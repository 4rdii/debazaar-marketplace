// Backend API Types

export interface UserProfile {
  id: number;
  telegram_id?: string;
  wallet_address?: string;
  privy_user_id?: string;
  rating: number;
  total_orders: number;
  dispute_count: number;
  dispute_rate: number;
}

export interface Listing {
  id: number;
  seller: number;
  seller_username: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  image?: string;
  payment_method: 'escrow' | 'direct';
  escrow_type?: 'disputable' | 'api_approval' | 'onchain_approval';
  status: 'open' | 'filled' | 'delivered' | 'released' | 'refunded' | 'disputed' | 'canceled' | 'inactive';
  duration: number;
  created_at: string;
  updated_at: string;
  blockchain_listing_id?: string;
  tx_hash?: string;
  seller_contact?: string;
  tweet_username?: string;
  crosschain_nft_contract?: string;
}

export interface Order {
  id: number;
  order_id: string;
  listing: number;
  buyer: number;
  seller: number;
  status: 'created' | 'paid' | 'delivered' | 'confirmed' | 'disputed' | 'completed' | 'cancelled';
  tx_hash?: string;
  delivery_cid?: string;
  tweet_id?: string;
  created_at: string;
  updated_at: string;
  deadline?: string;
}

export interface Dispute {
  id: number;
  order: number;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  result?: 'buyer_wins' | 'seller_wins' | 'partial_refund' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface TransactionData {
  to: string;
  data: string;
  value?: string;
  from?: string;
  gas?: string;
}
