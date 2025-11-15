import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, ChevronRight } from 'lucide-react';
import { Navbar } from './components/navigation/Navbar';
import { Footer } from './components/navigation/Footer';
import { InfluencerCard, InfluencerData } from './components/influencer/InfluencerCard';
import { InfluencerDetailModal } from './components/influencer/InfluencerDetailModal';
import { InfluencersDirectory } from './pages/InfluencersDirectory';
import { OnboardingCTA } from './pages/OnboardingCTA';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { Profile } from './pages/Profile';
import { InfluencersDashboard } from './pages/InfluencersDashboard';
import { AdvertiserDashboard } from './pages/AdvertiserDashboard';
import { OnboardingForm } from './pages/OnboardingForm';
import { InfluencerHome } from './pages/InfluencerHome';
import { AllCampaigns } from './pages/AllCampaigns';
import { GlassCard } from './components/ui/GlassCard';

// Mock influencer data
const mockInfluencers: InfluencerData[] = [
  {
    id: '1',
    username: 'TechNova',
    handle: 'technova',
    followers: 2500000,
    following: 1200,
    pricePost: 450,
    priceRepost: 180,
    perViewsBonus: { amount: 25, per: 10000 },
    profileImage: 'https://images.unsplash.com/photo-1758272422316-9d068810052d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNoJTIwaW5mbHVlbmNlciUyMHdvcmtzcGFjZXxlbnwxfHx8fDE3NjI3OTA4NDV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Technology',
  },
  {
    id: '2',
    username: 'CryptoWhale',
    handle: 'cryptowhale',
    followers: 3200000,
    following: 850,
    pricePost: 650,
    priceRepost: 250,
    perViewsBonus: { amount: 30, per: 10000 },
    profileImage: 'https://images.unsplash.com/photo-1550851067-48d3dd68842e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBtaW5pbWFsJTIwYWJzdHJhY3R8ZW58MXx8fHwxNzYyNzkwODQ1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Crypto',
  },
  {
    id: '3',
    username: 'FitLifeGuru',
    handle: 'fitlifeguru',
    followers: 1800000,
    following: 2500,
    pricePost: 380,
    priceRepost: 150,
    profileImage: 'https://images.unsplash.com/photo-1613759612065-d5971d32ca49?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdCUyMHdvcmtzcGFjZXxlbnwxfHx8fDE3NjI3MDQ0OTV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Fitness',
  },
  {
    id: '4',
    username: 'GamingPro',
    handle: 'gamingpro',
    followers: 4100000,
    following: 650,
    pricePost: 800,
    priceRepost: 320,
    perViewsBonus: { amount: 40, per: 10000 },
    profileImage: 'https://images.unsplash.com/photo-1694919123854-24b74b376da1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjBzZXR1cCUyMGRlc2t8ZW58MXx8fHwxNzYyNzkwODQ2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Gaming',
  },
  {
    id: '5',
    username: 'DesignMaven',
    handle: 'designmaven',
    followers: 1500000,
    following: 3200,
    pricePost: 320,
    priceRepost: 130,
    perViewsBonus: { amount: 20, per: 10000 },
    profileImage: 'https://images.unsplash.com/photo-1741466071728-cc5691bfb535?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMHdvcmtzcGFjZSUyMGxhcHRvcHxlbnwxfHx8fDE3NjI3Njk1OTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Design',
  },
];

type Page = 'home' | 'directory' | 'onboarding' | 'onboarding-form' | 'login' | 'signup' | 'profile' | 'influencers-dashboard' | 'advertiser-dashboard' | 'influencer-home' | 'all-campaigns';

interface UserData {
  username: string;
  email?: string;
  profileImage?: string;
  xAccount?: string;
  gmailAccount?: string;
  wallets: { address: string; isPrimary: boolean }[];
  accountType?: 'influencer' | 'advertiser';
  onboardingComplete?: boolean;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string>('');
  const [user, setUser] = useState<UserData>({
    username: 'JohnDoe',
    email: 'john@example.com',
    profileImage: '',
    xAccount: '',
    gmailAccount: '',
    wallets: [],
    accountType: undefined,
    onboardingComplete: false,
  });

  const handleDashboardClick = () => {
    if (!isLoggedIn) {
      setCurrentPage('login');
      return;
    }
    
    if (!user.onboardingComplete) {
      setCurrentPage('onboarding-form');
      return;
    }

    if (user.accountType === 'influencer') {
      setCurrentPage('influencers-dashboard');
    } else if (user.accountType === 'advertiser') {
      setCurrentPage('advertiser-dashboard');
    }
  };

  const handleInfluencersDashboardClick = () => {
    handleDashboardClick();
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage('home');
  };

  const handleUpdateProfile = (updatedUser: UserData) => {
    setUser(updatedUser);
  };

  if (currentPage === 'directory') {
    return (
      <InfluencersDirectory
        influencers={mockInfluencers}
        onBack={() => setCurrentPage('home')}
        isLoggedIn={isLoggedIn}
        user={user}
        onProfileClick={() => setCurrentPage('profile')}
        onDashboardClick={handleInfluencersDashboardClick}
        onLogout={handleLogout}
        onLoginClick={() => setCurrentPage('login')}
        onSignUpClick={() => setCurrentPage('signup')}
        onJoinCampaignClick={() => setCurrentPage('influencer-home')}
      />
    );
  }

  if (currentPage === 'onboarding') {
    return (
      <OnboardingCTA onBack={() => setCurrentPage('home')} />
    );
  }

  if (currentPage === 'login') {
    return (
      <Login 
        onBack={() => setCurrentPage('home')}
        onLoginSuccess={() => {
          setIsLoggedIn(true);
          setCurrentPage('onboarding-form');
        }}
        onSignUpClick={() => setCurrentPage('signup')}
        onJoinCampaignClick={() => setCurrentPage('directory')}
        onBuyInteractionClick={() => setCurrentPage('home')}
      />
    );
  }

  if (currentPage === 'signup') {
    return (
      <SignUp 
        onBack={() => setCurrentPage('home')}
        onSignUpSuccess={() => {
          setIsLoggedIn(true);
          setCurrentPage('onboarding-form');
        }}
        onLoginClick={() => setCurrentPage('login')}
        onJoinCampaignClick={() => setCurrentPage('directory')}
        onBuyInteractionClick={() => setCurrentPage('home')}
      />
    );
  }

  if (currentPage === 'onboarding-form') {
    return (
      <OnboardingForm 
        connectedWallet={connectedWallet}
        onComplete={(data) => {
          setUser({
            ...user,
            accountType: data.accountType,
            xAccount: data.xAccount,
            gmailAccount: data.gmailAccount,
            wallets: [{ address: data.walletAddress, isPrimary: true }],
            onboardingComplete: true,
          });
          
          if (data.accountType === 'influencer') {
            setCurrentPage('influencer-home');
          } else {
            setCurrentPage('home');
          }
        }}
      />
    );
  }

  if (currentPage === 'profile') {
    return (
      <Profile 
        onBack={() => setCurrentPage('home')}
        user={user}
        onUpdateProfile={handleUpdateProfile}
        onLogout={handleLogout}
        onDashboardClick={handleInfluencersDashboardClick}
      />
    );
  }

  if (currentPage === 'influencers-dashboard') {
    // Check if user has influencer access
    if (!isLoggedIn) {
      return (
        <Login 
          onBack={() => setCurrentPage('home')}
          onLoginSuccess={() => {
            setIsLoggedIn(true);
            setCurrentPage('onboarding-form');
          }}
        />
      );
    }

    if (!user.onboardingComplete) {
      return (
        <OnboardingForm 
          connectedWallet={connectedWallet}
          onComplete={(data) => {
            setUser({
              ...user,
              accountType: data.accountType,
              xAccount: data.xAccount,
              gmailAccount: data.gmailAccount,
              wallets: [{ address: data.walletAddress, isPrimary: true }],
              onboardingComplete: true,
            });
            
            if (data.accountType === 'influencer') {
              setCurrentPage('influencers-dashboard');
            } else {
              setCurrentPage('advertiser-dashboard');
            }
          }}
        />
      );
    }

    // If user is an advertiser, redirect to advertiser dashboard
    if (user.accountType === 'advertiser') {
      return (
        <AdvertiserDashboard 
          onBack={() => setCurrentPage('home')}
          isLoggedIn={isLoggedIn}
          user={user}
          onProfileClick={() => setCurrentPage('profile')}
          onDashboardClick={() => setCurrentPage('advertiser-dashboard')}
          onLogout={handleLogout}
          onLoginClick={() => setCurrentPage('login')}
          onSignUpClick={() => setCurrentPage('signup')}
        />
      );
    }

    return (
      <InfluencersDashboard 
        onBack={() => setCurrentPage('influencer-home')}
        isLoggedIn={isLoggedIn}
        user={user}
        onProfileClick={() => setCurrentPage('profile')}
        onDashboardClick={handleInfluencersDashboardClick}
        onLogout={handleLogout}
        onLoginClick={() => setCurrentPage('login')}
        onSignUpClick={() => setCurrentPage('signup')}
      />
    );
  }

  if (currentPage === 'advertiser-dashboard') {
    // Check if user has advertiser access
    if (!isLoggedIn) {
      return (
        <Login 
          onBack={() => setCurrentPage('home')}
          onLoginSuccess={() => {
            setIsLoggedIn(true);
            setCurrentPage('onboarding-form');
          }}
        />
      );
    }

    if (!user.onboardingComplete) {
      return (
        <OnboardingForm 
          connectedWallet={connectedWallet}
          onComplete={(data) => {
            setUser({
              ...user,
              accountType: data.accountType,
              xAccount: data.xAccount,
              gmailAccount: data.gmailAccount,
              wallets: [{ address: data.walletAddress, isPrimary: true }],
              onboardingComplete: true,
            });
            
            if (data.accountType === 'influencer') {
              setCurrentPage('influencers-dashboard');
            } else {
              setCurrentPage('advertiser-dashboard');
            }
          }}
        />
      );
    }

    // If user is an influencer, redirect to influencer dashboard
    if (user.accountType === 'influencer') {
      return (
        <InfluencersDashboard 
          onBack={() => setCurrentPage('home')}
          isLoggedIn={isLoggedIn}
          user={user}
          onProfileClick={() => setCurrentPage('profile')}
          onDashboardClick={handleInfluencersDashboardClick}
          onLogout={handleLogout}
          onLoginClick={() => setCurrentPage('login')}
          onSignUpClick={() => setCurrentPage('signup')}
        />
      );
    }

    return (
      <AdvertiserDashboard 
        onBack={() => setCurrentPage('home')}
        isLoggedIn={isLoggedIn}
        user={user}
        onProfileClick={() => setCurrentPage('profile')}
        onDashboardClick={() => setCurrentPage('advertiser-dashboard')}
        onLogout={handleLogout}
        onLoginClick={() => setCurrentPage('login')}
        onSignUpClick={() => setCurrentPage('signup')}
      />
    );
  }

  if (currentPage === 'influencer-home') {
    return (
      <InfluencerHome
        onAllCampaignsClick={() => setCurrentPage('all-campaigns')}
        isLoggedIn={isLoggedIn}
        user={user}
        onProfileClick={() => setCurrentPage('profile')}
        onDashboardClick={handleInfluencersDashboardClick}
        onLogout={handleLogout}
        onLoginClick={() => setCurrentPage('login')}
        onSignUpClick={() => setCurrentPage('signup')}
        onBuyInteractionClick={() => setCurrentPage('home')}
      />
    );
  }

  if (currentPage === 'all-campaigns') {
    return (
      <AllCampaigns
        onBack={() => setCurrentPage('influencer-home')}
        isLoggedIn={isLoggedIn}
        user={user}
        onProfileClick={() => setCurrentPage('profile')}
        onDashboardClick={handleInfluencersDashboardClick}
        onLogout={handleLogout}
        onLoginClick={() => setCurrentPage('login')}
        onSignUpClick={() => setCurrentPage('signup')}
        onBuyInteractionClick={() => setCurrentPage('home')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1220] to-[#0F172A]">
      <Navbar 
        onInfluencersClick={() => setCurrentPage('influencer-home')}
        onLoginClick={() => setCurrentPage('login')}
        onSignUpClick={() => setCurrentPage('signup')}
        isLoggedIn={isLoggedIn}
        user={user}
        onProfileClick={() => setCurrentPage('profile')}
        onDashboardClick={handleDashboardClick}
        onLogout={handleLogout}
      />
      
      <main className="pt-32 pb-16 px-20">
        <div className="max-w-[1440px] mx-auto">
          {/* Hero Section */}
          <motion.section 
            className="mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left - Text Content */}
              <div>
                <h1 className="text-[#E5E7EB] mb-6" style={{ fontSize: '3.5rem', fontWeight: 600, lineHeight: 1.2 }}>
                  Buy promotion from X influencers.
                </h1>
                <p className="text-[#9CA3AF]" style={{ fontSize: '1.25rem', lineHeight: 1.6 }}>
                  Connect with top X (Twitter) influencers. Pay for Posts, Reposts, or earn performance bonuses based on views.
                </p>
              </div>

              {/* Right - Hero Image */}
              <div className="relative">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <GlassCard className="p-8 overflow-hidden">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-[#1D9BF0]/20 to-[#22D3EE]/20 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#1D9BF0] to-[#22D3EE] flex items-center justify-center">
                          <span className="text-white" style={{ fontSize: '3rem', fontWeight: 600 }}>ON</span>
                        </div>
                        <p className="text-[#E5E7EB]" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                          Our Name
                        </p>
                        <p className="text-[#9CA3AF] mt-2">
                          X Ad Marketplace
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              </div>
            </div>
          </motion.section>

          {/* Top 5 Influencers Section */}
          <motion.section 
            className="mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Section Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[#E5E7EB]" style={{ fontSize: '2rem', fontWeight: 600 }}>
                Top 5 Influencers
              </h2>
              <motion.button
                onClick={() => setCurrentPage('directory')}
                className="flex items-center gap-2 text-[#1D9BF0] hover:text-[#22D3EE] transition-colors duration-200 group"
                whileHover={{ x: 4 }}
              >
                <span style={{ fontWeight: 500 }}>See All</span>
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform duration-200" />
              </motion.button>
            </div>

            {/* Desktop - 5 Cards in a Row */}
            <div className="hidden lg:grid lg:grid-cols-5 gap-6">
              {mockInfluencers.map((influencer, index) => (
                <motion.div
                  key={influencer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                >
                  <InfluencerCard
                    influencer={influencer}
                    onClick={() => setSelectedInfluencer(influencer)}
                  />
                </motion.div>
              ))}
            </div>

            {/* Tablet - 2 Cards Carousel */}
            <div className="hidden md:block lg:hidden overflow-x-auto snap-x snap-mandatory scrollbar-hide">
              <div className="flex gap-6 pb-4" style={{ width: 'max-content' }}>
                {mockInfluencers.map((influencer) => (
                  <div key={influencer.id} className="w-[400px] snap-start">
                    <InfluencerCard
                      influencer={influencer}
                      onClick={() => setSelectedInfluencer(influencer)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile - 1 Card Carousel */}
            <div className="block md:hidden overflow-x-auto snap-x snap-mandatory scrollbar-hide">
              <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
                {mockInfluencers.map((influencer) => (
                  <div key={influencer.id} className="w-[320px] snap-start">
                    <InfluencerCard
                      influencer={influencer}
                      onClick={() => setSelectedInfluencer(influencer)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* CTA for Influencers */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <GlassCard className="p-12 text-center overflow-hidden relative">
              {/* Background Decorative Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#1D9BF0]/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#22D3EE]/10 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <h2 className="text-[#E5E7EB] mb-4" style={{ fontSize: '2.5rem', fontWeight: 600 }}>
                  Are you an Influencer?
                </h2>
                <p className="text-[#9CA3AF] mb-8 max-w-2xl mx-auto" style={{ fontSize: '1.125rem' }}>
                  Create your profile, set your rates, and start earning from your X presence.
                </p>
                <motion.button
                  onClick={handleInfluencersDashboardClick}
                  className="px-8 py-4 rounded-xl bg-[#1D9BF0] text-white hover:bg-[#1a8cd8] transition-all duration-200 shadow-lg shadow-[#1D9BF0]/25"
                  whileHover={{ scale: 1.05, boxShadow: '0 12px 24px rgba(29, 155, 240, 0.35)' }}
                  whileTap={{ scale: 0.98 }}
                  style={{ fontSize: '1.125rem', fontWeight: 600, minHeight: '56px' }}
                >
                  Yes, I am
                </motion.button>
              </div>
            </GlassCard>
          </motion.section>
        </div>
      </main>

      <Footer />

      {/* Influencer Detail Modal */}
      <InfluencerDetailModal
        influencer={selectedInfluencer}
        isOpen={selectedInfluencer !== null}
        onClose={() => setSelectedInfluencer(null)}
      />

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 1024px) {
          main {
            padding-left: 72px;
            padding-right: 72px;
          }
        }
        @media (max-width: 768px) {
          main {
            padding-left: 16px;
            padding-right: 16px;
          }
          h1 {
            font-size: 2.5rem !important;
          }
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}