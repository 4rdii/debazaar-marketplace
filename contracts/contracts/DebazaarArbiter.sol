// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IEntropyConsumer} from "@pythnetwork/entropy-sdk-solidity/IEntropyConsumer.sol";
import {IEntropyV2} from "@pythnetwork/entropy-sdk-solidity/IEntropyV2.sol";
import {IDebazaarArbiter} from "./interfaces/IDebazaarArbiter.sol";
import {IDebazaarEscrow} from "./interfaces/IDebazaarEscrow.sol";

contract DebazaarArbiter is IDebazaarArbiter, ReentrancyGuard, IEntropyConsumer, Ownable {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using EnumerableSet for EnumerableSet.AddressSet;

    // ========= State Variables =========
    uint256 public constant ARBITERS_PER_LISTING = 3;

    address private s_debazaarEscrow;
    IEntropyV2 private s_entropyV2;
    EnumerableSet.Bytes32Set private s_listingsQueue;
    EnumerableSet.AddressSet private s_arbitrators;

    //listingId => DisputedListing
    mapping(bytes32 => DisputedListing) private s_disputedListings;
    //sequenceNumber => listingId
    mapping(uint64 => bytes32) private s_sequenceNumberToListingId;

    constructor(address _owner, address[] memory _InitialArbitrators, address _entropyV2) Ownable(_owner) {
        if (_owner == address(0) || _entropyV2 == address(0)) revert ZeroAddress();
        s_entropyV2 = IEntropyV2(_entropyV2);
        if (_InitialArbitrators.length > 0) {
            for (uint256 i = 0; i < _InitialArbitrators.length; i++) {
                s_arbitrators.add(_InitialArbitrators[i]);
                emit ArbiterAdded(_InitialArbitrators[i]);
            }
        }
    }

    // ========= External Functions =========

    function addListingToQueue(bytes32 _listingId) external payable {
        if (msg.sender != s_debazaarEscrow) revert UnAuthorized();
        bool result = s_listingsQueue.add(_listingId);
        if (result) {
            _requestRandomNumber(_listingId);
            s_disputedListings[_listingId].state = State.Disputed;
            emit ListingsAddedToQueue(_listingId);
        } else {
            revert ListingsAlreadyInQueue(_listingId);
        }
    }

    function resolveListing(bytes32 _listingId, bool _toBuyer) external nonReentrant {
        DisputedListing storage disputedListing = s_disputedListings[_listingId];
        // Checks
        if (disputedListing.randomness == bytes32(0)) revert RandomnessNotReceived();
        if (!disputedListing.arbiters.contains(msg.sender)) revert UnAuthorized();
        if (disputedListing.state != State.Disputed) revert InvalidState();
        if (disputedListing.votes[msg.sender] != Vote.NOT_VOTED) revert AlreadyVoted();

        // Effects
        disputedListing.votes[msg.sender] = _toBuyer ? Vote.FOR_BUYER : Vote.FOR_SELLER;
        if (_toBuyer) {
            disputedListing.votesForBuyer++;
        } else {
            disputedListing.votesForSeller++;
        }
        
        // Interactions
        if (disputedListing.votesForBuyer >= ARBITERS_PER_LISTING / 2 + 1) {
            disputedListing.state = State.Resolved;
            IDebazaarEscrow(s_debazaarEscrow).resolveListing(_listingId, true);
            emit ListingsResolved(_listingId, true);
        } else if (disputedListing.votesForSeller >= ARBITERS_PER_LISTING / 2 + 1) {
            disputedListing.state = State.Resolved;
            IDebazaarEscrow(s_debazaarEscrow).resolveListing(_listingId, false);
            emit ListingsResolved(_listingId, false);
        }
        emit VoteCast(_listingId, msg.sender, _toBuyer ? Vote.FOR_BUYER : Vote.FOR_SELLER);
    }

    function setDebazaarEscrow(address _debazaarEscrow) external onlyOwner {
        if (_debazaarEscrow == address(0)) revert ZeroAddress();
        s_debazaarEscrow = _debazaarEscrow;
        emit DebazaarEscrowSet(_debazaarEscrow);
    }

    function addOrRemoveArbiters(address[] calldata _arbiter, bool[] calldata _add) external onlyOwner {
        for (uint256 i = 0; i < _arbiter.length; i++) {
            if (_add[i]) {
                bool result = s_arbitrators.add(_arbiter[i]);
                if (result) {
                    emit ArbiterAdded(_arbiter[i]);
                }
            } else {
                bool result = s_arbitrators.remove(_arbiter[i]);
                if (result) {
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
        return s_disputedListings[_listingId].arbiters.values();
    }

    function getResolvedListingVotes(bytes32 _listingId) external view returns (uint256, uint256) {
        return (s_disputedListings[_listingId].votesForBuyer, s_disputedListings[_listingId].votesForSeller);
    }

    function getEntropyV2() external view returns (address) {
        return getEntropy();
    }

    // ========= Internal Functions =========
    function _requestRandomNumber(bytes32 _listingId) internal {
        uint64 sequenceNumber = s_entropyV2.requestV2{value: msg.value}();
        s_sequenceNumberToListingId[sequenceNumber] = _listingId;
        emit RandomnessRequested(_listingId, sequenceNumber);
    }

    function entropyCallback(uint64 sequenceNumber, address provider, bytes32 randomNumber) internal override {
        bytes32 listingId = s_sequenceNumberToListingId[sequenceNumber];
        DisputedListing storage disputedListing = s_disputedListings[listingId];

        disputedListing.randomness = randomNumber;
        disputedListing.sequenceNumber = sequenceNumber;
        address[] memory arbiters = _selectArbiters(randomNumber, s_arbitrators.values());
        for (uint256 i = 0; i < arbiters.length; i++) {
            disputedListing.arbiters.add(arbiters[i]);
        }

        emit RandomnessReceived(listingId, randomNumber);
    }

    function getEntropy() internal view override returns (address) {
        return address(s_entropyV2);
    }

    function _selectArbiters(bytes32 _randomness, address[] memory _arbitrators)
        internal
        pure
        returns (address[] memory selectedArbiters)
    {
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
