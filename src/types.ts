export type UserRole = 'buyer' | 'seller' | 'admin';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  shop_name?: string;
  whatsapp?: string;
  phone?: string;
  address?: string;
  profile_image?: string;
  balance?: number;
  created_at: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  quantity: number;
  total_amount: number;
  seller_amount: number;
  admin_commission: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: string;
  phone: string;
  payment_method: string;
  created_at: any;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'sale' | 'commission' | 'payout' | 'refund';
  amount: number;
  order_id?: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: any;
}

export interface Product {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  discount_price?: number;
  original_price?: number;
  stock: number;
  category: string;
  images: string[];
  delivery_charges: number;
  condition: 'New' | 'Used';
  delivery_type: 'Local' | 'Nationwide';
  status: 'available' | 'out_of_stock';
  is_approved: boolean;
  is_sponsored?: boolean;
  created_at: any;
}

export interface Banner {
  id: string;
  image_url: string;
  link: string;
  active: boolean;
  title: string;
  order: number;
  type: 'home' | 'category' | 'video';
  category?: string;
}

export interface Campaign {
  id: string;
  title: string;
  image_url: string;
  discount_text: string;
  active: boolean;
  start_date: string;
  end_date: string;
}

export interface PopupAd {
  id: string;
  image_url: string;
  title: string;
  description: string;
  button_text: string;
  button_link: string;
  active: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase?: number;
  active: boolean;
  expiry_date?: string;
}
