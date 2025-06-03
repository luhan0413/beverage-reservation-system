"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Coffee, Package, Clock, LogOut, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { orderService } from "@/lib/database"
import type { Order, User } from "@/lib/supabase"

export default function StaffPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser")
    if (currentUser) {
      const userData = JSON.parse(currentUser)
      if (userData.role !== "staff") {
        router.push("/")
        return
      }
      setUser(userData)
      loadOrders()
    } else {
      router.push("/")
    }
  }, [router])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const ordersData = await orderService.getAll()
      setOrders(ordersData)
    } catch (error) {
      console.error("Error loading orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    router.push("/")
  }

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      await orderService.updateStatus(orderId, newStatus)
      // 重新載入訂單
      await loadOrders()
    } catch (error) {
      console.error("Error updating order status:", error)
      alert("更新訂單狀態失敗")
    }
  }

  const getStatusBadge = (status: Order["status"]) => {
    const statusMap = {
      pending: { label: "待確認", variant: "secondary" as const, color: "bg-yellow-100 text-yellow-800" },
      confirmed: { label: "已確認", variant: "default" as const, color: "bg-blue-100 text-blue-800" },
      preparing: { label: "製作中", variant: "default" as const, color: "bg-orange-100 text-orange-800" },
      ready: { label: "可取餐", variant: "default" as const, color: "bg-green-100 text-green-800" },
      completed: { label: "已完成", variant: "outline" as const, color: "bg-gray-100 text-gray-800" },
      cancelled: { label: "已取消", variant: "destructive" as const, color: "bg-red-100 text-red-800" },
    }
    return statusMap[status]
  }

  const getStatusActions = (order: Order) => {
    switch (order.status) {
      case "pending":
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => updateOrderStatus(order.id, "confirmed")}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              確認訂單
            </Button>
            <Button size="sm" variant="destructive" onClick={() => updateOrderStatus(order.id, "cancelled")}>
              拒絕訂單
            </Button>
          </div>
        )
      case "confirmed":
        return (
          <Button
            size="sm"
            onClick={() => updateOrderStatus(order.id, "preparing")}
            className="bg-orange-600 hover:bg-orange-700"
          >
            開始製作
          </Button>
        )
      case "preparing":
        return (
          <Button
            size="sm"
            onClick={() => updateOrderStatus(order.id, "ready")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            製作完成
          </Button>
        )
      case "ready":
        return (
          <Button
            size="sm"
            onClick={() => updateOrderStatus(order.id, "completed")}
            className="bg-green-600 hover:bg-green-700"
          >
            已取餐
          </Button>
        )
      default:
        return null
    }
  }

  const getOrdersByStatus = (status: Order["status"]) => {
    return orders.filter((order) => order.status === status)
  }

  const getPendingOrdersCount = () => {
    return orders.filter((order) => order.status === "pending").length
  }

  const getActiveOrdersCount = () => {
    return orders.filter((order) => ["confirmed", "preparing", "ready"].includes(order.status)).length
  }

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
              <h1 className="text-xl font-bold">員工工作台</h1>
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
        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">待處理訂單</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getPendingOrdersCount()}</div>
              <p className="text-xs text-muted-foreground">需要確認的新訂單</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">進行中訂單</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getActiveOrdersCount()}</div>
              <p className="text-xs text-muted-foreground">正在處理的訂單</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今日總訂單</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
              <p className="text-xs text-muted-foreground">包含所有狀態的訂單</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pending">待確認 ({getOrdersByStatus("pending").length})</TabsTrigger>
            <TabsTrigger value="confirmed">已確認 ({getOrdersByStatus("confirmed").length})</TabsTrigger>
            <TabsTrigger value="preparing">製作中 ({getOrdersByStatus("preparing").length})</TabsTrigger>
            <TabsTrigger value="ready">可取餐 ({getOrdersByStatus("ready").length})</TabsTrigger>
            <TabsTrigger value="all">所有訂單</TabsTrigger>
          </TabsList>

          {/* 各狀態的訂單列表 */}
          {["pending", "confirmed", "preparing", "ready"].map((status) => (
            <TabsContent key={status} value={status} className="space-y-4">
              {getOrdersByStatus(status as Order["status"]).length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-500">目前沒有{getStatusBadge(status as Order["status"]).label}的訂單</p>
                  </CardContent>
                </Card>
              ) : (
                getOrdersByStatus(status as Order["status"]).map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">訂單 #{order.id.slice(-8)}</CardTitle>
                          <CardDescription>
                            {order.user?.name} • {new Date(order.created_at).toLocaleString()}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusBadge(order.status).color}>
                          {getStatusBadge(order.status).label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* 訂單項目 */}
                        <div>
                          <h4 className="font-medium mb-2">訂單內容：</h4>
                          <div className="space-y-1">
                            {order.order_items?.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span>
                                  {item.menu_item?.name} x {item.quantity}
                                </span>
                                <span>NT$ {item.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 訂單詳情 */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">取餐時間：</span>
                            <span>{order.pickup_time}</span>
                          </div>
                          <div>
                            <span className="font-medium">付款方式：</span>
                            <span>{order.payment_method}</span>
                          </div>
                        </div>

                        {/* 總計和操作按鈕 */}
                        <div className="flex justify-between items-center pt-4 border-t">
                          <div className="text-lg font-bold">總計：NT$ {order.total}</div>
                          {getStatusActions(order)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          ))}

          {/* 所有訂單 */}
          <TabsContent value="all" className="space-y-4">
            {orders.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">目前沒有任何訂單</p>
                </CardContent>
              </Card>
            ) : (
              orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">訂單 #{order.id.slice(-8)}</CardTitle>
                        <CardDescription>
                          {order.user?.name} • {new Date(order.created_at).toLocaleString()}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusBadge(order.status).color}>{getStatusBadge(order.status).label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* 訂單項目 */}
                      <div>
                        <h4 className="font-medium mb-2">訂單內容：</h4>
                        <div className="space-y-1">
                          {order.order_items?.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>
                                {item.menu_item?.name} x {item.quantity}
                              </span>
                              <span>NT$ {item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 訂單詳情 */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">取餐時間：</span>
                          <span>{order.pickup_time}</span>
                        </div>
                        <div>
                          <span className="font-medium">付款方式：</span>
                          <span>{order.payment_method}</span>
                        </div>
                      </div>

                      {/* 總計和操作按鈕 */}
                      <div className="flex justify-between items-center pt-4 border-t">
                        <div className="text-lg font-bold">總計：NT$ {order.total}</div>
                        {getStatusActions(order)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
