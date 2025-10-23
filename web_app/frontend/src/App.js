import React, { useState, useEffect, useCallback } from 'react';
import ProductCard from './components/ProductCard';
import AddProductForm from './components/AddProductForm';
import ProductDetailModal from './components/ProductDetailModal';
import MyProductsModal from './components/MyProductsModal';
import MyPurchasesModal from './components/MyPurchasesModal';
import { api } from './services/api';
import { authenticateWithWallet, getStoredAuth, logout } from './services/auth';
import './App.css';
import {
    isMetaMaskInstalled,
    getCurrentAccount,
    getCurrentChainId,
    getNetworkName,
    formatAddress,
    onAccountsChanged,
    onChainChanged
} from './utils/metamask';

function App() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [authUser, setAuthUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchTimeout, setSearchTimeout] = useState(null);
    const [showMyProducts, setShowMyProducts] = useState(false);
    const [showMyPurchases, setShowMyPurchases] = useState(false);

    // MetaMask state
    const [walletAddress, setWalletAddress] = useState(null);
    const [chainId, setChainId] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        // Check for stored authentication on mount
        const storedAuth = getStoredAuth();
        if (storedAuth) {
            setAuthUser(storedAuth.authUser);
            setWalletAddress(storedAuth.walletAddress);
        }

        // Load products
        loadProducts();

        // Check if wallet is already connected on mount
        checkWalletConnection();

        // Listen for account changes
        onAccountsChanged((newAccount) => {
            if (newAccount && newAccount !== walletAddress) {
                // Wallet changed - logout user
                handleLogout();
            }
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

    // Connect MetaMask wallet and authenticate
    const handleConnectWallet = async () => {
        if (!isMetaMaskInstalled()) {
            alert('Please install MetaMask to use this app!');
            return;
        }

        setIsConnecting(true);

        try {
            const authData = await authenticateWithWallet();

            if (authData && authData.success) {
                setAuthUser(authData);
                setWalletAddress(authData.wallet_address);

                // Get chain ID
                const chain = await getCurrentChainId();
                setChainId(chain);

                console.log('Authenticated successfully!');
                console.log('User ID:', authData.user_id);
                console.log('Wallet:', authData.wallet_address);
                console.log('Network:', getNetworkName(chain));

                alert(`Successfully authenticated!\nWallet: ${formatAddress(authData.wallet_address)}`);
            }
        } catch (error) {
            console.error('Authentication error:', error);
            alert(`Authentication failed: ${error.message}`);
        } finally {
            setIsConnecting(false);
        }
    };

    // Logout and disconnect wallet
    const handleLogout = () => {
        logout();
        setAuthUser(null);
        setWalletAddress(null);
        setChainId(null);
        alert('Logged out successfully');
    };

    const handleAddProduct = async (productData) => {
        // The AddProductForm now handles the entire blockchain transaction flow
        // This callback is called after successful listing creation
        console.log('Listing created successfully:', productData);
        setShowAddForm(false);
        loadProducts(); // Refresh the product list
    };

    const handleWatchClick = (product) => {
        // Close any open modals before showing product detail
        setShowMyProducts(false);
        setShowMyPurchases(false);
        setSelectedProduct(product);
    };

    const handleBuyClick = (product) => {
        // Close any open modals before showing product detail
        setShowMyProducts(false);
        setShowMyPurchases(false);
        setSelectedProduct(product);
    };

    const handleCloseProductDetail = () => {
        setSelectedProduct(null);
    };

    const handlePurchaseSuccess = () => {
        // Reload products list to reflect that the purchased item is no longer available
        loadProducts(searchQuery.trim() ? { search: searchQuery } : {});
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
                    {authUser && walletAddress && (
                        <div className="user-info">
                            Connected: {formatAddress(walletAddress)}
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
                    {!authUser ? (
                        <button
                            className="login-btn"
                            onClick={handleConnectWallet}
                            disabled={isConnecting}
                        >
                            {isConnecting ? 'Connecting...' : 'Connect Wallet & Login'}
                        </button>
                    ) : (
                        <>
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
                                    onClick={handleLogout}
                                >
                                    Logout
                                </button>
                            </div>
                            <button
                                className="my-products-btn"
                                onClick={() => setShowMyProducts(true)}
                            >
                                My Products
                            </button>
                            <button
                                className="my-products-btn"
                                onClick={() => setShowMyPurchases(true)}
                            >
                                My Purchases
                            </button>
                            <button
                                className="sell-btn"
                                onClick={() => setShowAddForm(true)}
                            >
                                Sell
                            </button>
                        </>
                    )}
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
                            onBuyClick={handleBuyClick}
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
                    onPurchaseSuccess={handlePurchaseSuccess}
                />
            )}

            {showMyProducts && (
                <MyProductsModal
                    onClose={() => setShowMyProducts(false)}
                    authUser={authUser}
                    onProductClick={handleWatchClick}
                />
            )}

            {showMyPurchases && (
                <MyPurchasesModal
                    onClose={() => setShowMyPurchases(false)}
                    authUser={authUser}
                    onProductClick={handleWatchClick}
                />
            )}
        </div>
    );
}

export default App;
