import { network } from "hardhat";
import { ethers } from "ethers";

async function main() {
  const { ethers } = await network.connect({ 
    network: "arbitrumSepolia", 
    chainType: "op" 
  });

  const [deployer] = await ethers.getSigners();
  
  // Contract addresses
  const contractAddresses = {
    debazaarEscrow: "0x9491a2E6Cf08BCCC9416E652Cfa463b3D94D1eb5",
    debazaarArbiter: "0xdc58De22A66c81672dA2D885944d343E9d2BFB04",
    functionsConsumerProxy: "0x0A77e401Ea1808e5d91314DE09f12072774b0953"
  };

  const escrow = await ethers.getContractAt("DebazaarEscrow", contractAddresses.debazaarEscrow);
  
  // LINK token setup
  const TestToken = "0xC9C401E0094B2d3d796Ed074b023551038b84F07";
  const listingPrice = ethers.parseUnits("1", 15); // 0.001 TestToken
  
  // ERC20 ABI
  const erc20Abi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
  ];
  
  const testTokenContract = new ethers.Contract(TestToken, erc20Abi, deployer);
  
  // Chainlink Functions parameters
  const subscriptionId = parseInt(process.env.CHAINLINK_FUNCTIONS_SUBSCRIPTION_ID || "518");
  const gasLimit = 300000;
  const donID = process.env.CHAINLINK_DON_ID_ARB_SEPOLIA || "0x66756e2d617262697472756d2d7365706f6c69612d3100000000000000000000";
  const donHostedSecretsSlotID = 0;
  const donHostedSecretsVersion = 0;
  
  // Approve escrow contract to spend LINK tokens
  // const approveTx = await linkContract.approve(contractAddresses.debazaarEscrow, listingPrice);
  // await approveTx.wait();
  
  // JavaScript source code for BTC price verification
  const jsSourceCode = `// This function retrieves the latest BTC price from the SampleAPIs Bitcoin endpoint

// No arguments needed for this example
// Make HTTP request
const url = 'https://api.sampleapis.com/bitcoin/historical_prices'
console.log(\`HTTP GET Request to \${url}\\n\`)

// construct the HTTP Request object
const btcRequest = Functions.makeHttpRequest({
  url: url,
})

// Execute the API request (Promise)
const btcResponse = await btcRequest
if (btcResponse.error) {
  console.error(btcResponse.error)
  throw Error("Request failed")
}

const data = btcResponse["data"]
console.log(JSON.stringify(data, null, 2))

if (!data || data.length === 0) {
  throw Error("No data returned from API")
}

// Assuming data is an array of objects with shape like { date: "...", price: 12345 }
const latestEntry = data[data.length - 1] // last entry is the latest
console.log(latestEntry)
const btcPrice = latestEntry.Price

if (!btcPrice) {
  throw Error("BTC price not found in response")
}

// Solidity doesn't support decimals, so multiply by 100 to preserve 2 decimals
if (btcPrice < 1000) {
  return Functions.encodeUint256(1)
} else {
  return Functions.encodeUint256(0)
}`;

  // API delivery data
  const apiDeliveryData = {
    source: jsSourceCode,
    encryptedSecretsUrls: "0x",
    args: [],
    bytesArgs: [],
    requestId: ethers.ZeroHash
  };
  
  const extraData = ethers.AbiCoder.defaultAbiCoder().encode(
    ["tuple(string source, bytes encryptedSecretsUrls, string[] args, bytes[] bytesArgs, bytes32 requestId)"],
    [apiDeliveryData]
  );

  // Generate listing ID
  const expiration = Math.floor(Date.now() / 1000) + 7200; // 2 hours from now
  const listingId = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "uint256", "uint64"],
    [deployer.address, listingPrice, expiration]
  ));

  // // 1. Create Listing
  const createTx = await escrow.connect(deployer).createListing(
    listingId,
    TestToken,
    listingPrice,
    expiration,
    0 // EscrowType.API_APPROVAL
  );
  await createTx.wait();
  console.log("createTx", createTx);

  const mintTestTokenTx = await testTokenContract.mint(deployer.address, listingPrice);
  await mintTestTokenTx.wait();
  console.log("mintTestTokenTx", mintTestTokenTx);
  
  const approveTx = await testTokenContract.approve(contractAddresses.debazaarEscrow, listingPrice);
  await approveTx.wait();
  console.log("approveTx", approveTx);
  
  // 2. Fill Listing
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  const fillTx = await escrow.connect(deployer).fillListing(listingId, deadline, extraData);
  await fillTx.wait();
  console.log("fillTx", fillTx);

  // 3. Deliver API Approval


// // // 1) direct provider + wallet (bypass hardhat signer)
// const provider = new ethers.JsonRpcProvider(process.env.ARBITRUM_SEPOLIA_RPC_URL);
// const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

// // 2) minimal ABI for the function
// const abi = [
//   "function deliverApiApprovalListing(bytes32,uint8,uint64,uint64,uint32,bytes32)"
// ];

// // 3) encode data and send raw tx
// const escrowAddress = "0xEDb35EbC4aD6Bb753Bd46747FF4f91459FF3255F";
// const iface = new ethers.Interface(abi);
// const data = iface.encodeFunctionData(
//   "deliverApiApprovalListing",
//   ["0x4b84dfb76173e5b5cc3ce621e4e40cf98df2e992e805966180dc130d224b0489", donHostedSecretsSlotID, donHostedSecretsVersion, subscriptionId, gasLimit, donID]
// );

// // 4) force send with explicit gas and fees
// const tx = await wallet.sendTransaction({
//   to: escrowAddress,
//   data,
//   gasLimit: 350000n,             // explicit to avoid estimateGas
//   maxFeePerGas: ethers.parseUnits("5", "gwei"),
//   maxPriorityFeePerGas: ethers.parseUnits("1", "gwei"),
// });
// console.log("sent", tx.hash);
// const rcpt = await tx.wait();
// console.log("mined", rcpt?.status);

  const setConsumerTx = await escrow.connect(deployer).setFunctionsConsumer(contractAddresses.functionsConsumerProxy);
  await setConsumerTx.wait();
  console.log("setConsumerTx", setConsumerTx);
  const deliverTx = await escrow.connect(deployer).deliverApiApprovalListing(
    listingId,
    donHostedSecretsSlotID,
    donHostedSecretsVersion,
    subscriptionId,
    gasLimit,
    donID
  );
  const deliverReceipt = await deliverTx.wait();
  
  console.log("deliverReceipt", deliverReceipt);
}

main().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});