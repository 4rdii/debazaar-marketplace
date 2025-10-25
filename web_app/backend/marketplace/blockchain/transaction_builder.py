"""
Transaction Builder
Builds unsigned transactions for frontend to sign
Uses dynamic ABI loading from Arbiscan via ContractService
"""

import time
import hashlib
import os
from web3 import Web3
from .config import (
    get_network_config,
    get_contract_address,
    get_token_address,
    ESCROW_ABI,
    ERC20_ABI,
    ESCROW_TYPES,
    DEFAULT_NETWORK,
    CHAINLINK_SUBSCRIPTION_ID, CHAINLINK_GAS_LIMIT, CHAINLINK_DON_ID,
    CHAINLINK_DON_HOSTED_SECRETS_SLOT_ID, CHAINLINK_DON_HOSTED_SECRETS_VERSION,
    CHAINLINK_ENCRYPTED_SECRETS_URLS,
    CHAINLINK_TWEET_REPOST_SOURCE, CHAINLINK_CROSSCHAIN_NFT_SOURCE
)
from .contract_service import ContractService


def encode_api_approval_extra_data(api_approval_method, tweet_id=None, tweet_username=None, crosschain_rpc_url=None, crosschain_nft_contract=None, crosschain_token_id=None, buyer_address=None):
    """
    Encode ApiApprovalData struct as extraData for fillListing

    struct ApiApprovalData {
        string source;
        bytes encryptedSecretsUrls;
        string[] args;
        bytes[] bytesArgs;
        bytes32 requestId;
    }
    """
    # Load source code based on method
    if api_approval_method == 'tweet_repost':
        js_source = CHAINLINK_TWEET_REPOST_SOURCE
        args = [tweet_id, tweet_username.replace('@', '').strip()]
        bytes_args = []
    elif api_approval_method == 'crosschain_nft':
        js_source = CHAINLINK_CROSSCHAIN_NFT_SOURCE
        args = [crosschain_rpc_url, crosschain_nft_contract, crosschain_token_id, buyer_address]
        bytes_args = []
    else:
        raise ValueError(f"Unknown API approval method: {api_approval_method}")

    # Ensure encrypted secrets URL starts with 0x
    encrypted_secrets_urls = CHAINLINK_ENCRYPTED_SECRETS_URLS
    if not encrypted_secrets_urls.startswith('0x'):
        encrypted_secrets_urls = f'0x{encrypted_secrets_urls}'

    # Encode ApiApprovalData struct
    api_approval_data = (
        js_source,
        bytes.fromhex(encrypted_secrets_urls[2:]),
        args,
        bytes_args,
        b'\x00' * 32  # requestId = bytes32(0)
    )

    # Encode as tuple
    encoded = Web3.solidity_keccak(['string'], [''])  # Placeholder, will use proper encoding
    # Proper encoding using eth_abi
    from eth_abi import encode
    encoded = encode(
        ['(string,bytes,string[],bytes[],bytes32)'],
        [api_approval_data]
    )

    return encoded


class TransactionBuilder:
    """Builds unsigned transactions for various contract interactions"""

    def __init__(self, network_name=None):
        """
        Initialize transaction builder

        Args:
            network_name (str): Network name ('arbitrum_sepolia' or 'arbitrum_one')
        """
        self.network_name = network_name or DEFAULT_NETWORK
        self.network_config = get_network_config(self.network_name)

        # Initialize Web3 with RPC
        self.w3 = Web3(Web3.HTTPProvider(self.network_config['rpc_url']))

        # Get contract addresses
        self.escrow_address = get_contract_address('escrow', self.network_name)

        # Initialize contract service for dynamic ABI loading
        self.contract_service = ContractService(network_name=self.network_name)

        # Get escrow contract with dynamic ABI from Arbiscan (falls back to hardcoded if needed)
        self.escrow_contract = self.contract_service.get_escrow_contract()

    def generate_listing_id(self, seller_address, title, timestamp=None):
        """
        Generate a unique bytes32 listing ID

        Args:
            seller_address (str): Seller's wallet address
            title (str): Product title
            timestamp (int): Unix timestamp (optional, defaults to current time)

        Returns:
            str: Hexadecimal listing ID (bytes32)
        """
        if timestamp is None:
            timestamp = int(time.time())

        # Create a unique hash from seller, title, and timestamp
        data = f"{seller_address}{title}{timestamp}"
        listing_id = '0x' + hashlib.sha256(data.encode()).hexdigest()

        return listing_id

    def build_create_listing_transaction(
        self,
        listing_id,
        token_symbol,
        amount_in_tokens,
        expiration_timestamp,
        escrow_type='disputable',
        from_address=None, 
        token_decimals=6
    ):
        """
        Build unsigned transaction for createListing

        Args:
            listing_id (str): Unique listing ID (bytes32 hex string)
            token_symbol (str): Token symbol ('PYUSD')
            amount_in_tokens (float): Amount in token units (e.g., 100.5 for 100.5 PYUSD)
            expiration_timestamp (int): Unix timestamp when listing expires
            escrow_type (str): Escrow type ('disputable', 'api_approval', 'onchain_approval')
            from_address (str): Seller's wallet address
            token_decimals (int): Token decimals
        Returns:
            dict: Unsigned transaction data
        """
        # Get token address
        token_address = get_token_address(token_symbol, self.network_name)
        if not token_address:
            raise ValueError(f"Token {token_symbol} not found on {self.network_name}")

        # Convert amount to wei (assuming 6 decimals for PYUSD)
        amount_wei = int(amount_in_tokens * 10**token_decimals)

        # Get escrow type enum value
        escrow_type_value = ESCROW_TYPES.get(escrow_type)
        if escrow_type_value is None:
            raise ValueError(f"Invalid escrow type: {escrow_type}")

        # Build contract function call
        contract_function = self.escrow_contract.functions.createListing(
            listing_id,
            token_address,
            amount_wei,
            expiration_timestamp,
            escrow_type_value
        )

        # Build transaction
        transaction = {
            'to': self.escrow_address,
            'value': 0,  # No ETH sent for createListing
            'chainId': self.network_config['chain_id'],
            'data': contract_function._encode_transaction_data(),
        }

        # Add from address if provided
        if from_address:
            transaction['from'] = from_address

            # Estimate gas
            try:
                gas_estimate = contract_function.estimate_gas({'from': from_address})
                transaction['gas'] = hex(int(gas_estimate * 1.2))  # Add 20% buffer
            except Exception as e:
                # If gas estimation fails, use a default value
                transaction['gas'] = hex(200000)
        else:
            transaction['gas'] = hex(200000)

        return transaction

    def calculate_expiration_timestamp(self, duration_days):
        """
        Calculate expiration timestamp

        Args:
            duration_days (int): Number of days until expiration

        Returns:
            int: Unix timestamp
        """
        current_time = int(time.time())
        # Add duration in seconds (days * 24 hours * 60 minutes * 60 seconds)
        expiration = current_time + (duration_days * 24 * 60 * 60)
        return expiration

    def get_listing_from_blockchain(self, listing_id):
        """
        Get listing details from blockchain

        Args:
            listing_id (str): Listing ID (bytes32 hex string)

        Returns:
            dict: Listing details
        """
        try:
            listing = self.escrow_contract.functions.getListing(listing_id).call()

            return {
                'listing_id': listing[0].hex(),
                'buyer': listing[1],
                'seller': listing[2],
                'token': listing[3],
                'amount': listing[4],
                'expiration': listing[5],
                'deadline': listing[6],
                'state': listing[7],
                'escrow_type': listing[8],
            }
        except Exception as e:
            raise ValueError(f"Failed to get listing from blockchain: {str(e)}")

    def check_token_whitelisted(self, token_address):
        """
        Check if token is whitelisted in the escrow contract

        Args:
            token_address (str): Token contract address

        Returns:
            bool: True if whitelisted
        """
        try:
            return self.escrow_contract.functions.isTokenWhitelisted(token_address).call()
        except Exception as e:
            print(f"Error checking token whitelist: {e}")
            return False

    def build_approve_token_transaction(
        self,
        token_symbol,
        amount_in_tokens,
        from_address=None, 
        token_decimals=6
    ):
        """
        Build unsigned transaction for ERC20 token approval

        Args:
            token_symbol (str): Token symbol ('PYUSD')
            amount_in_tokens (float): Amount in token units
            from_address (str): Buyer's wallet address
            token_decimals (int): Token decimals
        Returns:
            dict: Unsigned transaction data
        """
        # Get token address
        token_address = get_token_address(token_symbol, self.network_name)
        if not token_address:
            raise ValueError(f"Token {token_symbol} not found on {self.network_name}")

        # Convert amount to wei (assuming 6 decimals for PYUSD)
        amount_wei = int(amount_in_tokens * 10**token_decimals)

        token_contract = self.contract_service.get_erc20_contract(token_address)

        # Build approve function call
        contract_function = token_contract.functions.approve(
            self.escrow_address,
            amount_wei
        )

        # Build transaction
        transaction = {
            'to': token_address,
            'value': 0,
            'chainId': self.network_config['chain_id'],
            'data': contract_function._encode_transaction_data(),
        }

        # Add from address if provided
        if from_address:
            transaction['from'] = from_address

            # Estimate gas
            try:
                gas_estimate = contract_function.estimate_gas({'from': from_address})
                transaction['gas'] = hex(int(gas_estimate * 1.2))
            except Exception as e:
                transaction['gas'] = hex(100000)
        else:
            transaction['gas'] = hex(100000)

        return transaction

    def build_fill_listing_transaction(
        self,
        listing_id,
        deadline_timestamp,
        from_address=None,
        extra_data=b''
    ):
        """
        Build unsigned transaction for fillListing (buyer purchases)

        Args:
            listing_id (str): Listing ID (bytes32 hex string)
            deadline_timestamp (int): Unix timestamp for delivery deadline
            from_address (str): Buyer's wallet address
            extra_data (bytes): Extra data for onchain approval (default empty)

        Returns:
            dict: Unsigned transaction data
        """
        # Build contract function call
        contract_function = self.escrow_contract.functions.fillListing(
            listing_id,
            deadline_timestamp,
            extra_data
        )

        # Build transaction
        transaction = {
            'to': self.escrow_address,
            'value': 0,
            'chainId': self.network_config['chain_id'],
            'data': contract_function._encode_transaction_data(),
        }

        # Add from address if provided
        if from_address:
            transaction['from'] = from_address

            # Estimate gas
            try:
                gas_estimate = contract_function.estimate_gas({'from': from_address})
                transaction['gas'] = hex(int(gas_estimate * 1.2))
            except Exception as e:
                transaction['gas'] = hex(2000000)
        else:
            transaction['gas'] = hex(2000000)

        return transaction

    def build_deliver_disputable_transaction(
        self,
        listing_id,
        from_address=None
    ):
        """
        Build unsigned transaction for deliverDisputableListing (seller delivers)

        Args:
            listing_id (str): Listing ID (bytes32 hex string)
            from_address (str): Seller's wallet address

        Returns:
            dict: Unsigned transaction data
        """
        # Build contract function call
        contract_function = self.escrow_contract.functions.deliverDisputableListing(
            listing_id
        )

        # Build transaction
        transaction = {
            'to': self.escrow_address,
            'value': 0,
            'chainId': self.network_config['chain_id'],
            'data': contract_function._encode_transaction_data(),
        }

        # Add from address if provided
        if from_address:
            transaction['from'] = from_address

            # Estimate gas
            try:
                gas_estimate = contract_function.estimate_gas({'from': from_address})
                transaction['gas'] = hex(int(gas_estimate * 1.2))
            except Exception as e:
                transaction['gas'] = hex(150000)
        else:
            transaction['gas'] = hex(150000)

        return transaction

    def build_deliver_onchain_approval_transaction(
        self,
        listing_id,
        from_address=None
    ):
        """
        Build unsigned transaction for deliverOnchainApprovalListing (anyone can call)

        Args:
            listing_id (str): Listing ID (bytes32 hex string)
            from_address (str): Caller's wallet address

        Returns:
            dict: Unsigned transaction data
        """
        # Build contract function call
        contract_function = self.escrow_contract.functions.deliverOnchainApprovalListing(
            listing_id
        )

        # Build transaction
        transaction = {
            'to': self.escrow_address,
            'value': 0,
            'chainId': self.network_config['chain_id'],
            'data': contract_function._encode_transaction_data(),
        }

        # Add from address if provided
        if from_address:
            transaction['from'] = from_address

            # Estimate gas
            try:
                gas_estimate = contract_function.estimate_gas({'from': from_address})
                transaction['gas'] = hex(int(gas_estimate * 1.2))
            except Exception as e:
                transaction['gas'] = hex(200000)
        else:
            transaction['gas'] = hex(200000)

        return transaction

    def build_deliver_api_approval_transaction(
        self,
        listing_id,
        from_address=None
    ):
        """
        Build unsigned transaction for deliverApiApprovalListing (seller calls after fulfilling)

        Args:
            listing_id (str): Listing ID (bytes32 hex string)
            from_address (str): Seller's wallet address

        Returns:
            dict: Unsigned transaction data
        """
        # Build contract function call with Chainlink params
        contract_function = self.escrow_contract.functions.deliverApiApprovalListing(
            listing_id,
            [],  # _sellerArgs (empty, args already in extraData)
            [],  # _sellerBytesArgs (empty)
            CHAINLINK_DON_HOSTED_SECRETS_SLOT_ID,
            CHAINLINK_DON_HOSTED_SECRETS_VERSION,
            CHAINLINK_SUBSCRIPTION_ID,
            CHAINLINK_GAS_LIMIT,
            CHAINLINK_DON_ID
        )

        # Build transaction
        transaction = {
            'to': self.escrow_address,
            'value': 0,
            'chainId': self.network_config['chain_id'],
            'data': contract_function._encode_transaction_data(),
        }

        # Add from address if provided
        if from_address:
            transaction['from'] = from_address

            # Estimate gas
            try:
                gas_estimate = contract_function.estimate_gas({'from': from_address})
                transaction['gas'] = hex(int(gas_estimate * 1.5))  # Higher gas for Chainlink
            except Exception as e:
                transaction['gas'] = hex(2500000)  # Higher default for Chainlink
        else:
            transaction['gas'] = hex(2500000)

        return transaction

    def build_resolve_listing_transaction(
        self,
        listing_id,
        to_buyer,
        from_address=None
    ):
        """
        Build unsigned transaction for resolveListing (buyer accepts or rejects)

        Args:
            listing_id (str): Listing ID (bytes32 hex string)
            to_buyer (bool): True to refund buyer, False to release to seller
            from_address (str): Buyer's or seller's wallet address

        Returns:
            dict: Unsigned transaction data
        """
        # Build contract function call
        contract_function = self.escrow_contract.functions.resolveListing(
            listing_id,
            to_buyer
        )

        # Build transaction
        transaction = {
            'to': self.escrow_address,
            'value': 0,
            'chainId': self.network_config['chain_id'],
            'data': contract_function._encode_transaction_data(),
        }

        # Add from address if provided
        if from_address:
            transaction['from'] = from_address

            # Estimate gas
            try:
                gas_estimate = contract_function.estimate_gas({'from': from_address})
                transaction['gas'] = hex(int(gas_estimate * 1.2))
            except Exception as e:
                transaction['gas'] = hex(200000)
        else:
            transaction['gas'] = hex(200000)

        return transaction

    def build_dispute_listing_transaction(
        self,
        listing_id,
        entropy_fee_wei,
        from_address=None
    ):
        """
        Build unsigned transaction for disputeListing (buyer or seller disputes)

        Args:
            listing_id (str): Listing ID (bytes32 hex string)
            entropy_fee_wei (int): Fee for entropy/randomness in wei
            from_address (str): Disputer's wallet address

        Returns:
            dict: Unsigned transaction data
        """
        # Build contract function call
        contract_function = self.escrow_contract.functions.disputeListing(
            listing_id
        )

        # Build transaction (payable function - needs ETH)
        transaction = {
            'to': self.escrow_address,
            'value': hex(entropy_fee_wei),
            'chainId': self.network_config['chain_id'],
            'data': contract_function._encode_transaction_data(),
        }

        # Add from address if provided
        if from_address:
            transaction['from'] = from_address

            # Estimate gas
            try:
                gas_estimate = contract_function.estimate_gas({
                    'from': from_address,
                    'value': entropy_fee_wei
                })
                transaction['gas'] = hex(int(gas_estimate * 1.2))
            except Exception as e:
                transaction['gas'] = hex(300000)
        else:
            transaction['gas'] = hex(300000)

        return transaction

    def calculate_deadline_timestamp(self, deadline_days):
        """
        Calculate deadline timestamp from current time

        Args:
            deadline_days (int): Number of days until deadline

        Returns:
            int: Unix timestamp
        """
        current_time = int(time.time())
        deadline = current_time + (deadline_days * 24 * 60 * 60)
        return deadline

    def get_entropy_fee(self):
        """
        Get the entropy fee from the escrow contract
        This is used for dispute randomness generation

        Returns:
            int: Fee in wei
        """
        try:
            # Call getFee() from contract
            fee = self.escrow_contract.functions.getFee().call()
            return fee
        except Exception as e:
            print(f"Error getting entropy fee: {e}")
            # Default fallback (0.001 ETH)
            return int(0.001 * 10**18)

    def create_extra_data_onchain_approval(self, destination, data, expected_result):
        """
        Create extra data for onchain approval

        Args:
            destination (address): Destination address
            data (bytes): Data
            expected_result (bytes): Expected result

        Returns:
            bytes: Extra data
        """
        return self.w3.eth.abi.encode_abi(['address', 'bytes', 'bytes'], [destination, data, expected_result])

    def create_extra_data_api_approval(self, source, encrypted_secrets_urls, args, bytes_args):
        """
        Create extra data for api approval

        Args:
            source (str): Source code
            encrypted_secrets_urls (bytes): Encrypted secrets URLs
            args (string[]): Arguments
            bytes_args (bytes[]): Bytes arguments

        """
        request_id = Web3.to_bytes(hexstr='0x' + '00' * 32)
        return self.w3.eth.abi.encode_abi(['string', 'bytes', 'string[]', 'bytes[]', 'bytes32'], [source, encrypted_secrets_urls, args, bytes_args, request_id])

    def script_flattener(self, script_path):
        """
        Flatten the script

        Args:
            script_path (str): Absolute path to a Chainlink Functions .js script

        Returns:
            str: Flattened script
        """
        # TODO: I wrote this one, assuming we will save functions in an static folder and load them from there
        # Please check if this approach is correct. If not, please rewrite that part. We can also save the scripts in the flatended form in the database.
        # also I didnt test the python implementation of this function, it needs to be tested.
        # One last thing, I didnt know where else to put this function, so I put it here. Please move it to the correct place.

        if not isinstance(script_path, str):
            raise TypeError("script must be an absolute file path string")
        script_path = script
        if not os.path.isabs(script_path):
            raise ValueError("Expected an absolute file path for Chainlink Functions script")
        if not os.path.exists(script_path):
            raise FileNotFoundError(f"Chainlink Functions script not found: {script_path}")

        with open(script_path, 'r', encoding='utf-8') as f:
            script = f.read()

        # Normalize content
        if isinstance(script, bytes):
            script = script.decode('utf-8', errors='ignore')
        # Strip UTF-8 BOM if present and normalize newlines
        script = script.replace('\r\n', '\n').replace('\r', '\n')
        if script.startswith('\ufeff'):
            script = script.lstrip('\ufeff')

        # Optionally trim trailing spaces on each line
        script = '\n'.join(line.rstrip() for line in script.split('\n'))

        return script

# Create singleton instance
transaction_builder = TransactionBuilder()
