import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, UserPlus, Loader2 } from 'lucide-react';
import { InfluencerData } from './InfluencerCard';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface InfluencerDetailModalProps {
  influencer: InfluencerData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InfluencerDetailModal({ influencer, isOpen, onClose }: InfluencerDetailModalProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const handleAction = (action: string) => {
    setLoadingAction(action);
    setTimeout(() => {
      setLoadingAction(null);
      onClose();
    }, 1500);
  };

  if (!influencer) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal - Desktop */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="glass-card rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden pointer-events-auto relative"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-all duration-200"
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                <X size={20} />
              </button>

              {/* Content */}
              <div className="grid md:grid-cols-2 gap-6 p-8">
                {/* Left - Profile Image */}
                <div className="relative aspect-square rounded-2xl overflow-hidden">
                  <ImageWithFallback
                    src={influencer.profileImage}
                    alt={`${influencer.username} profile`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Right - Details */}
                <div className="flex flex-col justify-between space-y-6">
                  {/* Header */}
                  <div>
                    <h2 className="text-[#E5E7EB] mb-2" style={{ fontSize: '1.75rem', fontWeight: 600 }}>
                      {influencer.username}
                    </h2>
                    <p className="text-[#9CA3AF] mb-3" style={{ fontSize: '1.125rem' }}>
                      @{influencer.handle}
                    </p>
                    
                    {/* Category Badge */}
                    <div className="inline-flex">
                      <span className="px-3 py-1.5 rounded-lg bg-[#1D9BF0]/20 text-[#1D9BF0] border border-[#1D9BF0]/30">
                        {influencer.category}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                      <Users size={20} className="text-[#22D3EE]" />
                      <div>
                        <div className="text-[#E5E7EB]" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                          {formatNumber(influencer.followers)}
                        </div>
                        <div className="text-[#9CA3AF]" style={{ fontSize: '0.75rem' }}>
                          Followers
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                      <UserPlus size={20} className="text-[#9CA3AF]" />
                      <div>
                        <div className="text-[#E5E7EB]" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                          {formatNumber(influencer.following)}
                        </div>
                        <div className="text-[#9CA3AF]" style={{ fontSize: '0.75rem' }}>
                          Following
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-3 p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="text-[#E5E7EB] mb-3" style={{ fontSize: '1rem', fontWeight: 600 }}>
                      Pricing
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-[#9CA3AF]">Post (Tweet)</span>
                      <span className="text-[#E5E7EB]" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                        ${influencer.pricePost}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#9CA3AF]">Repost (Retweet)</span>
                      <span className="text-[#E5E7EB]" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                        ${influencer.priceRepost}
                      </span>
                    </div>
                    {influencer.perViewsBonus && (
                      <div className="pt-2 border-t border-white/10">
                        <span className="text-[#22D3EE]" style={{ fontSize: '0.875rem' }}>
                          +${influencer.perViewsBonus.amount} per {formatNumber(influencer.perViewsBonus.per)} views bonus
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <motion.button
                      onClick={() => handleAction('post')}
                      disabled={loadingAction !== null}
                      className="w-full px-6 py-3.5 rounded-xl bg-[#1D9BF0] text-white hover:bg-[#1a8cd8] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                      whileHover={loadingAction === null ? { scale: 1.02 } : {}}
                      whileTap={loadingAction === null ? { scale: 0.98 } : {}}
                      style={{ minHeight: '52px' }}
                    >
                      {loadingAction === 'post' ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        'Buy Post'
                      )}
                    </motion.button>
                    <motion.button
                      onClick={() => handleAction('repost')}
                      disabled={loadingAction !== null}
                      className="w-full px-6 py-3.5 rounded-xl bg-white/10 text-[#E5E7EB] hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                      whileHover={loadingAction === null ? { scale: 1.02 } : {}}
                      whileTap={loadingAction === null ? { scale: 0.98 } : {}}
                      style={{ minHeight: '52px' }}
                    >
                      {loadingAction === 'repost' ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        'Buy Repost'
                      )}
                    </motion.button>
                    <motion.button
                      onClick={() => handleAction('negotiate')}
                      disabled={loadingAction !== null}
                      className="w-full px-6 py-3.5 rounded-xl text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                      whileHover={loadingAction === null ? { scale: 1.02 } : {}}
                      whileTap={loadingAction === null ? { scale: 0.98 } : {}}
                      style={{ minHeight: '52px' }}
                    >
                      {loadingAction === 'negotiate' ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        'Negotiate'
                      )}
                    </motion.button>
                    <p className="text-[#9CA3AF] text-center pt-2" style={{ fontSize: '0.875rem' }}>
                      Propose custom text, timing, or per-view rate
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Mobile Bottom Sheet */}
          <style>{`
            @media (max-width: 768px) {
              .grid.md\\:grid-cols-2 {
                grid-template-columns: 1fr;
              }
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
}