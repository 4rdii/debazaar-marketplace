// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {DebazaarEscrow} from "../contracts/DebazaarEscrow.sol";
import {DebazaarArbiter} from "../contracts/DebazaarArbiter.sol";
import {MockERC20} from "./MockERC20.sol";
import {MockEntropyV2} from "./MockEntropyV2.sol";
import {MockERC721} from "./MockERC721.sol";
import {MockMulticall3} from "./MockMulticall3.sol";
import {IDebazaarEscrow} from "../contracts/interfaces/IDebazaarEscrow.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract TestBase is Test {
    // Core contracts
    DebazaarEscrow public escrow;
    DebazaarArbiter public arbiter;
    MockERC20 public token;
    MockEntropyV2 public entropyV2;
    MockERC721 public nft;
    MockMulticall3 public multicall3;
    
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
    uint64 public constant TEST_EXPIRATION = 10800; // 3 hours (greater than MIN_EXPIRATION of 1 hour)
    uint64 public constant TEST_DEADLINE = 7200; // 2 hours
    uint256 public constant TEST_TOKEN_ID = 1;
    uint256 nonce; // nonce for generating listing id

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
        nft = new MockERC721("TestNFT", "TNFT");
        multicall3 = new MockMulticall3();
        
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

        // Mint NFT to seller for tests
        nft.mint(seller, TEST_TOKEN_ID);
        
        // deal fee to everyone 
        vm.deal(owner, 1 ether);
        vm.deal(buyer, 1 ether);
        vm.deal(seller, 1 ether);
        vm.deal(address(escrow), 1 ether);
    }
    
    function generateListingId() internal returns (bytes32) {
        return keccak256(abi.encodePacked("listing", block.timestamp, block.number, ++nonce));
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
        escrow.fillListing(listingId, deadline, bytes(""));
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
    
    // ========= Onchain Approval Helper Functions =========
    
    function createOnchainApprovalListing() internal returns (bytes32) {
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
        
        return listingId;
    }
    
    function fillOnchainApprovalListing(bytes32 listingId) internal {
        uint64 deadline = getFutureTime(TEST_DEADLINE);
        
        // Create onchain approval data
        IDebazaarEscrow.OnchainApprovalData memory approvalData = IDebazaarEscrow.OnchainApprovalData({
            destination: address(nft),
            data: encodeOwnerOfCall(TEST_TOKEN_ID),
            expectedResult: encodeExpectedResult(buyer)
        });
        
        bytes memory extraData = abi.encode(approvalData);
        
        vm.prank(buyer);
        escrow.fillListing(listingId, deadline, extraData);
    }
    
    function encodeOwnerOfCall(uint256 tokenId) internal pure returns (bytes memory) {
        return abi.encodeWithSelector(IERC721.ownerOf.selector, tokenId);
    }
    
    function encodeExpectedResult(address expectedOwner) internal pure returns (bytes memory) {
        return abi.encode(expectedOwner);
    }
    
    function transferNFTToBuyer() internal {
        vm.prank(seller);
        nft.transferFrom(seller, buyer, TEST_TOKEN_ID);
    }
    
    function deliverOnchainApprovalListing(bytes32 listingId) internal {
        escrow.deliverOnchainApprovalListing(listingId);
    }
    
    function createMulticallForNFTTransferAndDelivery(bytes32 listingId) internal view returns (MockMulticall3.Call3[] memory) {
        MockMulticall3.Call3[] memory calls = new MockMulticall3.Call3[](2);
        
        // Call 1: Transfer NFT
        calls[0] = MockMulticall3.Call3({
            target: address(nft),
            allowFailure: false,
            callData: abi.encodeWithSelector(
                IERC721.transferFrom.selector,
                seller,
                buyer,
                TEST_TOKEN_ID
            )
        });
        
        // Call 2: Deliver listing
        calls[1] = MockMulticall3.Call3({
            target: address(escrow),
            allowFailure: false,
            callData: abi.encodeWithSelector(
                escrow.deliverOnchainApprovalListing.selector,
                listingId
            )
        });
        
        return calls;
    }
}
