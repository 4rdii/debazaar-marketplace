// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IDebazaarEscrow} from "./interfaces/IDebazaarEscrow.sol";
import {IDebazaarArbiter} from "./interfaces/IDebazaarArbiter.sol";
import {IEntropyV2} from "@pythnetwork/entropy-sdk-solidity/IEntropyV2.sol";

/// @title Debazaar Escrow
/// @author 4rdii
/// @notice This contract is used to escrow funds for the Debazaar Marketplace
contract DebazaarEscrow is IDebazaarEscrow, Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint64 public constant MIN_EXPIRATION = 1 hours;
    uint256 public constant BASE_BASIS_POINTS = 10000;

    uint256 private s_feeBasisPoints;
    address private s_arbiter;
    mapping(bytes32 => Listing) private s_listings;

    constructor(address _owner) Ownable(_owner) {}

    // ========= External Functions =========
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
    function fillListing(bytes32 _listingId, uint64 _deadline) external nonReentrant {
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

    /// @notice Cancels a listing By Buyer
    /// @param _listingId The ID of the listing
    /// @dev Only the buyer can cancel the listing, Listing is cancalable by buyer if the seller did not deliver the listing in the deadline
    function cancelListingByBuyer(bytes32 _listingId) external nonReentrant {
        Listing storage listing = s_listings[_listingId];
        // Checks
        if (listing.buyer != msg.sender) revert NotBuyer();
        if (listing.state != State.Filled ) revert InvalidState();
        if (block.timestamp < listing.deadline) revert DeadlineHasNotPassed();
        // Effects
        if (block.timestamp < listing.expiration) {
            listing.state = State.Open;
            listing.buyer = address(0);
            listing.deadline = 0;
            emit DeBazaar__ListingReset(_listingId);
        }
        else {
            listing.state = State.Canceled;
            emit DeBazaar__ListingCancelled(msg.sender, _listingId);
        }
        listing.token.safeTransfer(msg.sender, listing.amount);
    }

    /// @notice Cancels a listing By Seller
    /// @param _listingId The ID of the listing
    /// @dev Only the seller can cancel the listing, Listing is cancalable by seller, before the buyer has paid for the listing
    function cancelListingBySeller(bytes32 _listingId) external nonReentrant {
        Listing storage listing = s_listings[_listingId];
        // Checks
        if (listing.seller != msg.sender) revert NotSeller();
        if (listing.state != State.Open) revert InvalidState();
        // Effects
        listing.state = State.Canceled;
        emit DeBazaar__ListingCancelled(msg.sender, _listingId);
    }

    /// @notice Delivers a disputable listing
    /// @param _listingId The ID of the listing
    /// @dev the seller marks the listing as delivered, when he has delivered the listing to the buyer
    function deliverDisputableListing(bytes32 _listingId) external nonReentrant {
        Listing storage listing = s_listings[_listingId];
        // Checks
        if (listing.escrowType != EscrowType.DISPUTABLE) revert InvalidEscrowType();
        if (listing.state != State.Filled) revert InvalidState();
        if (msg.sender != listing.seller) revert NotSeller();
        // Effects
        listing.state = State.Delivered;
        // Interactions
        emit DeBazaar__Delivered(_listingId);
    }

    function deliverApiApprovalListing(bytes32 _listingId) external nonReentrant {
        // not implemented yet
    }

    function deliverOnchainApprovalListing(bytes32 _listingId) external nonReentrant {
        // not implemented yet
    }

    /// @notice Disputs a listing
    /// @param _listingId The ID of the listing
    /// @dev Only the buyer or seller can dispute the listing
    /// @dev Listing is disputable by buyer or seller after delivery is started by the seller
    function disputeListing(bytes32 _listingId) external payable nonReentrant {
        Listing storage listing = s_listings[_listingId];
        IDebazaarArbiter arbiterContract = IDebazaarArbiter(s_arbiter);
        address entropyV2 = arbiterContract.getEntropyV2();
        uint128 fee = IEntropyV2(entropyV2).getFeeV2();

        // Checks
        if (listing.escrowType != EscrowType.DISPUTABLE) revert InvalidEscrowType();
        if (listing.state != State.Delivered) revert InvalidState();
        if (msg.sender != listing.buyer && msg.sender != listing.seller) revert NotBuyerOrSeller();
        if (msg.value < fee) revert InsufficientFeeSentForRandomNumberGeneration(fee, msg.value);

        // Effects
        listing.state = State.Disputed;
        // Interactions
        arbiterContract.addListingToQueue{value: fee}(_listingId);
        if (msg.value - fee > 0) {
            (bool success,) = payable(msg.sender).call{value: msg.value - fee}("");
            if (!success) revert FailedToRefund();
        }
        emit DeBazaar__Disputed(_listingId, msg.sender);
    }

    /**
     * @notice Resolves the listing in favor of the buyer or seller.
     * @dev This function is only callable by the arbiter in case of a dispute
     *      or by the escrow itself in case of a fullfillment event.
     *      the buyer himself can call this in disputable escrow type,
     *      if the item's delivery was satisfactory.
     * @param _listingId The id of the escrow.
     * @param _toBuyer The boolean to determine if the listing is resolved in favor of the buyer.
     */
    function resolveListing(bytes32 _listingId, bool _toBuyer) external nonReentrant {
        Listing storage listing = s_listings[_listingId];
        // Checks
        if (listing.escrowType == EscrowType.DISPUTABLE) {
            if (listing.state == State.Disputed) {
                require(msg.sender == s_arbiter, "Only the arbiter can resolve a disputed listing");
                emit DeBazaar__Resolved(_listingId, _toBuyer ? listing.buyer : listing.seller);
            } else if (listing.state == State.Delivered) {
                require(msg.sender == listing.buyer, "Only the buyer can resolve a delivered listing");
                _toBuyer = false;
            } else {
                revert InvalidState();
            }
        } else if (listing.escrowType == EscrowType.API_APPROVAL) {
            require(
                msg.sender == address(this) && listing.state == State.Delivered,
                "Only the escrow itself can resolve this listing"
            );
        } else if (listing.escrowType == EscrowType.ONCHAIN_APPROVAL) {
            require(msg.sender == address(this), "Only the escrow itself can resolve this listing");
        }
        // Effects
        _toBuyer ? listing.state = State.Refunded : listing.state = State.Released;

        // Interactions
        if (_toBuyer) {
            _transferWithFee(address(listing.token), listing.buyer, listing.amount);
            emit DeBazaar__Refunded(_listingId);
        } else {
            _transferWithFee(address(listing.token), listing.seller, listing.amount);
            emit DeBazaar__Released(_listingId);
        }
    }
    // ========= Setter Functions =========

    function setArbiter(address _arbiter) external onlyOwner {
        if (_arbiter == address(0)) revert ZeroAddress();
        s_arbiter = _arbiter;
    }

    // ========= Getter Functions =========

    /// @notice Returns the listing details
    /// @param _listingId The ID of the listing
    /// @return The listing details
    function getListing(bytes32 _listingId) external view returns (Listing memory) {
        return s_listings[_listingId];
    }

    function getArbiter() external view returns (address) {
        return s_arbiter;
    }

    function getFee() external view returns (uint256) {
        return s_feeBasisPoints;
    }

    // ========= Internal Functions =========
    /// @dev Calculates the protocol fee for a given amount.
    /// @param amount The gross amount.
    /// @return The fee portion.

    function _calculateFee(uint256 amount) internal view returns (uint256) {
        return amount * s_feeBasisPoints / BASE_BASIS_POINTS;
    }

    /// @dev Transfers amount minus fee to recipient and fee to owner.
    /// @param token The ERC20 token address.
    /// @param to The recipient of the net amount.
    /// @param amount The gross amount to distribute.
    function _transferWithFee(address token, address to, uint256 amount) internal {
        uint256 fee = _calculateFee(amount);
        uint256 amountAfterFee = amount - fee;
        IERC20(token).safeTransfer(to, amountAfterFee);
        IERC20(token).safeTransfer(owner(), fee);
    }
}
