import { connectWallet } from '../utils/metamask';

const API_BASE = process.env.REACT_APP_API_URL || 'https://api.debazaar.click/api';

/**
 * Authenticate user via MetaMask wallet signature
 * @returns {Promise<{success: boolean, user_id: number, username: string, wallet_address: string}>}
 */
export const authenticateWithWallet = async () => {
    try {
        // Step 1: Connect wallet
        const walletAddress = await connectWallet();

        if (!walletAddress) {
            throw new Error('Failed to connect wallet');
        }

        // Step 2: Create message to sign
        const message = `Sign this message to authenticate with DeBazaar.\n\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;

        // Step 3: Request signature from MetaMask
        const signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [message, walletAddress],
        });

        // Step 4: Send to backend for verification
        const response = await fetch(`${API_BASE}/auth/wallet/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                wallet_address: walletAddress,
                signature: signature,
                message: message,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Authentication failed');
        }

        const authData = await response.json();

        // Store auth data in localStorage
        localStorage.setItem('authUser', JSON.stringify(authData));
        localStorage.setItem('walletAddress', walletAddress);

        return authData;
    } catch (error) {
        console.error('Wallet authentication failed:', error);
        throw error;
    }
};

/**
 * Get stored auth data from localStorage
 */
export const getStoredAuth = () => {
    const authUser = localStorage.getItem('authUser');
    const walletAddress = localStorage.getItem('walletAddress');

    if (authUser && walletAddress) {
        return {
            authUser: JSON.parse(authUser),
            walletAddress: walletAddress
        };
    }

    return null;
};

/**
 * Clear auth data (logout)
 */
export const logout = () => {
    localStorage.removeItem('authUser');
    localStorage.removeItem('walletAddress');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
    return getStoredAuth() !== null;
};
