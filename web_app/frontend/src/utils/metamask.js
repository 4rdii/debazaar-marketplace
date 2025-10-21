/**
 * MetaMask Integration Utilities
 *
 * This file contains all MetaMask-related functions:
 * - Checking if MetaMask is installed
 * - Connecting to MetaMask
 * - Getting wallet address
 * - Switching networks
 * - Listening to account/network changes
 */

import { ethers } from 'ethers';

// Supported networks configuration - Only Arbitrum networks
export const NETWORKS = {
    ARBITRUM_ONE: {
        chainId: '0xa4b1', // 42161 in hex
        chainName: 'Arbitrum One',
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        },
        rpcUrls: ['https://arb1.arbitrum.io/rpc'],
        blockExplorerUrls: ['https://arbiscan.io']
    },
    ARBITRUM_SEPOLIA: {
        chainId: '0x66eee', // 421614 in hex
        chainName: 'Arbitrum Sepolia',
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        },
        rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
        blockExplorerUrls: ['https://sepolia.arbiscan.io']
    }
};

/**
 * Check if MetaMask is installed
 * MetaMask injects ethereum object into window
 */
export const isMetaMaskInstalled = () => {
    const { ethereum } = window;
    return Boolean(ethereum && ethereum.isMetaMask);
};

/**
 * Get the Web3 provider from MetaMask
 */
export const getProvider = () => {
    if (!isMetaMaskInstalled()) {
        throw new Error('MetaMask is not installed');
    }
    return new ethers.providers.Web3Provider(window.ethereum);
};

/**
 * Connect to MetaMask wallet
 * This will prompt user to approve connection
 * Returns: wallet address
 */
export const connectWallet = async () => {
    try {
        if (!isMetaMaskInstalled()) {
            alert('Please install MetaMask to use this feature!');
            window.open('https://metamask.io/download/', '_blank');
            return null;
        }

        // Request account access
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        if (accounts.length === 0) {
            throw new Error('No accounts found');
        }

        console.log('Connected to wallet:', accounts[0]);
        return accounts[0];

    } catch (error) {
        console.error('Error connecting to MetaMask:', error);

        // User rejected the request
        if (error.code === 4001) {
            alert('Please connect to MetaMask to continue');
        } else {
            alert(`Error connecting to MetaMask: ${error.message}`);
        }

        return null;
    }
};

/**
 * Get current connected wallet address
 * Returns: wallet address or null
 */
export const getCurrentAccount = async () => {
    try {
        if (!isMetaMaskInstalled()) {
            return null;
        }

        const accounts = await window.ethereum.request({
            method: 'eth_accounts'
        });

        return accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
        console.error('Error getting current account:', error);
        return null;
    }
};

/**
 * Get current network/chain ID
 * Returns: chain ID (number)
 */
export const getCurrentChainId = async () => {
    try {
        if (!isMetaMaskInstalled()) {
            return null;
        }

        const chainId = await window.ethereum.request({
            method: 'eth_chainId'
        });

        // Convert hex to decimal
        return parseInt(chainId, 16);
    } catch (error) {
        console.error('Error getting chain ID:', error);
        return null;
    }
};

/**
 * Switch to a specific network
 * If network doesn't exist in MetaMask, it will be added
 */
export const switchNetwork = async (networkKey) => {
    try {
        if (!isMetaMaskInstalled()) {
            throw new Error('MetaMask is not installed');
        }

        const network = NETWORKS[networkKey];
        if (!network) {
            throw new Error(`Network ${networkKey} not found`);
        }

        try {
            // Try to switch to the network
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: network.chainId }]
            });

            console.log(`Switched to ${network.chainName}`);
            return true;

        } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
                try {
                    // Add the network
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [network]
                    });

                    console.log(`Added and switched to ${network.chainName}`);
                    return true;
                } catch (addError) {
                    console.error('Error adding network:', addError);
                    throw addError;
                }
            }
            throw switchError;
        }
    } catch (error) {
        console.error('Error switching network:', error);
        alert(`Error switching network: ${error.message}`);
        return false;
    }
};

/**
 * Get balance of connected wallet (in native currency)
 * Returns: balance as string
 */
export const getBalance = async (address) => {
    try {
        const provider = getProvider();
        const balance = await provider.getBalance(address);

        // Convert from wei to ether
        return ethers.utils.formatEther(balance);
    } catch (error) {
        console.error('Error getting balance:', error);
        return '0';
    }
};

/**
 * Get USDT token balance
 * You'll need the USDT contract address for your network
 */
export const getTokenBalance = async (address, tokenContractAddress) => {
    try {
        const provider = getProvider();

        // ERC20 ABI (just the balanceOf function)
        const erc20Abi = [
            'function balanceOf(address owner) view returns (uint256)',
            'function decimals() view returns (uint8)'
        ];

        const tokenContract = new ethers.Contract(
            tokenContractAddress,
            erc20Abi,
            provider
        );

        const balance = await tokenContract.balanceOf(address);
        const decimals = await tokenContract.decimals();

        // Format with proper decimals
        return ethers.utils.formatUnits(balance, decimals);
    } catch (error) {
        console.error('Error getting token balance:', error);
        return '0';
    }
};

/**
 * Format wallet address for display
 * Example: 0x1234...5678
 */
export const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * Listen for account changes
 * Callback will be called when user switches accounts in MetaMask
 */
export const onAccountsChanged = (callback) => {
    if (!isMetaMaskInstalled()) return;

    window.ethereum.on('accountsChanged', (accounts) => {
        console.log('Account changed:', accounts[0]);
        callback(accounts[0] || null);
    });
};

/**
 * Listen for network/chain changes
 * Callback will be called when user switches networks in MetaMask
 */
export const onChainChanged = (callback) => {
    if (!isMetaMaskInstalled()) return;

    window.ethereum.on('chainChanged', (chainId) => {
        console.log('Chain changed:', chainId);
        // Convert hex to decimal
        callback(parseInt(chainId, 16));
        // MetaMask recommends reloading the page on chain changes
        // window.location.reload();
    });
};

/**
 * Disconnect wallet (note: MetaMask doesn't have a disconnect method)
 * This just clears the local state - user needs to disconnect from MetaMask extension
 */
export const disconnectWallet = () => {
    console.log('Wallet disconnected (local state cleared)');
    // Note: MetaMask doesn't provide a programmatic way to disconnect
    // User must disconnect from the MetaMask extension
    return true;
};

/**
 * Get network name from chain ID
 */
export const getNetworkName = (chainId) => {
    const networks = {
        42161: 'Arbitrum One',
        421614: 'Arbitrum Sepolia',
        11155111: 'Ethereum Sepolia (Unsupported - Please switch to Arbitrum Sepolia)'
    };
    return networks[chainId] || `Unsupported Network (${chainId})`;
};

/**
 * Check if current network is supported
 * Returns: boolean
 */
export const isCorrectNetwork = async () => {
    const chainId = await getCurrentChainId();
    // Only Arbitrum Sepolia (421614) is supported for testnet
    return chainId === 421614 || chainId === 42161;
};

/**
 * Prompt user to switch to Arbitrum Sepolia if on wrong network
 */
export const ensureCorrectNetwork = async () => {
    const isCorrect = await isCorrectNetwork();

    if (!isCorrect) {
        const chainId = await getCurrentChainId();
        const currentNetwork = getNetworkName(chainId);

        const userConfirmed = window.confirm(
            `You are connected to ${currentNetwork}.\n\n` +
            `This app requires Arbitrum Sepolia network.\n\n` +
            `Would you like to switch to Arbitrum Sepolia now?`
        );

        if (userConfirmed) {
            return await switchNetwork('ARBITRUM_SEPOLIA');
        }

        return false;
    }

    return true;
};
