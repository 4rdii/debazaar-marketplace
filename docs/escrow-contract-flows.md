## Debazaar Escrow Flows (Quick Guide)

This project supports three escrow flows in `DebazaarEscrow`:

- DISPUTABLE ( Arbiter selection done via pyth entropy )
- API_APPROVAL (via Chainlink Functions)
- ONCHAIN_APPROVAL (via on-chain callable check)

Below is the minimal lifecycle and the specific delivery step for each flow.

### Common Lifecycle (all flows)
- createListing(bytes32 listingId, address token, uint256 amount, uint64 expiration, EscrowType type)
  - Seller creates an escrow listing (emits DeBazaar__ListingCreated)
- fillListing(bytes32 listingId, uint64 deadline, bytes extraData)
  - Buyer approves the token to escrow and fills (escrow pulls `amount` from buyer)
  - Encodes per-flow data in `extraData`
  - Emits DeBazaar__ListingFilled

States: Open → Filled → Delivered → Released/Refunded (or Canceled/Disputed)

---

### 1) DISPUTABLE flow
- extraData: empty
- Delivery: seller calls `deliverDisputableListing(listingId)` → state: Delivered, emits DeBazaar__Delivered
- Dispute window: buyer/seller may call `disputeListing(listingId)` to involve arbiter selection and voting.
- Resolution:
  - Buyer can call the `resolveListing(listingId, toBuyer)` to acknowledge that he has receieved the asset. (happy-path)
  - `resolveListing(listingId, toBuyer)` by arbiter(s) or specific rules (disputed-path)
  - Emits DeBazaar__Released (to seller) or DeBazaar__Refunded (to buyer)

---

### 2) API_APPROVAL flow (Chainlink Functions)
- extraData: `ApiApprovalData` encoded as tuple
  - source (JS), encryptedSecretsUrls (bytes), args (string[]), bytesArgs (bytes[]), requestId (bytes32)
  - On fill, the escrow stores the API data and clears the requestId (will be set on delivery)
- Delivery: seller calls
  - `deliverApiApprovalListing(listingId, donHostedSecretsSlotID, donHostedSecretsVersion, subscriptionId, gasLimit, donID)`
  - Emits DeBazaar__ApiApprovalRequested and DeBazaar__Delivered
- Fulfillment: `FunctionsConsumerDebazaarUpgradeable` calls `fulfillRequest(requestId, response, err)` back to escrow
  - If response decodes to 1 → refund to buyer; else → release to seller

Environment variables typically needed for the API flow:
- CHAINLINK_FUNCTIONS_SUBSCRIPTION_ID
- CHAINLINK_DON_ID_ARB_SEPOLIA
- ARBITRUM_SEPOLIA_RPC_URL, PRIVATE_KEY (funded)

How to run the sample API flow script:
- Uses `contracts/scripts/test-chainlink-functions.ts`
- Update LINK token allowance and ensure subscription exists/funded
- Command:
  - `npm run test:chainlink-functions`

---

### 3) ONCHAIN_APPROVAL flow
- extraData: `OnchainApprovalData` encoded as tuple
  - destination (address), data (bytes), expectedResult (bytes)
- Delivery: anyone calls `deliverOnchainApprovalListing(listingId)`
  - Escrow `staticcall`s `destination` with `data`
  - If returned bytes keccak256 matches `expectedResult` → release to seller
  - Else reverts (ApprovalResultMismatch)
  - Emits DeBazaar__Delivered

---

### Key Events
- DeBazaar__ListingCreated(listingId, seller, token, amount, expiration, type)
- DeBazaar__ListingFilled(listingId, buyer, deadline)
- DeBazaar__Delivered(listingId)
- DeBazaar__ApiApprovalRequested(listingId, requestId) [API_APPROVAL]
- DeBazaar__Released(listingId)
- DeBazaar__Refunded(listingId)

### Addresses (Arbitrum Sepolia - latest)
- Escrow: see `contracts/ignition/deployments/chain-421614/deployed_addresses.json`
- FunctionsConsumerProxy: same file (`FunctionsConsumerProxy`)

### Notes
- Buyer must `approve(escrow, amount)` before `fillListing` for ERC20 flows
- API flow must have a funded Chainlink Functions subscription and correct DON ID
- Deadlines/expirations must be in the future, or calls revert


