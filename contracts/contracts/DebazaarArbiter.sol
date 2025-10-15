// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable2Step,Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
contract DebazaarArbiter is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using EnumerableSet for EnumerableSet.AddressSet;
    // ========= Errors =========
    error ZeroAddress();
    error ListingsAlreadyInQueue(bytes32 listing);

    // ========= Events =========
    event ArbiterAdded(address indexed arbiter);
    event ArbiterRemoved(address indexed arbiter);
    event ListingsAddedToQueue(bytes32 indexed listings);
    event ListingsResolved(bytes32[] indexed listings);

    // ========= State Variables =========
    bytes32 public constant ARBITER_ROLE = keccak256("ARBITER_ROLE");
    bytes32 public constant ESCROW_ROLE = keccak256("ESCROW_ROLE");
    EnumerableSet.Bytes32Set private s_listingsQueue;
    EnumerableSet.AddressSet private s_arbitrators;
    address private s_debazaarEscrow;
    mapping (bytes32 => EnumerableSet.AddressSet) private s_selectedArbitratorsForListing;

    constructor(address _owner, address[] memory _InitialArbitrators)  {
        if (_owner == address(0)) revert ZeroAddress();
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

    function addListingToQueue(bytes32 _listingId) external onlyRole(ESCROW_ROLE) {
        bool result = s_listingsQueue.add(_listingId);
        if (result) {
            // Request a random number from pyth entropy service
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

    function addOrRemoveArbiters(address[] calldata _arbiter, bool[] calldata _add) external onlyRole(DEFAULT_ADMIN_ROLE) {
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
        return s_selectedArbitratorsForListing[_listingId].values();
    }


}