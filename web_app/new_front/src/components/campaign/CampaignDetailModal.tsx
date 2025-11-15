import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, DollarSign, Users, Calendar, Loader2 } from 'lucide-react';
import { CampaignData } from './CampaignCard';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface CampaignDetailModalProps {
  campaign: CampaignData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CampaignDetailModal({ campaign, isOpen, onClose }: CampaignDetailModalProps) {
  const [loadingAction, setLoadingAction] = useState<boolean>(false);

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

  const handleApply = () => {
    setLoadingAction(true);
    setTimeout(() => {
      setLoadingAction(false);
      onClose();
    }, 1500);
  };

  if (!campaign) return null;

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

          {/* Modal */}
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
                {/* Left - Campaign Image */}
                <div className="relative aspect-square rounded-2xl overflow-hidden">
                  <ImageWithFallback
                    src={campaign.image}
                    alt={campaign.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Right - Details */}
                <div className="flex flex-col justify-between space-y-6">
                  {/* Header */}
                  <div>
                    <h2 className="text-[#E5E7EB] mb-2" style={{ fontSize: '1.75rem', fontWeight: 600 }}>
                      {campaign.title}
                    </h2>
                    <p className="text-[#9CA3AF] mb-3" style={{ fontSize: '1.125rem' }}>
                      by {campaign.advertiser}
                    </p>
                    
                    {/* Type Badge */}
                    <div className="inline-flex">
                      <span
                        className={`px-3 py-1.5 rounded-lg text-xs ${
                          campaign.type === 'post'
                            ? 'bg-[#1D9BF0]/20 text-[#1D9BF0] border border-[#1D9BF0]/30'
                            : campaign.type === 'repost'
                            ? 'bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30'
                            : 'bg-gradient-to-r from-[#1D9BF0]/20 to-[#22D3EE]/20 text-[#22D3EE] border border-[#1D9BF0]/30'
                        }`}
                      >
                        {campaign.type === 'both' ? 'Post & Repost' : campaign.type}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[#9CA3AF]" style={{ fontSize: '0.875rem' }}>
                      {campaign.description}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign size={16} className="text-[#22D3EE]" />
                        <span className="text-[#9CA3AF] text-xs">Budget</span>
                      </div>
                      <div className="text-[#E5E7EB]" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                        ${formatNumber(campaign.budget)}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Users size={16} className="text-[#22D3EE]" />
                        <span className="text-[#9CA3AF] text-xs">Reach</span>
                      </div>
                      <div className="text-[#E5E7EB]" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                        {formatNumber(campaign.reach)}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar size={16} className="text-[#22D3EE]" />
                        <span className="text-[#9CA3AF] text-xs">Deadline</span>
                      </div>
                      <div className="text-[#E5E7EB] text-xs" style={{ lineHeight: 1.4 }}>
                        {campaign.deadline}
                      </div>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                    <h3 className="text-[#E5E7EB] mb-2" style={{ fontSize: '1rem', fontWeight: 600 }}>
                      Categories
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {campaign.categories.map((category) => (
                        <span
                          key={category}
                          className="px-3 py-1.5 rounded-lg bg-[#1D9BF0]/20 text-[#1D9BF0] text-xs border border-[#1D9BF0]/30"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Apply Button */}
                  <motion.button
                    onClick={handleApply}
                    disabled={loadingAction}
                    className="w-full px-6 py-3.5 rounded-xl bg-[#1D9BF0] text-white hover:bg-[#1a8cd8] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                    whileHover={!loadingAction ? { scale: 1.02 } : {}}
                    whileTap={!loadingAction ? { scale: 0.98 } : {}}
                    style={{ minHeight: '52px' }}
                  >
                    {loadingAction ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      'Apply Now'
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Mobile Responsive */}
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
