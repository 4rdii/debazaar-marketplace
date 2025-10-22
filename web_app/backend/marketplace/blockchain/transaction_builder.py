"""
Transaction Builder
Builds unsigned transactions for frontend to sign
Uses dynamic ABI loading from Arbiscan via ContractService
"""

import time
import hashlib
from web3 import Web3
from .config import (
    get_network_config,
    get_contract_address,
    get_token_address,
    ESCROW_ABI,
    ERC20_ABI,
    ESCROW_TYPES,
    DEFAULT_NETWORK
)
from .contract_service import ContractService


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
            token_symbol (str): Token symbol ('PYUSD', 'USDC', 'USDT')
            amount_in_tokens (float): Amount in token units (e.g., 100.5 for 100.5 USDC)
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

        # Convert amount to wei (assuming 6 decimals for USDC/USDT/PYUSD)
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
            token_symbol (str): Token symbol ('PYUSD', 'USDC', 'USDT')
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

        # Convert amount to wei (assuming 6 decimals for USDC/USDT/PYUSD)
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
                transaction['gas'] = hex(250000)
        else:
            transaction['gas'] = hex(250000)

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



# Create singleton instance
transaction_builder = TransactionBuilder()
