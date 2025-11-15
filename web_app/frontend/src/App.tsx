import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { InfluencerHome } from './pages/InfluencerHome';
import { AllCampaigns } from './pages/AllCampaigns';
import { Login } from './pages/Login';
import { AdvertiserDashboard } from './pages/AdvertiserDashboard';

interface UserData {
  username: string;
  email?: string;
  profileImage?: string;
  wallets: { address: string; isPrimary: boolean }[];
  accountType?: 'influencer' | 'advertiser';
  onboardingComplete?: boolean;
}

export default function App() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserData>({
    username: 'User',
    email: '',
    profileImage: '',
    wallets: [],
    accountType: 'advertiser',
    onboardingComplete: true,
  });

  // Check auth on mount
  useEffect(() => {
    const walletAddress = localStorage.getItem('wallet_address');
    const authToken = localStorage.getItem('auth_token');
    if (walletAddress && authToken) {
      setIsLoggedIn(true);
      setUser(prev => ({
        ...prev,
        username: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
        wallets: [{ address: walletAddress, isPrimary: true }],
      }));
    }
  }, []);

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('auth_token');
    navigate('/');
  };

  const handleLoginSuccess = () => {
    const walletAddress = localStorage.getItem('wallet_address') || '';
    setIsLoggedIn(true);
    setUser(prev => ({
      ...prev,
      username: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
      wallets: [{ address: walletAddress, isPrimary: true }],
    }));
    navigate('/');
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <InfluencerHome
            onAllCampaignsClick={() => navigate('/products')}
            isLoggedIn={isLoggedIn}
            user={user}
            onProfileClick={() => navigate('/profile')}
            onDashboardClick={() => navigate('/dashboard')}
            onLogout={handleLogout}
            onLoginClick={() => navigate('/login')}
            onSignUpClick={() => navigate('/login')}
            onBuyInteractionClick={() => navigate('/products')}
          />
        }
      />

      <Route
        path="/products"
        element={
          <AllCampaigns
            onBack={() => navigate('/')}
            isLoggedIn={isLoggedIn}
            user={user}
            onProfileClick={() => navigate('/profile')}
            onDashboardClick={() => navigate('/dashboard')}
            onLogout={handleLogout}
            onLoginClick={() => navigate('/login')}
            onSignUpClick={() => navigate('/login')}
            onBuyInteractionClick={() => navigate('/products')}
          />
        }
      />

      <Route
        path="/login"
        element={
          <Login
            onBack={() => navigate('/')}
            onLoginSuccess={handleLoginSuccess}
            onSignUpClick={() => navigate('/login')}
            onJoinCampaignClick={() => navigate('/products')}
            onBuyInteractionClick={() => navigate('/products')}
          />
        }
      />

      <Route
        path="/dashboard"
        element={
          <AdvertiserDashboard
            onBack={() => navigate('/')}
            isLoggedIn={isLoggedIn}
            user={user}
            onProfileClick={() => navigate('/profile')}
            onDashboardClick={() => navigate('/dashboard')}
            onLogout={handleLogout}
            onLoginClick={() => navigate('/login')}
            onSignUpClick={() => navigate('/login')}
          />
        }
      />
    </Routes>
  );
}
