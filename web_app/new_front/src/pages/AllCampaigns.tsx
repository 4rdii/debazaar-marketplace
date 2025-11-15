import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, DollarSign, Users, Calendar, Search, Filter, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Navbar } from '../components/navigation/Navbar';
import { Footer } from '../components/navigation/Footer';
import { GlassCard } from '../components/ui/GlassCard';
import { CampaignCard, CampaignData } from '../components/campaign/CampaignCard';
import { CampaignDetailModal } from '../components/campaign/CampaignDetailModal';
import { DualRangeSlider } from '../components/ui/DualRangeSlider';

interface AllCampaignsProps {
  onBack: () => void;
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

interface Campaign {
  id: string;
  title: string;
  advertiser: string;
  budget: number;
  reach: number;
  type: 'post' | 'repost' | 'both';
  categories: string[];
  deadline: string;
  description: string;
}

// Extended mock campaign data
const allCampaigns: CampaignData[] = [
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
    categories: ['Crypto'],
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
  {
    id: '6',
    title: 'Food Delivery Service',
    advertiser: 'QuickEats',
    budget: 3800,
    reach: 600000,
    type: 'post',
    categories: ['Food', 'Lifestyle'],
    deadline: '2025-12-05',
    description: 'Share the convenience of our 15-minute food delivery service',
    image: 'https://images.unsplash.com/photo-1760709758484-4ccff92a6aec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kJTIwZGVsaXZlcnklMjBzZXJ2aWNlfGVufDF8fHx8MTc2MjkzNjUxNnww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: '7',
    title: 'Travel Destination Guide',
    advertiser: 'TravelWorld',
    budget: 5500,
    reach: 950000,
    type: 'both',
    categories: ['Travel'],
    deadline: '2025-12-18',
    description: 'Feature our exotic travel destinations in your content',
    image: 'https://images.unsplash.com/photo-1721908919568-4003760b6c7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBkZXN0aW5hdGlvbiUyMGJlYWNofGVufDF8fHx8MTc2Mjg3MjM1N3ww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: '8',
    title: 'Design Tool Launch',
    advertiser: 'CreativeHub',
    budget: 4600,
    reach: 750000,
    type: 'post',
    categories: ['Design', 'Technology'],
    deadline: '2025-11-28',
    description: 'Introduce our new collaborative design platform to your audience',
    image: 'https://images.unsplash.com/photo-1700887944225-f148dd124305?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNpZ24lMjBzb2Z0d2FyZSUyMGNyZWF0aXZlfGVufDF8fHx8MTc2Mjg3OTEwMnww&ixlib=rb-4.1.0&q=80&w=1080',
  },
];

const categories = ['All', 'Technology', 'Crypto', 'Fitness', 'Gaming', 'Design', 'Fashion', 'Food', 'Travel', 'Business', 'Lifestyle'];

type SortOption = 'budget-high' | 'budget-low' | 'reach-high' | 'reach-low' | 'deadline-soon' | 'deadline-later';

export function AllCampaigns({
  onBack,
  isLoggedIn = false,
  user,
  onProfileClick,
  onDashboardClick,
  onLogout,
  onLoginClick,
  onSignUpClick,
  onBuyInteractionClick,
}: AllCampaignsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignData | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 10000]);
  const [reachRange, setReachRange] = useState<[number, number]>([0, 2500000]);
  const [deadlineBefore, setDeadlineBefore] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('budget-high');

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const filteredCampaigns = allCampaigns
    .filter((campaign) => {
      const matchesSearch =
        campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.advertiser.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' || campaign.categories.includes(selectedCategory);

      const matchesBudget = campaign.budget >= budgetRange[0] && campaign.budget <= budgetRange[1];
      
      const matchesReach = campaign.reach >= reachRange[0] && campaign.reach <= reachRange[1];
      
      const matchesDeadline = !deadlineBefore || new Date(campaign.deadline) <= new Date(deadlineBefore);

      return matchesSearch && matchesCategory && matchesBudget && matchesReach && matchesDeadline;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'budget-high':
          return b.budget - a.budget;
        case 'budget-low':
          return a.budget - b.budget;
        case 'reach-high':
          return b.reach - a.reach;
        case 'reach-low':
          return a.reach - b.reach;
        case 'deadline-soon':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'deadline-later':
          return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
        default:
          return 0;
      }
    });

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
              All Campaigns
            </h1>
            <p className="text-[#9CA3AF]" style={{ fontSize: '1.125rem' }}>
              Browse and apply to campaigns that match your profile
            </p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            className="mb-8 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={20} />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 rounded-xl glass-card text-[#E5E7EB] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] transition-all duration-200"
                  style={{ minHeight: '56px' }}
                />
              </div>

              {/* Filter Toggle Button */}
              <motion.button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-6 py-4 rounded-xl glass-card text-[#E5E7EB] hover:bg-white/10 transition-all duration-200 flex items-center gap-2 ${
                  showFilters ? 'bg-white/10' : ''
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ minHeight: '56px' }}
              >
                <SlidersHorizontal size={20} />
                <span>Filters</span>
              </motion.button>
            </div>

            {/* Filters Panel */}
            <motion.div
              initial={false}
              animate={{
                height: showFilters ? 'auto' : 0,
                opacity: showFilters ? 1 : 0,
              }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <GlassCard className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                  {/* Row 1: Sort By (2 cols) | Category (2 cols) | Deadline (2 cols) */}
                  <div className="md:col-span-6 lg:col-span-2">
                    <label className="block text-[#9CA3AF] mb-2 text-sm">Sort By</label>
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="w-full px-4 py-3 rounded-xl glass-card text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] transition-all duration-200 appearance-none cursor-pointer"
                        style={{ minHeight: '48px' }}
                      >
                        <option value="budget-high">Budget (High to Low)</option>
                        <option value="budget-low">Budget (Low to High)</option>
                        <option value="reach-high">Reach (High to Low)</option>
                        <option value="reach-low">Reach (Low to High)</option>
                        <option value="deadline-soon">Deadline (Soonest)</option>
                        <option value="deadline-later">Deadline (Latest)</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                    </div>
                  </div>

                  <div className="md:col-span-6 lg:col-span-2">
                    <label className="block text-[#9CA3AF] mb-2 text-sm">Category</label>
                    <div className="relative">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl glass-card text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] transition-all duration-200 appearance-none cursor-pointer"
                        style={{ minHeight: '48px' }}
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                    </div>
                  </div>

                  <div className="md:col-span-6 lg:col-span-2">
                    <label className="block text-[#9CA3AF] mb-2 text-sm">
                      Deadline Before
                    </label>
                    <input
                      type="date"
                      value={deadlineBefore}
                      onChange={(e) => setDeadlineBefore(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl glass-card text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] transition-all duration-200"
                      style={{ minHeight: '48px' }}
                    />
                  </div>

                  {/* Row 2: Budget Range (3 cols) | Reach Range (3 cols) */}
                  <div className="md:col-span-6 lg:col-span-3">
                    <label className="block text-[#9CA3AF] mb-2 text-sm">
                      Budget Range: ${formatNumber(budgetRange[0])} - ${formatNumber(budgetRange[1])}
                    </label>
                    <DualRangeSlider
                      min={0}
                      max={10000}
                      step={500}
                      value={budgetRange}
                      onChange={setBudgetRange}
                      className="w-full accent-[#1D9BF0]"
                    />
                  </div>

                  <div className="md:col-span-6 lg:col-span-3">
                    <label className="block text-[#9CA3AF] mb-2 text-sm">
                      Reach: {formatNumber(reachRange[0])} - {formatNumber(reachRange[1])}
                    </label>
                    <DualRangeSlider
                      min={0}
                      max={2500000}
                      step={100000}
                      value={reachRange}
                      onChange={setReachRange}
                      className="w-full accent-[#1D9BF0]"
                    />
                  </div>
                </div>

                {/* Reset Filters */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setBudgetRange([0, 10000]);
                      setReachRange([0, 2500000]);
                      setDeadlineBefore('');
                      setSortBy('budget-high');
                    }}
                    className="px-4 py-2 rounded-lg text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-white/5 transition-all duration-200"
                  >
                    Reset Filters
                  </button>
                </div>
              </GlassCard>
            </motion.div>

            {/* Results Count */}
            <div className="flex items-center justify-between">
              <p className="text-[#9CA3AF]">
                Showing {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? 's' : ''}
              </p>
            </div>
          </motion.div>

          {/* Campaigns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
              >
                <CampaignCard
                  campaign={campaign}
                  onClick={() => setSelectedCampaign(campaign)}
                />
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {filteredCampaigns.length === 0 && (
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[#9CA3AF]" style={{ fontSize: '1.125rem' }}>
                No campaigns found. Try adjusting your filters.
              </p>
            </motion.div>
          )}
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

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <CampaignDetailModal
          campaign={selectedCampaign}
          isOpen={selectedCampaign !== null}
          onClose={() => setSelectedCampaign(null)}
        />
      )}
    </div>
  );
}