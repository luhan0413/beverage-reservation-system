import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 客戶端 Supabase 實例（單例模式）
let supabaseClient: ReturnType<typeof createClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClient
}

// 類型定義
export interface User {
  id: string
  username: string
  password: string
  role: "customer" | "staff" | "manager"
  name: string
  email?: string
  created_at: string
  updated_at: string
}

export interface MenuItem {
  id: string
  name: string
  price: number
  category: string
  description?: string
  available: boolean
  image_url?: string // 新增圖片 URL 欄位
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  user_id: string
  total: number
  status: "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled"
  pickup_time: string
  payment_method: string
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
  user?: User
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  price: number
  created_at: string
  menu_item?: MenuItem
}

export interface BusinessSettings {
  id: string
  open_time: string
  close_time: string
  is_open: boolean
  created_at: string
  updated_at: string
}

export interface PickupTimeOption {
  id: string
  option_text: string
  is_active: boolean
  created_at: string
  updated_at: string
}
