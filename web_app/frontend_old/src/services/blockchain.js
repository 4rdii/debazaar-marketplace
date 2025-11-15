/**
 * Blockchain Service
 * Handles Web3/MetaMask interactions for blockchain transactions
 */

/**
 * Send a transaction to the blockchain via MetaMask
 * @param {Object} transaction - Transaction object from backend
 * @param {string} transaction.to - Contract address
 * @param {string} transaction.from - Sender address
 * @param {string} transaction.data - Encoded transaction data
 * @param {string} transaction.value - ETH value to send (in hex)
 * @param {string} transaction.gas - Gas limit (in hex)
 * @returns {Promise<string>} Transaction hash
 */
export const sendTransaction = async (transaction) => {
    if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
    }

    try {
        console.log('Sending transaction:', transaction);

        // Request transaction via MetaMask
        const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [transaction],
        });

        console.log('Transaction sent! Hash:', txHash);
        return txHash;
    } catch (error) {
        console.error('Transaction failed:', error);

        // Handle user rejection
        if (error.code === 4001) {
            throw new Error('Transaction rejected by user');
        }

        // Handle insufficient funds
        if (error.message?.includes('insufficient funds')) {
            throw new Error('Insufficient funds for transaction');
        }

        throw error;
    }
};

/**
 * Wait for transaction confirmation on blockchain
 * @param {string} txHash - Transaction hash
 * @param {number} confirmations - Number of confirmations to wait for (default: 1)
 * @param {number} timeout - Timeout in milliseconds (default: 120000 = 2 minutes)
 * @returns {Promise<Object>} Transaction receipt
 */
export const waitForTransaction = async (txHash, confirmations = 1, timeout = 120000) => {
    if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
    }

    console.log(`Waiting for transaction ${txHash} to be mined...`);

    const startTime = Date.now();

    return new Promise((resolve, reject) => {
        const checkTransaction = async () => {
            try {
                // Get transaction receipt
                const receipt = await window.ethereum.request({
                    method: 'eth_getTransactionReceipt',
                    params: [txHash],
                });

                if (receipt) {
                    // Transaction is mined
                    console.log('Transaction confirmed!', receipt);

                    // Check if transaction succeeded
                    if (receipt.status === '0x0') {
                        reject(new Error('Transaction failed on blockchain'));
                        return;
                    }

                    resolve(receipt);
                } else {
                    // Check timeout
                    if (Date.now() - startTime > timeout) {
                        reject(new Error('Transaction confirmation timeout'));
                        return;
                    }

                    // Transaction not yet mined, check again in 2 seconds
                    setTimeout(checkTransaction, 2000);
                }
            } catch (error) {
                reject(error);
            }
        };

        // Start checking
        checkTransaction();
    });
};

/**
 * Get current gas price
 * @returns {Promise<string>} Gas price in wei (hex)
 */
export const getGasPrice = async () => {
    if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
    }

    const gasPrice = await window.ethereum.request({
        method: 'eth_gasPrice',
    });

    return gasPrice;
};

/**
 * Estimate gas for a transaction
 * @param {Object} transaction - Transaction object
 * @returns {Promise<string>} Estimated gas (hex)
 */
export const estimateGas = async (transaction) => {
    if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
    }

    try {
        const gasEstimate = await window.ethereum.request({
            method: 'eth_estimateGas',
            params: [transaction],
        });

        return gasEstimate;
    } catch (error) {
        console.error('Gas estimation failed:', error);
        // Return a default gas limit if estimation fails
        return '0x493E0'; // 300000 in decimal
    }
};

/**
 * Format wei to ether
 * @param {string|number} wei - Amount in wei
 * @returns {string} Amount in ether
 */
export const weiToEther = (wei) => {
    const weiValue = typeof wei === 'string' ? parseInt(wei, 16) : wei;
    return (weiValue / 1e18).toFixed(6);
};

/**
 * Format ether to wei (hex)
 * @param {string|number} ether - Amount in ether
 * @returns {string} Amount in wei (hex)
 */
export const etherToWei = (ether) => {
    const weiValue = Math.floor(parseFloat(ether) * 1e18);
    return '0x' + weiValue.toString(16);
};
