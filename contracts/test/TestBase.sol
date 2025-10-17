// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {DebazaarEscrow} from "../contracts/DebazaarEscrow.sol";
import {DebazaarArbiter} from "../contracts/DebazaarArbiter.sol";
import {MockERC20} from "./MockERC20.sol";
import {MockEntropyV2} from "./MockEntropyV2.sol";
import {IDebazaarEscrow} from "../contracts/interfaces/IDebazaarEscrow.sol";

contract TestBase is Test {
    // Core contracts
    DebazaarEscrow public escrow;
    DebazaarArbiter public arbiter;
    MockERC20 public token;
    MockEntropyV2 public entropyV2;
    
    // Test accounts
    address public owner;
    address public seller;
    address public buyer;
    address public arbiter1;
    address public arbiter2;
    address public arbiter3;
    address public arbiter4;
    address public arbiter5;
    
    // Test constants
    uint256 public constant TEST_AMOUNT = 100 ether;
    uint64 public constant TEST_EXPIRATION = 7200; // 2 hours (greater than MIN_EXPIRATION of 1 hour)
    uint64 public constant TEST_DEADLINE = 10800; // 3 hours
    
    function setUp() public virtual {
        // Set up test accounts
        owner = address(this);
        seller = makeAddr("seller");
        buyer = makeAddr("buyer");
        arbiter1 = makeAddr("arbiter1");
        arbiter2 = makeAddr("arbiter2");
        arbiter3 = makeAddr("arbiter3");
        arbiter4 = makeAddr("arbiter4");
        arbiter5 = makeAddr("arbiter5");
        
        // Deploy mock contracts
        token = new MockERC20("Test Token", "TEST");
        entropyV2 = new MockEntropyV2();
        
        // Deploy escrow
        escrow = new DebazaarEscrow(owner);
        
        // Deploy arbiter with initial arbiters
        address[] memory initialArbiters = new address[](5);
        initialArbiters[0] = arbiter1;
        initialArbiters[1] = arbiter2;
        initialArbiters[2] = arbiter3;
        initialArbiters[3] = arbiter4;
        initialArbiters[4] = arbiter5;
        
        arbiter = new DebazaarArbiter(owner, initialArbiters, address(entropyV2));
        
        // Configure system
        escrow.setArbiter(address(arbiter));
        arbiter.setDebazaarEscrow(address(escrow));
        
        // Mint tokens to buyer
        token.mint(buyer, TEST_AMOUNT * 10);
        
        // Approve escrow to spend buyer's tokens
        vm.prank(buyer);
        token.approve(address(escrow), TEST_AMOUNT * 10);
    }
    
    function generateListingId() internal view returns (bytes32) {
        return keccak256(abi.encodePacked("listing", block.timestamp, block.number));
    }
    
    function getCurrentTime() internal view returns (uint64) {
        return uint64(block.timestamp);
    }
    
    function getFutureTime(uint64 secondsFromNow) internal view returns (uint64) {
        return uint64(block.timestamp + secondsFromNow);
    }
    
    function getPastTime(uint64 secondsAgo) internal view returns (uint64) {
        return uint64(block.timestamp - secondsAgo);
    }
    
    function advanceTime(uint64 timeSeconds) internal {
        vm.warp(block.timestamp + timeSeconds);
    }
    
    function simulateEntropyCallback(uint64 sequenceNumber, bytes32 randomNumber) internal {
        entropyV2.simulateCallback(sequenceNumber, randomNumber);
    }
    
    function getEntropyFee() internal view returns (uint128) {
        return entropyV2.getFeeV2();
    }
    
    function createTestListing() internal returns (bytes32) {
        bytes32 listingId = generateListingId();
        uint64 expiration = getFutureTime(TEST_EXPIRATION);
        
        vm.prank(seller);
        escrow.createListing(
            listingId,
            address(token),
            TEST_AMOUNT,
            expiration,
            IDebazaarEscrow.EscrowType.DISPUTABLE
        );
        
        return listingId;
    }
    
    function fillTestListing(bytes32 listingId) internal {
        uint64 deadline = getFutureTime(TEST_DEADLINE);
        
        vm.prank(buyer);
        escrow.fillListing(listingId, deadline);
    }
    
    function deliverTestListing(bytes32 listingId) internal {
        vm.prank(seller);
        escrow.deliverDisputableListing(listingId);
    }
    
    function disputeTestListing(bytes32 listingId) internal {
        uint128 fee = getEntropyFee();
        
        vm.prank(buyer);
        escrow.disputeListing{value: fee}(listingId);
    }
}
