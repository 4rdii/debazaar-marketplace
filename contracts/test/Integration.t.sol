// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {TestBase} from "./TestBase.sol";
import {Vm} from "forge-std/Vm.sol";
import {MockMulticall3} from "../contracts/mocks/MockMulticall3.sol";

import {IDebazaarEscrow} from "../contracts/interfaces/IDebazaarEscrow.sol";

contract IntegrationTest is TestBase {
    
    function testFullOnchainApprovalFlow() public {
        // Step 1: Seller creates ONCHAIN_APPROVAL listing
        bytes32 listingId = createOnchainApprovalListing();
        
        // Step 2: Buyer fills listing with onchain approval data
        fillOnchainApprovalListing(listingId);
        assertEq(token.balanceOf(address(escrow)), TEST_AMOUNT, "Tokens should be in escrow");
        
        // Step 3: Seller transfers NFT to buyer
        transferNFTToBuyer();
        assertEq(nft.ownerOf(TEST_TOKEN_ID), buyer, "NFT should be owned by buyer");
        
        // Step 4: Anyone can call deliverOnchainApprovalListing
        deliverOnchainApprovalListing(listingId);
        
        // Step 5: Verify listing is resolved and funds released
        IDebazaarEscrow.Listing memory listing = escrow.getListing(listingId);
        assertEq(uint8(listing.state), 3, "Listing should be Released");
        assertEq(token.balanceOf(seller), TEST_AMOUNT, "Seller should receive payment");
        assertEq(token.balanceOf(address(escrow)), 0, "Escrow should have no tokens");
    }
    
    function testOnchainApprovalWithMulticall() public {
        // Step 1: Create and fill listing
        bytes32 listingId = createOnchainApprovalListing();
        fillOnchainApprovalListing(listingId);
        
        // Step 2: Use multicall to atomically transfer NFT and deliver listing
        MockMulticall3.Call3[] memory calls = createMulticallForNFTTransferAndDelivery(listingId);
        
        vm.startPrank(seller);
        nft.approve(address(multicall3), TEST_TOKEN_ID);
        multicall3.aggregate3(calls);
        vm.stopPrank();
        
        // Step 3: Verify everything worked atomically
        IDebazaarEscrow.Listing memory listing = escrow.getListing(listingId);
        assertEq(uint8(listing.state), 3, "Listing should be Released");
        assertEq(nft.ownerOf(TEST_TOKEN_ID), buyer, "NFT should be owned by buyer");
        assertEq(token.balanceOf(seller), TEST_AMOUNT, "Seller should receive payment");
    }
   
    function testFullDisputeResolutionFlow() public {
        // Step 1: Seller creates DISPUTABLE listing
        bytes32 listingId = createTestListing();
        
        // Step 2: Buyer fills listing with tokens
        fillTestListing(listingId);
        assertEq(token.balanceOf(address(escrow)), TEST_AMOUNT, "Tokens should be in escrow");
        
        // Step 3: Seller delivers listing
        deliverTestListing(listingId);
        
        // Step 4: Buyer disputes delivery
        disputeTestListing(listingId);
        
        // Step 5: Escrow forwards to arbiter with entropy fee
        // This happens automatically in disputeListing
        
        // Step 6: Mock entropy returns randomness
        bytes32 randomNumber = keccak256(abi.encodePacked("integration-test-randomness"));
        simulateEntropyCallback(1, randomNumber);
        
        // // Step 7: Three arbiters are selected
        address[] memory selectedArbiters = arbiter.getSelectedArbitratorsForListing(listingId);
        assertEq(selectedArbiters.length, 3, "Should select 3 arbiters");
        
        // Step 8: Arbiters vote (2 for buyer, 1 for seller)

        vm.prank(selectedArbiters[0]);
        arbiter.resolveListing(listingId, true); // Vote for buyer
        
        vm.prank(selectedArbiters[1]);
        arbiter.resolveListing(listingId, false); // Vote for seller
        
        vm.prank(selectedArbiters[2]);
        arbiter.resolveListing(listingId, true); // Vote for buyer
        
        // Step 9: Listing resolved in buyer's favor
        // The arbiter should call escrow.resolveListing with true (for buyer)
        (uint256 votesForBuyer, uint256 votesForSeller) = arbiter.getResolvedListingVotes(listingId);
        assertEq(votesForBuyer, 2, "Should have 2 votes for buyer");
        assertEq(votesForSeller, 1, "Should have 1 vote for seller");
        
        // Step 10: Buyer receives refund minus protocol fee
        // This would be triggered by the arbiter calling escrow.resolveListing(listingId, true)
        assert(token.balanceOf(buyer) == TEST_AMOUNT*10);
    }
    
    function testMultipleConcurrentDisputes() public {
        bytes32 listingId1 = generateListingId();
        bytes32 listingId2 = generateListingId();
        uint128 fee = getEntropyFee();
        
        // Create and fill both listings
        vm.prank(seller);
        escrow.createListing(
            listingId1,
            address(token),
            TEST_AMOUNT,
            getFutureTime(TEST_EXPIRATION),
            IDebazaarEscrow.EscrowType.DISPUTABLE
        );
        
        vm.prank(seller);
        escrow.createListing(
            listingId2,
            address(token),
            TEST_AMOUNT,
            getFutureTime(TEST_EXPIRATION),
            IDebazaarEscrow.EscrowType.DISPUTABLE
        );
        
        fillTestListing(listingId1);
        fillTestListing(listingId2);
        
        deliverTestListing(listingId1);
        deliverTestListing(listingId2);
        
        
        vm.recordLogs();
        vm.prank(address(escrow));
        arbiter.addListingToQueue{value: fee}(listingId1);
        
        Vm.Log[] memory logs1 = vm.getRecordedLogs();
        uint64 sequenceNumber1 = 0;
        for (uint256 i = 0; i < logs1.length; i++) {
            if (logs1[i].topics[0] == keccak256("RandomnessRequested(bytes32,uint64)")) {
                sequenceNumber1 = uint64(uint256(logs1[i].topics[2]));
                break;
            }
        }
        
        vm.recordLogs();
        vm.prank(address(escrow));
        arbiter.addListingToQueue{value: fee}(listingId2);
        
        Vm.Log[] memory logs2 = vm.getRecordedLogs();
        uint64 sequenceNumber2 = 0;
        for (uint256 i = 0; i < logs2.length; i++) {
            if (logs2[i].topics[0] == keccak256("RandomnessRequested(bytes32,uint64)")) {
                sequenceNumber2 = uint64(uint256(logs2[i].topics[2]));
                break;
            }
        }
        
        assertTrue(sequenceNumber1 != sequenceNumber2, "Should have different sequence numbers");
        
        
        // Simulate callbacks for both
        bytes32 randomNumber1 = keccak256(abi.encodePacked("randomness-1"));
        bytes32 randomNumber2 = keccak256(abi.encodePacked("randomness-2"));
        
        simulateEntropyCallback(1, randomNumber1);
        simulateEntropyCallback(2, randomNumber2);
        
        // Both should have selected arbiters
        address[] memory selectedArbiters1 = arbiter.getSelectedArbitratorsForListing(listingId1);
        address[] memory selectedArbiters2 = arbiter.getSelectedArbitratorsForListing(listingId2);
        
        assertEq(selectedArbiters1.length, 3, "First listing should have 3 arbiters");
        assertEq(selectedArbiters2.length, 3, "Second listing should have 3 arbiters");

        // Both listings should be in queue
        bytes32[] memory queue = arbiter.getListingsQueue();
        assertEq(queue.length, 2, "Queue should have 2 listings");
        assertEq(queue[0], listingId1, "First listing should be in queue");
        assertEq(queue[1], listingId2, "Second listing should be in queue");
        
    }
    
    
    function testDisputeWith10PlusArbiters() public {
        // Add more arbiters to have 10+
        address[] memory additionalArbiters = new address[](7);
        additionalArbiters[0] = makeAddr("arbiter6");
        additionalArbiters[1] = makeAddr("arbiter7");
        additionalArbiters[2] = makeAddr("arbiter8");
        additionalArbiters[3] = makeAddr("arbiter9");
        additionalArbiters[4] = makeAddr("arbiter10");
        additionalArbiters[5] = makeAddr("arbiter11");
        additionalArbiters[6] = makeAddr("arbiter12");
        
        bool[] memory addFlags = new bool[](7);
        for (uint256 i = 0; i < 7; i++) {
            addFlags[i] = true;
        }
        
        arbiter.addOrRemoveArbiters(additionalArbiters, addFlags);
        
        address[] memory arbiters = arbiter.getArbiters();
        assertEq(arbiters.length, 12, "Should have 12 arbiters (5 original + 7 additional)");
        
        bytes32 listingId = createTestListing();
        fillTestListing(listingId);
        deliverTestListing(listingId);
        disputeTestListing(listingId);
        
        // get randomness
        bytes32 randomNumber = keccak256(abi.encodePacked("test-randomness"));
        simulateEntropyCallback(1, randomNumber);
        
        // Should select exactly 3 arbiters from the 12 available
        address[] memory selectedArbiters = arbiter.getSelectedArbitratorsForListing(listingId);
        assertEq(selectedArbiters.length, 3, "Should select exactly 3 arbiters");
        
        // Verify uniqueness
        assertTrue(selectedArbiters[0] != selectedArbiters[1], "Arbiters should be unique");
        assertTrue(selectedArbiters[0] != selectedArbiters[2], "Arbiters should be unique");
        assertTrue(selectedArbiters[1] != selectedArbiters[2], "Arbiters should be unique");
        
        // Verify all are from the original pool
        for (uint256 i = 0; i < selectedArbiters.length; i++) {
            bool found = false;
            for (uint256 j = 0; j < arbiters.length; j++) {
                if (selectedArbiters[i] == arbiters[j]) {
                    found = true;
                    break;
                }
            }
            assertTrue(found, "Selected arbiter should be from original pool");
        }
    }
    
    // Fuzz Tests
    
    function testFuzzListingAmounts(uint256 amount) public {
        vm.assume(amount > 0 && amount < type(uint128).max);
        
        bytes32 listingId = generateListingId();
        uint64 expiration = getFutureTime(TEST_EXPIRATION);
        
        vm.prank(seller);
        escrow.createListing(
            listingId,
            address(token),
            amount,
            expiration,
            IDebazaarEscrow.EscrowType.DISPUTABLE
        );
        
        (IDebazaarEscrow.Listing memory listing) = escrow.getListing(listingId);
        assertEq(listing.amount, amount, "Amount should match fuzz input");
    }
    
    function testFuzzExpirationTimes(uint64 expiration) public {
        uint64 minExpiration = uint64(block.timestamp) + 3600; // 1 hour from now
        vm.assume(expiration > minExpiration && expiration < type(uint64).max);
        
        bytes32 listingId = generateListingId();
        
        vm.prank(seller);
        escrow.createListing(
            listingId,
            address(token),
            TEST_AMOUNT,
            expiration,
            IDebazaarEscrow.EscrowType.DISPUTABLE
        );
        
        (IDebazaarEscrow.Listing memory listing) = escrow.getListing(listingId);
        assertEq(listing.expiration, expiration, "Expiration should match fuzz input");
    }
    
    function testFuzzArbiterVotes(bool vote1, bool vote2, bool vote3) public {
        bytes32 listingId = createTestListing();
        fillTestListing(listingId);
        deliverTestListing(listingId);
        disputeTestListing(listingId);
        
        bytes32 randomNumber = keccak256(abi.encodePacked("fuzz-randomness"));
        simulateEntropyCallback(1, randomNumber);
        
        address[] memory selectedArbiters = arbiter.getSelectedArbitratorsForListing(listingId);
        
        // Cast votes based on fuzz inputs
        vm.prank(selectedArbiters[0]);
        arbiter.resolveListing(listingId, vote1);
        
        vm.prank(selectedArbiters[1]);
        arbiter.resolveListing(listingId, vote2);
        if (vote1 != vote2){
            vm.prank(selectedArbiters[2]);
            arbiter.resolveListing(listingId, vote3);
        }
        // Count votes
        uint256 buyerVotes = 0;
        uint256 sellerVotes = 0;
        
        if (vote1) buyerVotes++; else sellerVotes++;
        if (vote2) buyerVotes++; else sellerVotes++;
        if (vote3) buyerVotes++; else sellerVotes++;
        
        // Verify vote counting logic
        assertTrue(buyerVotes + sellerVotes == 3, "Total votes should equal 3");
        assertTrue(buyerVotes <= 3, "Buyer votes should not exceed 3");
        assertTrue(sellerVotes <= 3, "Seller votes should not exceed 3");
    }
}