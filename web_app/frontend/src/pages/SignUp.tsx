import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Mail, Loader2, Wallet } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Navbar } from '../components/navigation/Navbar';
import { Footer } from '../components/navigation/Footer';

// Twitter/X icon component
const XIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface SignUpProps {
  onBack: () => void;
  onSignUpSuccess: () => void;
  onLoginClick?: () => void;
  onJoinCampaignClick?: () => void;
  onBuyInteractionClick?: () => void;
}

export function SignUp({ onBack, onSignUpSuccess, onLoginClick, onJoinCampaignClick, onBuyInteractionClick }: SignUpProps) {
  const [loadingMethod, setLoadingMethod] = useState<string | null>(null);

  const handleSignUp = async (method: string) => {
    setLoadingMethod(method);
    
    // Simulate registration
    setTimeout(() => {
      setLoadingMethod(null);
      // In a real app, this would handle the actual registration
      alert(`Sign up with ${method} successful!`);
      onSignUpSuccess();
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1220] to-[#0F172A]">
      <Navbar 
        isLoggedIn={false}
        onLoginClick={onLoginClick}
        onSignUpClick={() => {}}
        onInfluencersClick={onJoinCampaignClick}
        showBuyInteraction={true}
        onBuyInteractionClick={onBuyInteractionClick}
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

          {/* Sign Up Card */}
          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <GlassCard className="p-8 md:p-12">
                {/* Header */}
                <div className="text-center mb-10">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#1D9BF0] to-[#22D3EE] flex items-center justify-center">
                    <span className="text-white" style={{ fontSize: '1.75rem', fontWeight: 600 }}>ON</span>
                  </div>
                  <h1 className="text-[#E5E7EB] mb-2" style={{ fontSize: '2rem', fontWeight: 600 }}>
                    Create Account
                  </h1>
                  <p className="text-[#9CA3AF]">
                    Join Our Name and start your journey
                  </p>
                </div>

                {/* Sign Up Options */}
                <div className="space-y-4">
                  {/* Email Sign Up */}
                  <motion.button
                    onClick={() => handleSignUp('Email')}
                    disabled={loadingMethod !== null}
                    className="w-full px-6 py-4 rounded-xl glass-card hover:bg-white/10 text-[#E5E7EB] transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
                    whileHover={loadingMethod === null ? { scale: 1.02 } : {}}
                    whileTap={loadingMethod === null ? { scale: 0.98 } : {}}
                    style={{ minHeight: '56px' }}
                  >
                    {loadingMethod === 'Email' ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <Mail size={20} className="text-[#22D3EE]" />
                        <span style={{ fontWeight: 500 }}>Sign up with Email</span>
                      </>
                    )}
                  </motion.button>

                  {/* Gmail Sign Up */}
                  <motion.button
                    onClick={() => handleSignUp('Gmail')}
                    disabled={loadingMethod !== null}
                    className="w-full px-6 py-4 rounded-xl glass-card hover:bg-white/10 text-[#E5E7EB] transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
                    whileHover={loadingMethod === null ? { scale: 1.02 } : {}}
                    whileTap={loadingMethod === null ? { scale: 0.98 } : {}}
                    style={{ minHeight: '56px' }}
                  >
                    {loadingMethod === 'Gmail' ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <Mail size={20} className="text-[#1D9BF0]" />
                        <span style={{ fontWeight: 500 }}>Sign up with Gmail</span>
                      </>
                    )}
                  </motion.button>

                  {/* X (Twitter) Sign Up */}
                  <motion.button
                    onClick={() => handleSignUp('X')}
                    disabled={loadingMethod !== null}
                    className="w-full px-6 py-4 rounded-xl glass-card hover:bg-white/10 text-[#E5E7EB] transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
                    whileHover={loadingMethod === null ? { scale: 1.02 } : {}}
                    whileTap={loadingMethod === null ? { scale: 0.98 } : {}}
                    style={{ minHeight: '56px' }}
                  >
                    {loadingMethod === 'X' ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <div className="text-[#1D9BF0]">
                          <XIcon />
                        </div>
                        <span style={{ fontWeight: 500 }}>Sign up with X</span>
                      </>
                    )}
                  </motion.button>

                  {/* Crypto Wallet Sign Up */}
                  <motion.button
                    onClick={() => handleSignUp('Crypto Wallet')}
                    disabled={loadingMethod !== null}
                    className="w-full px-6 py-4 rounded-xl glass-card hover:bg-white/10 text-[#E5E7EB] transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
                    whileHover={loadingMethod === null ? { scale: 1.02 } : {}}
                    whileTap={loadingMethod === null ? { scale: 0.98 } : {}}
                    style={{ minHeight: '56px' }}
                  >
                    {loadingMethod === 'Crypto Wallet' ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <Wallet size={20} className="text-[#22D3EE]" />
                        <span style={{ fontWeight: 500 }}>Sign up with Wallet</span>
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Terms */}
                <p className="text-center text-[#9CA3AF] mt-8 text-sm">
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
              </GlassCard>
            </motion.div>
          </div>
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