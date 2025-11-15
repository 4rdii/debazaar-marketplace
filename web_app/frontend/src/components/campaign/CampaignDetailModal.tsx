import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, DollarSign, User, Shield, Loader2, ExternalLink } from 'lucide-react';
import { CampaignData } from '../../utils/adapters';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { sendTransaction } from '../../services/blockchain';
import { ordersAPI } from '../../services/api';

interface CampaignDetailModalProps {
  campaign: CampaignData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CampaignDetailModal({ campaign, isOpen, onClose }: CampaignDetailModalProps) {
  const [loadingAction, setLoadingAction] = useState<boolean>(false);
  const [purchaseStep, setPurchaseStep] = useState<'idle' | 'approving' | 'purchasing' | 'success'>('idle');

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

  const handlePurchase = async () => {
    if (!campaign) return;

    setLoadingAction(true);
    setPurchaseStep('approving');

    try {
      // Step 1: Approve token
      const approveData = await ordersAPI.approveToken({
        listing_id: campaign.id,
        token_address: campaign.currency,
      });

      if (approveData.data) {
        await sendTransaction(approveData.data);
      }

      // Step 2: Purchase
      setPurchaseStep('purchasing');
      const purchaseData = await ordersAPI.purchaseTransaction({
        listing_id: campaign.id,
      });

      if (purchaseData.data) {
        const txHash = await sendTransaction(purchaseData.data);

        // Confirm purchase
        await ordersAPI.confirmPurchase(parseInt(campaign.id), { tx_hash: txHash });

        setPurchaseStep('success');
        setTimeout(() => {
          onClose();
          setPurchaseStep('idle');
        }, 2000);
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
      setPurchaseStep('idle');
    } finally {
      setLoadingAction(false);
    }
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
                {/* Left - Product Image */}
                <div className="relative aspect-square rounded-2xl overflow-hidden">
                  <ImageWithFallback
                    src={campaign.image || 'https://via.placeholder.com/400'}
                    alt={campaign.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1.5 rounded-lg text-xs backdrop-blur-md ${
                      campaign.status === 'open'
                        ? 'bg-green-500/80 text-white border border-green-500'
                        : 'bg-gray-500/80 text-white border border-gray-500'
                    }`}>
                      {campaign.status === 'open' ? 'Available' : 'Sold'}
                    </span>
                  </div>
                </div>

                {/* Right - Details */}
                <div className="flex flex-col justify-between space-y-6">
                  {/* Header */}
                  <div>
                    <h2 className="text-[#E5E7EB] mb-2" style={{ fontSize: '1.75rem', fontWeight: 600 }}>
                      {campaign.title}
                    </h2>
                    <p className="text-[#9CA3AF] mb-3 flex items-center gap-2">
                      <User size={16} />
                      <span>by {campaign.seller.username}</span>
                      <span className="text-yellow-400">★ {campaign.seller.rating.toFixed(1)}</span>
                    </p>
                  </div>

                  {/* Description */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[#9CA3AF]" style={{ fontSize: '0.875rem' }}>
                      {campaign.description}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign size={16} className="text-[#22D3EE]" />
                        <span className="text-[#9CA3AF] text-xs">Price</span>
                      </div>
                      <div className="text-[#E5E7EB]" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                        {campaign.price} {campaign.currency}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield size={16} className="text-[#22D3EE]" />
                        <span className="text-[#9CA3AF] text-xs">Payment</span>
                      </div>
                      <div className="text-[#E5E7EB] text-xs" style={{ lineHeight: 1.4 }}>
                        {campaign.paymentMethod === 'escrow' ? 'Escrow Protected' : 'Direct'}
                      </div>
                    </div>
                  </div>

                  {/* Escrow Type */}
                  {campaign.escrowType && (
                    <div className="p-4 rounded-xl bg-[#1D9BF0]/10 border border-[#1D9BF0]/30">
                      <div className="flex items-center gap-2">
                        <Shield size={16} className="text-[#1D9BF0]" />
                        <span className="text-[#1D9BF0] text-sm font-medium">
                          {campaign.escrowType === 'disputable' && 'Buyer Protection: Can dispute'}
                          {campaign.escrowType === 'api_approval' && 'API Verified Delivery'}
                          {campaign.escrowType === 'onchain_approval' && 'Onchain Verified'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Purchase Button */}
                  <motion.button
                    onClick={handlePurchase}
                    disabled={loadingAction || campaign.status !== 'open'}
                    className="w-full px-6 py-3.5 rounded-xl bg-[#1D9BF0] text-white hover:bg-[#1a8cd8] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                    whileHover={!loadingAction ? { scale: 1.02 } : {}}
                    whileTap={!loadingAction ? { scale: 0.98 } : {}}
                    style={{ minHeight: '52px' }}
                  >
                    {loadingAction ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>
                          {purchaseStep === 'approving' && 'Approving Token...'}
                          {purchaseStep === 'purchasing' && 'Processing Purchase...'}
                          {purchaseStep === 'success' && 'Purchase Successful!'}
                        </span>
                      </>
                    ) : campaign.status !== 'open' ? (
                      'Not Available'
                    ) : (
                      'Purchase Now'
                    )}
                  </motion.button>

                  {campaign.blockchain_listing_id && (
                    <a
                      href={`https://sepolia.arbiscan.io/tx/${campaign.blockchain_listing_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#9CA3AF] text-xs flex items-center gap-1 hover:text-[#1D9BF0] transition-colors"
                    >
                      <ExternalLink size={12} />
                      View on Arbiscan
                    </a>
                  )}
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
