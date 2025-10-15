// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IEntropyV2} from "@pythnetwork/entropy-sdk-solidity/IEntropyV2.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

interface IDebazaarArbiter {
    // ========= Types =========

    enum Vote {
        NOT_VOTED,
        FOR_BUYER,
        FOR_SELLER
    }

    enum State {
        Disputed,
        Resolved
    }

    struct DisputedListing {
        bytes32 randomness;
        uint64 sequenceNumber;
        EnumerableSet.AddressSet arbiters;
        mapping(address => Vote) votes;
        State state;
    }
    // ========= Errors =========

    error ZeroAddress();
    error ListingsAlreadyInQueue(bytes32 listing);
    error UnAuthorized();
    error RandomnessNotReceived();
    error InvalidState();

    // ========= Events =========

    event ArbiterAdded(address indexed arbiter);
    event ArbiterRemoved(address indexed arbiter);
    event ListingsAddedToQueue(bytes32 indexed listings);
    event ListingsResolved(bytes32 indexed listings, bool indexed toBuyer);
    event RandomnessReceived(bytes32 indexed listingId, bytes32 indexed randomness);
    event RandomnessRequested(bytes32 indexed listingId, uint64 indexed sequenceNumber);
    event VoteCast(bytes32 indexed listingId, address indexed voter, Vote indexed vote);
    event DebazaarEscrowSet(address indexed debazaarEscrow);

    // ========= Functions =========
    function addListingToQueue(bytes32 _listingId) external payable;
    function getEntropyV2() external view returns (address);
}
