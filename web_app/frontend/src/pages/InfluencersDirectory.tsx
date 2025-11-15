import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, ArrowLeft, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Navbar } from '../components/navigation/Navbar';
import { Footer } from '../components/navigation/Footer';
import { InfluencerCard, InfluencerData } from '../components/influencer/InfluencerCard';
import { InfluencerDetailModal } from '../components/influencer/InfluencerDetailModal';
import { GlassCard } from '../components/ui/GlassCard';
import { DualRangeSlider } from '../components/ui/DualRangeSlider';

interface InfluencersDirectoryProps {
  influencers: InfluencerData[];
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
  onJoinCampaignClick?: () => void;
}

type SortOption = 'followers-high' | 'followers-low' | 'price-high' | 'price-low';

// Standardized categories matching AllCampaigns
const categories = ['All', 'Technology', 'Crypto', 'Fitness', 'Gaming', 'Design', 'Fashion', 'Food', 'Travel', 'Business', 'Lifestyle'];

export function InfluencersDirectory({ 
  influencers, 
  onBack,
  isLoggedIn = false,
  user,
  onProfileClick,
  onDashboardClick,
  onLogout,
  onLoginClick,
  onSignUpClick,
  onJoinCampaignClick
}: InfluencersDirectoryProps) {
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [followerRange, setFollowerRange] = useState<[number, number]>([0, 5000000]);
  const [sortBy, setSortBy] = useState<SortOption>('followers-high');

  // Apply filters and sorting
  const filteredInfluencers = influencers
    .filter(inf => {
      // Search filter
      const matchesSearch = inf.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inf.handle.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      const matchesCategory = selectedCategory === 'All' || inf.category === selectedCategory;
      
      // Price filter (using post price)
      const matchesPrice = inf.pricePost >= priceRange[0] && inf.pricePost <= priceRange[1];
      
      // Follower filter
      const matchesFollowers = inf.followers >= followerRange[0] && inf.followers <= followerRange[1];
      
      return matchesSearch && matchesCategory && matchesPrice && matchesFollowers;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'followers-high':
          return b.followers - a.followers;
        case 'followers-low':
          return a.followers - b.followers;
        case 'price-high':
          return b.pricePost - a.pricePost;
        case 'price-low':
          return a.pricePost - b.pricePost;
        default:
          return 0;
      }
    });

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
        onInfluencersClick={onJoinCampaignClick}
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
          <div className="mb-12">
            <h1 className="text-[#E5E7EB] mb-4" style={{ fontSize: '2.5rem', fontWeight: 600 }}>
              All Influencers
            </h1>
            <p className="text-[#9CA3AF]" style={{ fontSize: '1.125rem' }}>
              Browse our complete directory of X influencers
            </p>
          </div>

          {/* Search and Filter Controls */}
          <div className="mb-8 space-y-4">
            <div className="flex gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={20} />
                <input
                  type="text"
                  placeholder="Search influencers or @handle"
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Sort By */}
                  <div>
                    <label className="block text-[#9CA3AF] mb-2 text-sm">Sort By</label>
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="w-full px-4 py-3 rounded-xl glass-card text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] transition-all duration-200 appearance-none cursor-pointer"
                        style={{ minHeight: '48px' }}
                      >
                        <option value="followers-high">Followers (High to Low)</option>
                        <option value="followers-low">Followers (Low to High)</option>
                        <option value="price-high">Price (High to Low)</option>
                        <option value="price-low">Price (Low to High)</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-[#9CA3AF] mb-2 text-sm">Category</label>
                    <div className="relative">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl glass-card text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] transition-all duration-200 appearance-none cursor-pointer capitalize"
                        style={{ minHeight: '48px' }}
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat} className="capitalize">{cat}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-[#9CA3AF] mb-2 text-sm">
                      Price Range: ${priceRange[0]} - ${priceRange[1]}
                    </label>
                    <DualRangeSlider
                      min={0}
                      max={1000}
                      step={50}
                      value={priceRange}
                      onChange={setPriceRange}
                      className="w-full"
                      thumbColors={['#1D9BF0', '#22D3EE']}
                    />
                  </div>

                  {/* Follower Range */}
                  <div>
                    <label className="block text-[#9CA3AF] mb-2 text-sm">
                      Followers: {(followerRange[0] / 1000000).toFixed(1)}M - {(followerRange[1] / 1000000).toFixed(1)}M
                    </label>
                    <DualRangeSlider
                      min={0}
                      max={5000000}
                      step={100000}
                      value={followerRange}
                      onChange={setFollowerRange}
                      className="w-full"
                      thumbColors={['#1D9BF0', '#22D3EE']}
                    />
                  </div>
                </div>

                {/* Reset Filters */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setPriceRange([0, 1000]);
                      setFollowerRange([0, 5000000]);
                      setSortBy('followers-high');
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
                Showing {filteredInfluencers.length} influencer{filteredInfluencers.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Influencers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredInfluencers.map((influencer) => (
              <InfluencerCard
                key={influencer.id}
                influencer={influencer}
                onClick={() => setSelectedInfluencer(influencer)}
                defaultExpanded={false}
              />
            ))}
          </div>

          {filteredInfluencers.length === 0 && (
            <div className="text-center py-20">
              <p className="text-[#9CA3AF]" style={{ fontSize: '1.125rem' }}>
                No influencers found matching your criteria
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Detail Modal */}
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
        }
      `}</style>
    </div>
  );
}