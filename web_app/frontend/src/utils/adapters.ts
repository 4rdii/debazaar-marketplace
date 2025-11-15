import type { Listing, Order, UserProfile } from '../types';

// Adapt backend Listing to frontend Campaign format
export interface CampaignData {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  image?: string;
  seller: {
    id: number;
    username: string;
    rating: number;
  };
  status: string;
  paymentMethod: string;
  escrowType?: string;
  createdAt: string;
  blockchain_listing_id?: string;
}

// Adapt backend Order to frontend Request format
export interface RequestData {
  id: string;
  listing: CampaignData;
  buyer: {
    id: number;
    username: string;
  };
  status: string;
  txHash?: string;
  deliveryCid?: string;
  createdAt: string;
  deadline?: string;
}

// Convert Listing to Campaign
export const listingToCampaign = (listing: Listing): CampaignData => {
  return {
    id: listing.id.toString(),
    title: listing.title,
    description: listing.description,
    price: parseFloat(listing.price),
    currency: listing.currency,
    image: listing.image,
    seller: {
      id: listing.seller,
      username: listing.seller_username,
      rating: 5, // Default rating, will be replaced with actual data
    },
    status: listing.status,
    paymentMethod: listing.payment_method,
    escrowType: listing.escrow_type,
    createdAt: listing.created_at,
    blockchain_listing_id: listing.blockchain_listing_id,
  };
};

// Convert Order to Request
export const orderToRequest = (order: Order, listing?: Listing): RequestData => {
  return {
    id: order.id.toString(),
    listing: listing ? listingToCampaign(listing) : {
      id: order.listing.toString(),
      title: 'Loading...',
      description: '',
      price: 0,
      currency: 'USDC',
      seller: { id: order.seller, username: 'Seller', rating: 5 },
      status: 'open',
      paymentMethod: 'escrow',
      createdAt: '',
    },
    buyer: {
      id: order.buyer,
      username: `Buyer #${order.buyer}`,
    },
    status: order.status,
    txHash: order.tx_hash,
    deliveryCid: order.delivery_cid,
    createdAt: order.created_at,
    deadline: order.deadline,
  };
};

// Get status badge info
export const getStatusBadge = (status: string): { label: string; color: string } => {
  const statusMap: Record<string, { label: string; color: string }> = {
    open: { label: 'Available', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    filled: { label: 'Sold', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    delivered: { label: 'Delivered', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    released: { label: 'Completed', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    refunded: { label: 'Refunded', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    disputed: { label: 'Disputed', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    canceled: { label: 'Canceled', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    inactive: { label: 'Inactive', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  };

  return statusMap[status] || { label: status, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
};

// Get payment method badge
export const getPaymentMethodBadge = (method: string, escrowType?: string): string => {
  if (method === 'direct') return 'Direct Payment';
  if (method === 'escrow' && escrowType) {
    const typeMap: Record<string, string> = {
      disputable: 'Escrow (Disputable)',
      api_approval: 'Escrow (API Verified)',
      onchain_approval: 'Escrow (Onchain Verified)',
    };
    return typeMap[escrowType] || 'Escrow';
  }
  return 'Escrow';
};

// Format price with currency
export const formatPrice = (price: number, currency: string): string => {
  return `${price.toFixed(2)} ${currency}`;
};

// Shorten wallet address
export const shortenAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
