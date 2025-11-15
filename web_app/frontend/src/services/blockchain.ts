import { ethers } from 'ethers';
import type { TransactionData } from '../types';

// Network configurations
export const NETWORKS = {
  arbitrum_sepolia: {
    chainId: '0x66eee',
    chainName: 'Arbitrum Sepolia',
    rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://sepolia.arbiscan.io'],
  },
  arbitrum_one: {
    chainId: '0xa4b1',
    chainName: 'Arbitrum One',
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io'],
  },
};

// Get provider (MetaMask)
export const getProvider = (): ethers.providers.Web3Provider | null => {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return new ethers.providers.Web3Provider((window as any).ethereum);
  }
  return null;
};

// Get signer
export const getSigner = async (): Promise<ethers.Signer | null> => {
  const provider = getProvider();
  if (!provider) return null;
  return provider.getSigner();
};

// Connect wallet
export const connectWallet = async (): Promise<string | null> => {
  const provider = getProvider();
  if (!provider) {
    throw new Error('MetaMask not installed');
  }

  const accounts = await provider.send('eth_requestAccounts', []);
  return accounts[0] || null;
};

// Get current account
export const getCurrentAccount = async (): Promise<string | null> => {
  const provider = getProvider();
  if (!provider) return null;

  const accounts = await provider.listAccounts();
  return accounts[0] || null;
};

// Switch network
export const switchNetwork = async (network: 'arbitrum_sepolia' | 'arbitrum_one') => {
  const provider = getProvider();
  if (!provider) throw new Error('MetaMask not installed');

  const networkConfig = NETWORKS[network];

  try {
    await provider.send('wallet_switchEthereumChain', [
      { chainId: networkConfig.chainId },
    ]);
  } catch (error: any) {
    // If network doesn't exist, add it
    if (error.code === 4902) {
      await provider.send('wallet_addEthereumChain', [networkConfig]);
    } else {
      throw error;
    }
  }
};

// Sign message
export const signMessage = async (message: string): Promise<string> => {
  const signer = await getSigner();
  if (!signer) throw new Error('No signer available');
  return await signer.signMessage(message);
};

// Send transaction
export const sendTransaction = async (txData: TransactionData): Promise<string> => {
  const signer = await getSigner();
  if (!signer) throw new Error('No signer available');

  const tx = await signer.sendTransaction({
    to: txData.to,
    data: txData.data,
    value: txData.value || '0',
  });

  return tx.hash;
};

// Wait for transaction confirmation
export const waitForTransaction = async (txHash: string, confirmations = 1) => {
  const provider = getProvider();
  if (!provider) throw new Error('No provider available');

  return await provider.waitForTransaction(txHash, confirmations);
};

// Format ether
export const formatEther = (value: string): string => {
  return ethers.utils.formatEther(value);
};

// Parse ether
export const parseEther = (value: string): string => {
  return ethers.utils.parseEther(value).toString();
};
