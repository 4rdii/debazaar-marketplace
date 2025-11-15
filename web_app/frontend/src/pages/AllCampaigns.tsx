import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Navbar } from '../components/navigation/Navbar';
import { Footer } from '../components/navigation/Footer';
import { GlassCard } from '../components/ui/GlassCard';
import { CampaignCard } from '../components/campaign/CampaignCard';
import { CampaignDetailModal } from '../components/campaign/CampaignDetailModal';
import { CampaignData } from '../utils/adapters';

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

// Extended mock product listings
const allCampaigns: CampaignData[] = [
  {
    id: '1',
    title: 'Premium AI Assistant License',
    description: 'Lifetime access to revolutionary AI assistant software',
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
    title: 'Gaming 3D Asset Pack',
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
    description: 'AI-powered workout and nutrition plans',
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
    description: 'Sustainable fashion templates and resources',
    price: 250,
    currency: 'USDC',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400',
    seller: { id: 5, username: 'DesignStudio', rating: 4.6 },
    status: 'open',
    paymentMethod: 'escrow',
    escrowType: 'onchain_approval',
    createdAt: new Date().toISOString(),
  },
  {
    id: '6',
    title: 'Professional Photography Pack',
    description: 'High-res stock photos for commercial use',
    price: 89,
    currency: 'USDC',
    image: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400',
    seller: { id: 6, username: 'ProPhotos', rating: 4.9 },
    status: 'open',
    paymentMethod: 'escrow',
    escrowType: 'disputable',
    createdAt: new Date().toISOString(),
  },
];

type SortOption = 'price-high' | 'price-low' | 'newest' | 'oldest';

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
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignData | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('price-high');

  const filteredCampaigns = allCampaigns
    .filter((campaign) => {
      const matchesSearch =
        campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.seller.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-high':
          return b.price - a.price;
        case 'price-low':
          return a.price - b.price;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1220] to-[#0F172A]">
      <Navbar
        showBuyInteraction={true}
        onBuyInteractionClick={onBuyInteractionClick}
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
              All Products
            </h1>
            <p className="text-[#9CA3AF]" style={{ fontSize: '1.125rem' }}>
              Browse digital goods marketplace
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
                  placeholder="Search products..."
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
                <span>Sort</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#9CA3AF] mb-2 text-sm">Sort By</label>
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="w-full px-4 py-3 rounded-xl glass-card text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] transition-all duration-200 appearance-none cursor-pointer"
                        style={{ minHeight: '48px' }}
                      >
                        <option value="price-high">Price (High to Low)</option>
                        <option value="price-low">Price (Low to High)</option>
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Results Count */}
            <div className="flex items-center justify-between">
              <p className="text-[#9CA3AF]">
                Showing {filteredCampaigns.length} product{filteredCampaigns.length !== 1 ? 's' : ''}
              </p>
            </div>
          </motion.div>

          {/* Products Grid */}
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
                No products found. Try adjusting your search.
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

      {/* Product Detail Modal */}
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
