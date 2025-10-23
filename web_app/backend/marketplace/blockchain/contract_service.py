"""
Contract Service
Handles Web3 interactions with blockchain contracts
Uses hardcoded ABIs for reliability
"""

import os
from web3 import Web3
from .config import (
    get_network_config,
    get_contract_address,
    get_token_address,
    ESCROW_ABI,
    ENTROPY_V2_ABI,
    ERC20_ABI,
    DEFAULT_NETWORK
)


class ContractService:
    """Service for interacting with smart contracts"""

    def __init__(self, network_name=None):
        """
        Initialize contract service

        Args:
            network_name (str): Network name ('arbitrum_sepolia' or 'arbitrum_one')
        """
        self.network_name = network_name or DEFAULT_NETWORK
        self.network_config = get_network_config(self.network_name)

        # Initialize Web3 with RPC
        self.w3 = Web3(Web3.HTTPProvider(self.network_config['rpc_url']))

        # Verify connection
        if not self.w3.is_connected():
            raise ConnectionError(f"Failed to connect to {self.network_config['name']} RPC")

    def get_escrow_contract(self):
        """
        Get escrow contract instance with hardcoded ABI

        Returns:
            web3.eth.Contract: Escrow contract instance
        """
        escrow_address = get_contract_address('escrow', self.network_name)
        if not escrow_address:
            raise ValueError(f"Escrow contract not deployed on {self.network_name}")

        # Create contract instance with hardcoded ABI
        return self.w3.eth.contract(
            address=Web3.to_checksum_address(escrow_address),
            abi=ESCROW_ABI
        )

    def get_erc20_contract(self, token_address):
        """
        Get ERC20 token contract instance

        Args:
            token_address (str): Token contract address

        Returns:
            web3.eth.Contract: ERC20 contract instance
        """
        # Create contract instance with standard ERC20 ABI
        return self.w3.eth.contract(
            address=Web3.to_checksum_address(token_address),
            abi=ERC20_ABI
        )

    def get_entropyv2_contract(self):
        """
        Get entropy v2 contract instance with hardcoded ABI

        Returns:
            web3.eth.Contract: Entropy v2 contract instance
        """
        entropy_v2_address = get_contract_address('entropy_v2', self.network_name)
        if not entropy_v2_address:
            raise ValueError(f"Entropy v2 contract not deployed on {self.network_name}")

        # Create contract instance with hardcoded ABI
        return self.w3.eth.contract(
            address=Web3.to_checksum_address(entropy_v2_address),
            abi=ENTROPY_V2_ABI
        )

    def get_listing(self, listing_id):
        """
        Read listing details from blockchain

        Args:
            listing_id (str): Listing ID (bytes32 hex string)

        Returns:
            dict: Listing details
        """
        try:
            escrow_contract = self.get_escrow_contract()
            listing = escrow_contract.functions.getListing(listing_id).call()

            return {
                'listing_id': listing[0].hex() if isinstance(listing[0], bytes) else listing[0],
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

    def estimate_gas(self, contract_function, from_address, value=0):
        """
        Estimate gas for a contract function call

        Args:
            contract_function: Web3 contract function
            from_address (str): Sender address
            value (int): ETH value to send (in wei)

        Returns:
            int: Estimated gas
        """
        try:
            gas_estimate = contract_function.estimate_gas({
                'from': from_address,
                'value': value
            })
            # Add 20% buffer
            return int(gas_estimate * 1.2)
        except Exception as e:
            print(f"Gas estimation failed: {e}")
            # Return default gas limit
            return 300000

    def check_token_whitelisted(self, token_address):
        """
        Check if token is whitelisted in escrow contract

        Args:
            token_address (str): Token contract address

        Returns:
            bool: True if whitelisted
        """
        try:
            escrow_contract = self.get_escrow_contract()
            return escrow_contract.functions.isTokenWhitelisted(
                Web3.to_checksum_address(token_address)
            ).call()
        except Exception as e:
            print(f"Error checking token whitelist: {e}")
            return False

    def get_token_decimals(self, token_address):
        """
        Get token decimals

        Args:
            token_address (str): Token contract address

        Returns:
            int: Token decimals
        """
        try:
            token_contract = self.get_erc20_contract(token_address)
            return token_contract.functions.decimals().call()
        except Exception as e:
            print(f"Error getting token decimals: {e}")
            # Default to 6 for USDC/USDT/PYUSD
            return 6

    def get_token_allowance(self, token_address, owner_address, spender_address):
        """
        Get token allowance

        Args:
            token_address (str): Token contract address
            owner_address (str): Token owner address
            spender_address (str): Spender address

        Returns:
            int: Allowance amount (in wei)
        """
        try:
            token_contract = self.get_erc20_contract(token_address)
            return token_contract.functions.allowance(
                Web3.to_checksum_address(owner_address),
                Web3.to_checksum_address(spender_address)
            ).call()
        except Exception as e:
            print(f"Error getting token allowance: {e}")
            return 0

    def verify_transaction(self, tx_hash, timeout=120):
        """
        Wait for transaction confirmation and verify it succeeded

        Args:
            tx_hash (str): Transaction hash
            timeout (int): Timeout in seconds

        Returns:
            dict: Transaction receipt

        Raises:
            ValueError: If transaction failed or timed out
        """
        try:
            # Wait for transaction receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=timeout)

            # Check if transaction succeeded
            if receipt['status'] != 1:
                raise ValueError(f"Transaction failed: {tx_hash}")

            return {
                'tx_hash': receipt['transactionHash'].hex(),
                'block_number': receipt['blockNumber'],
                'gas_used': receipt['gasUsed'],
                'status': receipt['status']
            }
        except Exception as e:
            raise ValueError(f"Transaction verification failed: {str(e)}")


# Create singleton instance
contract_service = ContractService()
