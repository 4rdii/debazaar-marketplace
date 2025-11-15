import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, DollarSign, Users, TrendingUp, Calendar } from 'lucide-react';
import { Navbar } from '../components/navigation/Navbar';
import { Footer } from '../components/navigation/Footer';
import { GlassCard } from '../components/ui/GlassCard';
import { CampaignCard, CampaignData } from '../components/campaign/CampaignCard';
import { CampaignDetailModal } from '../components/campaign/CampaignDetailModal';

interface InfluencerHomeProps {
  onAllCampaignsClick: () => void;
  isLoggedIn?: boolean;
  user?: {
    username: string;
    profileImage?: string;
    accountType?: 'influencer' | 'advertiser';
  };
  onProfileClick?: () => void;
  onDashboardClick?: () => void;
  onLogout?: () => void;
  onLoginClick?: () => void;
  onSignUpClick?: () => void;
  onBuyInteractionClick?: () => void;
}

// Mock product listings data
const mockCampaigns: CampaignData[] = [
  {
    id: '1',
    title: 'Premium AI Assistant License',
    description: 'Lifetime access to our revolutionary AI assistant software',
    price: 299,
    currency: 'USDC',
    image: 'https://images.unsplash.com/photo-1550959087-f655e48c2b8d?w=400',
    seller: { id: 1, username: 'TechStartup', rating: 4.9 },
    status: 'open',
    paymentMethod: 'escrow',
    escrowType: 'disputable',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Crypto Trading Bot Access',
    description: 'Advanced trading bot with backtested strategies',
    price: 450,
    currency: 'USDC',
    image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400',
    seller: { id: 2, username: 'CryptoTools', rating: 4.7 },
    status: 'open',
    paymentMethod: 'escrow',
    escrowType: 'api_approval',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Gaming Asset Pack',
    description: '3D models and textures for game development',
    price: 180,
    currency: 'USDC',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400',
    seller: { id: 3, username: 'GameAssets', rating: 5.0 },
    status: 'open',
    paymentMethod: 'escrow',
    escrowType: 'disputable',
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Fitness Training Program',
    description: 'AI-powered personalized workout and nutrition plans',
    price: 120,
    currency: 'USDC',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
    seller: { id: 4, username: 'FitCoach', rating: 4.8 },
    status: 'filled',
    paymentMethod: 'escrow',
    escrowType: 'disputable',
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'Digital Fashion Design Kit',
    description: 'Sustainable fashion design templates and resources',
    price: 250,
    currency: 'USDC',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400',
    seller: { id: 5, username: 'DesignStudio', rating: 4.6 },
    status: 'open',
    paymentMethod: 'escrow',
    escrowType: 'onchain_approval',
    createdAt: new Date().toISOString(),
  },
];

export function InfluencerHome({
  onAllCampaignsClick,
  isLoggedIn = false,
  user,
  onProfileClick,
  onDashboardClick,
  onLogout,
  onLoginClick,
  onSignUpClick,
  onBuyInteractionClick,
}: InfluencerHomeProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const [selectedCampaign, setSelectedCampaign] = useState<CampaignData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCampaignClick = (campaign: CampaignData) => {
    setSelectedCampaign(campaign);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1220] to-[#0F172A]">
      <Navbar
        showBuyInteraction={true}
        onBuyInteractionClick={onBuyInteractionClick} // This would redirect to advertiser home
        isLoggedIn={isLoggedIn}
        user={user}
        onProfileClick={onProfileClick}
        onDashboardClick={onDashboardClick}
        onLogout={onLogout}
        onLoginClick={onLoginClick}
        onSignUpClick={onSignUpClick}
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
                  Discover Your Next Campaign
                </h1>
                <p className="text-[#9CA3AF]" style={{ fontSize: '1.25rem', lineHeight: 1.6 }}>
                  Browse top campaigns from brands looking to collaborate with influencers like you.
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

          {/* Top 5 Campaigns Section */}
          <motion.section
            className="mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Section Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[#E5E7EB]" style={{ fontSize: '2rem', fontWeight: 600 }}>
                Top 5 Campaigns
              </h2>
              <motion.button
                onClick={onAllCampaignsClick}
                className="flex items-center gap-2 text-[#1D9BF0] hover:text-[#22D3EE] transition-colors duration-200 group"
                whileHover={{ x: 4 }}
              >
                <span style={{ fontWeight: 500 }}>See All</span>
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform duration-200" />
              </motion.button>
            </div>

            {/* Campaigns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {mockCampaigns.map((campaign, index) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                >
                  <CampaignCard campaign={campaign} onClick={() => handleCampaignClick(campaign)} />
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* CTA Section */}
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
                  Ready to Grow Your Earnings?
                </h2>
                <p className="text-[#9CA3AF] mb-8 max-w-2xl mx-auto" style={{ fontSize: '1.125rem' }}>
                  Manage your profile, set your rates, and track your performance.
                </p>
                <motion.button
                  onClick={onDashboardClick}
                  className="px-8 py-4 rounded-xl bg-[#1D9BF0] text-white hover:bg-[#1a8cd8] transition-all duration-200 shadow-lg shadow-[#1D9BF0]/25"
                  whileHover={{ scale: 1.05, boxShadow: '0 12px 24px rgba(29, 155, 240, 0.35)' }}
                  whileTap={{ scale: 0.98 }}
                  style={{ fontSize: '1.125rem', fontWeight: 600, minHeight: '56px' }}
                >
                  Go to Dashboard
                </motion.button>
              </div>
            </GlassCard>
          </motion.section>
        </div>
      </main>

      <Footer />

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
      `}</style>

      {/* Campaign Detail Modal */}
      <CampaignDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        campaign={selectedCampaign}
      />
    </div>
  );
}