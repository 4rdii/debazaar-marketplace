import { connectWallet, signMessage } from './blockchain';
import { authAPI, setAuthToken, removeAuthToken } from './api';

const AUTH_MESSAGE = 'Sign this message to authenticate with DeBazaar';

export interface AuthResult {
  success: boolean;
  walletAddress?: string;
  token?: string;
  error?: string;
}

// Authenticate with MetaMask
export const authenticateWithWallet = async (): Promise<AuthResult> => {
  try {
    // Connect wallet
    const walletAddress = await connectWallet();
    if (!walletAddress) {
      return { success: false, error: 'Failed to connect wallet' };
    }

    // Sign authentication message
    const signature = await signMessage(AUTH_MESSAGE);

    // Send to backend
    const response = await authAPI.wallet({
      wallet_address: walletAddress,
      signature,
    });

    // Store token
    const token = response.data?.token;
    if (token) {
      setAuthToken(token);
    }

    return {
      success: true,
      walletAddress,
      token,
    };
  } catch (error: any) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: error.message || 'Authentication failed',
    };
  }
};

// Logout
export const logout = () => {
  removeAuthToken();
  localStorage.removeItem('wallet_address');
};

// Check if authenticated
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('auth_token');
};

// Get stored wallet address
export const getStoredWalletAddress = (): string | null => {
  return localStorage.getItem('wallet_address');
};
