// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable2Step,Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IDebazaarEscrow} from "./IDebazaarEscrow.sol";

/// @title Debazaar Escrow
/// @author 4rdii
/// @notice This contract is used to escrow funds for the Debazaar Marketplace
contract DebazaarEscrow is IDebazaarEscrow, Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;
    uint64 public constant MIN_EXPIRATION = 1 hours;
    
    address public s_arbiter;
    mapping(bytes32 => Listing) public s_listings;


        
    constructor(address _owner) Ownable(_owner) {}

    /// @notice Creates a new listing for the seller
    /// @param _listingId The ID of the listing
    /// @param _token The token of the listing
    /// @param _amount The amount of the listing
    /// @param _expiration The expiration of the listing
    /// @param _escrowType The type of the listing
    function createListing(
        bytes32 _listingId,
        address _token,
        uint256 _amount,
        uint64 _expiration,
        EscrowType _escrowType
    ) external nonReentrant {
        // Checks
        if (msg.sender == address(0) || address(_token) == address(0)) revert ZeroAddress();
        if (_expiration <= block.timestamp + MIN_EXPIRATION) revert InvalidDeadline();
        if (_amount == 0 || _expiration == 0) revert ZeroAmount();

        Listing storage listing = s_listings[_listingId];
        if (listing.seller != address(0)) revert ListingAlreadyExists();

        // Effects
        listing.seller = msg.sender;
        listing.listingId = _listingId;
        listing.token = IERC20(_token);
        listing.amount = _amount;
        listing.expiration = _expiration;
        listing.escrowType = _escrowType;
        listing.state = State.Open;

        // Interactions
        emit DeBazaar__ListingCreated(_listingId, msg.sender, _token, _amount, _expiration, _escrowType);
    }

    /// @notice Fills a listing for the buyer
    /// @param _listingId The ID of the listing
    /// @param _deadline The deadline of the listing, after which the buyer can be refunded
    function fillListing(
        bytes32 _listingId,
        uint64 _deadline
    )external nonReentrant {

        Listing storage listing = s_listings[_listingId];
        // Checks
        if (listing.state != State.Open) revert InvalidState();
        if (listing.expiration <= block.timestamp) revert ListingExpired();
        if (_deadline <= block.timestamp) revert InvalidDeadlineForRefund();
        // Effects
        listing.buyer = msg.sender;
        listing.state = State.Filled;
        listing.deadline = _deadline;
        // Interactions
        listing.token.safeTransferFrom(msg.sender, address(this), listing.amount);
        emit DeBazaar__ListingFilled(_listingId, msg.sender, _deadline);
    }


    /// @notice Cancels a listing
    /// @param _listingId The ID of the listing
    /// @dev Only the buyer or seller can cancel the listing, Listing is cancalable by buyer if the seller did not deliver the listing in the deadline
    /// @dev Listing is cancalable by seller, before the buyer has paid for the listing
    function cancelListing(bytes32 _listingId) external nonReentrant {
        Listing storage listing = s_listings[_listingId];
        // Checks
        if (listing.buyer != msg.sender && listing.seller != msg.sender) revert NotBuyerOrSeller();
        if (listing.expiration <= block.timestamp) revert ListingExpired();
        if (listing.state != State.Filled && listing.state != State.Open) revert InvalidState();
        bool needsRefund = listing.state == State.Filled && listing.deadline > block.timestamp;
        // Effects
        listing.state = State.Canceled;
        if (needsRefund) {
            listing.token.safeTransfer(listing.buyer, listing.amount);
            if (block.timestamp > listing.expiration) {
                listing.state = State.Open;
                listing.buyer = address(0);
                listing.deadline = 0;
                emit DeBazaar__ListingReset(_listingId);
            }
        } else {
            listing.state = State.Canceled;
            emit DeBazaar__ListingCancelled(msg.sender, _listingId);
        }
    }
}