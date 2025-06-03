import { getSupabaseClient } from "./supabase"
import type { User, MenuItem, Order, BusinessSettings, PickupTimeOption } from "./supabase"

const supabase = getSupabaseClient()

// 用戶相關操作
export const userService = {
  async login(username: string, password: string, role: string) {
    try {
      console.log("Attempting login with:", { username, role })

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .eq("password", password)
        .eq("role", role)

      console.log("Supabase response:", { data, error })

      if (error) {
        console.error("Supabase error:", error)
        throw error
      }

      if (!data || data.length === 0) {
        throw new Error("用戶名、密碼或角色不正確")
      }

      console.log("Login successful:", data[0])
      return data[0] as User
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  },

  async getById(id: string) {
    const { data, error } = await supabase.from("users").select("*").eq("id", id).single()

    if (error) throw error
    return data as User
  },

  // 測試連接函數
  async testConnection() {
    try {
      const { data, error } = await supabase.from("users").select("count", { count: "exact" })
      console.log("Connection test:", { data, error })
      return { success: !error, data, error }
    } catch (error) {
      console.error("Connection test failed:", error)
      return { success: false, error }
    }
  },
}

// 菜單相關操作
export const menuService = {
  async getAll() {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true })

    if (error) throw error
    return data as MenuItem[]
  },

  async create(item: Omit<MenuItem, "id" | "created_at" | "updated_at">) {
    try {
      console.log("Creating menu item with data:", item)

      // 確保所有必需的欄位都存在
      const menuItemData = {
        name: item.name,
        price: Number(item.price),
        category: item.category,
        description: item.description || "",
        available: item.available !== undefined ? item.available : true,
        image_url: item.image_url || "",
      }

      console.log("Processed menu item data:", menuItemData)

      const { data, error } = await supabase.from("menu_items").insert([menuItemData]).select().single()

      console.log("Supabase insert response:", { data, error })

      if (error) {
        console.error("Supabase insert error:", error)
        throw error
      }

      if (!data) {
        throw new Error("No data returned from insert operation")
      }

      return data as MenuItem
    } catch (error) {
      console.error("Error in menuService.create:", error)
      throw error
    }
  },

  async update(id: string, updates: Partial<MenuItem>) {
    try {
      console.log("Updating menu item:", id, updates)

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      }

      // 移除 id, created_at 等不應該更新的欄位
      delete updateData.id
      delete updateData.created_at

      const { data, error } = await supabase.from("menu_items").update(updateData).eq("id", id).select().single()

      console.log("Supabase update response:", { data, error })

      if (error) {
        console.error("Supabase update error:", error)
        throw error
      }

      return data as MenuItem
    } catch (error) {
      console.error("Error in menuService.update:", error)
      throw error
    }
  },

  async delete(id: string) {
    try {
      console.log("Deleting menu item:", id)

      const { error } = await supabase.from("menu_items").delete().eq("id", id)

      if (error) {
        console.error("Supabase delete error:", error)
        throw error
      }
    } catch (error) {
      console.error("Error in menuService.delete:", error)
      throw error
    }
  },
}

// 訂單相關操作
export const orderService = {
  async getAll() {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        user:users(*),
        order_items(
          *,
          menu_item:menu_items(*)
        )
      `)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data as Order[]
  },

  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items(
          *,
          menu_item:menu_items(*)
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data as Order[]
  },

  async create(order: {
    user_id: string
    total: number
    pickup_time: string
    payment_method: string
    items: Array<{
      menu_item_id: string
      quantity: number
      price: number
    }>
  }) {
    // 創建訂單
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          user_id: order.user_id,
          total: order.total,
          status: "pending",
          pickup_time: order.pickup_time,
          payment_method: order.payment_method,
        },
      ])
      .select()
      .single()

    if (orderError) throw orderError

    // 創建訂單項目
    const orderItems = order.items.map((item) => ({
      order_id: orderData.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      price: item.price,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) throw itemsError

    return orderData as Order
  },

  async updateStatus(id: string, status: Order["status"]) {
    const { data, error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data as Order
  },
}

// 營業設置相關操作
export const businessService = {
  async getSettings() {
    try {
      const { data, error } = await supabase.from("business_settings").select("*").limit(1)

      if (error) throw error

      // 如果沒有設定記錄，創建一個預設的
      if (!data || data.length === 0) {
        console.log("No business settings found, creating default...")
        const defaultSettings = {
          open_time: "08:00",
          close_time: "22:00",
          is_open: true,
        }

        const { data: newData, error: insertError } = await supabase
          .from("business_settings")
          .insert([defaultSettings])
          .select()
          .single()

        if (insertError) throw insertError
        return newData as BusinessSettings
      }

      return data[0] as BusinessSettings
    } catch (error) {
      console.error("Error getting business settings:", error)
      throw error
    }
  },

  async updateSettings(updates: Partial<BusinessSettings>) {
    try {
      console.log("Updating business settings with:", updates)

      // 先獲取現有設定
      const { data: existingData, error: fetchError } = await supabase.from("business_settings").select("*").limit(1)

      if (fetchError) throw fetchError

      if (!existingData || existingData.length === 0) {
        // 如果沒有現有設定，創建新的
        console.log("Creating new business settings...")
        const { data, error } = await supabase
          .from("business_settings")
          .insert([{ ...updates, updated_at: new Date().toISOString() }])
          .select()
          .single()

        if (error) throw error
        return data as BusinessSettings
      } else {
        // 更新現有設定
        console.log("Updating existing business settings with ID:", existingData[0].id)
        const { data, error } = await supabase
          .from("business_settings")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", existingData[0].id)
          .select()
          .single()

        if (error) {
          console.error("Update error:", error)
          throw error
        }
        return data as BusinessSettings
      }
    } catch (error) {
      console.error("Error updating business settings:", error)
      throw error
    }
  },

  async getPickupTimeOptions() {
    try {
      const { data, error } = await supabase
        .from("pickup_time_options")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true })

      if (error) throw error

      // 如果沒有取餐時間選項，創建預設的
      if (!data || data.length === 0) {
        console.log("No pickup time options found, creating default...")
        const defaultOptions = [
          { option_text: "30分鐘後", is_active: true },
          { option_text: "1小時後", is_active: true },
          { option_text: "2小時後", is_active: true },
        ]

        const { data: newData, error: insertError } = await supabase
          .from("pickup_time_options")
          .insert(defaultOptions)
          .select()

        if (insertError) throw insertError
        return newData as PickupTimeOption[]
      }

      return data as PickupTimeOption[]
    } catch (error) {
      console.error("Error getting pickup time options:", error)
      throw error
    }
  },

  async updatePickupTimeOptions(options: string[]) {
    try {
      console.log("Updating pickup time options:", options)

      // 先刪除所有現有選項
      const { error: deleteError } = await supabase
        .from("pickup_time_options")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000")

      if (deleteError) {
        console.error("Delete error:", deleteError)
        throw deleteError
      }

      // 插入新選項
      if (options.length > 0) {
        const newOptions = options.map((option) => ({
          option_text: option,
          is_active: true,
        }))

        const { data, error } = await supabase.from("pickup_time_options").insert(newOptions).select()

        if (error) {
          console.error("Insert error:", error)
          throw error
        }
        return data as PickupTimeOption[]
      }

      return []
    } catch (error) {
      console.error("Error updating pickup time options:", error)
      throw error
    }
  },
}
