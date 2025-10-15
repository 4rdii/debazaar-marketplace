// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IEntropyConsumer} from "@pythnetwork/entropy-sdk-solidity/IEntropyConsumer.sol";
import {IEntropyV2} from "@pythnetwork/entropy-sdk-solidity/IEntropyV2.sol";

contract DebazaarArbiter is AccessControl, ReentrancyGuard, IEntropyConsumer {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using EnumerableSet for EnumerableSet.AddressSet;

    bytes32 public constant ARBITER_ROLE = keccak256("ARBITER_ROLE");
    bytes32 public constant ESCROW_ROLE = keccak256("ESCROW_ROLE");
    uint256 public constant ARBITERS_PER_LISTING = 3;
    // ========= Errors =========

    error ZeroAddress();
    error ListingsAlreadyInQueue(bytes32 listing);
    error InsufficientFeeSentForRandomNumberGeneration();
    error FailedToRefund();
    error UnAuthorized();
    error InvalidSequenceNumber();
    // ========= Events =========

    event ArbiterAdded(address indexed arbiter);
    event ArbiterRemoved(address indexed arbiter);
    event ListingsAddedToQueue(bytes32 indexed listings);
    event ListingsResolved(bytes32[] indexed listings);
    event RandomnessReceived(bytes32 indexed listingId, bytes32 indexed randomness);

    // ========= State Variables =========

    address private s_debazaarEscrow;
    IEntropyV2 private s_entropyV2;
    EnumerableSet.Bytes32Set private s_listingsQueue;
    EnumerableSet.AddressSet private s_arbitrators;

    struct DisputedListing {
        bytes32 listingId;
        bytes32 randomness;
        uint64 sequenceNumber;
        address[] arbiters;
    }
    //listingId => DisputedListing
    mapping(bytes32 => DisputedListing) private s_disputedListings;
    //sequenceNumber => listingId
    mapping(uint64 => bytes32) private s_sequenceNumberToListingId;

    constructor(address _owner, address[] memory _InitialArbitrators, address _entropyV2) {
        if (_owner == address(0) || _entropyV2 == address(0)) revert ZeroAddress();
        s_entropyV2 = IEntropyV2(_entropyV2);
        _grantRole(DEFAULT_ADMIN_ROLE, _owner);
        if (_InitialArbitrators.length > 0) {
            for (uint256 i = 0; i < _InitialArbitrators.length; i++) {
                s_arbitrators.add(_InitialArbitrators[i]);
                grantRole(ARBITER_ROLE, _InitialArbitrators[i]);
                emit ArbiterAdded(_InitialArbitrators[i]);
            }
        }
    }

    // ========= External Functions =========

    function addListingToQueue(bytes32 _listingId, address _refundTo) external payable onlyRole(ESCROW_ROLE) {
        bool result = s_listingsQueue.add(_listingId);
        if (result) {
            // Next steps:
            // Request a random number from pyth entropy service
            _requestRandomNumber(_refundTo, _listingId);
            // receive the random number in the callback
            // select the arbiters based on the random number
            emit ListingsAddedToQueue(_listingId);
        } else {
            revert ListingsAlreadyInQueue(_listingId);
        }
    }

    function setDebazaarEscrow(address _debazaarEscrow) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_debazaarEscrow == address(0)) revert ZeroAddress();
        s_debazaarEscrow = _debazaarEscrow;
        grantRole(ESCROW_ROLE, _debazaarEscrow);
    }

    function addOrRemoveArbiters(address[] calldata _arbiter, bool[] calldata _add)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        for (uint256 i = 0; i < _arbiter.length; i++) {
            if (_add[i]) {
                bool result = s_arbitrators.add(_arbiter[i]);
                if (result) {
                    grantRole(ARBITER_ROLE, _arbiter[i]);
                    emit ArbiterAdded(_arbiter[i]);
                }
            } else {
                bool result = s_arbitrators.remove(_arbiter[i]);
                if (result) {
                    revokeRole(ARBITER_ROLE, _arbiter[i]);
                    emit ArbiterRemoved(_arbiter[i]);
                }
            }
        }
    }
    // ========= Getter Functions =========

    function getArbiters() external view returns (address[] memory) {
        return s_arbitrators.values();
    }

    function getListingsQueue() external view returns (bytes32[] memory) {
        return s_listingsQueue.values();
    }

    function getDebazaarEscrow() external view returns (address) {
        return s_debazaarEscrow;
    }

    function getSelectedArbitratorsForListing(bytes32 _listingId) external view returns (address[] memory) {
        return s_disputedListings[_listingId].arbiters;
    }

    function getEntropyV2() external view returns (address) {
        return getEntropy();
    }

    // ========= Internal Functions =========
    function _requestRandomNumber(address _refundTo, bytes32 _listingId) internal {
        uint256 fee = s_entropyV2.getFeeV2();
        if (msg.value < fee) revert InsufficientFeeSentForRandomNumberGeneration();
        uint64 sequenceNumber = s_entropyV2.requestV2{value: fee}();
        s_sequenceNumberToListingId[sequenceNumber] = _listingId;
        if (msg.value - fee > 0) {
            (bool success,) = payable(_refundTo).call{value: msg.value - fee}("");
            if (!success) revert FailedToRefund();
        }
    }

    function entropyCallback(uint64 sequenceNumber, address provider, bytes32 randomNumber) internal override {
        bytes32 listingId = s_sequenceNumberToListingId[sequenceNumber];
        DisputedListing storage disputedListing = s_disputedListings[listingId];

        disputedListing.randomness = randomNumber;
        disputedListing.sequenceNumber = sequenceNumber;
        disputedListing.arbiters = _selectArbiters(randomNumber, disputedListing.arbiters);

        emit RandomnessReceived(listingId, randomNumber);
    }

    function getEntropy() internal view override returns (address) {
        return address(s_entropyV2);
    }

    function _selectArbiters(bytes32 _randomness, address[] memory _arbitrators) internal pure returns (address[] memory selectedArbiters) {
        uint256 n = _arbitrators.length;
        selectedArbiters = new address[](ARBITERS_PER_LISTING);

        for (uint256 i = 0; i < 3; i++) {
            // Derive a new random number from the bytes32 seed
            uint256 j = i + (uint256(keccak256(abi.encode(_randomness, i))) % (n - i));

            // Swap picked element into position i
            (_arbitrators[i], _arbitrators[j]) = (_arbitrators[j], _arbitrators[i]);

            // Save chosen address
            selectedArbiters[i] = _arbitrators[i];
        }
    }
}
