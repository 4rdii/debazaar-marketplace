# Onchain Delivery Test Extension Plan

## Overview

Add comprehensive test coverage for the ONCHAIN_APPROVAL escrow type, which validates delivery by checking NFT ownership on-chain. Tests will use Uniswap's Multicall3 contract to bundle NFT transfers with delivery calls to prevent frontrunning.

## Understanding the New Flow

### ONCHAIN_APPROVAL Flow

1. **Create Listing**: Seller creates listing with `EscrowType.ONCHAIN_APPROVAL`

2. **Fill Listing**: Buyer fills listing with `extraData` containing:

    - `OnchainApprovalData.destination`: Address to call for verification (NFT contract)

    - `OnchainApprovalData.data`: Encoded call data (e.g., `ownerOf(tokenId)`)

    - `OnchainApprovalData.expectedResult`: Expected return value (e.g., buyer's address)

3. **Deliver**: Anyone calls `deliverOnchainApprovalListing()`:

    - Makes `staticcall` to destination with provided data

    - Compares result hash with expectedResult hash

    - If match: calls `resolveListing(listingId, false)` to release funds to seller

    - If mismatch: reverts with `ApprovalResultMismatch`

4. **Frontrunning Prevention**: Use Multicall3 to atomically:

    - Transfer NFT from seller to buyer

    - Call `deliverOnchainApprovalListing()` in same transaction

## Implementation Steps

### 1. Create Mock NFT Contract

**File**: `contracts/test/MockERC721.sol`

Create a simple ERC721 mock with:

- Standard OpenZeppelin ERC721 inheritance

- `mint(address to, uint256 tokenId)` function for test setup

- No additional complexity needed

### 2. Create Multicall3 Mock/Interface

**File**: `contracts/test/MockMulticall3.sol`

Create a simplified Multicall3 implementation:

- `aggregate3` function that accepts array of calls

- Each call contains: target address, calldata, allowFailure flag

- Returns array of results (success, returnData)

- This mimics Uniswap's Multicall3 at 0xcA11bde05977b3631167028862bE2a173976CA11

**Alternative**: If using mainnet fork, can use actual Multicall3 deployment

### 3. Extend TestBase

**File**: `contracts/test/TestBase.sol`

Add to TestBase:

```solidity

MockERC721 public nft;

MockMulticall3 public multicall3;

uint256 public constant TEST_TOKEN_ID = 1;

```

In `setUp()`:

```solidity

nft = new MockERC721("TestNFT", "TNFT");

multicall3 = new MockMulticall3();



// Mint NFT to seller for tests

nft.mint(seller, TEST_TOKEN_ID);

```

Helper functions:

```solidity

function createOnchainApprovalListing() internal returns (bytes32)

function fillOnchainApprovalListing(bytes32 listingId) internal

function encodeOwnerOfCall(uint256 tokenId) internal pure returns (bytes)

function encodeExpectedResult(address owner) internal pure returns (bytes)

```

### 4. Create OnchainApproval Test File

**File**: `contracts/test/DebazaarEscrowOnchain.t.sol`

#### Test Structure:

**Setup Tests:**

- `testCreateOnchainApprovalListing()` - Create listing with ONCHAIN_APPROVAL type

- `testFillOnchainApprovalListingWithValidData()` - Fill with valid OnchainApprovalData

- `testFillOnchainApprovalListingRevertsWithInvalidExtraData()` - Revert on malformed data

**Happy Path Tests:**

- `testDeliverOnchainApprovalListingSuccess()` - Direct delivery after NFT transfer

- `testDeliverOnchainApprovalListingViaMulticall()` - Bundle NFT transfer + delivery

- `testDeliverOnchainApprovalListingByAnyone()` - Verify anyone can call delivery

- `testDeliverOnchainApprovalListingEmitsEvents()` - Check correct events emitted

- `testDeliverOnchainApprovalListingReleasesToSeller()` - Verify funds go to seller

- `testDeliverOnchainApprovalListingWithProtocolFee()` - Verify fee deduction

**Failure Scenario Tests:**

- `testDeliverOnchainApprovalListingRevertsOnWrongState()` - Must be State.Filled

- `testDeliverOnchainApprovalListingRevertsOnWrongEscrowType()` - Must be ONCHAIN_APPROVAL

- `testDeliverOnchainApprovalListingRevertsWhenNFTNotTransferred()` - Static call returns wrong owner

- `testDeliverOnchainApprovalListingRevertsOnStaticCallFailure()` - Destination call fails

- `testDeliverOnchainApprovalListingRevertsOnResultMismatch()` - Result doesn't match expected

- `testDeliverOnchainApprovalListingRevertsOnInvalidDestination()` - Call to invalid contract

- `testDeliverOnchainApprovalListingFrontrunningPrevention()` - Demonstrate frontrunning vulnerability without multicall

**Edge Cases:**

- `testDeliverOnchainApprovalListingWithZeroAddressInData()` - Handle edge case data

- `testDeliverOnchainApprovalListingWithLargeReturnData()` - Test gas limits

- `testDeliverOnchainApprovalListingAfterExpiration()` - Time-based edge case

### 5. Create Integration Test

**File**: `contracts/test/IntegrationOnchain.t.sol`

Full end-to-end tests:

- `testFullOnchainApprovalFlow()` - Complete flow from creation to resolution

- `testMultipleOnchainApprovalListings()` - Handle multiple concurrent listings

- `testOnchainApprovalWithDifferentNFTs()` - Test with different token IDs

- `testOnchainApprovalFlowComparison()` - Compare ONCHAIN vs DISPUTABLE flows

### 6. Update Existing Tests

**Files**: `contracts/test/DebazaarEscrow.t.sol`, `contracts/test/Integration.t.sol`

Add ONCHAIN_APPROVAL variants where appropriate:

- Update `testFillListing` to test all three escrow types

- Add ONCHAIN_APPROVAL to integration tests

- Ensure state transitions work correctly

### 7. Create Test Plan Documentation

**File**: `extendtestplan.md`

Document:

- New test coverage areas

- Multicall3 usage patterns

- Frontrunning attack vectors and mitigations

- Gas cost comparisons

- Known limitations and future improvements

## Key Test Patterns

### Multicall3 Usage Example:

```solidity

IMulticall3.Call3[] memory calls = new IMulticall3.Call3[](2);



// Call 1: Transfer NFT

calls[0] = IMulticall3.Call3({

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

calls[1] = IMulticall3.Call3({

    target: address(escrow),

    allowFailure: false,

    callData: abi.encodeWithSelector(

        escrow.deliverOnchainApprovalListing.selector,

        listingId

    )

});



vm.prank(seller);

multicall3.aggregate3(calls);

```

### OnchainApprovalData Encoding:

```solidity

IDebazaarEscrow.OnchainApprovalData memory approvalData = IDebazaarEscrow.OnchainApprovalData({

    destination: address(nft),

    data: abi.encodeWithSelector(IERC721.ownerOf.selector, TEST_TOKEN_ID),

    expectedResult: abi.encode(buyer)

});



bytes memory extraData = abi.encode(approvalData);

```

## Testing Checklist

- [ ] MockERC721 contract created and tested

- [ ] MockMulticall3 contract created and tested  

- [ ] TestBase extended with NFT and multicall helpers

- [ ] All happy path tests passing

- [ ] All failure scenario tests passing

- [ ] Integration tests passing

- [ ] Gas cost measurements documented

- [ ] Frontrunning scenarios tested

- [ ] Documentation in extendtestplan.md completed

## Expected Test Count

- Setup tests: 3

- Happy path tests: 6

- Failure scenarios: 7

- Edge cases: 3

- Integration tests: 4

- **Total new tests: ~23**

## Notes

- Use `vm.expectRevert()` for error testing

- Use `vm.expectEmit()` for event testing

- Use `vm.prank()` for caller simulation

- Consider gas snapshots for optimization tracking

- Document any assumptions about NFT transfer patterns