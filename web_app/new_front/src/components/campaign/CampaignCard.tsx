import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, DollarSign, Users, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export interface CampaignData {
  id: string;
  title: string;
  advertiser: string;
  budget: number;
  reach: number;
  type: 'post' | 'repost' | 'both';
  categories: string[];
  deadline: string;
  description: string;
  image: string;
}

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
        {/* Campaign Image - Fixed aspect ratio */}
        <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
          <ImageWithFallback
            src={campaign.image}
            alt={campaign.title}
            className="w-full h-full object-cover"
          />
          {/* Type Badge on Image */}
          <div className="absolute top-3 right-3">
            <span
              className={`inline-block px-3 py-1.5 rounded-lg text-xs backdrop-blur-md ${
                campaign.type === 'post'
                  ? 'bg-[#1D9BF0]/80 text-white border border-[#1D9BF0]'
                  : campaign.type === 'repost'
                  ? 'bg-[#22D3EE]/80 text-white border border-[#22D3EE]'
                  : 'bg-gradient-to-r from-[#1D9BF0]/80 to-[#22D3EE]/80 text-white border border-[#1D9BF0]'
              }`}
            >
              {campaign.type === 'both' ? 'Post & Repost' : campaign.type}
            </span>
          </div>
        </div>

        {/* Campaign Title - Fixed 2 lines with ellipsis */}
        <h3 
          className="text-[#E5E7EB] mb-3 flex items-center"
          style={{ 
            fontSize: '1.125rem', 
            fontWeight: 600,
            minHeight: '3rem', // Exactly 2 lines height
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

        {/* Categories - Flex grow to push to bottom */}
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {campaign.categories.map((category) => (
            <span
              key={category}
              className="px-2 py-1 rounded bg-[#1D9BF0]/20 text-[#1D9BF0] text-xs border border-[#1D9BF0]/30"
            >
              {category}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}