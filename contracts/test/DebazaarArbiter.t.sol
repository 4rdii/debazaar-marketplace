// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {TestBase} from "./TestBase.sol";
import {IDebazaarArbiter} from "../contracts/interfaces/IDebazaarArbiter.sol";

contract DebazaarArbiterTest is TestBase {
    
    // Event declarations for testing
    event ArbiterAdded(address indexed arbiter);
    event ArbiterRemoved(address indexed arbiter);
    event ListingsAddedToQueue(bytes32 indexed listingId);
    event RandomnessRequested(bytes32 indexed listingId, uint64 indexed sequenceNumber);
    event RandomnessReceived(bytes32 indexed listingId, bytes32 indexed randomNumber, address indexed provider);
    event VoteCast(bytes32 indexed listingId, address indexed voter, uint8 indexed vote);
    
    function testDeployWithInitialArbiters() public {
        address[] memory arbiters = arbiter.getArbiters();
        assertEq(arbiters.length, 5, "Should have 5 initial arbiters");
        assertEq(arbiters[0], arbiter1, "First arbiter should match");
        assertEq(arbiters[1], arbiter2, "Second arbiter should match");
        assertEq(arbiters[2], arbiter3, "Third arbiter should match");
        assertEq(arbiters[3], arbiter4, "Fourth arbiter should match");
        assertEq(arbiters[4], arbiter5, "Fifth arbiter should match");
    }
    
    function testAddArbiter() public {
        address newArbiter = makeAddr("newArbiter");
        
        vm.expectEmit(true, false, false, false);
        emit ArbiterAdded(newArbiter);
        
        address[] memory arbitersToAdd = new address[](1);
        arbitersToAdd[0] = newArbiter;
        bool[] memory addFlags = new bool[](1);
        addFlags[0] = true;
        
        arbiter.addOrRemoveArbiters(arbitersToAdd, addFlags);
        
        address[] memory arbiters = arbiter.getArbiters();
        assertEq(arbiters.length, 6, "Should have 6 arbiters after adding");
        // Check that the new arbiter is in the list
        bool found = false;
        for (uint256 i = 0; i < arbiters.length; i++) {
            if (arbiters[i] == newArbiter) {
                found = true;
                break;
            }
        }
        assertTrue(found, "New arbiter should be in the arbiters list");
    }
    
    function testRemoveArbiter() public {
        vm.expectEmit(true, false, false, false);
        emit ArbiterRemoved(arbiter1);
        
        address[] memory arbitersToRemove = new address[](1);
        arbitersToRemove[0] = arbiter1;
        bool[] memory removeFlags = new bool[](1);
        removeFlags[0] = false;
        
        arbiter.addOrRemoveArbiters(arbitersToRemove, removeFlags);
        
        address[] memory arbiters = arbiter.getArbiters();
        assertEq(arbiters.length, 4, "Should have 4 arbiters after removing");
        // Check that arbiter1 is not in the list
        bool found = false;
        for (uint256 i = 0; i < arbiters.length; i++) {
            if (arbiters[i] == arbiter1) {
                found = true;
                break;
            }
        }
        assertFalse(found, "Removed arbiter should not be in the arbiters list");
    }
    
    function testAddArbiterRevertsOnNonAdmin() public {
        address newArbiter = makeAddr("newArbiter");
        address[] memory arbitersToAdd = new address[](1);
        arbitersToAdd[0] = newArbiter;
        bool[] memory addFlags = new bool[](1);
        addFlags[0] = true;
        
        vm.prank(seller);
        vm.expectRevert();
        arbiter.addOrRemoveArbiters(arbitersToAdd, addFlags);
    }
    
    function testSetEscrow() public {
        address newEscrow = makeAddr("newEscrow");
        arbiter.setDebazaarEscrow(newEscrow);
        
        assertEq(arbiter.getDebazaarEscrow(), newEscrow, "Escrow should be set");
    }
    
    function testSetEscrowRevertsOnZeroAddress() public {
        vm.expectRevert(IDebazaarArbiter.ZeroAddress.selector);
        arbiter.setDebazaarEscrow(address(0));
    }
    
    function testAddListingToQueue() public {
        bytes32 listingId = generateListingId();
        uint128 fee = getEntropyFee();
        
        vm.expectEmit(true, false, false, false);
        emit ListingsAddedToQueue(listingId);
        
        vm.deal(address(escrow), fee);
        vm.prank(address(escrow));
        arbiter.addListingToQueue{value: fee}(listingId);
        
        bytes32[] memory queue = arbiter.getListingsQueue();
        assertEq(queue.length, 1, "Queue should have one listing");
        assertEq(queue[0], listingId, "Queue should contain the listing");
    }
    
    function testAddListingToQueueRequestsRandomness() public {
        bytes32 listingId = generateListingId();
        uint128 fee = getEntropyFee();
        
        vm.expectEmit(true, true, false, false);
        emit RandomnessRequested(listingId, 1); // First sequence number
        
        vm.deal(address(escrow), fee);
        vm.prank(address(escrow));
        arbiter.addListingToQueue{value: fee}(listingId);
    }
    
    function testAddListingToQueueRevertsOnDuplicate() public {
        bytes32 listingId = generateListingId();
        uint128 fee = getEntropyFee();
        
        vm.deal(address(escrow), 2*fee);
        vm.prank(address(escrow));
        arbiter.addListingToQueue{value: fee}(listingId);
        
        vm.prank(address(escrow));
        vm.expectRevert(abi.encodeWithSelector(IDebazaarArbiter.ListingsAlreadyInQueue.selector, listingId));
        arbiter.addListingToQueue{value: fee}(listingId);
        vm.stopPrank();
    }
    
    function testAddListingToQueueRevertsOnUnauthorized() public {
        bytes32 listingId = generateListingId();
        uint128 fee = getEntropyFee();
        vm.deal(seller, fee);
        vm.prank(seller);
        vm.expectRevert();
        arbiter.addListingToQueue{value: fee}(listingId);
    }
    
    function testEntropyCallbackSelectsArbiters() public {
        bytes32 listingId = generateListingId();
        uint128 fee = getEntropyFee();
        
        vm.deal(address(escrow), fee);
        vm.prank(address(escrow));
        arbiter.addListingToQueue{value: fee}(listingId);
        
        bytes32 randomNumber = keccak256(abi.encodePacked("test-randomness"));
        
        vm.expectEmit(true, true, false, false);
        emit RandomnessReceived(listingId, randomNumber, address(entropyV2));
        
        simulateEntropyCallback(1, randomNumber);
        
        address[] memory selectedArbiters = arbiter.getSelectedArbitratorsForListing(listingId);
        assertEq(selectedArbiters.length, 3, "Should select 3 arbiters");
        
        // Verify uniqueness
        assertTrue(selectedArbiters[0] != selectedArbiters[1], "Arbiters should be unique");
        assertTrue(selectedArbiters[0] != selectedArbiters[2], "Arbiters should be unique");
        assertTrue(selectedArbiters[1] != selectedArbiters[2], "Arbiters should be unique");
    }
    
    function testResolveListing() public {
        bytes32 listingId = generateListingId();
        uint128 fee = getEntropyFee();
        
        vm.deal(address(escrow), fee);
        vm.prank(address(escrow));
        arbiter.addListingToQueue{value: fee}(listingId);
        
        bytes32 randomNumber = keccak256(abi.encodePacked("test-randomness"));
        simulateEntropyCallback(1, randomNumber);
        
        address[] memory selectedArbiters = arbiter.getSelectedArbitratorsForListing(listingId);
        address firstArbiter = selectedArbiters[0];
        
        vm.expectEmit(true, true, false, true);
        emit VoteCast(listingId, firstArbiter, 1); // Vote.FOR_BUYER
        
        vm.prank(firstArbiter);
        arbiter.resolveListing(listingId, true);
    }
    
    function testResolveListingRevertsOnNoRandomness() public {
        bytes32 listingId = generateListingId();
        
        vm.prank(arbiter1);
        vm.expectRevert(IDebazaarArbiter.RandomnessNotReceived.selector);
        arbiter.resolveListing(listingId, true);
    }
    
    function testResolveListingRevertsOnUnauthorized() public {
        bytes32 listingId = generateListingId();
        uint128 fee = getEntropyFee();

        vm.deal(address(escrow), fee);
        vm.prank(address(escrow));
        arbiter.addListingToQueue{value: fee}(listingId);
        
        bytes32 randomNumber = keccak256(abi.encodePacked("test-randomness"));
        simulateEntropyCallback(1, randomNumber);
        
        address unauthorized = makeAddr("unauthorized");
        vm.prank(unauthorized);
        vm.expectRevert(IDebazaarArbiter.UnAuthorized.selector);
        arbiter.resolveListing(listingId, true);
    }
    
    function testSelectArbitersUniqueness() public {
        bytes32 listingId = generateListingId();
        uint128 fee = getEntropyFee();
        
        vm.deal(address(escrow), fee);
        vm.prank(address(escrow));
        arbiter.addListingToQueue{value: fee}(listingId);

        bytes32 randomNumber = keccak256(abi.encodePacked("test-randomness"));
        simulateEntropyCallback(1, randomNumber);
        
        address[] memory selectedArbiters = arbiter.getSelectedArbitratorsForListing(listingId);
        assertEq(selectedArbiters.length, 3, "Should select exactly 3 arbiters");
        
        // Verify all are unique
        assertTrue(selectedArbiters[0] != selectedArbiters[1], "Arbiters should be unique");
        assertTrue(selectedArbiters[0] != selectedArbiters[2], "Arbiters should be unique");
        assertTrue(selectedArbiters[1] != selectedArbiters[2], "Arbiters should be unique");
        
        // Verify all are from the original pool
        address[] memory allArbiters = arbiter.getArbiters();
        for (uint256 i = 0; i < selectedArbiters.length; i++) {
            bool found = false;
            for (uint256 j = 0; j < allArbiters.length; j++) {
                if (selectedArbiters[i] == allArbiters[j]) {
                    found = true;
                    break;
                }
            }
            assertTrue(found, "Selected arbiter should be from original pool");
        }
    }
}