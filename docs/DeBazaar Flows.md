# DeBazaar Flows

This project supports three escrow flows in `DebazaarEscrow`:

- DISPUTABLE ( Arbiter selection done via Pyth entropy )
- API_APPROVAL (via Chainlink Functions)
- ONCHAIN_APPROVAL (via on-chain callable check)

Below is the minimal lifecycle and the specific delivery step for each flow.

## Common Lifecycle (all flows)
- `createListing(bytes32 listingId, address token, uint256 amount, uint64 expiration, EscrowType type)`
  - Seller creates an escrow listing (emits `DeBazaar__ListingCreated`)
- `fillListing(bytes32 listingId, uint64 deadline, bytes extraData)`
  - Buyer approves the token to escrow and fills (escrow pulls `amount` from buyer)
  - Encodes per-flow data in `extraData`
  - Emits `DeBazaar__ListingFilled`

States: Open → Filled → Delivered → Released/Refunded (or Canceled/Disputed)

---

## 1) DISPUTABLE Asset Transfer Flow
- Extra Data: empty
- Full Flow:

  ![Disputable Flow](./assets/Arbitration-Settlement-Flow.svg)
    - Seller creates an escrow listing and emits `DeBazaar__ListingCreated`
    - Backend creates a Telegram group in case of any dispute; Seller must join in.
    - After the negotiation phase, Buyer locks funds in the Escrow using `fillListing()`, and joins the Telegram group.
    - Happy Path:
      - Seller calls `deliverDisputableListing(listingId)` → state: Delivered, emits `DeBazaar__Delivered`
      - Escrow unlocks the fund and fee using `resolveListing(listingId, toBuyer)`.
    - Dispute Path:
      - Buyer/Seller may call `disputeListing(listingId)` to involve arbiter selection and voting.
      - The Escrow contract calls `addToListingQueue{value: fee}(listingId)` of the Arbitration contract.
      - Arbitration contract calls `requestRandomNumber(listingId)`, which calls `requestV2()` on Pyth VRF contract.
      - Pyth VRF contract provides a random number and calls `entropyCallback(sequenceNumber, provider, randomNumber)` of the Arbitration contract.
      - A random list of Arbiters are selected and Backend is notified with this list; Arbiters are added to the Telegram group.
      - Buyer and Seller provide their own evidence; Arbiters decide who is right.
      - Arbiters call `resolveListing(listingId, toBuyer)` of Arbitration contract, which calls `resolveListing(listingId, toBuyer)` of the Escrow contract.
    - Emits `DeBazaar__Released` (to seller) or `DeBazaar__Refunded` (to buyer).

---

## 2) Centralized API_APPROVAL-needed Asset Transfer Flow (via Chainlink Functions)

### The Flow 
- extraData: `ApiApprovalData` encoded as tuple
  - source (JS), `encryptedSecretsUrls (bytes)`, args `(string[]), bytesArgs (bytes[]), requestId (bytes32)`.
  - On fill, the escrow stores the API data and clears the requestId (will be set on delivery).
- Full Flow:

  ![Disputable Flow](./assets/Centralized-with-API-Settlement-and-Oracle.svg)
    - Seller creates an escrow listing and emits `DeBazaar__ListingCreated`
    - After the negotiation phase, Buyer locks funds in the Escrow using `fillListing()`.
    - After Seller transferred assets off-chain (e.g., a rare skin in a game), he calls `deliverApiApprovalListing(listingId, donHostedSecretsSlotID, donHostedSecretsVersion, subscriptionId, gasLimit, donID)` on the Escrow contract.
    - This call on the Escrow contract calls the `sendRequest()` on `FunctionsConsumerUpgradeable` which is a ChainLink's [`FunctionClient`](https://github.com/smartcontractkit/chainlink-brownie-contracts/blob/main/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol).
    - ChainLink queries the API of the asset centralized provider (e.g., the gaming company), and after getting the `response` calls `fullfillRequest(linstingId, response, err)`.
    - Happy Path:
      - Escrow unlocks the fund and fee using `resolveListing(listingId, toBuyer: false)`.
    - Unhappy Paths:
      - Seller has not sent the asset:
        - Escrow refunds the fund  back to the Buyer using `resolveListing(listingId, toBuyer: true)`.
      - Deadline is passed:
        - Buyer calls `cancelListingByBuyer(listingId)` and Escrow refunds the locked fund back to Buyer.
    - Emits `DeBazaar__Released` (to seller) or `DeBazaar__Refunded` (to buyer).

### Environment variables typically needed for the API flow:
- `CHAINLINK_FUNCTIONS_SUBSCRIPTION_ID`
- `CHAINLINK_DON_ID_ARB_SEPOLIA`
- `ARBITRUM_SEPOLIA_RPC_URL, PRIVATE_KEY` (funded)

### How to run the sample API flow script:
- Uses `contracts/scripts/test-chainlink-functions.ts`
- Update LINK token allowance and ensure subscription exists/funded
- Command:
  - `npm run test:chainlink-functions`

---

## 3) ONCHAIN_APPROVAL-needed Asset Transfer Flow

### The Flow
- extraData: `OnchainApprovalData` encoded as tuple, destination (address), data (bytes), expectedResult (bytes)
- Full Flow:

  ![Disputable Flow](./assets/On-chain-Settlement.svg)
    - Seller creates an escrow listing and emits `DeBazaar__ListingCreated`
    - After the negotiation phase, Buyer locks funds in the Escrow using `fillListing()`.
    - The Seller:
      - Transfers assets on-chain (e.g., a NFT or fungible token), then he calls `deliverOnchainApprovalListing(listingId)` on the Escrow contract, or
      - He does the transfer and call in via a multicall.
      - Emits `DeBazaar__Delivered`.
    - Happy path:
      - If the returned bytes keccak256 matches `expectedResult`, this calls the Escrow contract's `resolveListing(listingId, toBuyer: false)` and unlocks the fund and the fee.
    - Unhappy paths:
      - If the return bytes does not match, returns with `ApprovalResultMismatch`, and calls the Escrow contract's `resolveListing(listingId, toBuyer: true)` and refunds the Buyer.
      - If the deadline of transfer is passed:
        - Buyer calls `cancelListingByBuyer(listingId)` and Escrow refunds the locked fund back to Buyer.
    - Emits `DeBazaar__Released` (to seller) or `DeBazaar__Refunded` (to buyer).
 
### Why this flow?
By design, our on-chain asset-transfer flow differs from conventional marketplaces 
(including NFT platforms and ERC-20 DEXs). We chose this approach to support a wide
range of asset types and transfer methods through a single, consistent process. 
This generalized flow lets us accommodate heterogeneous assets without coupling to 
any one standard, aligning with our vision for an **ULTIMATE**, **COMPREHENSIVE**, 
crypto-based marketplace.

---

## Key Events
- `DeBazaar__ListingCreated(listingId, seller, token, amount, expiration, type)`
- `DeBazaar__ListingFilled(listingId, buyer, deadline)`
- `DeBazaar__Delivered(listingId)`
- `DeBazaar__ApiApprovalRequested(listingId, requestId)`
- `DeBazaar__Released(listingId)`
- `DeBazaar__Refunded(listingId)`

## Addresses (Arbitrum Sepolia - latest)
- Escrow: see `contracts/ignition/deployments/chain-421614/deployed_addresses.json`
- FunctionsConsumerProxy: same file (`FunctionsConsumerProxy`)

## Notes
- In the flows above, we assume that Buyer already called `approve(escrow, amount)` before `fillListing` for ERC20 flows. This can be done in frontend.
- In the Centralized API-needed flow, we assume we have a funded Chainlink Functions subscription and correct DON ID.
- Deadlines/expirations must be in the future, or calls revert.
