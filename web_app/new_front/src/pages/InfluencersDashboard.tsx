import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, DollarSign, TrendingUp, Eye, MessageSquare, CheckCircle, Clock, XCircle, ChevronDown } from 'lucide-react';
import { Navbar } from '../components/navigation/Navbar';
import { Footer } from '../components/navigation/Footer';
import { GlassCard } from '../components/ui/GlassCard';

interface InfluencersDashboardProps {
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

interface Request {
  id: string;
  buyerName: string;
  buyerHandle: string;
  type: 'post' | 'repost' | 'views';
  amount: number;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: string;
}

// Mock data for demonstration
const mockRequests: Request[] = [
  {
    id: '1',
    buyerName: 'TechStartup Inc',
    buyerHandle: 'techstartup',
    type: 'post',
    amount: 450,
    message: 'Would love a post about our new AI product launch!',
    status: 'pending',
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    buyerName: 'Crypto Exchange',
    buyerHandle: 'cryptoexchange',
    type: 'repost',
    amount: 180,
    message: 'Please repost our announcement tweet',
    status: 'pending',
    timestamp: '5 hours ago',
  },
  {
    id: '3',
    buyerName: 'Fashion Brand',
    buyerHandle: 'fashionbrand',
    type: 'post',
    amount: 650,
    message: 'Interested in a collaboration post for our summer collection',
    status: 'accepted',
    timestamp: '1 day ago',
  },
  {
    id: '4',
    buyerName: 'Gaming Studio',
    buyerHandle: 'gamingstudio',
    type: 'views',
    amount: 320,
    message: 'Looking for view boost on our game trailer',
    status: 'declined',
    timestamp: '2 days ago',
  },
];

const stats = [
  { label: 'Total Earnings', value: '$12,450', icon: DollarSign, color: '#22D3EE' },
  { label: 'Active Campaigns', value: '8', icon: TrendingUp, color: '#1D9BF0' },
  { label: 'Total Views', value: '2.4M', icon: Eye, color: '#22D3EE' },
  { label: 'Pending Requests', value: '5', icon: Clock, color: '#9CA3AF' },
];

const categories = ['Technology', 'Crypto', 'Fitness', 'Gaming', 'Design', 'Fashion', 'Food', 'Travel', 'Business', 'Lifestyle'];

export function InfluencersDashboard({ 
  onBack,
  isLoggedIn = false,
  user,
  onProfileClick,
  onDashboardClick,
  onLogout,
  onLoginClick,
  onSignUpClick
}: InfluencersDashboardProps) {
  const [requests, setRequests] = useState(mockRequests);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Technology']);

  const handleRequest = (requestId: string, action: 'accept' | 'decline') => {
    setRequests(requests.map(req => 
      req.id === requestId 
        ? { ...req, status: action === 'accept' ? 'accepted' : 'declined' }
        : req
    ));
  };

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      // Don't allow removing if it's the only selected category
      if (selectedCategories.length === 1) {
        return; // Must have at least 1 category
      }
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      // Don't allow adding more than 3 categories
      if (selectedCategories.length >= 3) {
        return; // Maximum 3 categories
      }
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const filteredRequests = requests.filter(req => 
    activeTab === 'all' || req.status === activeTab
  );

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
            <h1 className="text-[#E5E7EB] mb-4" style={{ fontSize: '2.5rem', fontWeight: 600 }}>
              Influencer Dashboard
            </h1>
            <p className="text-[#9CA3AF]" style={{ fontSize: '1.125rem' }}>
              Manage your promotions and track earnings
            </p>
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

          {/* Pricing Settings */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h2 className="text-[#E5E7EB] mb-6" style={{ fontSize: '1.5rem', fontWeight: 600 }}>
              Your Pricing
            </h2>
            <GlassCard className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="block text-[#9CA3AF] mb-2">Price per Post</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">$</span>
                    <input
                      type="number"
                      defaultValue="450"
                      className="w-full pl-8 pr-4 py-3 rounded-xl glass-card text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] transition-all duration-200"
                      style={{ minHeight: '48px' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#9CA3AF] mb-2">Price per Repost</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">$</span>
                    <input
                      type="number"
                      defaultValue="180"
                      className="w-full pl-8 pr-4 py-3 rounded-xl glass-card text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] transition-all duration-200"
                      style={{ minHeight: '48px' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#9CA3AF] mb-2">Bonus per 10K Views</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">$</span>
                    <input
                      type="number"
                      defaultValue="25"
                      className="w-full pl-8 pr-4 py-3 rounded-xl glass-card text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] transition-all duration-200"
                      style={{ minHeight: '48px' }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <motion.button
                  className="px-8 py-3 rounded-xl bg-[#1D9BF0] text-white hover:bg-[#1a8cd8] transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ minHeight: '48px' }}
                >
                  Update Pricing
                </motion.button>
              </div>
            </GlassCard>
          </motion.div>

          {/* Categories Section */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            <h2 className="text-[#E5E7EB] mb-6" style={{ fontSize: '1.5rem', fontWeight: 600 }}>
              Your Categories
            </h2>
            <GlassCard className="p-8">
              <p className="text-[#9CA3AF] mb-4">
                Select 1 to 3 categories that best describe your content. This helps buyers find you.
              </p>
              <div className="flex flex-wrap gap-3">
                {categories.map((category) => (
                  <motion.button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                      selectedCategories.includes(category)
                        ? 'bg-[#1D9BF0] text-white'
                        : 'glass-card text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-white/10'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {category}
                  </motion.button>
                ))}
              </div>
              <div className="mt-6 flex justify-between items-center">
                <p className="text-[#9CA3AF] text-sm">
                  {selectedCategories.length} {selectedCategories.length === 1 ? 'category' : 'categories'} selected (min: 1, max: 3)
                </p>
                <motion.button
                  className="px-8 py-3 rounded-xl bg-[#1D9BF0] text-white hover:bg-[#1a8cd8] transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ minHeight: '48px' }}
                >
                  Update Categories
                </motion.button>
              </div>
            </GlassCard>
          </motion.div>

          {/* Requests Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[#E5E7EB]" style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                Promotion Requests
              </h2>
              
              {/* Tab Filters */}
              <div className="flex gap-2">
                {(['all', 'pending', 'accepted', 'declined'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 capitalize ${
                      activeTab === tab
                        ? 'bg-[#1D9BF0] text-white'
                        : 'text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-white/5'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <GlassCard key={request.id} className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-[#E5E7EB]" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                          {request.buyerName}
                        </h3>
                        <span className="text-[#9CA3AF]" style={{ fontSize: '0.875rem' }}>
                          @{request.buyerHandle}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          request.status === 'pending'
                            ? 'bg-[#9CA3AF]/20 text-[#9CA3AF]'
                            : request.status === 'accepted'
                            ? 'bg-[#22D3EE]/20 text-[#22D3EE]'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                          <MessageSquare size={14} className="text-[#22D3EE]" />
                          <span className="text-[#E5E7EB] capitalize" style={{ fontSize: '0.875rem' }}>
                            {request.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                          <DollarSign size={14} className="text-[#1D9BF0]" />
                          <span className="text-[#E5E7EB]" style={{ fontSize: '0.875rem' }}>
                            ${request.amount}
                          </span>
                        </div>
                        <span className="text-[#9CA3AF]" style={{ fontSize: '0.75rem' }}>
                          {request.timestamp}
                        </span>
                      </div>

                      <p className="text-[#9CA3AF]" style={{ fontSize: '0.875rem' }}>
                        {request.message}
                      </p>
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <motion.button
                          onClick={() => handleRequest(request.id, 'accept')}
                          className="px-4 py-2 rounded-lg bg-[#1D9BF0] text-white hover:bg-[#1a8cd8] transition-all duration-200 flex items-center gap-2"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <CheckCircle size={16} />
                          Accept
                        </motion.button>
                        <motion.button
                          onClick={() => handleRequest(request.id, 'decline')}
                          className="px-4 py-2 rounded-lg bg-white/10 text-[#E5E7EB] hover:bg-white/15 transition-all duration-200 flex items-center gap-2"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <XCircle size={16} />
                          Decline
                        </motion.button>
                      </div>
                    )}
                  </div>
                </GlassCard>
              ))}

              {filteredRequests.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-[#9CA3AF]" style={{ fontSize: '1.125rem' }}>
                    No {activeTab !== 'all' ? activeTab : ''} requests
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