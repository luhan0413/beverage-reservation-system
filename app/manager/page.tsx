"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Coffee, Settings, Menu, BarChart3, LogOut, Plus, Edit, Trash2, Save } from "lucide-react"
import { useRouter } from "next/navigation"
import { menuService, orderService, businessService } from "@/lib/database"
import type { MenuItem, Order, User, BusinessSettings, PickupTimeOption } from "@/lib/supabase"
import Image from "next/image"
import { ImageUpload } from "@/components/image-upload"

export default function ManagerPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)
  const [pickupTimeOptions, setPickupTimeOptions] = useState<PickupTimeOption[]>([])
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: "",
    price: 0,
    category: "",
    description: "",
    available: true,
    image_url: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser")
    if (currentUser) {
      const userData = JSON.parse(currentUser)
      if (userData.role !== "manager") {
        router.push("/")
        return
      }
      setUser(userData)
      loadData()
    } else {
      router.push("/")
    }
  }, [router])

  const loadData = async () => {
    try {
      setLoading(true)
      const [menuData, ordersData, settingsData, pickupOptions] = await Promise.all([
        menuService.getAll(),
        orderService.getAll(),
        businessService.getSettings(),
        businessService.getPickupTimeOptions(),
      ])

      setMenuItems(menuData)
      setOrders(ordersData)
      setBusinessSettings(settingsData)
      setPickupTimeOptions(pickupOptions)
    } catch (error) {
      console.error("Error loading data:", error)
      alert("載入資料失敗，請檢查網路連接")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    router.push("/")
  }

  const saveBusinessSettings = async () => {
    if (!businessSettings) {
      alert("營業設定資料錯誤")
      return
    }

    try {
      setSaving(true)
      const updatedSettings = await businessService.updateSettings(businessSettings)
      setBusinessSettings(updatedSettings)
      alert("營業設定已保存")
    } catch (error) {
      console.error("Error saving business settings:", error)
      alert("保存失敗，請稍後再試")
    } finally {
      setSaving(false)
    }
  }

  const addMenuItem = async () => {
    // 詳細的驗證
    if (!newItem.name || newItem.name.trim() === "") {
      alert("請輸入商品名稱")
      return
    }

    if (!newItem.price || newItem.price <= 0) {
      alert("請輸入有效的價格")
      return
    }

    if (!newItem.category || newItem.category.trim() === "") {
      alert("請選擇商品分類")
      return
    }

    try {
      console.log("Adding menu item with data:", newItem)

      const itemToCreate = {
        name: newItem.name.trim(),
        price: Number(newItem.price),
        category: newItem.category.trim(),
        description: newItem.description?.trim() || "",
        available: newItem.available !== undefined ? newItem.available : true,
        image_url: newItem.image_url?.trim() || "",
      }

      console.log("Processed item data:", itemToCreate)

      const item = await menuService.create(itemToCreate)

      console.log("Successfully created item:", item)

      setMenuItems([...menuItems, item])
      setNewItem({
        name: "",
        price: 0,
        category: "",
        description: "",
        available: true,
        image_url: "",
      })
      alert("商品已新增")
    } catch (error) {
      console.error("Error adding menu item:", error)

      // 更詳細的錯誤處理
      if (error instanceof Error) {
        alert(`新增失敗：${error.message}`)
      } else if (typeof error === "object" && error !== null) {
        const errorMessage = JSON.stringify(error)
        console.error("Error object:", errorMessage)
        alert(`新增失敗：${errorMessage}`)
      } else {
        alert("新增失敗，請稍後再試")
      }
    }
  }

  const updateMenuItem = async (item: MenuItem) => {
    try {
      const updatedItem = await menuService.update(item.id, item)
      setMenuItems(menuItems.map((menuItem) => (menuItem.id === item.id ? updatedItem : menuItem)))
      setEditingItem(null)
      alert("商品已更新")
    } catch (error) {
      console.error("Error updating menu item:", error)
      alert("更新失敗")
    }
  }

  const deleteMenuItem = async (id: string) => {
    if (confirm("確定要刪除這個商品嗎？")) {
      try {
        await menuService.delete(id)
        setMenuItems(menuItems.filter((item) => item.id !== id))
        alert("商品已刪除")
      } catch (error) {
        console.error("Error deleting menu item:", error)
        alert("刪除失敗")
      }
    }
  }

  const toggleItemAvailability = async (id: string) => {
    const item = menuItems.find((item) => item.id === id)
    if (!item) return

    try {
      const updatedItem = await menuService.update(id, { available: !item.available })
      setMenuItems(menuItems.map((menuItem) => (menuItem.id === id ? updatedItem : menuItem)))
    } catch (error) {
      console.error("Error toggling item availability:", error)
      alert("更新失敗")
    }
  }

  const updatePickupTimeOptions = async () => {
    try {
      setSaving(true)
      const optionTexts = pickupTimeOptions.map((option) => option.option_text)
      const updatedOptions = await businessService.updatePickupTimeOptions(optionTexts)
      setPickupTimeOptions(updatedOptions)
      alert("取餐時間選項已更新")
    } catch (error) {
      console.error("Error updating pickup time options:", error)
      alert("更新失敗")
    } finally {
      setSaving(false)
    }
  }

  const getOrderStats = () => {
    const today = new Date().toDateString()
    const todayOrders = orders.filter((order) => new Date(order.created_at).toDateString() === today)

    return {
      total: todayOrders.length,
      revenue: todayOrders.reduce((sum, order) => sum + order.total, 0),
      pending: todayOrders.filter((order) => order.status === "pending").length,
      completed: todayOrders.filter((order) => order.status === "completed").length,
    }
  }

  const categories = [...new Set(menuItems.map((item) => item.category))]
  const stats = getOrderStats()

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

  if (!user || !businessSettings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p>載入資料中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Coffee className="h-8 w-8 text-orange-600" />
              <h1 className="text-xl font-bold">經理管理台</h1>
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
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">營運概況</TabsTrigger>
            <TabsTrigger value="menu">菜單管理</TabsTrigger>
            <TabsTrigger value="settings">營業設定</TabsTrigger>
            <TabsTrigger value="orders">訂單管理</TabsTrigger>
          </TabsList>

          {/* 營運概況 */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">今日訂單</CardTitle>
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">筆訂單</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">今日營收</CardTitle>
                  <BarChart3 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">NT$ {stats.revenue}</div>
                  <p className="text-xs text-muted-foreground">總營收</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">待處理</CardTitle>
                  <BarChart3 className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pending}</div>
                  <p className="text-xs text-muted-foreground">筆訂單</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">已完成</CardTitle>
                  <BarChart3 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completed}</div>
                  <p className="text-xs text-muted-foreground">筆訂單</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>營業狀態</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">目前營業狀態</h3>
                    <p className="text-sm text-gray-500">
                      營業時間：{businessSettings.open_time} - {businessSettings.close_time}
                    </p>
                  </div>
                  <Badge variant={businessSettings.is_open ? "default" : "secondary"}>
                    {businessSettings.is_open ? "營業中" : "休息中"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 菜單管理 */}
          <TabsContent value="menu" className="space-y-6">
            {/* 新增商品 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  新增商品
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="name">商品名稱 *</Label>
                    <Input
                      id="name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder="輸入商品名稱"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">價格 *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                      placeholder="輸入價格"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">分類 *</Label>
                    <Select
                      value={newItem.category}
                      onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選擇分類" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="咖啡">咖啡</SelectItem>
                        <SelectItem value="茶類">茶類</SelectItem>
                        <SelectItem value="果汁">果汁</SelectItem>
                        <SelectItem value="其他">其他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="description">商品描述</Label>
                    <Textarea
                      id="description"
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      placeholder="輸入商品描述"
                    />
                  </div>
                  <div>
                    <Label>商品圖片</Label>
                    <ImageUpload
                      currentImageUrl={newItem.image_url}
                      onImageChange={(imageUrl) => setNewItem({ ...newItem, image_url: imageUrl })}
                    />
                    {newItem.image_url && (
                      <div className="mt-2 relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={newItem.image_url || "/placeholder.svg"}
                          alt="預覽"
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <Button onClick={addMenuItem} className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="h-4 w-4 mr-2" />
                    新增商品
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 商品列表 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Menu className="h-5 w-5" />
                  菜單商品
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {categories.map((category) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold mb-3">{category}</h3>
                      <div className="grid gap-4">
                        {menuItems
                          .filter((item) => item.category === category)
                          .map((item) => (
                            <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                              {/* 商品圖片 */}
                              <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                  src={item.image_url || "/placeholder.svg?height=80&width=80&text=飲品"}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                  sizes="80px"
                                />
                              </div>

                              {editingItem?.id === item.id ? (
                                <div className="flex-1 space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                      value={editingItem.name}
                                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                      placeholder="商品名稱"
                                    />
                                    <Input
                                      type="number"
                                      value={editingItem.price}
                                      onChange={(e) =>
                                        setEditingItem({ ...editingItem, price: Number(e.target.value) })
                                      }
                                      placeholder="價格"
                                    />
                                  </div>
                                  <Input
                                    value={editingItem.description}
                                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                                    placeholder="描述"
                                  />
                                  <div>
                                    <Label>商品圖片</Label>
                                    <ImageUpload
                                      currentImageUrl={editingItem.image_url}
                                      onImageChange={(imageUrl) =>
                                        setEditingItem({ ...editingItem, image_url: imageUrl })
                                      }
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={() => updateMenuItem(editingItem)}>
                                      保存
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>
                                      取消
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                      <h4 className="font-medium">{item.name}</h4>
                                      <Badge variant={item.available ? "default" : "secondary"}>
                                        {item.available ? "供應中" : "暫停供應"}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-1">{item.description}</p>
                                    <p className="text-lg font-bold text-orange-600">NT$ {item.price}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={item.available}
                                      onCheckedChange={() => toggleItemAvailability(item.id)}
                                    />
                                    <Button size="sm" variant="outline" onClick={() => setEditingItem(item)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => deleteMenuItem(item.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 營業設定 */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  營業時間設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">營業狀態</h3>
                    <p className="text-sm text-gray-500">控制店家是否接受新訂單</p>
                  </div>
                  <Switch
                    checked={businessSettings.is_open}
                    onCheckedChange={(checked) => setBusinessSettings({ ...businessSettings, is_open: checked })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="openTime">開店時間</Label>
                    <Input
                      id="openTime"
                      type="time"
                      value={businessSettings.open_time}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, open_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="closeTime">關店時間</Label>
                    <Input
                      id="closeTime"
                      type="time"
                      value={businessSettings.close_time}
                      onChange={(e) => setBusinessSettings({ ...businessSettings, close_time: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>取餐時間選項</Label>
                  <div className="space-y-2 mt-2">
                    {pickupTimeOptions.map((option, index) => (
                      <div key={option.id} className="flex items-center gap-2">
                        <Input
                          value={option.option_text}
                          onChange={(e) => {
                            const newOptions = [...pickupTimeOptions]
                            newOptions[index] = { ...option, option_text: e.target.value }
                            setPickupTimeOptions(newOptions)
                          }}
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            const newOptions = pickupTimeOptions.filter((_, i) => i !== index)
                            setPickupTimeOptions(newOptions)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setPickupTimeOptions([
                          ...pickupTimeOptions,
                          {
                            id: `temp-${Date.now()}`,
                            option_text: "新時間選項",
                            is_active: true,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                          },
                        ])
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      新增時間選項
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={saveBusinessSettings} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "保存中..." : "保存營業設定"}
                  </Button>
                  <Button onClick={updatePickupTimeOptions} variant="outline" disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "保存中..." : "保存取餐時間"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 訂單管理 */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>訂單管理</CardTitle>
                <CardDescription>查看和管理所有訂單</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">目前沒有任何訂單</p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-medium">訂單 #{order.id.slice(-8)}</h3>
                            <p className="text-sm text-gray-500">
                              {order.user?.name} • {new Date(order.created_at).toLocaleString()}
                            </p>
                          </div>
                          <Badge
                            variant={
                              order.status === "completed"
                                ? "default"
                                : order.status === "cancelled"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {order.status === "pending" && "待確認"}
                            {order.status === "confirmed" && "已確認"}
                            {order.status === "preparing" && "製作中"}
                            {order.status === "ready" && "可取餐"}
                            {order.status === "completed" && "已完成"}
                            {order.status === "cancelled" && "已取消"}
                          </Badge>
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
                          <div className="text-lg font-bold">總計：NT$ {order.total}</div>
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
