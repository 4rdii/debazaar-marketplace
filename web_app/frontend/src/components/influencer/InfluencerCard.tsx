import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GlassCard } from '../ui/GlassCard';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export interface InfluencerData {
  id: string;
  username: string;
  handle: string;
  followers: number;
  following: number;
  pricePost: number;
  priceRepost: number;
  perViewsBonus?: { amount: number; per: number };
  profileImage: string;
  category: string;
}

interface InfluencerCardProps {
  influencer: InfluencerData;
  onClick?: () => void;
}

export function InfluencerCard({ influencer, onClick }: InfluencerCardProps) {
  return (
    <GlassCard hover onClick={onClick} className="overflow-hidden cursor-pointer">
      {/* Profile Image */}
      <div className="relative aspect-square overflow-hidden">
        <ImageWithFallback
          src={influencer.profileImage}
          alt={`${influencer.username} profile`}
          className="w-full h-full object-cover"
        />
        
        {/* Overlay with username */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <h3 className="text-[#E5E7EB] mb-1" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
            {influencer.username}
          </h3>
          <p className="text-[#9CA3AF] text-sm">
            @{influencer.handle}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}