<!-- 485d311b-065a-4ea0-91a6-4e6e2adc0eb8 77680544-03cd-45e3-a551-defb6da62337 -->
<!-- 485d311b-065a-4ea0-91a6-4e6e2adc0eb8 a6302f3d-ab9c-4bcb-9dca-cdf721926a2f -->

# Test Suite for Debazaar Contracts - Hardhat 3 Solidity Tests

## Overview

Using Hardhat 3's native Solidity testing feature for comprehensive unit and integration tests. This approach provides better gas reporting, faster execution, and native Solidity assertions.

## Test Structure

### 1. Test Utilities and Mocks

**Mock Contracts (`test/` directory):**

- `MockERC20.sol` - ERC20 token for testing transfers
- `MockEntropyV2.sol` - Mock Pyth Entropy contract with manual callback triggering

**Test Base Contract (`test/TestBase.sol`):**

- Import forge-std Test contract for assertions
- Common setup functions and utilities
- Helper functions for deployment and configuration

### 2. Unit Tests (Solidity)

#### DebazaarEscrow Tests (`test/DebazaarEscrow.t.sol`)

Extends TestBase and includes:

**Setup:**

- `setUp()` - Deploy escrow, mocks, and configure system
- Create reusable contract instances

**Test Functions:**

- `testDeployWithCorrectOwner()` - Verify owner after deployment
- `testSetArbiter()` - Set arbiter address successfully
- `testSetArbiterRevertsOnZeroAddress()` - Revert on zero address
- `testCreateListing()` - Create listing with valid parameters
- `testCreateListingRevertsOnZeroAddress()` - Revert on invalid addresses
- `testCreateListingRevertsOnInvalidExpiration()` - Revert on short expiration
- `testCreateListingRevertsOnZeroAmount()` - Revert on zero amount
- `testCreateListingRevertsOnDuplicate()` - Revert on duplicate listing ID
- `testFillListing()` - Buyer fills open listing successfully
- `testFillListingRevertsOnInvalidState()` - Revert if not open
- `testFillListingRevertsOnExpired()` - Revert if expired
- `testFillListingRevertsOnInvalidDeadline()` - Revert on invalid deadline
- `testCancelListingBySeller()` - Seller cancels open listing
- `testCancelListingByBuyer()` - Buyer cancels after deadline
- `testCancelListingRevertsOnUnauthorized()` - Revert if not buyer/seller
- `testDeliverDisputableListing()` - Seller marks as delivered
- `testDisputeListing()` - Buyer/seller disputes with correct fee
- `testDisputeListingRevertsOnInsufficientFee()` - Revert on low fee
- `testDisputeListingRefundsExcess()` - Refund excess entropy fee
- `testResolveListing()` - Buyer accepts delivery
- `testResolveListingWithProtocolFee()` - Verify fee deduction

#### DebazaarArbiter Tests (`test/DebazaarArbiter.t.sol`)

**Setup:**

- `setUp()` - Deploy arbiter with initial arbiters and mock entropy

**Test Functions:**

- `testDeployWithInitialArbiters()` - Verify initial arbiters set
- `testAddArbiter()` - Add new arbiter successfully
- `testRemoveArbiter()` - Remove arbiter successfully
- `testAddArbiterRevertsOnNonAdmin()` - Revert if not admin
- `testSetEscrow()` - Set escrow contract address
- `testSetEscrowRevertsOnZeroAddress()` - Revert on zero address
- `testAddListingToQueue()` - Escrow adds listing to queue
- `testAddListingToQueueRequestsRandomness()` - Verify randomness request
- `testAddListingToQueueRevertsOnDuplicate()` - Revert on duplicate
- `testAddListingToQueueRevertsOnUnauthorized()` - Revert if not escrow
- `testEntropyCallbackSelectsArbiters()` - Callback selects 3 arbiters
- `testEntropyCallbackStoresRandomness()` - Verify randomness storage
- `testResolveListing()` - Arbiter casts vote successfully
- `testResolveListingCountsVotes()` - Verify vote counting
- `testResolveListingForBuyer()` - Resolve in buyer's favor (2+ votes)
- `testResolveListingForSeller()` - Resolve in seller's favor (2+ votes)
- `testResolveListingRevertsOnNoRandomness()` - Revert if no randomness
- `testResolveListingRevertsOnUnauthorized()` - Revert if not selected
- `testResolveListingRevertsOnAlreadyResolved()` - Revert on double resolution
- `testSelectArbitersUniqueness()` - Verify 3 unique arbiters selected
- `testSelectArbitersDeterministic()` - Same randomness = same selection

### 3. Integration Tests (`test/Integration.t.sol`)

**Full Flow Tests:**

- `testFullDisputeResolutionFlow()` - Complete dispute resolution workflow
- `testMultipleConcurrentDisputes()` - Handle multiple disputes
- `testDisputeWith3Arbiters()` - Edge case with exactly 3 arbiters
- `testDisputeWith10PlusArbiters()` - Random selection from large pool

**Fuzz Tests:**

- `testFuzzListingAmounts(uint256 amount)` - Test various amounts
- `testFuzzExpirationTimes(uint64 expiration)` - Test expiration edge cases
- `testFuzzArbiterVotes(bool vote1, bool vote2, bool vote3)` - Test vote combinations

## Key Features

**Using forge-std assertions:**

```solidity
import {Test} from "forge-std/Test.sol";

contract DebazaarEscrowTest is Test {
    function testExample() public {
        assertEq(value, expected, "Values should match");
        assertTrue(condition, "Should be true");
        assertGt(a, b, "A should be greater than B");
    }
}
```

**Setup function for test initialization:**

```solidity
function setUp() public {
    // Runs before each test
    escrow = new DebazaarEscrow(owner);
    token = new MockERC20("Test", "TEST");
}
```

**Fuzz testing support:**

```solidity
function testFuzzAmount(uint256 amount) public {
    // Called multiple times with random values
    vm.assume(amount > 0 && amount < type(uint128).max);
    // test logic
}
```

## Files to Create

1. `test/MockERC20.sol` - ERC20 mock for testing
2. `test/MockEntropyV2.sol` - Entropy mock with callback simulation
3. `test/TestBase.sol` - Base test contract with common setup
4. `test/DebazaarEscrow.t.sol` - Escrow unit tests
5. `test/DebazaarArbiter.t.sol` - Arbiter unit tests
6. `test/Integration.t.sol` - Integration and fuzz tests

## Dependencies

Install forge-std for assertions and test utilities:

```bash
npm install --save-dev github:foundry-rs/forge-std#v1.9.4
```

## Run Commands

```bash
# Run all tests (both Solidity and TypeScript if any)
npx hardhat test

# Run only Solidity tests
npx hardhat test solidity

# Run specific test file
npx hardhat test test/DebazaarEscrow.t.sol

# Run with gas reporting
REPORT_GAS=true npx hardhat test solidity

# Verbose output
npx hardhat test solidity --verbose
```

## Configuration

Update `hardhat.config.ts` to configure Solidity tests if needed:

```typescript
test: {
  solidity: {
    // Configure test execution environment
    sender: "0x1234567890123456789012345678901234567890", // default msg.sender
  }
}
```

### To-dos

- [ ] Create MockERC20.sol and MockEntropyV2.sol in test/mocks/
- [ ] Create fixtures.ts and helpers.ts in test/shared/
- [ ] Write DebazaarEscrow.test.ts with all unit tests
- [ ] Write DebazaarArbiter.test.ts with all unit tests
- [ ] Write Integration.test.ts for full flow testing

### To-dos

- [ ] Create MockERC721.sol with mint function
- [ ] Create MockMulticall3.sol with aggregate3 function
- [ ] Add NFT and Multicall3 setup to TestBase.sol
- [ ] Create DebazaarEscrowOnchain.t.sol with all unit tests
- [ ] Create IntegrationOnchain.t.sol for end-to-end flows
- [ ] Update existing tests to include ONCHAIN_APPROVAL variants
- [ ] Create extendtestplan.md with detailed test documentation