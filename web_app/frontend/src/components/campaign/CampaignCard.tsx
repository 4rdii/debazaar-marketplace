import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, DollarSign, Users, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { CampaignData } from '../../utils/adapters';

interface CampaignCardProps {
  campaign: CampaignData;
  onClick?: () => void;
}

export function CampaignCard({ campaign, onClick }: CampaignCardProps) {
  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <motion.div
      className="glass-card rounded-2xl overflow-hidden cursor-pointer hover:bg-white/[0.16] transition-all duration-300 h-full"
      onClick={handleCardClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="p-6 flex flex-col h-full">
        {/* Product Image - Fixed aspect ratio */}
        <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
          <ImageWithFallback
            src={campaign.image || 'https://via.placeholder.com/400x300?text=No+Image'}
            alt={campaign.title}
            className="w-full h-full object-cover"
          />
          {/* Status Badge on Image */}
          <div className="absolute top-3 right-3">
            <span
              className={`inline-block px-3 py-1.5 rounded-lg text-xs backdrop-blur-md ${
                campaign.status === 'open'
                  ? 'bg-green-500/80 text-white border border-green-500'
                  : campaign.status === 'filled'
                  ? 'bg-yellow-500/80 text-white border border-yellow-500'
                  : 'bg-gray-500/80 text-white border border-gray-500'
              }`}
            >
              {campaign.status === 'open' ? 'Available' : campaign.status === 'filled' ? 'Sold' : campaign.status}
            </span>
          </div>
        </div>

        {/* Product Title - Fixed 2 lines with ellipsis */}
        <h3
          className="text-[#E5E7EB] mb-3 flex items-center"
          style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            minHeight: '3rem',
            lineHeight: '1.5rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {campaign.title}
        </h3>

        {/* Price and Payment Method */}
        <div className="flex flex-wrap gap-1.5 mt-auto">
          <span className="px-3 py-1.5 rounded bg-[#1D9BF0]/20 text-[#1D9BF0] text-sm border border-[#1D9BF0]/30 font-semibold">
            {campaign.price} {campaign.currency}
          </span>
          <span className="px-2 py-1 rounded bg-[#22D3EE]/20 text-[#22D3EE] text-xs border border-[#22D3EE]/30">
            {campaign.paymentMethod}
          </span>
        </div>
      </div>
    </motion.div>
  );
}