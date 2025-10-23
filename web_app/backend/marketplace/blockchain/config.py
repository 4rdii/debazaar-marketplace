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
        'PYUSD': '0xC9C401E0094B2d3d796Ed074b023551038b84F07',
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
_ESCROW_ABI_JSON = '''[{"inputs":[{"internalType":"address","name":"_owner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"ApprovalResultMismatch","type":"error"},{"inputs":[],"name":"ApprovalStaticCallFailed","type":"error"},{"inputs":[],"name":"BeforeDeadline","type":"error"},{"inputs":[],"name":"DeadlineHasNotPassed","type":"error"},{"inputs":[],"name":"FailedToRefund","type":"error"},{"inputs":[{"internalType":"uint128","name":"fee","type":"uint128"},{"internalType":"uint256","name":"msgValue","type":"uint256"}],"name":"InsufficientFeeSentForRandomNumberGeneration","type":"error"},{"inputs":[],"name":"InvalidAmount","type":"error"},{"inputs":[],"name":"InvalidDeadline","type":"error"},{"inputs":[],"name":"InvalidDeadlineForRefund","type":"error"},{"inputs":[],"name":"InvalidEscrowType","type":"error"},{"inputs":[],"name":"InvalidExtraData","type":"error"},{"inputs":[],"name":"InvalidFee","type":"error"},{"inputs":[],"name":"InvalidState","type":"error"},{"inputs":[],"name":"ListingAlreadyExists","type":"error"},{"inputs":[],"name":"ListingExpired","type":"error"},{"inputs":[],"name":"NotBuyer","type":"error"},{"inputs":[],"name":"NotBuyerOrSeller","type":"error"},{"inputs":[],"name":"NotFunctionsConsumer","type":"error"},{"inputs":[],"name":"NotSeller","type":"error"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"inputs":[],"name":"ReentrancyGuardReentrantCall","type":"error"},{"inputs":[{"internalType":"address","name":"token","type":"address"}],"name":"SafeERC20FailedOperation","type":"error"},{"inputs":[],"name":"TokenNotWhitelisted","type":"error"},{"inputs":[],"name":"ZeroAddress","type":"error"},{"inputs":[],"name":"ZeroAmount","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"listingId","type":"bytes32"},{"indexed":false,"internalType":"bytes32","name":"requestId","type":"bytes32"}],"name":"DeBazaar__ApiApprovalRequested","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"listingId","type":"bytes32"},{"indexed":false,"internalType":"bytes","name":"err","type":"bytes"}],"name":"DeBazaar__ApiReturnedAnError","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"listingId","type":"bytes32"}],"name":"DeBazaar__ApiReturnedEmptyResponse","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"listingId","type":"bytes32"}],"name":"DeBazaar__ApiReturnedFalse","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"listingId","type":"bytes32"}],"name":"DeBazaar__Delivered","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"listingId","type":"bytes32"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"DeBazaar__Disputed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"bytes32","name":"listingId","type":"bytes32"}],"name":"DeBazaar__ListingCancelled","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"listingId","type":"bytes32"},{"indexed":true,"internalType":"address","name":"seller","type":"address"},{"indexed":true,"internalType":"address","name":"token","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint64","name":"expiration","type":"uint64"},{"indexed":false,"internalType":"enum IDebazaarEscrow.EscrowType","name":"escrowType","type":"uint8"}],"name":"DeBazaar__ListingCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"listingId","type":"bytes32"},{"indexed":true,"internalType":"address","name":"buyer","type":"address"},{"indexed":false,"internalType":"uint64","name":"deadline","type":"uint64"}],"name":"DeBazaar__ListingFilled","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"listingId","type":"bytes32"}],"name":"DeBazaar__ListingReset","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"listingId","type":"bytes32"}],"name":"DeBazaar__Refunded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"listingId","type":"bytes32"}],"name":"DeBazaar__Released","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"listingId","type":"bytes32"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"DeBazaar__Resolved","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferStarted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[],"name":"BASE_BASIS_POINTS","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MIN_EXPIRATION","outputs":[{"internalType":"uint64","name":"","type":"uint64"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"acceptOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_listingId","type":"bytes32"}],"name":"cancelListingByBuyer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_listingId","type":"bytes32"}],"name":"cancelListingBySeller","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_listingId","type":"bytes32"},{"internalType":"address","name":"_token","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"uint64","name":"_expiration","type":"uint64"},{"internalType":"enum IDebazaarEscrow.EscrowType","name":"_escrowType","type":"uint8"}],"name":"createListing","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_listingId","type":"bytes32"},{"internalType":"uint8","name":"_donHostedSecretsSlotID","type":"uint8"},{"internalType":"uint64","name":"_donHostedSecretsVersion","type":"uint64"},{"internalType":"uint64","name":"_subscriptionId","type":"uint64"},{"internalType":"uint32","name":"_gasLimit","type":"uint32"},{"internalType":"bytes32","name":"_donID","type":"bytes32"}],"name":"deliverApiApprovalListing","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_listingId","type":"bytes32"}],"name":"deliverDisputableListing","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_listingId","type":"bytes32"}],"name":"deliverOnchainApprovalListing","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_listingId","type":"bytes32"}],"name":"disputeListing","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_listingId","type":"bytes32"},{"internalType":"uint64","name":"_deadline","type":"uint64"},{"internalType":"bytes","name":"_extraData","type":"bytes"}],"name":"fillListing","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"requestId","type":"bytes32"},{"internalType":"bytes","name":"response","type":"bytes"},{"internalType":"bytes","name":"err","type":"bytes"}],"name":"fulfillRequest","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_listingId","type":"bytes32"}],"name":"getApiApprovalData","outputs":[{"components":[{"internalType":"string","name":"source","type":"string"},{"internalType":"bytes","name":"encryptedSecretsUrls","type":"bytes"},{"internalType":"string[]","name":"args","type":"string[]"},{"internalType":"bytes[]","name":"bytesArgs","type":"bytes[]"},{"internalType":"bytes32","name":"requestId","type":"bytes32"}],"internalType":"struct IDebazaarEscrow.ApiApprovalData","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getArbiter","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getFee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getFunctionsConsumer","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_listingId","type":"bytes32"}],"name":"getListing","outputs":[{"components":[{"internalType":"bytes32","name":"listingId","type":"bytes32"},{"internalType":"address","name":"buyer","type":"address"},{"internalType":"address","name":"seller","type":"address"},{"internalType":"contract IERC20","name":"token","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint64","name":"expiration","type":"uint64"},{"internalType":"uint64","name":"deadline","type":"uint64"},{"internalType":"enum IDebazaarEscrow.State","name":"state","type":"uint8"},{"internalType":"enum IDebazaarEscrow.EscrowType","name":"escrowType","type":"uint8"},{"components":[{"internalType":"address","name":"destination","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"bytes","name":"expectedResult","type":"bytes"}],"internalType":"struct IDebazaarEscrow.OnchainApprovalData","name":"onchainApprovalData","type":"tuple"},{"components":[{"internalType":"string","name":"source","type":"string"},{"internalType":"bytes","name":"encryptedSecretsUrls","type":"bytes"},{"internalType":"string[]","name":"args","type":"string[]"},{"internalType":"bytes[]","name":"bytesArgs","type":"bytes[]"},{"internalType":"bytes32","name":"requestId","type":"bytes32"}],"internalType":"struct IDebazaarEscrow.ApiApprovalData","name":"apiApprovalData","type":"tuple"}],"internalType":"struct IDebazaarEscrow.Listing","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_listingId","type":"bytes32"}],"name":"getOnchainApprovalData","outputs":[{"components":[{"internalType":"address","name":"destination","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"bytes","name":"expectedResult","type":"bytes"}],"internalType":"struct IDebazaarEscrow.OnchainApprovalData","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_token","type":"address"}],"name":"isTokenWhitelisted","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pendingOwner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_listingId","type":"bytes32"},{"internalType":"bool","name":"_toBuyer","type":"bool"}],"name":"resolveListing","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_arbiter","type":"address"}],"name":"setArbiter","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_feeBasisPoints","type":"uint256"}],"name":"setFee","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_functionsConsumer","type":"address"}],"name":"setFunctionsConsumer","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"_tokens","type":"address[]"},{"internalType":"bool[]","name":"_whitelisted","type":"bool[]"}],"name":"setWhitelistedTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]'''

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
