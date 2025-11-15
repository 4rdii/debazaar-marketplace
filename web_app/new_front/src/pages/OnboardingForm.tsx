import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserCircle, Users, Megaphone, X } from 'lucide-react';
import { Navbar } from '../components/navigation/Navbar';
import { Footer } from '../components/navigation/Footer';
import { GlassCard } from '../components/ui/GlassCard';

interface OnboardingFormProps {
  onComplete: (data: {
    accountType: 'influencer' | 'advertiser';
    xAccount?: string;
    walletAddress: string;
    gmailAccount?: string;
  }) => void;
  connectedWallet?: string;
}

export function OnboardingForm({ onComplete, connectedWallet }: OnboardingFormProps) {
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<'influencer' | 'advertiser' | null>(null);
  const [xAccount, setXAccount] = useState('');
  const [walletAddress, setWalletAddress] = useState(connectedWallet || '');
  const [gmailAccount, setGmailAccount] = useState('');

  const handleSubmit = () => {
    if (!accountType || !walletAddress) {
      alert('Please select an account type and provide a wallet address');
      return;
    }

    onComplete({
      accountType,
      xAccount: xAccount || undefined,
      walletAddress,
      gmailAccount: gmailAccount || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1220] to-[#0F172A]">
      <Navbar />

      <main className="pt-32 pb-16 px-20">
        <div className="max-w-[800px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-[#E5E7EB] mb-4 text-center" style={{ fontSize: '2.5rem', fontWeight: 600 }}>
              Complete Your Profile
            </h1>
            <p className="text-[#9CA3AF] mb-12 text-center" style={{ fontSize: '1.125rem' }}>
              Tell us a bit about yourself to get started
            </p>

            <GlassCard className="p-8">
              {/* Step 1: Account Type */}
              <div className="mb-8">
                <h2 className="text-[#E5E7EB] mb-4" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  1. Choose Your Account Type
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.button
                    onClick={() => setAccountType('influencer')}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                      accountType === 'influencer'
                        ? 'border-[#1D9BF0] bg-[#1D9BF0]/10'
                        : 'border-white/10 hover:border-white/20 bg-white/5'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <div
                        className={`p-4 rounded-xl ${
                          accountType === 'influencer' ? 'bg-[#1D9BF0]' : 'bg-white/10'
                        }`}
                      >
                        <Users size={32} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-[#E5E7EB] mb-1" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                          Influencer
                        </h3>
                        <p className="text-[#9CA3AF] text-sm">
                          Monetize your X presence by accepting promotion requests
                        </p>
                      </div>
                    </div>
                  </motion.button>

                  <motion.button
                    onClick={() => setAccountType('advertiser')}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                      accountType === 'advertiser'
                        ? 'border-[#22D3EE] bg-[#22D3EE]/10'
                        : 'border-white/10 hover:border-white/20 bg-white/5'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <div
                        className={`p-4 rounded-xl ${
                          accountType === 'advertiser' ? 'bg-[#22D3EE]' : 'bg-white/10'
                        }`}
                      >
                        <Megaphone size={32} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-[#E5E7EB] mb-1" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                          Advertiser
                        </h3>
                        <p className="text-[#9CA3AF] text-sm">
                          Create campaigns and connect with influencers
                        </p>
                      </div>
                    </div>
                  </motion.button>
                </div>
              </div>

              {/* Step 2: X Account */}
              <div className="mb-8">
                <h2 className="text-[#E5E7EB] mb-4" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  2. X (Twitter) Account <span className="text-[#9CA3AF] text-sm">(Optional)</span>
                </h2>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">@</span>
                  <input
                    type="text"
                    value={xAccount}
                    onChange={(e) => setXAccount(e.target.value)}
                    placeholder="your_handle"
                    className="w-full pl-8 pr-4 py-3 rounded-xl glass-card text-[#E5E7EB] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] transition-all duration-200"
                    style={{ minHeight: '48px' }}
                  />
                </div>
              </div>

              {/* Step 3: Wallet Address */}
              <div className="mb-8">
                <h2 className="text-[#E5E7EB] mb-4" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  3. Wallet Address
                </h2>
                <div className="relative">
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="0x..."
                    disabled={!!connectedWallet}
                    className={`w-full px-4 py-3 rounded-xl glass-card text-[#E5E7EB] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] transition-all duration-200 ${
                      connectedWallet ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                    style={{ minHeight: '48px' }}
                  />
                  {connectedWallet && (
                    <p className="text-[#22D3EE] text-sm mt-2">
                      Connected wallet address (cannot be changed)
                    </p>
                  )}
                </div>
              </div>

              {/* Step 4: Gmail Account */}
              <div className="mb-8">
                <h2 className="text-[#E5E7EB] mb-4" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  4. Gmail Account <span className="text-[#9CA3AF] text-sm">(Optional)</span>
                </h2>
                <input
                  type="email"
                  value={gmailAccount}
                  onChange={(e) => setGmailAccount(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="w-full px-4 py-3 rounded-xl glass-card text-[#E5E7EB] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] transition-all duration-200"
                  style={{ minHeight: '48px' }}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <motion.button
                  onClick={handleSubmit}
                  disabled={!accountType || !walletAddress}
                  className={`px-8 py-3 rounded-xl text-white transition-all duration-200 ${
                    accountType && walletAddress
                      ? 'bg-[#1D9BF0] hover:bg-[#1a8cd8]'
                      : 'bg-[#9CA3AF]/50 cursor-not-allowed'
                  }`}
                  whileHover={accountType && walletAddress ? { scale: 1.02 } : {}}
                  whileTap={accountType && walletAddress ? { scale: 0.98 } : {}}
                  style={{ minHeight: '48px' }}
                >
                  Complete Setup
                </motion.button>
              </div>
            </GlassCard>
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
