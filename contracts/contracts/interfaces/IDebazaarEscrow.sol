// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IDebazaarEscrow {
    // ========= Types =========

    enum State {
        Open, // listing is open for purchase
        Filled, // buyer has payed for the listing
        Delivered, // seller has delivered the listing
        Released, // funds have been released to the seller
        Refunded, // funds have been refunded to the buyer
        Disputed, // in dispution phase, only for disputable escrow type
        Canceled // listing has been canceled

    }

    enum EscrowType {
        API_APPROVAL,
        ONCHAIN_APPROVAL,
        DISPUTABLE
    }

    struct OnchainApprovalData {
        address destination;
        bytes data;
        bytes expectedResult;
    }

    struct ApiApprovalData {
        string source;
        bytes encryptedSecretsUrls;
        string[] args;
        bytes[] bytesArgs;
    }

    struct Listing {
        bytes32 listingId;
        address buyer;
        address seller;
        IERC20 token;
        uint256 amount;
        uint64 expiration;
        uint64 deadline;
        State state;
        EscrowType escrowType;
        OnchainApprovalData onchainApprovalData;
        ApiApprovalData apiApprovalData;
    }
    // ========= Events =========

    event DeBazaar__ListingCreated(
        bytes32 indexed listingId,
        address indexed seller,
        address indexed token,
        uint256 amount,
        uint64 expiration,
        EscrowType escrowType
    );
    event DeBazaar__ListingFilled(bytes32 indexed listingId, address indexed buyer, uint64 deadline);
    event DeBazaar__ListingCancelled(address indexed sender, bytes32 indexed listingId);
    event DeBazaar__ListingReset(bytes32 indexed listingId);
    event DeBazaar__Resolved(bytes32 indexed listingId, address indexed to);
    event DeBazaar__Released(bytes32 indexed listingId);
    event DeBazaar__Refunded(bytes32 indexed listingId);
    event DeBazaar__Delivered(bytes32 indexed listingId);
    event DeBazaar__Disputed(bytes32 indexed listingId, address indexed sender);
    // ========= Errors =========

    error ZeroAddress();
    error InvalidFee();
    error InvalidDeadline();
    error ZeroAmount();
    error ListingAlreadyExists();
    error InvalidEscrowType();
    error InvalidState();
    error InvalidAmount();
    error ListingExpired();
    error InvalidDeadlineForRefund();
    error NotBuyerOrSeller();
    error NotSeller();
    error NotBuyer();
    error DeadlineHasNotPassed();
    error InsufficientFeeSentForRandomNumberGeneration(uint128 fee, uint256 msgValue);
    error FailedToRefund();
    error InvalidExtraData();
    error ApprovalStaticCallFailed();
    error ApprovalResultMismatch();

    // ========= Functions =========
    function resolveListing(bytes32 _listingId, bool _toBuyer) external;
}
