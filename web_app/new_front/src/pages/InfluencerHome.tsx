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

// Mock campaign data
const mockCampaigns: CampaignData[] = [
  {
    id: '1',
    title: 'New AI Product Launch',
    advertiser: 'TechStartup Inc',
    budget: 5000,
    reach: 1000000,
    type: 'post',
    categories: ['Technology', 'Business'],
    deadline: '2025-12-15',
    description: 'Looking for tech influencers to promote our revolutionary AI assistant',
    image: 'https://images.unsplash.com/photo-1550959087-f655e48c2b8d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBSSUyMHRlY2hub2xvZ3klMjBwcm9kdWN0fGVufDF8fHx8MTc2MjkzNjQ3OHww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: '2',
    title: 'Crypto Exchange Promo',
    advertiser: 'CryptoExchange',
    budget: 8500,
    reach: 2000000,
    type: 'both',
    categories: ['Crypto', 'Finance'],
    deadline: '2025-12-01',
    description: 'Seeking crypto enthusiasts to share our new trading platform features',
    image: 'https://images.unsplash.com/photo-1744473755637-e09f0c2fab41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcnlwdG9jdXJyZW5jeSUyMGV4Y2hhbmdlfGVufDF8fHx8MTc2Mjg1NzA1M3ww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: '3',
    title: 'Gaming Tournament',
    advertiser: 'Gaming Studio',
    budget: 6200,
    reach: 1500000,
    type: 'post',
    categories: ['Gaming'],
    deadline: '2025-12-20',
    description: 'Promote our upcoming esports tournament with exclusive content',
    image: 'https://images.unsplash.com/photo-1759701546851-1d903ac1a2e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYW1pbmclMjB0b3VybmFtZW50JTIwZXNwb3J0c3xlbnwxfHx8fDE3NjI4OTQ3MzR8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: '4',
    title: 'Fitness App Launch',
    advertiser: 'FitTech',
    budget: 4200,
    reach: 800000,
    type: 'repost',
    categories: ['Fitness', 'Lifestyle'],
    deadline: '2025-11-30',
    description: 'Help us spread the word about our new AI-powered fitness coaching app',
    image: 'https://images.unsplash.com/photo-1748280621226-91f9530fc329?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwYXBwJTIwd29ya291dHxlbnwxfHx8fDE3NjI4MzA3ODB8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: '5',
    title: 'Fashion Brand Collab',
    advertiser: 'UrbanStyle',
    budget: 7500,
    reach: 1200000,
    type: 'both',
    categories: ['Fashion', 'Lifestyle'],
    deadline: '2025-12-10',
    description: 'Partner with us to showcase our sustainable fashion collection',
    image: 'https://images.unsplash.com/photo-1665702860632-4dfcd4b2d869?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc3VzdGFpbmFibGUlMjBjbG90aGluZ3xlbnwxfHx8fDE3NjI5MzY0Nzl8MA&ixlib=rb-4.1.0&q=80&w=1080',
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