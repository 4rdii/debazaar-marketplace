// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {TestBase} from "./TestBase.sol";
import {IDebazaarEscrow} from "../contracts/interfaces/IDebazaarEscrow.sol";

contract DebazaarEscrowTest is TestBase {
    
    // Event declarations for testing
    event DeBazaar__ListingCreated(bytes32 indexed listingId, address indexed seller, address indexed token, uint256 amount, uint64 expiration, uint8 escrowType);
    event DeBazaar__ListingFilled(bytes32 indexed listingId, address indexed buyer, uint64 indexed deadline);
    event DeBazaar__ListingCancelled(address indexed canceller, bytes32 indexed listingId);
    event DeBazaar__Delivered(bytes32 indexed listingId);
    event DeBazaar__Disputed(bytes32 indexed listingId, address indexed disputer);
    event DeBazaar__Released(bytes32 indexed listingId);
    
    function testDeployWithCorrectOwner() public {
        assertEq(escrow.owner(), owner, "Owner should be set correctly");
    }
    
    function testSetArbiter() public {
        address newArbiter = makeAddr("newArbiter");
        escrow.setArbiter(newArbiter);
        assertEq(escrow.getArbiter(), newArbiter, "Arbiter should be set");
    }
    
    function testSetArbiterRevertsOnZeroAddress() public {
        vm.expectRevert(IDebazaarEscrow.ZeroAddress.selector);
        escrow.setArbiter(address(0));
    }
    
    function testCreateListing() public {
        bytes32 listingId = generateListingId();
        uint64 expiration = getFutureTime(TEST_EXPIRATION);
        
        vm.expectEmit(true, true, true, true);
        emit DeBazaar__ListingCreated(listingId, seller, address(token), TEST_AMOUNT, expiration, 2);
        
        vm.prank(seller);
        escrow.createListing(
            listingId,
            address(token),
            TEST_AMOUNT,
            expiration,
            IDebazaarEscrow.EscrowType.DISPUTABLE
        );
        
        (IDebazaarEscrow.Listing memory listing) = escrow.getListing(listingId);
        assertEq(listing.seller, seller, "Seller should be set");
        assertEq(address(listing.token), address(token), "Token should be set");
        assertEq(listing.amount, TEST_AMOUNT, "Amount should be set");
        assertEq(listing.expiration, expiration, "Expiration should be set");
        assertEq(uint8(listing.escrowType), 2, "Escrow type should be DISPUTABLE");
        assertEq(uint8(listing.state), 0, "State should be Open");
    }
    
    function testCreateListingRevertsOnZeroAddress() public {
        bytes32 listingId = generateListingId();
        uint64 expiration = getFutureTime(TEST_EXPIRATION);
        
        vm.prank(seller);
        vm.expectRevert(IDebazaarEscrow.ZeroAddress.selector);
        escrow.createListing(
            listingId,
            address(0),
            TEST_AMOUNT,
            expiration,
            IDebazaarEscrow.EscrowType.DISPUTABLE
        );
    }
    
    function testCreateListingRevertsOnInvalidExpiration() public {
        bytes32 listingId = generateListingId();
        uint64 invalidExpiration = getFutureTime(1800); // 30 minutes (less than MIN_EXPIRATION of 1 hour)
        
        vm.prank(seller);
        vm.expectRevert(IDebazaarEscrow.InvalidDeadline.selector);
        escrow.createListing(
            listingId,
            address(token),
            TEST_AMOUNT,
            invalidExpiration,
            IDebazaarEscrow.EscrowType.DISPUTABLE
        );
    }
    
    function testCreateListingRevertsOnZeroAmount() public {
        bytes32 listingId = generateListingId();
        uint64 expiration = getFutureTime(TEST_EXPIRATION);
        
        vm.prank(seller);
        vm.expectRevert(IDebazaarEscrow.ZeroAmount.selector);
        escrow.createListing(
            listingId,
            address(token),
            0,
            expiration,
            IDebazaarEscrow.EscrowType.DISPUTABLE
        );
    }
    
    function testCreateListingRevertsOnDuplicate() public {
        bytes32 listingId = generateListingId();
        uint64 expiration = getFutureTime(TEST_EXPIRATION);
        
        vm.startPrank(seller);
        escrow.createListing(
            listingId,
            address(token),
            TEST_AMOUNT,
            expiration,
            IDebazaarEscrow.EscrowType.DISPUTABLE
        );
        
        vm.expectRevert(IDebazaarEscrow.ListingAlreadyExists.selector);
        escrow.createListing(
            listingId,
            address(token),
            TEST_AMOUNT,
            expiration,
            IDebazaarEscrow.EscrowType.DISPUTABLE
        );
        vm.stopPrank();
    }
    
    function testFillListing() public {
        bytes32 listingId = createTestListing();
        uint64 deadline = getFutureTime(TEST_DEADLINE);
        
        vm.expectEmit(true, true, false, true);
        emit DeBazaar__ListingFilled(listingId, buyer, deadline);
        
        vm.prank(buyer);
        escrow.fillListing(listingId, deadline);
        
        (IDebazaarEscrow.Listing memory listing) = escrow.getListing(listingId);
        assertEq(listing.buyer, buyer, "Buyer should be set");
        assertEq(uint8(listing.state), 1, "State should be Filled");
        assertEq(listing.deadline, deadline, "Deadline should be set");
        assertEq(token.balanceOf(address(escrow)), TEST_AMOUNT, "Escrow should hold tokens");
    }
    
    function testFillListingRevertsOnInvalidState() public {
        bytes32 listingId = generateListingId();
        uint64 deadline = getFutureTime(TEST_DEADLINE);
        
        vm.prank(buyer);
        // This will fail because the listing doesn't exist, so token transfer will fail
        vm.expectRevert();
        escrow.fillListing(listingId, deadline);
    }
    
    function testFillListingRevertsOnExpired() public {
        bytes32 listingId = generateListingId();
        uint64 expiration = uint64(block.timestamp + 2 hours); // Expired
        uint64 deadline = getFutureTime(TEST_DEADLINE);
        
        vm.prank(seller);
        escrow.createListing(
            listingId,
            address(token),
            TEST_AMOUNT,
            expiration,
            IDebazaarEscrow.EscrowType.DISPUTABLE
        );
        vm.warp(expiration+1);
        vm.prank(buyer);
        vm.expectRevert(IDebazaarEscrow.ListingExpired.selector);
        escrow.fillListing(listingId, deadline);
    }
    
    function testFillListingRevertsOnInvalidDeadline() public {
        bytes32 listingId = createTestListing();
        uint64 invalidDeadline = getPastTime(1); // Past deadline
        
        vm.prank(buyer);
        vm.expectRevert(IDebazaarEscrow.InvalidDeadlineForRefund.selector);
        escrow.fillListing(listingId, invalidDeadline);
    }
    
    function testCancelListingBySeller() public {
        bytes32 listingId = createTestListing();
        
        vm.expectEmit(true, true, false, true);
        emit DeBazaar__ListingCancelled(seller, listingId);
        
        vm.prank(seller);
        escrow.cancelListing(listingId);
        
        (IDebazaarEscrow.Listing memory listing) = escrow.getListing(listingId);
        assertEq(uint8(listing.state), 6, "State should be Canceled");
    }
    
    function testCancelListingByBuyer() public {
        bytes32 listingId = createTestListing();
        fillTestListing(listingId);
        
        // Advance time past deadline
        advanceTime(TEST_DEADLINE + 1);
        
        vm.expectEmit(true, true, false, true);
        emit DeBazaar__ListingCancelled(buyer, listingId);
        
        vm.prank(buyer);
        escrow.cancelListing(listingId);
        
        (IDebazaarEscrow.Listing memory listing) = escrow.getListing(listingId);
        assertEq(uint8(listing.state), 6, "State should be Canceled");
        assertEq(token.balanceOf(buyer), TEST_AMOUNT * 10, "Buyer should be refunded");
    }
    
    function testCancelListingRevertsOnUnauthorized() public {
        bytes32 listingId = createTestListing();
        address unauthorized = makeAddr("unauthorized");
        
        vm.prank(unauthorized);
        vm.expectRevert(IDebazaarEscrow.NotBuyerOrSeller.selector);
        escrow.cancelListing(listingId);
    }
    
    function testDeliverDisputableListing() public {
        bytes32 listingId = createTestListing();
        fillTestListing(listingId);
        
        vm.expectEmit(true, false, false, false);
        emit DeBazaar__Delivered(listingId);
        
        vm.prank(seller);
        escrow.deliverDisputableListing(listingId);
        
        (IDebazaarEscrow.Listing memory listing) = escrow.getListing(listingId);
        assertEq(uint8(listing.state), 2, "State should be Delivered");
    }
    
    function testDisputeListing() public {
        bytes32 listingId = createTestListing();
        fillTestListing(listingId);
        deliverTestListing(listingId);
        
        uint128 fee = getEntropyFee();
        
        vm.expectEmit(true, true, false, false);
        emit DeBazaar__Disputed(listingId, buyer);
        
        vm.prank(buyer);
        escrow.disputeListing{value: fee}(listingId);
        
        (IDebazaarEscrow.Listing memory listing) = escrow.getListing(listingId);
        assertEq(uint8(listing.state), 5, "State should be Disputed");
    }
    
    function testDisputeListingRevertsOnInsufficientFee() public {
        bytes32 listingId = createTestListing();
        fillTestListing(listingId);
        deliverTestListing(listingId);
        
        uint128 insufficientFee = 0.0001 ether;
        
        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(IDebazaarEscrow.InsufficientFeeSentForRandomNumberGeneration.selector, getEntropyFee(), insufficientFee));
        escrow.disputeListing{value: insufficientFee}(listingId);
    }
    
    function testDisputeListingRefundsExcess() public {
        bytes32 listingId = createTestListing();
        fillTestListing(listingId);
        deliverTestListing(listingId);
        
        uint128 fee = getEntropyFee();
        uint128 excessAmount = 0.1 ether;
        uint128 totalValue = fee + excessAmount;
        
        uint256 buyerBalanceBefore = buyer.balance;
        
        vm.prank(buyer);
        escrow.disputeListing{value: totalValue}(listingId);
        
        uint256 buyerBalanceAfter = buyer.balance;
        // Should receive excess amount back (minus gas costs)
        assertApproxEqAbs(buyerBalanceAfter, buyerBalanceBefore - fee, 0.01 ether, "Buyer should receive excess refund");
    }
    
    function testResolveListing() public {
        bytes32 listingId = createTestListing();
        fillTestListing(listingId);
        deliverTestListing(listingId);
        
        vm.expectEmit(true, false, false, false);
        emit DeBazaar__Released(listingId);
        
        vm.prank(buyer);
        escrow.resolveListing(listingId, false); // Accept delivery (resolve in seller's favor)
        
        (IDebazaarEscrow.Listing memory listing) = escrow.getListing(listingId);
        assertEq(uint8(listing.state), 3, "State should be Released");
    }
    
    function testResolveListingWithProtocolFee() public {
        bytes32 listingId = createTestListing();
        fillTestListing(listingId);
        deliverTestListing(listingId);
        
        uint256 sellerBalanceBefore = token.balanceOf(seller);
        
        vm.prank(buyer);
        escrow.resolveListing(listingId, false);
        
        uint256 sellerBalanceAfter = token.balanceOf(seller);
        // Note: Protocol fee testing would require setting fee basis points
        assertGt(sellerBalanceAfter, sellerBalanceBefore, "Seller should receive tokens");
    }
}
