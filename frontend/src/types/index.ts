export type UserRole = 'admin' | 'customer';

export interface User {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  role: UserRole;
  customer_id?: number | null;
  address?: string | null;
  status?: 'active' | 'disabled';
  created_at?: string;
}

export interface Customer {
  id: number;
  user_id?: number | null;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  customer_type?: 'retail' | 'wholesale';
  account_status?: 'active' | 'disabled';
  total_orders?: number;
  total_spent?: number;
  last_order_date?: string | null;
  last_bill_date?: string | null;
  created_at?: string;
}

export interface Product {
  id: number;
  name: string;
  name_tamil?: string | null;
  category: string;
  sku: string;
  barcode?: string | null;
  purchase_price: number; // Cost / Purchase Rate
  selling_price: number;  // Standard Retail Rate
  w_rate: number;         // Wholesale Rate (W-Rate)
  c_rate: number;         // Customer Rate (C-Rate)
  stock: number;
  minimum_stock: number;
  unit: string;
  image?: string | null;
  status: 'active' | 'inactive';
  stock_status?: 'available' | 'low_stock' | 'out_of_stock';
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  rate_type?: 'c_rate' | 'w_rate';
}

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface OrderItem {
  id?: number;
  order_id?: number;
  product_id: number;
  product_name: string;
  product_name_tamil?: string | null;
  quantity: number;
  unit: string;
  price: number;
  rate_type?: 'c_rate' | 'w_rate';
  total: number;
  image?: string | null;
  sku?: string;
  available_stock?: number;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id?: number | null;
  customer_name: string;
  customer_phone: string;
  delivery_address?: string | null;
  notes?: string | null;
  subtotal: number;
  tax: number;
  total_amount: number;
  status: OrderStatus;
  items?: OrderItem[];
  item_count?: number;
  items_summary?: string;
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'other';
export type DiscountType = 'flat' | 'percentage';

export interface BillItem {
  id?: number;
  bill_id?: number;
  product_id: number;
  product_name: string;
  product_name_tamil?: string | null;
  sku?: string;
  unit: string;
  quantity: number;
  price: number;
  rate_type?: 'c_rate' | 'w_rate';
  total: number;
}

export interface Bill {
  id: number;
  bill_number: string;
  customer_id?: number | null;
  customer_name: string;
  customer_phone?: string | null;
  subtotal: number;
  discount: number;
  discount_type: DiscountType;
  tax: number;
  tax_percentage: number;
  grand_total: number;
  payment_method: PaymentMethod;
  payment_reference?: string | null;
  order_id?: number | null;
  items?: BillItem[];
  item_count?: number;
  items_summary?: string;
  created_at: string;
}

export type StockTransactionType =
  | 'BILL_SALE'
  | 'ORDER_FULFILL'
  | 'RESTOCK'
  | 'REDUCTION'
  | 'CORRECTION'
  | 'INITIAL';

export interface StockTransaction {
  id: number;
  product_id: number;
  product_name: string;
  transaction_type: StockTransactionType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference_id?: string | null;
  notes?: string | null;
  admin_name: string;
  created_at: string;
  sku?: string;
  unit?: string;
}

export interface ShopSettings {
  shop_name: string;
  shop_address: string;
  shop_phone: string;
  shop_email: string;
  shop_gstin: string;
  receipt_footer: string;
  default_tax_rate: string;
  currency_symbol: string;
  thermal_paper_width: string;
  upi_id?: string;
}

export interface DashboardStats {
  summary: {
    today_sales: number;
    today_bills: number;
    total_products: number;
    low_stock_products?: number;
    low_stock_count?: number;
    total_customers: number;
    pending_orders: number;
  };
  recent_bills: Bill[];
  recent_orders: Order[];
  low_stock_products: Product[];
  charts: {
    sales_trend: Array<{ date: string; display_date?: string; sales: number; bills_count?: number }>;
    payment_breakdown: Array<{ payment_method: string; total_amount: number; count: number }>;
    top_products: Array<{ name: string; quantity: number; revenue: number }>;
  };
}
