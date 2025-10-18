import React, { useState, useEffect, useCallback } from 'react';
import ProductCard from './components/ProductCard';
import AddProductForm from './components/AddProductForm';
import ProductDetailModal from './components/ProductDetailModal';
import MyProductsModal from './components/MyProductsModal';
import { api } from './services/api';
import './App.css';
import {
    isMetaMaskInstalled,
    connectWallet,
    getCurrentAccount,
    getCurrentChainId,
    getNetworkName,
    formatAddress,
    onAccountsChanged,
    onChainChanged
} from './utils/metamask';
// import { usePrivy } from '@privy-io/react-auth';

function App() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [telegramUser, setTelegramUser] = useState(null);
    const [authUser, setAuthUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchTimeout, setSearchTimeout] = useState(null);
    const [showMyProducts, setShowMyProducts] = useState(false);
    // const { login, authenticated, getIdToken } = usePrivy();
    const authenticated = false; // Privy disabled

    // MetaMask state
    const [walletAddress, setWalletAddress] = useState(null);
    const [chainId, setChainId] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        // Initialize Telegram WebApp
        if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;

            // Expand the app to full height
            tg.expand();

            // Get user data from Telegram
            if (tg.initData) {
                try {
                    // Parse initData to get user information
                    const params = new URLSearchParams(tg.initData);
                    const userString = params.get('user');

                    if (userString) {
                        const user = JSON.parse(userString);
                        setTelegramUser(user);

                        // Authenticate with your backend
                        authenticateWithTelegram(user);
                    }
                } catch (error) {
                    console.error('Error parsing user data:', error);
                }
            }

            // Set theme colors
            tg.setHeaderColor('#2563eb');
            tg.setBackgroundColor('#ffffff');
        }

        loadProducts();

        // Check if wallet is already connected on mount
        checkWalletConnection();

        // Listen for account changes
        onAccountsChanged((newAccount) => {
            setWalletAddress(newAccount);
            console.log('Account changed to:', newAccount);
        });

        // Listen for network changes
        onChainChanged((newChainId) => {
            setChainId(newChainId);
            console.log('Network changed to:', newChainId, getNetworkName(newChainId));
        });
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
        };
    }, [searchTimeout]);

    const authenticateWithTelegram = async (user) => {
        try {
            const apiUrl = process.env.REACT_APP_API_URL || 'https://api.debazaar.click/api';
            const response = await fetch(`${apiUrl}/auth/telegram/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegram_id: user.id,
                    username: user.username,
                    first_name: user.first_name
                })
            });

            if (response.ok) {
                const authData = await response.json();
                console.log('Authenticated:', authData);
                console.log('Django User ID:', authData.user_id);
                console.log('Telegram ID:', user.id);
                // Store user session data
                setAuthUser(authData);

            } else {
                const errorText = await response.text();
                alert(`Authentication failed!\nStatus: ${response.status}\nError: ${errorText}`);
            }
        } catch (err) {
            console.error('Telegram auth failed:', err);
            alert(`Authentication error: ${err.message}`);
        }
    };

    const loadProducts = async (searchParams = {}) => {
        try {
            setLoading(true);
            console.log('Loading products with params:', searchParams);
            const data = await api.getListings(searchParams);
            console.log('data: ', data);
            setProducts(data.listings || []);
        } catch (err) {
            console.error('Error loading products:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrivyLogin = async () => {
        // Privy temporarily disabled
        alert('Privy login is currently disabled');
    };

    // MetaMask Functions

    // Check if wallet is already connected (on page load)
    const checkWalletConnection = async () => {
        if (!isMetaMaskInstalled()) {
            console.log('MetaMask is not installed');
            return;
        }

        try {
            const account = await getCurrentAccount();
            if (account) {
                setWalletAddress(account);
                const chain = await getCurrentChainId();
                setChainId(chain);
                console.log('Wallet already connected:', account);
                console.log('Network:', getNetworkName(chain));
            }
        } catch (error) {
            console.error('Error checking wallet connection:', error);
        }
    };

    // Connect MetaMask wallet
    const handleConnectWallet = async () => {
        setIsConnecting(true);

        try {
            const address = await connectWallet();

            if (address) {
                setWalletAddress(address);

                // Get chain ID
                const chain = await getCurrentChainId();
                setChainId(chain);

                console.log('Wallet connected successfully!');
                console.log('Address:', address);
                console.log('Network:', getNetworkName(chain));

                alert(`Wallet connected: ${formatAddress(address)}`);
            }
        } catch (error) {
            console.error('Connection error:', error);
        } finally {
            setIsConnecting(false);
        }
    };

    // Disconnect wallet (clear local state)
    const handleDisconnectWallet = () => {
        setWalletAddress(null);
        setChainId(null);
        alert('Wallet disconnected. To fully disconnect, please disconnect from MetaMask extension.');
    };

    const handleAddProduct = async (productData) => {
        try {
            // Add user ID to the product data
            const sellerId = authUser?.user_id || telegramUser?.id || 1;
            console.log('Creating product with seller_id:', sellerId);
            console.log('authUser:', authUser);
            console.log('telegramUser:', telegramUser);

            const listingData = {
                ...productData,
                seller_id: sellerId
            };
            await api.createListing(listingData);


            setShowAddForm(false);
            loadProducts(); // Refresh the product list
        } catch (err) {
            console.error('Error adding product:', err);
            alert('Failed to add product. Please try again.');
        }
    };

    const handleWatchClick = (product) => {
        setSelectedProduct(product);
    };

    const handleCloseProductDetail = () => {
        setSelectedProduct(null);
    };

    // Debounced search function
    const debouncedSearch = useCallback((query) => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        const timeout = setTimeout(() => {
            const searchParams = query.trim() ? { search: query } : {};
            loadProducts(searchParams);
        }, 300); // 300ms delay

        setSearchTimeout(timeout);
    }, [searchTimeout]);

    // Handle search input change
    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        debouncedSearch(query);
    };

    // Handle search button click (optional - for immediate search)
    const handleSearchClick = () => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        const searchParams = searchQuery.trim() ? { search: searchQuery } : {};
        loadProducts(searchParams);
    };

    return (
        <div className="app">
            <div className="header">
                <div className="header-left">
                    <h1>DeBazaar</h1>
                    {telegramUser && (
                        <div className="user-info">
                            Hi {telegramUser.first_name}!
                        </div>
                    )}
                </div>
                <div className="header-center">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="search-input"
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                        <button
                            className="search-btn"
                            onClick={handleSearchClick}
                        >
                            Search
                        </button>
                    </div>
                </div>
                <div className="header-right">
                    {!walletAddress ? (
                        <button
                            className="login-btn"
                            onClick={handleConnectWallet}
                            disabled={isConnecting}
                        >
                            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                        </button>
                    ) : (
                        <div className="wallet-info">
                            <span className="wallet-address">
                                {formatAddress(walletAddress)}
                            </span>
                            {chainId && [42161, 421614].includes(chainId) && (
                                <span className="network-badge">
                                    {getNetworkName(chainId)}
                                </span>
                            )}
                            {chainId && ![42161, 421614].includes(chainId) && (
                                <span className="network-badge-warning">
                                    Wrong Network
                                </span>
                            )}
                            <button
                                className="disconnect-btn"
                                onClick={handleDisconnectWallet}
                            >
                                Disconnect
                            </button>
                        </div>
                    )}
                    <button
                        className="my-products-btn"
                        onClick={() => setShowMyProducts(true)}
                    >
                        My Products
                    </button>
                    <button
                        className="sell-btn"
                        onClick={() => setShowAddForm(true)}
                    >
                        Sell
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading...</div>
            ) : (
                <div className="products-grid">
                    {products.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onWatchClick={handleWatchClick}
                        />
                    ))}
                </div>
            )}

            {showAddForm && (
                <AddProductForm
                    onClose={() => setShowAddForm(false)}
                    onSubmit={handleAddProduct}
                />
            )}

            {selectedProduct && (
                <ProductDetailModal
                    product={selectedProduct}
                    onClose={handleCloseProductDetail}
                />
            )}

            {showMyProducts && (
                <MyProductsModal
                    onClose={() => setShowMyProducts(false)}
                    telegramUser={telegramUser}
                    authUser={authUser}
                    onProductClick={handleWatchClick}
                />
            )}
        </div>
    );
}

export default App;
