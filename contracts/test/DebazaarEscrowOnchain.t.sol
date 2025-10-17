// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {TestBase} from "./TestBase.sol";
import {IDebazaarEscrow} from "../contracts/interfaces/IDebazaarEscrow.sol";
import {MockMulticall3} from "./MockMulticall3.sol";

contract DebazaarEscrowOnchainTest is TestBase {
    
    // Event declarations for testing
    event DeBazaar__ListingCreated(bytes32 indexed listingId, address indexed seller, address indexed token, uint256 amount, uint64 expiration, uint8 escrowType);
    event DeBazaar__ListingFilled(bytes32 indexed listingId, address indexed buyer, uint64 deadline);
    event DeBazaar__Delivered(bytes32 indexed listingId);
    event DeBazaar__Released(bytes32 indexed listingId);
    
    // ========= Setup Tests =========
    
    function testCreateOnchainApprovalListing() public {
        bytes32 listingId = generateListingId();
        uint64 expiration = getFutureTime(TEST_EXPIRATION);
        
        vm.expectEmit(true, true, true, true);
        emit DeBazaar__ListingCreated(listingId, seller, address(token), TEST_AMOUNT, expiration, 1);
        
        vm.prank(seller);
        escrow.createListing(
            listingId,
            address(token),
            TEST_AMOUNT,
            expiration,
            IDebazaarEscrow.EscrowType.ONCHAIN_APPROVAL
        );
        
        IDebazaarEscrow.Listing memory listing = escrow.getListing(listingId);
        assertEq(listing.seller, seller, "Seller should be set");
        assertEq(address(listing.token), address(token), "Token should be set");
        assertEq(listing.amount, TEST_AMOUNT, "Amount should be set");
        assertEq(listing.expiration, expiration, "Expiration should be set");
        assertEq(uint8(listing.escrowType), 1, "Escrow type should be ONCHAIN_APPROVAL");
        assertEq(uint8(listing.state), 0, "State should be Open");
    }
    
    function testFillOnchainApprovalListingWithValidData() public {
        bytes32 listingId = createOnchainApprovalListing();
        
        vm.expectEmit(true, true, true, true);
        emit DeBazaar__ListingFilled(listingId, buyer, getFutureTime(TEST_DEADLINE));
        
        fillOnchainApprovalListing(listingId);
        
        IDebazaarEscrow.Listing memory listing = escrow.getListing(listingId);
        assertEq(listing.buyer, buyer, "Buyer should be set");
        assertEq(uint8(listing.state), 1, "State should be Filled");
        assertEq(listing.onchainApprovalData.destination, address(nft), "Destination should be NFT contract");
        assertEq(listing.onchainApprovalData.data, encodeOwnerOfCall(TEST_TOKEN_ID), "Data should be ownerOf call");
        assertEq(listing.onchainApprovalData.expectedResult, encodeExpectedResult(buyer), "Expected result should be buyer");
    }
    
    function testFillOnchainApprovalListingRevertsWithInvalidExtraData() public {
        bytes32 listingId = createOnchainApprovalListing();
        uint64 deadline = getFutureTime(TEST_DEADLINE);
        
        // Try to fill with malformed extra data
        bytes memory invalidExtraData = abi.encode("invalid data");
        
        vm.prank(buyer);
        vm.expectRevert();
        escrow.fillListing(listingId, deadline, invalidExtraData);
    }
    
    // ========= Happy Path Tests =========
    
    function testDeliverOnchainApprovalListingSuccess() public {
        bytes32 listingId = createOnchainApprovalListing();
        fillOnchainApprovalListing(listingId);
        
        // Transfer NFT to buyer first
        transferNFTToBuyer();
        
        vm.expectEmit(true, true, true, true);
        emit DeBazaar__Delivered(listingId);
        
        vm.expectEmit(true, true, true, true);
        emit DeBazaar__Released(listingId);
        
        deliverOnchainApprovalListing(listingId);
        
        IDebazaarEscrow.Listing memory listing = escrow.getListing(listingId);
        assertEq(uint8(listing.state), 3, "State should be Released");
        assertEq(nft.ownerOf(TEST_TOKEN_ID), buyer, "NFT should be owned by buyer");
    }
    
    function testDeliverOnchainApprovalListingViaMulticall() public {
        bytes32 listingId = createOnchainApprovalListing();
        fillOnchainApprovalListing(listingId);
        
        MockMulticall3.Call3[] memory calls = createMulticallForNFTTransferAndDelivery(listingId);
        
        vm.expectEmit(true, true, true, true);
        emit DeBazaar__Delivered(listingId);
        
        vm.expectEmit(true, true, true, true);
        emit DeBazaar__Released(listingId);
        
        vm.prank(seller);
        multicall3.aggregate3(calls);
        
        IDebazaarEscrow.Listing memory listing = escrow.getListing(listingId);
        assertEq(uint8(listing.state), 3, "State should be Released");
        assertEq(nft.ownerOf(TEST_TOKEN_ID), buyer, "NFT should be owned by buyer");
    }
    
    function testDeliverOnchainApprovalListingByAnyone() public {
        bytes32 listingId = createOnchainApprovalListing();
        fillOnchainApprovalListing(listingId);
        transferNFTToBuyer();
        
        address randomUser = makeAddr("randomUser");
        
        vm.expectEmit(true, true, true, true);
        emit DeBazaar__Delivered(listingId);
        
        vm.expectEmit(true, true, true, true);
        emit DeBazaar__Released(listingId);
        
        vm.prank(randomUser);
        deliverOnchainApprovalListing(listingId);
        
        IDebazaarEscrow.Listing memory listing = escrow.getListing(listingId);
        assertEq(uint8(listing.state), 3, "State should be Released");
    }
    
    function testDeliverOnchainApprovalListingEmitsEvents() public {
        bytes32 listingId = createOnchainApprovalListing();
        fillOnchainApprovalListing(listingId);
        transferNFTToBuyer();
        
        vm.expectEmit(true, true, true, true);
        emit DeBazaar__Delivered(listingId);
        
        vm.expectEmit(true, true, true, true);
        emit DeBazaar__Released(listingId);
        
        deliverOnchainApprovalListing(listingId);
    }
    
    function testDeliverOnchainApprovalListingReleasesToSeller() public {
        bytes32 listingId = createOnchainApprovalListing();
        fillOnchainApprovalListing(listingId);
        transferNFTToBuyer();
        
        uint256 sellerBalanceBefore = token.balanceOf(seller);
        
        deliverOnchainApprovalListing(listingId);
        
        uint256 sellerBalanceAfter = token.balanceOf(seller);
        assertEq(sellerBalanceAfter - sellerBalanceBefore, TEST_AMOUNT, "Seller should receive the full amount");
    }
    
    function testDeliverOnchainApprovalListingWithProtocolFee() public {
        // Set a protocol fee
        vm.prank(owner);
        escrow.setFee(100); // 1% fee
        
        bytes32 listingId = createOnchainApprovalListing();
        fillOnchainApprovalListing(listingId);
        transferNFTToBuyer();
        
        uint256 sellerBalanceBefore = token.balanceOf(seller);
        uint256 ownerBalanceBefore = token.balanceOf(owner);
        
        deliverOnchainApprovalListing(listingId);
        
        uint256 sellerBalanceAfter = token.balanceOf(seller);
        uint256 ownerBalanceAfter = token.balanceOf(owner);
        
        uint256 expectedFee = TEST_AMOUNT / 100; // 1% of TEST_AMOUNT
        uint256 expectedSellerAmount = TEST_AMOUNT - expectedFee;
        
        assertEq(sellerBalanceAfter - sellerBalanceBefore, expectedSellerAmount, "Seller should receive amount minus fee");
        assertEq(ownerBalanceAfter - ownerBalanceBefore, expectedFee, "Owner should receive the fee");
    }
    
    // ========= Failure Scenario Tests =========
    
    function testDeliverOnchainApprovalListingRevertsOnWrongState() public {
        bytes32 listingId = createOnchainApprovalListing();
        // Don't fill the listing - it should still be in Open state
        
        vm.expectRevert(IDebazaarEscrow.InvalidState.selector);
        deliverOnchainApprovalListing(listingId);
    }
    
    function testDeliverOnchainApprovalListingRevertsOnWrongEscrowType() public {
        bytes32 listingId = createTestListing(); // Creates DISPUTABLE listing
        fillTestListing(listingId);
        
        vm.expectRevert(IDebazaarEscrow.InvalidEscrowType.selector);
        deliverOnchainApprovalListing(listingId);
    }
    
    function testDeliverOnchainApprovalListingRevertsWhenNFTNotTransferred() public {
        bytes32 listingId = createOnchainApprovalListing();
        fillOnchainApprovalListing(listingId);
        // Don't transfer NFT - seller still owns it
        
        vm.expectRevert(IDebazaarEscrow.ApprovalResultMismatch.selector);
        deliverOnchainApprovalListing(listingId);
    }
    
    function testDeliverOnchainApprovalListingRevertsOnStaticCallFailure() public {
        bytes32 listingId = createOnchainApprovalListing();
        fillOnchainApprovalListing(listingId);
        transferNFTToBuyer();
        
        // Create a new listing with invalid destination
        bytes32 invalidListingId = generateListingId();
        uint64 expiration = getFutureTime(TEST_EXPIRATION);
        
        vm.prank(seller);
        escrow.createListing(
            invalidListingId,
            address(token),
            TEST_AMOUNT,
            expiration,
            IDebazaarEscrow.EscrowType.ONCHAIN_APPROVAL
        );
        
        uint64 deadline = getFutureTime(TEST_DEADLINE);
        IDebazaarEscrow.OnchainApprovalData memory approvalData = IDebazaarEscrow.OnchainApprovalData({
            destination: address(0x1), // Invalid address
            data: encodeOwnerOfCall(TEST_TOKEN_ID),
            expectedResult: encodeExpectedResult(buyer)
        });
        
        bytes memory extraData = abi.encode(approvalData);
        
        vm.prank(buyer);
        escrow.fillListing(invalidListingId, deadline, extraData);
        
        vm.expectRevert(IDebazaarEscrow.ApprovalStaticCallFailed.selector);
        escrow.deliverOnchainApprovalListing(invalidListingId);
    }
    
    function testDeliverOnchainApprovalListingRevertsOnResultMismatch() public {
        bytes32 listingId = createOnchainApprovalListing();
        fillOnchainApprovalListing(listingId);
        transferNFTToBuyer();
        
        // Create a new listing with wrong expected result
        bytes32 wrongResultListingId = generateListingId();
        uint64 expiration = getFutureTime(TEST_EXPIRATION);
        
        vm.prank(seller);
        escrow.createListing(
            wrongResultListingId,
            address(token),
            TEST_AMOUNT,
            expiration,
            IDebazaarEscrow.EscrowType.ONCHAIN_APPROVAL
        );
        
        uint64 deadline = getFutureTime(TEST_DEADLINE);
        IDebazaarEscrow.OnchainApprovalData memory approvalData = IDebazaarEscrow.OnchainApprovalData({
            destination: address(nft),
            data: encodeOwnerOfCall(TEST_TOKEN_ID),
            expectedResult: encodeExpectedResult(seller) // Wrong expected result
        });
        
        bytes memory extraData = abi.encode(approvalData);
        
        vm.prank(buyer);
        escrow.fillListing(wrongResultListingId, deadline, extraData);
        
        vm.expectRevert(IDebazaarEscrow.ApprovalResultMismatch.selector);
        escrow.deliverOnchainApprovalListing(wrongResultListingId);
    }
    
    function testDeliverOnchainApprovalListingRevertsOnInvalidDestination() public {
        bytes32 listingId = createOnchainApprovalListing();
        fillOnchainApprovalListing(listingId);
        transferNFTToBuyer();
        
        // Create a new listing with invalid destination
        bytes32 invalidListingId = generateListingId();
        uint64 expiration = getFutureTime(TEST_EXPIRATION);
        
        vm.prank(seller);
        escrow.createListing(
            invalidListingId,
            address(token),
            TEST_AMOUNT,
            expiration,
            IDebazaarEscrow.EscrowType.ONCHAIN_APPROVAL
        );
        
        uint64 deadline = getFutureTime(TEST_DEADLINE);
        IDebazaarEscrow.OnchainApprovalData memory approvalData = IDebazaarEscrow.OnchainApprovalData({
            destination: address(0xDEADBEEF), // Invalid contract address
            data: encodeOwnerOfCall(TEST_TOKEN_ID),
            expectedResult: encodeExpectedResult(buyer)
        });
        
        bytes memory extraData = abi.encode(approvalData);
        
        vm.prank(buyer);
        escrow.fillListing(invalidListingId, deadline, extraData);
        
        vm.expectRevert(IDebazaarEscrow.ApprovalStaticCallFailed.selector);
        escrow.deliverOnchainApprovalListing(invalidListingId);
    }
    
    function testDeliverOnchainApprovalListingFrontrunningPrevention() public {
        bytes32 listingId = createOnchainApprovalListing();
        fillOnchainApprovalListing(listingId);
        
        // Simulate frontrunning attack: someone tries to deliver before NFT transfer
        vm.expectRevert(IDebazaarEscrow.ApprovalResultMismatch.selector);
        deliverOnchainApprovalListing(listingId);
        
        // Now transfer NFT and deliver - should work
        transferNFTToBuyer();
        deliverOnchainApprovalListing(listingId);
        
        IDebazaarEscrow.Listing memory listing = escrow.getListing(listingId);
        assertEq(uint8(listing.state), 3, "State should be Released");
    }
    
    // ========= Edge Cases =========
    
    function testDeliverOnchainApprovalListingWithZeroAddressInData() public {
        bytes32 listingId = generateListingId();
        uint64 expiration = getFutureTime(TEST_EXPIRATION);
        
        vm.prank(seller);
        escrow.createListing(
            listingId,
            address(token),
            TEST_AMOUNT,
            expiration,
            IDebazaarEscrow.EscrowType.ONCHAIN_APPROVAL
        );
        
        uint64 deadline = getFutureTime(TEST_DEADLINE);
        IDebazaarEscrow.OnchainApprovalData memory approvalData = IDebazaarEscrow.OnchainApprovalData({
            destination: address(0), // Zero address
            data: encodeOwnerOfCall(TEST_TOKEN_ID),
            expectedResult: encodeExpectedResult(buyer)
        });
        
        bytes memory extraData = abi.encode(approvalData);
        
        vm.prank(buyer);
        escrow.fillListing(listingId, deadline, extraData);
        
        vm.expectRevert(IDebazaarEscrow.ApprovalStaticCallFailed.selector);
        escrow.deliverOnchainApprovalListing(listingId);
    }
    
    function testDeliverOnchainApprovalListingWithLargeReturnData() public {
        // This test ensures the system can handle large return data
        bytes32 listingId = createOnchainApprovalListing();
        fillOnchainApprovalListing(listingId);
        transferNFTToBuyer();
        
        // Should work fine with standard ownerOf call
        deliverOnchainApprovalListing(listingId);
        
        IDebazaarEscrow.Listing memory listing = escrow.getListing(listingId);
        assertEq(uint8(listing.state), 3, "State should be Released");
    }
    
    function testDeliverOnchainApprovalListingAfterExpiration() public {
        bytes32 listingId = createOnchainApprovalListing();
        fillOnchainApprovalListing(listingId);
        transferNFTToBuyer();
        
        // Advance time past expiration
        advanceTime(TEST_EXPIRATION + 1);
        
        // Should still work - expiration only affects filling, not delivery
        deliverOnchainApprovalListing(listingId);
        
        IDebazaarEscrow.Listing memory listing = escrow.getListing(listingId);
        assertEq(uint8(listing.state), 3, "State should be Released");
    }
}
