import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, DollarSign, Users, TrendingUp, Target, Plus, Calendar, ChevronDown } from 'lucide-react';
import { Navbar } from '../components/navigation/Navbar';
import { Footer } from '../components/navigation/Footer';
import { GlassCard } from '../components/ui/GlassCard';

interface AdvertiserDashboardProps {
  onBack: () => void;
  isLoggedIn?: boolean;
  user?: {
    username: string;
    profileImage?: string;
  };
  onProfileClick?: () => void;
  onDashboardClick?: () => void;
  onLogout?: () => void;
  onLoginClick?: () => void;
  onSignUpClick?: () => void;
}

interface Campaign {
  id: string;
  title: string;
  type: 'post' | 'repost';
  budget: number;
  spent: number;
  influencersApplied: number;
  influencersAccepted: number;
  totalViews: number;
  status: 'active' | 'paused' | 'completed';
  endDate: string;
}

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    title: 'AI Product Launch Campaign',
    type: 'post',
    budget: 5000,
    spent: 2800,
    influencersApplied: 24,
    influencersAccepted: 8,
    totalViews: 1200000,
    status: 'active',
    endDate: '2025-12-15',
  },
  {
    id: '2',
    title: 'Crypto Exchange Awareness',
    type: 'repost',
    budget: 3000,
    spent: 3000,
    influencersApplied: 15,
    influencersAccepted: 15,
    totalViews: 800000,
    status: 'completed',
    endDate: '2025-11-01',
  },
  {
    id: '3',
    title: 'Summer Collection Promo',
    type: 'post',
    budget: 7500,
    spent: 0,
    influencersApplied: 0,
    influencersAccepted: 0,
    totalViews: 0,
    status: 'paused',
    endDate: '2026-01-20',
  },
];

const stats = [
  { label: 'Total Budget', value: '$15,500', icon: DollarSign, color: '#1D9BF0' },
  { label: 'Active Campaigns', value: '1', icon: TrendingUp, color: '#22D3EE' },
  { label: 'Total Influencers', value: '23', icon: Users, color: '#1D9BF0' },
  { label: 'Total Reach', value: '2.0M', icon: Target, color: '#22D3EE' },
];

export function AdvertiserDashboard({
  onBack,
  isLoggedIn = false,
  user,
  onProfileClick,
  onDashboardClick,
  onLogout,
  onLoginClick,
  onSignUpClick,
}: AdvertiserDashboardProps) {
  const [campaigns, setCampaigns] = useState(mockCampaigns);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    type: 'post' as 'post' | 'repost',
    budget: 0,
    description: '',
  });

  const handleCreateCampaign = () => {
    // Mock campaign creation
    alert('Campaign created! (This is a demo)');
    setShowCreateCampaign(false);
    setNewCampaign({ title: '', type: 'post', budget: 0, description: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1220] to-[#0F172A]">
      <Navbar
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
          {/* Back Button */}
          <motion.button
            onClick={onBack}
            className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#1D9BF0] mb-8 transition-colors duration-200"
            whileHover={{ x: -4 }}
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </motion.button>

          {/* Header */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[#E5E7EB] mb-4" style={{ fontSize: '2.5rem', fontWeight: 600 }}>
                  Advertiser Dashboard
                </h1>
                <p className="text-[#9CA3AF]" style={{ fontSize: '1.125rem' }}>
                  Create campaigns and manage your X promotions
                </p>
              </div>
              <motion.button
                onClick={() => setShowCreateCampaign(!showCreateCampaign)}
                className="px-6 py-3 rounded-xl bg-[#1D9BF0] text-white hover:bg-[#1a8cd8] transition-all duration-200 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ minHeight: '48px' }}
              >
                <Plus size={20} />
                Create Campaign
              </motion.button>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 rounded-xl bg-white/5">
                      <stat.icon size={24} style={{ color: stat.color }} />
                    </div>
                  </div>
                  <p className="text-[#9CA3AF] mb-1" style={{ fontSize: '0.875rem' }}>
                    {stat.label}
                  </p>
                  <p className="text-[#E5E7EB]" style={{ fontSize: '1.75rem', fontWeight: 600 }}>
                    {stat.value}
                  </p>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Create Campaign Form */}
          {showCreateCampaign && (
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <GlassCard className="p-8">
                <h2 className="text-[#E5E7EB] mb-6" style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                  Create New Campaign
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[#9CA3AF] mb-2">Campaign Title</label>
                    <input
                      type="text"
                      value={newCampaign.title}
                      onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                      placeholder="e.g., Summer Sale Promotion"
                      className="w-full px-4 py-3 rounded-xl glass-card text-[#E5E7EB] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] transition-all duration-200"
                      style={{ minHeight: '48px' }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[#9CA3AF] mb-2">Campaign Type</label>
                      <div className="relative">
                        <select
                          value={newCampaign.type}
                          onChange={(e) => setNewCampaign({ ...newCampaign, type: e.target.value as 'post' | 'repost' })}
                          className="w-full px-4 py-3 rounded-xl glass-card text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] transition-all duration-200 appearance-none cursor-pointer"
                          style={{ minHeight: '48px' }}
                        >
                          <option value="post">Post</option>
                          <option value="repost">Repost</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[#9CA3AF] mb-2">Total Budget</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">$</span>
                        <input
                          type="number"
                          value={newCampaign.budget || ''}
                          onChange={(e) => setNewCampaign({ ...newCampaign, budget: Number(e.target.value) })}
                          placeholder="0"
                          className="w-full pl-8 pr-4 py-3 rounded-xl glass-card text-[#E5E7EB] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] transition-all duration-200"
                          style={{ minHeight: '48px' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#9CA3AF] mb-2">Campaign Description</label>
                    <textarea
                      value={newCampaign.description}
                      onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                      placeholder="Describe what you want influencers to post about..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl glass-card text-[#E5E7EB] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] transition-all duration-200 resize-none"
                    />
                  </div>

                  <div className="flex gap-3 justify-end">
                    <motion.button
                      onClick={() => setShowCreateCampaign(false)}
                      className="px-6 py-3 rounded-xl text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-white/5 transition-all duration-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={handleCreateCampaign}
                      className="px-8 py-3 rounded-xl bg-[#1D9BF0] text-white hover:bg-[#1a8cd8] transition-all duration-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{ minHeight: '48px' }}
                    >
                      Create Campaign
                    </motion.button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Campaigns List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h2 className="text-[#E5E7EB] mb-6" style={{ fontSize: '1.5rem', fontWeight: 600 }}>
              Your Campaigns
            </h2>

            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <GlassCard key={campaign.id} className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-[#E5E7EB]" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                          {campaign.title}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs ${
                            campaign.status === 'active'
                              ? 'bg-[#22D3EE]/20 text-[#22D3EE]'
                              : campaign.status === 'completed'
                              ? 'bg-[#9CA3AF]/20 text-[#9CA3AF]'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {campaign.status}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs bg-[#1D9BF0]/20 text-[#1D9BF0] capitalize">
                          {campaign.type}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        <div>
                          <p className="text-[#9CA3AF] text-xs mb-1">Budget</p>
                          <p className="text-[#E5E7EB]">${campaign.budget.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[#9CA3AF] text-xs mb-1">Spent</p>
                          <p className="text-[#E5E7EB]">${campaign.spent.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[#9CA3AF] text-xs mb-1">Influencers</p>
                          <p className="text-[#E5E7EB]">
                            {campaign.influencersAccepted}/{campaign.influencersApplied}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#9CA3AF] text-xs mb-1">Total Views</p>
                          <p className="text-[#E5E7EB]">
                            {campaign.totalViews >= 1000000
                              ? (campaign.totalViews / 1000000).toFixed(1) + 'M'
                              : (campaign.totalViews / 1000).toFixed(0) + 'K'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#9CA3AF] text-xs mb-1">End Date</p>
                          <p className="text-[#E5E7EB] flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(campaign.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[#9CA3AF] text-xs">Budget Progress</span>
                          <span className="text-[#9CA3AF] text-xs">
                            {campaign.budget > 0 ? Math.round((campaign.spent / campaign.budget) * 100) : 0}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#1D9BF0] to-[#22D3EE] rounded-full transition-all duration-500"
                            style={{
                              width: `${campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <motion.button
                        className="px-4 py-2 rounded-lg bg-[#1D9BF0] text-white hover:bg-[#1a8cd8] transition-all duration-200 text-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        View Details
                      </motion.button>
                      {campaign.status === 'active' && (
                        <motion.button
                          className="px-4 py-2 rounded-lg bg-white/10 text-[#E5E7EB] hover:bg-white/15 transition-all duration-200 text-sm"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Pause
                        </motion.button>
                      )}
                      {campaign.status === 'paused' && (
                        <motion.button
                          className="px-4 py-2 rounded-lg bg-[#22D3EE] text-white hover:bg-[#1fb8d1] transition-all duration-200 text-sm"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Resume
                        </motion.button>
                      )}
                    </div>
                  </div>
                </GlassCard>
              ))}

              {campaigns.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-[#9CA3AF]" style={{ fontSize: '1.125rem' }}>
                    No campaigns yet. Create your first campaign to get started!
                  </p>
                </div>
              )}
            </div>
          </motion.div>
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
        }
      `}</style>
    </div>
  );
}
