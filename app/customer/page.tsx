"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Coffee, ShoppingCart, CreditCard, Package, LogOut, Plus, Minus, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { menuService, orderService, businessService } from "@/lib/database"
import type { MenuItem, Order, User, PickupTimeOption } from "@/lib/supabase"
import { MenuItemCard } from "@/components/menu-item-card"

interface CartItem extends MenuItem {
  quantity: number
}

export default function CustomerPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [pickupTimeOptions, setPickupTimeOptions] = useState<PickupTimeOption[]>([])
  const [pickupTime, setPickupTime] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser")
    if (currentUser) {
      const userData = JSON.parse(currentUser)
      if (userData.role !== "customer") {
        router.push("/")
        return
      }
      setUser(userData)
      loadData(userData.id)
    } else {
      router.push("/")
    }
  }, [router])

  const loadData = async (userId: string) => {
    try {
      setLoading(true)
      const [menuData, ordersData, pickupOptions] = await Promise.all([
        menuService.getAll(),
        orderService.getByUserId(userId),
        businessService.getPickupTimeOptions(),
      ])

      setMenuItems(menuData)
      setOrders(ordersData)
      setPickupTimeOptions(pickupOptions)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    router.push("/")
  }

  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find((cartItem) => cartItem.id === item.id)
    let newCart: CartItem[]

    if (existingItem) {
      newCart = cart.map((cartItem) =>
        cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
      )
    } else {
      newCart = [...cart, { ...item, quantity: 1 }]
    }

    setCart(newCart)
  }

  const updateCartQuantity = (id: string, change: number) => {
    const newCart = cart
      .map((item) => {
        if (item.id === id) {
          const newQuantity = item.quantity + change
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : null
        }
        return item
      })
      .filter(Boolean) as CartItem[]

    setCart(newCart)
  }

  const removeFromCart = (id: string) => {
    const newCart = cart.filter((item) => item.id !== id)
    setCart(newCart)
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("購物車是空的")
      return
    }

    if (!pickupTime || !paymentMethod) {
      alert("請選擇取餐時間和付款方式")
      return
    }

    if (!user) {
      alert("用戶信息錯誤")
      return
    }

    try {
      const orderData = {
        user_id: user.id,
        total: getTotalPrice(),
        pickup_time: pickupTime,
        payment_method: paymentMethod,
        items: cart.map((item) => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
      }

      await orderService.create(orderData)

      // 重新載入訂單
      const updatedOrders = await orderService.getByUserId(user.id)
      setOrders(updatedOrders)

      // 清空購物車
      setCart([])
      setPickupTime("")
      setPaymentMethod("")

      alert("訂單已成功提交！")
    } catch (error) {
      console.error("Checkout error:", error)
      alert("下單失敗，請稍後再試")
    }
  }

  const cancelOrder = async (orderId: string) => {
    try {
      await orderService.updateStatus(orderId, "cancelled")

      // 重新載入訂單
      if (user) {
        const updatedOrders = await orderService.getByUserId(user.id)
        setOrders(updatedOrders)
      }
    } catch (error) {
      console.error("Cancel order error:", error)
      alert("取消訂單失敗")
    }
  }

  const getStatusBadge = (status: Order["status"]) => {
    const statusMap = {
      pending: { label: "待確認", variant: "secondary" as const },
      confirmed: { label: "已確認", variant: "default" as const },
      preparing: { label: "製作中", variant: "default" as const },
      ready: { label: "可取餐", variant: "default" as const },
      completed: { label: "已完成", variant: "outline" as const },
      cancelled: { label: "已取消", variant: "destructive" as const },
    }
    return statusMap[status]
  }

  const categories = [...new Set(menuItems.map((item) => item.category))]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Coffee className="h-12 w-12 text-orange-600 mx-auto mb-4 animate-spin" />
          <p>載入中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <div>載入中...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Coffee className="h-8 w-8 text-orange-600" />
              <h1 className="text-xl font-bold">飲品點餐系統</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">歡迎，{user.name}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                登出
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="menu" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="menu">瀏覽菜單</TabsTrigger>
            <TabsTrigger value="cart">
              購物車 {cart.length > 0 && `(${cart.reduce((sum, item) => sum + item.quantity, 0)})`}
            </TabsTrigger>
            <TabsTrigger value="orders">我的訂單</TabsTrigger>
          </TabsList>

          {/* 菜單頁面 */}
          <TabsContent value="menu" className="space-y-6">
            {categories.map((category) => (
              <div key={category}>
                <h2 className="text-2xl font-bold mb-4">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {menuItems
                    .filter((item) => item.category === category)
                    .map((item) => (
                      <MenuItemCard key={item.id} item={item} onAddToCart={addToCart} />
                    ))}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* 購物車頁面 */}
          <TabsContent value="cart" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  購物車
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">購物車是空的</p>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-gray-500">NT$ {item.price}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => updateCartQuantity(item.id, -1)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button variant="outline" size="sm" onClick={() => updateCartQuantity(item.id, 1)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => removeFromCart(item.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    <div className="border-t pt-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span>總計：</span>
                        <span>NT$ {getTotalPrice()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">取餐時間</label>
                        <Select value={pickupTime} onValueChange={setPickupTime}>
                          <SelectTrigger>
                            <SelectValue placeholder="選擇取餐時間" />
                          </SelectTrigger>
                          <SelectContent>
                            {pickupTimeOptions.map((option) => (
                              <SelectItem key={option.id} value={option.option_text}>
                                {option.option_text}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">付款方式</label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger>
                            <SelectValue placeholder="選擇付款方式" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="現金">現金</SelectItem>
                            <SelectItem value="信用卡">信用卡</SelectItem>
                            <SelectItem value="行動支付">行動支付</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button onClick={handleCheckout} className="w-full bg-orange-600 hover:bg-orange-700" size="lg">
                      <CreditCard className="h-4 w-4 mr-2" />
                      結帳
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 訂單頁面 */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  我的訂單
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">尚無訂單記錄</p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-medium">訂單 #{order.id.slice(-8)}</h3>
                            <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                          </div>
                          <Badge {...getStatusBadge(order.status)}>{getStatusBadge(order.status).label}</Badge>
                        </div>

                        <div className="space-y-2 mb-4">
                          {order.order_items?.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>
                                {item.menu_item?.name} x {item.quantity}
                              </span>
                              <span>NT$ {item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t">
                          <div className="text-sm text-gray-500">
                            <div>取餐時間：{order.pickup_time}</div>
                            <div>付款方式：{order.payment_method}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">總計：NT$ {order.total}</div>
                            {order.status === "pending" && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => cancelOrder(order.id)}
                                className="mt-2"
                              >
                                取消訂單
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
