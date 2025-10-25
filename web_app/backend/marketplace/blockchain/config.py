"""
Blockchain Configuration
Contains contract addresses, ABIs, and network configurations
Supports dynamic ABI loading from Arbiscan
"""

import os
import json
from decouple import config

# Network Configurations
NETWORKS = {
    'arbitrum_sepolia': {
        'chain_id': 421614,
        'name': 'Arbitrum Sepolia',
        'rpc_url': 'https://sepolia-rollup.arbitrum.io/rpc',
        'block_explorer': 'https://sepolia.arbiscan.io',
    },
    'arbitrum_one': {
        'chain_id': 42161,
        'name': 'Arbitrum One',
        'rpc_url': 'https://arb1.arbitrum.io/rpc',
        'block_explorer': 'https://arbiscan.io',
    }
}

# Default network for development (can be overridden by environment variable)
DEFAULT_NETWORK = os.environ.get('BLOCKCHAIN_NETWORK', 'arbitrum_sepolia')

# Chainlink Functions configuration
CHAINLINK_SUBSCRIPTION_ID = int(os.environ.get('CHAINLINK_FUNCTIONS_SUBSCRIPTION_ID', '518'))
CHAINLINK_GAS_LIMIT = 300000
CHAINLINK_DON_ID = os.environ.get('CHAINLINK_DON_ID_ARB_SEPOLIA', '0x66756e2d617262697472756d2d7365706f6c69612d3100000000000000000000')
CHAINLINK_DON_HOSTED_SECRETS_SLOT_ID = int(os.environ.get('DON_HOSTED_SECRETS_SLOT_ID', '0'))
CHAINLINK_DON_HOSTED_SECRETS_VERSION = int(os.environ.get('DON_HOSTED_SECRETS_VERSION', '0'))
CHAINLINK_ENCRYPTED_SECRETS_URLS = os.environ.get('ENCRYPTED_SECRETS_URLS', '0xc63fd846b3aeb4f3be5a7bc7ff55b94c029880e6e04515eb4d225c86b9835d7a4a4bedf9c572d1739f9aabfb35d3b3702fc385397e8eec0e5211bda66c7f6afc8bac446a7f018cc60c2f0f7a30808541876f3f27d25b686fabb6b14971d76f4337baa86f1306ecc179c5a07d9beff107b382b5eeb05715470eff38fc6c11cd36aae16d7ef7a1e53807221cc062bad0b2e9e32cc268fd6e9a3c69874078cd6f5f6b')

# Chainlink Functions JavaScript source code
CHAINLINK_TWEET_REPOST_SOURCE = """// Chainlink Functions source script: Check if a user retweeted a tweet
// Docs: https://docs.twitterapi.io/api-reference/endpoint/get_tweet_retweeters
// Inputs:
// - secrets.twitterApiKey: X-API-Key value (required)
// - args[0] (required): tweetId (string)
// - args[1] (required): userName to check (string; can include leading @)
// Output: ABI-encoded uint256 => 1 if userName is in retweeters list, else 0

if (!secrets || typeof secrets.twitterApiKey !== "string" || secrets.twitterApiKey.length === 0) {
    throw Error("Missing secrets.twitterApiKey");
  }

  const tweetId = (args && typeof args[0] === "string" && args[0].length > 0) ? args[0] : null;
  let userName = (args && typeof args[1] === "string") ? args[1] : "";
  userName = userName.replace(/^@/, "").trim();
  if (!tweetId) {
    throw Error("Missing args[0] tweetId");
  }
  if (!userName) {
    throw Error("Missing args[1] userName");
  }

  const baseUrl = "https://api.twitterapi.io/twitter/tweet/retweeters";
  const params = new URLSearchParams({ tweetId });
  const url = `${baseUrl}?${params.toString()}`;

  let resp;
  try {
    resp = await Functions.makeHttpRequest({
      url,
      method: "GET",
      timeout: 15000,
      headers: {
        "X-API-Key": secrets.twitterApiKey,
        "accept": "application/json",
        "user-agent": "chainlink-functions/1.0",
      },
    });
  } catch (_) {
    return Functions.encodeUint256(0n);
  }

  if (!resp || resp.error) {
    return Functions.encodeUint256(0n);
  }

  let data = resp.data;
  if (typeof data === "string") {
    try { data = JSON.parse(data); } catch (_) { return Functions.encodeUint256(0n); }
  }

  if (!data || !Array.isArray(data.users)) {
    return Functions.encodeUint256(0n);
  }

  const target = userName.toLowerCase();
  const found = data.users.some((u) => typeof u?.userName === "string" && u.userName.replace(/^@/, "").toLowerCase() === target);

  return Functions.encodeUint256(found ? 1n : 0n);
"""

CHAINLINK_CROSSCHAIN_NFT_SOURCE = """// Chainlink Functions source script
// Checks ERC-721 ownerOf(tokenId) and returns 1 if it equals expected owner, else 0
// Args:
// - args[0]: rpcUrl (e.g., https://eth.llamarpc.com)
// - args[1]: nft contract address (0x...)
// - args[2]: tokenId (decimal string or number)
// - args[3]: expected owner address (0x...)

// Validate inputs
if (!args || typeof args[0] !== "string" || args[0].length === 0) {
    throw Error("Missing args[0] rpcUrl");
  }
  if (typeof args[1] !== "string" || !args[1].startsWith("0x") || args[1].length !== 42) {
    throw Error("Invalid args[1] nft contract address");
  }
  if (args[2] === undefined || args[2] === null || (typeof args[2] !== "string" && typeof args[2] !== "number")) {
    throw Error("Invalid args[2] tokenId");
  }
  if (typeof args[3] !== "string" || !args[3].startsWith("0x") || args[3].length !== 42) {
    throw Error("Invalid args[3] expected owner address");
  }

  const rpcUrl = args[0];
  const nft = args[1];
  const tokenIdBig = BigInt(args[2].toString());
  const expected = args[3].toLowerCase();

  // ownerOf(uint256) selector = bytes4(keccak256("ownerOf(uint256)")) = 0x6352211e
  const selector = "6352211e";

  // 32-byte left-padded tokenId hex
  let tokenHex = tokenIdBig.toString(16);
  if (tokenHex.length > 64) {
    throw Error("tokenId too large");
  }
  tokenHex = tokenHex.padStart(64, "0");
  const data = `0x${selector}${tokenHex}`;

  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_call",
    params: [
      {
        to: nft,
        data,
      },
      "latest",
    ],
  };

  let resp;
  try {
    resp = await Functions.makeHttpRequest({
      url: rpcUrl,
      method: "POST",
      timeout: 12000,
      headers: { "content-type": "application/json" },
      data: payload,
    });
  } catch (e) {
    throw Error(`RPC request failed: ${e}`);
  }

  if (!resp) {
    throw Error("No response from RPC endpoint");
  }
  if (resp.error) {
    throw Error(`RPC HTTP error: ${resp.error}`);
  }

  const result = resp.data?.result;
  if (!result || typeof result !== "string" || !result.startsWith("0x")) {
    const rpcError = resp.data?.error?.message || "Malformed eth_call response";
    throw Error(`eth_call error: ${rpcError}`);
  }

  // ABI-decoded address is right-most 20 bytes of 32-byte word
  // result is hex string like 0x000...000<40-hex-addr>
  const clean = result.slice(2);
  if (clean.length < 64) {
    throw Error("eth_call returned short data");
  }
  const ownerHex = clean.slice(-40);
  const ownerAddr = ("0x" + ownerHex).toLowerCase();

  const isMatch = ownerAddr === expected;
  return Functions.encodeUint256(isMatch ? 1n : 0n);
"""

# Arbiscan API key (optional, for fetching ABIs dynamically)
# Set this in your .env file: ARBISCAN_API_KEY=your_api_key_here
# Without API key, rate limits apply (5 requests/second)
ARBISCAN_API_KEY = os.environ.get('ARBISCAN_API_KEY', '')

# Contract Addresses
CONTRACT_ADDRESSES = {
    'arbitrum_sepolia': {
        'escrow': '0x8e601797f52AECD270484151Cc39C4074e0E861E',
        'arbiter': '0xdc58De22A66c81672dA2D885944d343E9d2BFB04',
        'functions_consumer': '0x0A77e401Ea1808e5d91314DE09f12072774b0953',
    },
    'arbitrum_one': {
        'escrow': None,  # TODO: Add when deployed to mainnet
        'arbiter': None,
        'functions_consumer': None,
    }
}

# Token Addresses
TOKEN_ADDRESSES = {
    'arbitrum_sepolia': {
        'PYUSD': '0x637a1259c6afd7e3adf63993ca7e58bb438ab1b1',
        'USDC': '0xC9C401E0094B2d3d796Ed074b023551038b84F07',  # Using PYUSD as mock
        'USDT': '0xC9C401E0094B2d3d796Ed074b023551038b84F07',  # Using PYUSD as mock
    },
    'arbitrum_one': {
        'USDC': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        'USDT': '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    }
}

# Escrow Type Enum (must match Solidity contract)
ESCROW_TYPES = {
    'api_approval': 0,
    'onchain_approval': 1,
    'disputable': 2,
}

# Listing State Enum (must match Solidity contract)
LISTING_STATES = {
    'open': 0,
    'filled': 1,
    'delivered': 2,
    'released': 3,
    'refunded': 4,
    'disputed': 5,
    'canceled': 6,
}

# Full Escrow Contract ABI (parsed from JSON)
_ESCROW_ABI_JSON = '''[{"inputs":[{"internalType":"address","name":"_owner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"ApprovalResultMismatch","type":"error"},{"inputs":[],"name":"ApprovalStaticCallFailed","type":"error"},{"inputs":[],"name":"BeforeDeadline","type":"error"},{"inputs":[],"name":"DeadlineHasNotPassed","type":"error"},{"inputs":[],"name":"FailedToRefund","type":"error"},{"inputs":[{"internalType":"uint128","name":"fee","type":"uint128"},{"internalType":"uint256","name":"msgValue","type":"uint256"}],"name":"InsufficientFeeSentForRandomNumberGeneration","type":"error"},{"inputs":[],"name":"InvalidAmount","type":"error"},{"inputs":[],"name":"InvalidDeadline","type":"error"},{"inputs":[],"name":"InvalidDeadlineForRefund","type":"error"},{"inputs":[],"name":"InvalidEscrowType","type":"error"},{"inputs":[],"name":"InvalidExtraData","type":"error"},{"inputs":[],"name":"InvalidFee","type":"error"},{"inputs":[],"name":"InvalidState","type":"error"},{"inputs":[],"name":"ListingAlreadyExists","type":"error"},{"inputs":[],"name":"ListingExpired","type":"error"},{"inputs":[],"name":"NotBuyer","type":"error"},{"inputs":[],"name":"NotBuyerOrSeller","type":"error"},{"inputs":[],"name":"NotFunctionsConsumer","type":"error"},{"inputs":[],"name":"NotSeller","type":"error"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"inputs":[],"name":"ReentrancyGuardReentrantCall","type":"error"},{"inputs":[{"internalType":"address","name":"token","type":"address"}],"name":"SafeERC20FailedOperation","type":"error"},{"inputs":[],"name":"TokenNotWhitelisted","type":"error"},{"inputs":[],"name":"ZeroAddress","type":"error"},{"inputs":[],"name":"ZeroAmount","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"listingId","type":"bytes32"},{"indexed":false,"internalType":"bytes32","name":"requestId","type":"bytes32"}],"name":"DeBazaar__ApiApprovalRequested","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"listingId","type":"bytes32"},{"indexed":false,"internalType":"bytes","name":"err","type":"bytes"}],"name":"DeBazaar__ApiReturnedAnError","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"listingId","type":"bytes32"}],"name":"DeBazaar__ApiReturnedEmptyResponse","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"listingId","type":"bytes32"}],"name":"DeBazaar__ApiReturnedFalse","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"listingId","type":"bytes32"}],"name":"DeBazaar__Delivered","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"listingId","type":"bytes32"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"DeBazaar__Disputed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"bytes32","name":"listingId","type":"bytes32"}],"name":"DeBazaar__ListingCancelled","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"listingId","type":"bytes32"},{"indexed":true,"internalType":"address","name":"seller","type":"address"},{"indexed":true,"internalType":"address","name":"token","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint64","name":"expiration","type":"uint64"},{"indexed":false,"internalType":"enum IDebazaarEscrow.EscrowType","name":"escrowType","type":"uint8"}],"name":"DeBazaar__ListingCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"listingId","type":"bytes32"},{"indexed":true,"internalType":"address","name":"buyer","type":"address"},{"indexed":false,"internalType":"uint64","name":"deadline","type":"uint64"}],"name":"DeBazaar__ListingFilled","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"listingId","type":"bytes32"}],"name":"DeBazaar__ListingReset","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"listingId","type":"bytes32"}],"name":"DeBazaar__Refunded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"listingId","type":"bytes32"}],"name":"DeBazaar__Released","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"listingId","type":"bytes32"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"DeBazaar__Resolved","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferStarted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[],"name":"BASE_BASIS_POINTS","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MIN_EXPIRATION","outputs":[{"internalType":"uint64","name":"","type":"uint64"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"acceptOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_listingId","type":"bytes32"}],"name":"cancelListingByBuyer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_listingId","type":"bytes32"}],"name":"cancelListingBySeller","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_listingId","type":"bytes32"},{"internalType":"address","name":"_token","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"uint64","name":"_expiration","type":"uint64"},{"internalType":"enum IDebazaarEscrow.EscrowType","name":"_escrowType","type":"uint8"}],"name":"createListing","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_listingId","type":"bytes32"},{"internalType":"string[]","name":"_sellerArgs","type":"string[]"},{"internalType":"bytes[]","name":"_sellerBytesArgs","type":"bytes[]"},{"internalType":"uint8","name":"_donHostedSecretsSlotID","type":"uint8"},{"internalType":"uint64","name":"_donHostedSecretsVersion","type":"uint64"},{"internalType":"uint64","name":"_subscriptionId","type":"uint64"},{"internalType":"uint32","name":"_gasLimit","type":"uint32"},{"internalType":"bytes32","name":"_donID","type":"bytes32"}],"name":"deliverApiApprovalListing","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_listingId","type":"bytes32"}],"name":"deliverDisputableListing","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_listingId","type":"bytes32"}],"name":"deliverOnchainApprovalListing","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_listingId","type":"bytes32"}],"name":"disputeListing","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_listingId","type":"bytes32"},{"internalType":"uint64","name":"_deadline","type":"uint64"},{"internalType":"bytes","name":"_extraData","type":"bytes"}],"name":"fillListing","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"requestId","type":"bytes32"},{"internalType":"bytes","name":"response","type":"bytes"},{"internalType":"bytes","name":"err","type":"bytes"}],"name":"fulfillRequest","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_listingId","type":"bytes32"}],"name":"getApiApprovalData","outputs":[{"components":[{"internalType":"string","name":"source","type":"string"},{"internalType":"bytes","name":"encryptedSecretsUrls","type":"bytes"},{"internalType":"string[]","name":"args","type":"string[]"},{"internalType":"bytes[]","name":"bytesArgs","type":"bytes[]"},{"internalType":"bytes32","name":"requestId","type":"bytes32"}],"internalType":"struct IDebazaarEscrow.ApiApprovalData","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getArbiter","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getFee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getFunctionsConsumer","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_listingId","type":"bytes32"}],"name":"getListing","outputs":[{"components":[{"internalType":"bytes32","name":"listingId","type":"bytes32"},{"internalType":"address","name":"buyer","type":"address"},{"internalType":"address","name":"seller","type":"address"},{"internalType":"contract IERC20","name":"token","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint64","name":"expiration","type":"uint64"},{"internalType":"uint64","name":"deadline","type":"uint64"},{"internalType":"enum IDebazaarEscrow.State","name":"state","type":"uint8"},{"internalType":"enum IDebazaarEscrow.EscrowType","name":"escrowType","type":"uint8"},{"components":[{"internalType":"address","name":"destination","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"bytes","name":"expectedResult","type":"bytes"}],"internalType":"struct IDebazaarEscrow.OnchainApprovalData","name":"onchainApprovalData","type":"tuple"},{"components":[{"internalType":"string","name":"source","type":"string"},{"internalType":"bytes","name":"encryptedSecretsUrls","type":"bytes"},{"internalType":"string[]","name":"args","type":"string[]"},{"internalType":"bytes[]","name":"bytesArgs","type":"bytes[]"},{"internalType":"bytes32","name":"requestId","type":"bytes32"}],"internalType":"struct IDebazaarEscrow.ApiApprovalData","name":"apiApprovalData","type":"tuple"}],"internalType":"struct IDebazaarEscrow.Listing","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_listingId","type":"bytes32"}],"name":"getOnchainApprovalData","outputs":[{"components":[{"internalType":"address","name":"destination","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"bytes","name":"expectedResult","type":"bytes"}],"internalType":"struct IDebazaarEscrow.OnchainApprovalData","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_token","type":"address"}],"name":"isTokenWhitelisted","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pendingOwner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_listingId","type":"bytes32"},{"internalType":"bool","name":"_toBuyer","type":"bool"}],"name":"resolveListing","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_arbiter","type":"address"}],"name":"setArbiter","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_feeBasisPoints","type":"uint256"}],"name":"setFee","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_functionsConsumer","type":"address"}],"name":"setFunctionsConsumer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"_tokens","type":"address[]"},{"internalType":"bool[]","name":"_whitelisted","type":"bool[]"}],"name":"setWhitelistedTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]'''

ESCROW_ABI = json.loads(_ESCROW_ABI_JSON)

# Standard ERC20 ABI
ERC20_ABI = [
    {"constant": True, "inputs": [], "name": "name", "outputs": [{"name": "", "type": "string"}], "payable": False, "stateMutability": "view", "type": "function"},
    {"constant": False, "inputs": [{"name": "_spender", "type": "address"}, {"name": "_value", "type": "uint256"}], "name": "approve", "outputs": [{"name": "", "type": "bool"}], "payable": False, "stateMutability": "nonpayable", "type": "function"},
    {"constant": True, "inputs": [], "name": "totalSupply", "outputs": [{"name": "", "type": "uint256"}], "payable": False, "stateMutability": "view", "type": "function"},
    {"constant": False, "inputs": [{"name": "_from", "type": "address"}, {"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}], "name": "transferFrom", "outputs": [{"name": "", "type": "bool"}], "payable": False, "stateMutability": "nonpayable", "type": "function"},
    {"constant": True, "inputs": [], "name": "decimals", "outputs": [{"name": "", "type": "uint8"}], "payable": False, "stateMutability": "view", "type": "function"},
    {"constant": True, "inputs": [{"name": "_owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "balance", "type": "uint256"}], "payable": False, "stateMutability": "view", "type": "function"},
    {"constant": True, "inputs": [], "name": "symbol", "outputs": [{"name": "", "type": "string"}], "payable": False, "stateMutability": "view", "type": "function"},
    {"constant": False, "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}], "name": "transfer", "outputs": [{"name": "", "type": "bool"}], "payable": False, "stateMutability": "nonpayable", "type": "function"},
    {"constant": True, "inputs": [{"name": "_owner", "type": "address"}, {"name": "_spender", "type": "address"}], "name": "allowance", "outputs": [{"name": "", "type": "uint256"}], "payable": False, "stateMutability": "view", "type": "function"},
]


def get_network_config(network_name=None):
    """Get network configuration"""
    if network_name is None:
        network_name = DEFAULT_NETWORK
    return NETWORKS.get(network_name, NETWORKS[DEFAULT_NETWORK])


def get_contract_address(contract_name, network_name=None):
    """Get contract address for a network"""
    if network_name is None:
        network_name = DEFAULT_NETWORK
    return CONTRACT_ADDRESSES.get(network_name, {}).get(contract_name)


def get_token_address(token_symbol, network_name=None):
    """Get token address for a network"""
    if network_name is None:
        network_name = DEFAULT_NETWORK
    return TOKEN_ADDRESSES.get(network_name, {}).get(token_symbol.upper())


def get_arbiscan_url(network_name=None):
    """Get Arbiscan block explorer URL for a network"""
    if network_name is None:
        network_name = DEFAULT_NETWORK
    return NETWORKS.get(network_name, {}).get('block_explorer')


# Arbiscan API URLs for fetching ABIs (v1 - v2 has Cloudflare protection)
ARBISCAN_API_URLS = {
    'arbitrum_sepolia': 'https://api-sepolia.arbiscan.io/api',
    'arbitrum_one': 'https://api.arbiscan.io/api',
}
