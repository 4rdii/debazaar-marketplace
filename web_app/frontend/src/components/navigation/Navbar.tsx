import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, User, LayoutDashboard, LogOut } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface NavbarProps {
  onInfluencersClick?: () => void;
  onLoginClick?: () => void;
  onSignUpClick?: () => void;
  isLoggedIn?: boolean;
  user?: {
    username: string;
    profileImage?: string;
    accountType?: 'influencer' | 'advertiser';
  };
  onProfileClick?: () => void;
  onDashboardClick?: () => void;
  onLogout?: () => void;
  showBuyInteraction?: boolean; // For campaigns homepage
  onBuyInteractionClick?: () => void;
}

export function Navbar({ 
  onInfluencersClick, 
  onLoginClick, 
  onSignUpClick,
  isLoggedIn = false,
  user,
  onProfileClick,
  onDashboardClick,
  onLogout,
  showBuyInteraction,
  onBuyInteractionClick
}: NavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 glass-nav"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-[1440px] mx-auto px-20 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1D9BF0] to-[#22D3EE] flex items-center justify-center">
              <span className="text-white">ON</span>
            </div>
            <span className="text-[#E5E7EB] tracking-tight" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
              Our Name
            </span>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-3">
            {/* Show "Join a Campaign" or "Buy Interaction" when not logged in */}
            {!isLoggedIn && showBuyInteraction && (
              <motion.button
                onClick={onBuyInteractionClick}
                className="px-6 py-2.5 rounded-xl glass-card text-[#E5E7EB] hover:bg-white/20 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ minHeight: '44px' }}
              >
                Buy Interaction
              </motion.button>
            )}
            
            {!isLoggedIn && !showBuyInteraction && (
              <motion.button
                onClick={onInfluencersClick}
                className="px-6 py-2.5 rounded-xl glass-card text-[#E5E7EB] hover:bg-white/20 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ minHeight: '44px' }}
              >
                Join a Campaign
              </motion.button>
            )}
            
            {isLoggedIn && user ? (
              <div className="flex items-center gap-3">
                {/* Account Type Badge */}
                {user.accountType && (
                  <div
                    className={`px-3 py-1.5 rounded-lg text-xs ${
                      user.accountType === 'influencer'
                        ? 'bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30'
                        : 'bg-[#1D9BF0]/20 text-[#1D9BF0] border border-[#1D9BF0]/30'
                    }`}
                  >
                    {user.accountType === 'influencer' ? 'Influencer' : 'Advertiser'}
                  </div>
                )}
                
                {/* Profile Dropdown */}
                <div ref={dropdownRef} className="relative">
                  {/* Profile Dropdown Button */}
                  <motion.button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/10 transition-all duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {user.profileImage ? (
                      <ImageWithFallback
                        src={user.profileImage}
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1D9BF0] to-[#22D3EE] flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <ChevronDown 
                      size={16} 
                      className={`text-[#E5E7EB] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </motion.button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        className="absolute right-0 top-full mt-2 w-48 glass-card rounded-xl overflow-hidden border border-white/10"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="py-2">
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false);
                              onProfileClick?.();
                            }}
                            className="w-full px-4 py-3 text-left text-[#E5E7EB] hover:bg-white/10 transition-colors duration-200 flex items-center gap-3"
                          >
                            <User size={18} />
                            <span>Profile</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false);
                              onDashboardClick?.();
                            }}
                            className="w-full px-4 py-3 text-left text-[#E5E7EB] hover:bg-white/10 transition-colors duration-200 flex items-center gap-3"
                          >
                            <LayoutDashboard size={18} />
                            <span>Dashboard</span>
                          </button>

                          {/* Separator */}
                          <div className="my-2 mx-4 border-t border-white/10" />

                          <button
                            onClick={() => {
                              setIsDropdownOpen(false);
                              onLogout?.();
                            }}
                            className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-400/10 transition-colors duration-200 flex items-center gap-3"
                          >
                            <LogOut size={18} />
                            <span>Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <>
                <motion.button
                  onClick={onLoginClick}
                  className="px-6 py-2.5 rounded-xl glass-card text-[#E5E7EB] hover:bg-white/20 transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ minHeight: '44px' }}
                >
                  Login
                </motion.button>
                
                <motion.button
                  onClick={onSignUpClick}
                  className="px-6 py-2.5 rounded-xl bg-[#1D9BF0] text-white hover:bg-[#1a8cd8] transition-all duration-200 shadow-lg shadow-[#1D9BF0]/25"
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 20px rgba(29, 155, 240, 0.35)' }}
                  whileTap={{ scale: 0.98 }}
                  style={{ minHeight: '44px' }}
                >
                  Sign Up
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile/Tablet - Responsive */}
      <style>{`
        @media (max-width: 1024px) {
          nav > div {
            padding-left: 72px;
            padding-right: 72px;
          }
        }
        @media (max-width: 768px) {
          nav > div {
            padding-left: 16px;
            padding-right: 16px;
          }
        }
      `}</style>
    </motion.nav>
  );
}