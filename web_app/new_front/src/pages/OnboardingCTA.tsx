import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, TrendingUp, DollarSign, Users, Zap } from 'lucide-react';
import { Navbar } from '../components/navigation/Navbar';
import { Footer } from '../components/navigation/Footer';
import { GlassCard } from '../components/ui/GlassCard';

interface OnboardingCTAProps {
  onBack: () => void;
}

export function OnboardingCTA({ onBack }: OnboardingCTAProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1220] to-[#0F172A]">
      <Navbar />
      
      <main className="pt-32 pb-16 px-20">
        <div className="max-w-[1200px] mx-auto">
          {/* Back Button */}
          <motion.button
            onClick={onBack}
            className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#1D9BF0] mb-8 transition-colors duration-200"
            whileHover={{ x: -4 }}
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </motion.button>

          {/* Hero Section */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-[#E5E7EB] mb-6" style={{ fontSize: '3rem', fontWeight: 600 }}>
                Become an Influencer
              </h1>
              <p className="text-[#9CA3AF] max-w-2xl mx-auto mb-8" style={{ fontSize: '1.25rem' }}>
                Join Our Name and start monetizing your X (Twitter) presence. Set your own rates, choose your campaigns, and get paid for your influence.
              </p>
              <motion.button
                className="px-8 py-4 rounded-xl bg-[#1D9BF0] text-white hover:bg-[#1a8cd8] transition-all duration-200 shadow-lg shadow-[#1D9BF0]/25"
                whileHover={{ scale: 1.05, boxShadow: '0 12px 24px rgba(29, 155, 240, 0.35)' }}
                whileTap={{ scale: 0.98 }}
                style={{ fontSize: '1.125rem', fontWeight: 600, minHeight: '56px' }}
              >
                Get Started Now
              </motion.button>
            </motion.div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <GlassCard className="p-8">
                <div className="w-12 h-12 rounded-xl bg-[#1D9BF0]/20 flex items-center justify-center mb-4">
                  <DollarSign className="text-[#1D9BF0]" size={24} />
                </div>
                <h3 className="text-[#E5E7EB] mb-3" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  Set Your Own Rates
                </h3>
                <p className="text-[#9CA3AF]">
                  You're in control. Set prices for posts, reposts, and per-view bonuses that reflect your value.
                </p>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard className="p-8">
                <div className="w-12 h-12 rounded-xl bg-[#22D3EE]/20 flex items-center justify-center mb-4">
                  <TrendingUp className="text-[#22D3EE]" size={24} />
                </div>
                <h3 className="text-[#E5E7EB] mb-3" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  Grow Your Earnings
                </h3>
                <p className="text-[#9CA3AF]">
                  Earn from posts, reposts, and performance bonuses. The more engagement you drive, the more you earn.
                </p>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard className="p-8">
                <div className="w-12 h-12 rounded-xl bg-[#22C55E]/20 flex items-center justify-center mb-4">
                  <Users className="text-[#22C55E]" size={24} />
                </div>
                <h3 className="text-[#E5E7EB] mb-3" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  Build Relationships
                </h3>
                <p className="text-[#9CA3AF]">
                  Connect with brands and advertisers looking for authentic voices like yours to promote their products.
                </p>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <GlassCard className="p-8">
                <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/20 flex items-center justify-center mb-4">
                  <Zap className="text-[#F59E0B]" size={24} />
                </div>
                <h3 className="text-[#E5E7EB] mb-3" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  Fast & Secure
                </h3>
                <p className="text-[#9CA3AF]">
                  Get paid quickly and securely. Our platform handles all transactions so you can focus on creating content.
                </p>
              </GlassCard>
            </motion.div>
          </div>

          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <GlassCard className="p-12 text-center">
              <h2 className="text-[#E5E7EB] mb-6" style={{ fontSize: '2rem', fontWeight: 600 }}>
                How It Works
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div>
                  <div className="w-16 h-16 rounded-full bg-[#1D9BF0] text-white flex items-center justify-center mx-auto mb-4" style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                    1
                  </div>
                  <h4 className="text-[#E5E7EB] mb-2" style={{ fontWeight: 600 }}>
                    Create Your Profile
                  </h4>
                  <p className="text-[#9CA3AF]" style={{ fontSize: '0.875rem' }}>
                    Sign up and connect your X account to get started
                  </p>
                </div>
                <div>
                  <div className="w-16 h-16 rounded-full bg-[#22D3EE] text-white flex items-center justify-center mx-auto mb-4" style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                    2
                  </div>
                  <h4 className="text-[#E5E7EB] mb-2" style={{ fontWeight: 600 }}>
                    Set Your Rates
                  </h4>
                  <p className="text-[#9CA3AF]" style={{ fontSize: '0.875rem' }}>
                    Define your pricing for posts, reposts, and bonuses
                  </p>
                </div>
                <div>
                  <div className="w-16 h-16 rounded-full bg-[#22C55E] text-white flex items-center justify-center mx-auto mb-4" style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                    3
                  </div>
                  <h4 className="text-[#E5E7EB] mb-2" style={{ fontWeight: 600 }}>
                    Start Earning
                  </h4>
                  <p className="text-[#9CA3AF]" style={{ fontSize: '0.875rem' }}>
                    Accept campaigns and get paid for your content
                  </p>
                </div>
              </div>
              <motion.button
                className="px-8 py-4 rounded-xl bg-[#1D9BF0] text-white hover:bg-[#1a8cd8] transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                style={{ fontSize: '1.125rem', fontWeight: 600, minHeight: '56px' }}
              >
                Create Your Profile
              </motion.button>
            </GlassCard>
          </motion.div>
        </div>
      </main>

      <Footer />

      {/* Responsive Styles */}
      <style jsx>{`
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
