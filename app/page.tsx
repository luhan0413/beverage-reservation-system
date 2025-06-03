"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Coffee, Users, UserCheck } from "lucide-react"
import { userService } from "@/lib/database"
import { useRouter } from "next/navigation"

type UserRole = "customer" | "staff" | "manager"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [selectedRole, setSelectedRole] = useState<UserRole>("customer")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!username || !password) {
      setError("請輸入帳號和密碼")
      return
    }

    setLoading(true)
    setError("")

    try {
      const user = await userService.login(username, password, selectedRole)

      // 儲存使用者資訊到 localStorage
      localStorage.setItem("currentUser", JSON.stringify(user))

      // 根據角色重定向
      switch (user.role) {
        case "customer":
          router.push("/customer")
          break
        case "staff":
          router.push("/staff")
          break
        case "manager":
          router.push("/manager")
          break
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("帳號密碼錯誤或角色不符")
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "customer":
        return <Coffee className="h-6 w-6" />
      case "staff":
        return <Users className="h-6 w-6" />
      case "manager":
        return <UserCheck className="h-6 w-6" />
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "customer":
        return "顧客"
      case "staff":
        return "員工"
      case "manager":
        return "經理"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Coffee className="h-12 w-12 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">飲品點餐自取系統</CardTitle>
          <CardDescription>請選擇您的身份並登入系統</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">身份選擇</Label>
            <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["customer", "staff", "manager"] as UserRole[]).map((role) => (
                  <SelectItem key={role} value={role}>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(role)}
                      {getRoleLabel(role)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">帳號</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="請輸入帳號"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密碼</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入密碼"
              disabled={loading}
              onKeyPress={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          <Button onClick={handleLogin} className="w-full" disabled={loading}>
            {loading ? "登入中..." : "登入"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
