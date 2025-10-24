import { network } from "hardhat";
import { ethers } from "ethers";

import fs from "fs";

async function main() {
  const { ethers } = await network.connect({
    network: "arbitrumSepolia",
    chainType: "op",
  });

  const [deployer] = await ethers.getSigners();

  // Contract addresses
  const contractAddresses = {
    debazaarEscrow: "0x8e601797f52AECD270484151Cc39C4074e0E861E",
    debazaarArbiter: "0xdc58De22A66c81672dA2D885944d343E9d2BFB04",
    functionsConsumerProxy: "0x0A77e401Ea1808e5d91314DE09f12072774b0953",
  };

  const escrow = await ethers.getContractAt(
    "DebazaarEscrow",
    contractAddresses.debazaarEscrow
  );

  // Test ERC20 setup (mock token)
  const TestToken = "0xC9C401E0094B2d3d796Ed074b023551038b84F07";
  const listingPrice = ethers.parseUnits("1", 15); // 0.001 TestToken

  // Minimal ERC20 ABI for mint/approve
  const erc20Abi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function mint(address to, uint256 amount)",
  ];

  const testTokenContract = new ethers.Contract(TestToken, erc20Abi, deployer);

  // Chainlink Functions parameters
  const subscriptionId = parseInt(
    process.env.CHAINLINK_FUNCTIONS_SUBSCRIPTION_ID || "518"
  );
  const gasLimit = 300000;
  const donID =
    process.env.CHAINLINK_DON_ID_ARB_SEPOLIA ||
    "0x66756e2d617262697472756d2d7365706f6c69612d3100000000000000000000";
  const donHostedSecretsSlotID = parseInt(
    process.env.DON_HOSTED_SECRETS_SLOT_ID || "0"
  );
  const donHostedSecretsVersion = parseInt(
    process.env.DON_HOSTED_SECRETS_VERSION || "0"
  );

  // Load Chainlink Functions source (tweet reposts checker)
  const sourcePath = `${process.cwd()}/scripts/chainlink_functions/chainlink-functions-checkTweetReposts.js`;
  const jsSourceCode = fs.readFileSync(sourcePath, "utf8");

  // Encrypted secrets URL (gist/URL-based secrets per Chainlink guide)
  let encryptedSecretsUrlsHex = process.env.ENCRYPTED_SECRETS_URLS || "0xc63fd846b3aeb4f3be5a7bc7ff55b94c029880e6e04515eb4d225c86b9835d7a4a4bedf9c572d1739f9aabfb35d3b3702fc385397e8eec0e5211bda66c7f6afc8bac446a7f018cc60c2f0f7a30808541876f3f27d25b686fabb6b14971d76f4337baa86f1306ecc179c5a07d9beff107b382b5eeb05715470eff38fc6c11cd36aae16d7ef7a1e53807221cc062bad0b2e9e32cc268fd6e9a3c69874078cd6f5f6b";
  if (!encryptedSecretsUrlsHex.startsWith("0x")) {
    encryptedSecretsUrlsHex = `0x${encryptedSecretsUrlsHex}`;
  }
  // Ensure even-length hex and convert to bytes to satisfy AbiCoder "bytes" type
  // if ((encryptedSecretsUrlsHex.length - 2) % 2 !== 0) {
  //   encryptedSecretsUrlsHex = `0x0${encryptedSecretsUrlsHex.slice(2)}`;
  // }
  const encryptedSecretsUrlsBytes = ethers.getBytes(encryptedSecretsUrlsHex);
  console.log('encryptedSecretsUrlsBytes', encryptedSecretsUrlsBytes);
  const tweetId = "1977949648263274883";
  const userName = "GArdeshir";

  // Prepare API approval extraData stored at fillListing time
  const apiDeliveryData = {
    source: jsSourceCode,
    encryptedSecretsUrls: encryptedSecretsUrlsHex,
    args: [tweetId, userName],
    bytesArgs: [],
    requestId: ethers.ZeroHash,
  };

  const extraData = ethers.AbiCoder.defaultAbiCoder().encode(
    [
      "tuple(string source, bytes encryptedSecretsUrls, string[] args, bytes[] bytesArgs, bytes32 requestId)",
    ],
    [apiDeliveryData]
  );

  // Generate listing ID
  const expiration = Math.floor(Date.now() / 1000) + 7200; // 2 hours from now
  const listingId = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256", "uint64"],
      [deployer.address, listingPrice, expiration]
    )
  );

  // 1. Create Listing (API_APPROVAL = 0)
  const createTx = await escrow
    .connect(deployer)
    .createListing(listingId, TestToken, listingPrice, expiration, 0);
  await createTx.wait();
  console.log("createTx", createTx.hash);

  // Mint and approve
  const mintTestTokenTx = await testTokenContract.mint(
    deployer.address,
    listingPrice
  );
  await mintTestTokenTx.wait();
  console.log("mintTestTokenTx", mintTestTokenTx.hash);

  const approveTx = await testTokenContract.approve(
    contractAddresses.debazaarEscrow,
    listingPrice
  );
  await approveTx.wait();
  console.log("approveTx", approveTx.hash);

  // 2. Fill Listing
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  const fillTx = await escrow
    .connect(deployer)
    .fillListing(listingId, deadline, extraData);
  await fillTx.wait();
  console.log("fillTx", fillTx.hash);

  // 4. Deliver API Approval with seller-provided args for the tweet check
  // args[0] = tweetId, args[1] = userName (without leading @)

  const deliverTx = await escrow
    .connect(deployer)
    .deliverApiApprovalListing(
      listingId,
      [],
      [],
      donHostedSecretsSlotID,
      donHostedSecretsVersion,
      subscriptionId,
      gasLimit,
      donID
    );
  const deliverReceipt = await deliverTx.wait();

  console.log("deliverReceipt", deliverReceipt?.hash);
}

main().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
