"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import type { MenuItem } from "@/lib/supabase"
import Image from "next/image"

interface MenuItemCardProps {
  item: MenuItem
  onAddToCart: (item: MenuItem) => void
}

export function MenuItemCard({ item, onAddToCart }: MenuItemCardProps) {
  return (
    <Card className="overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
      <CardContent className="p-0">
        {/* 飲品圖片 */}
        <div className="relative h-48 w-full bg-gray-100">
          <Image
            src={item.image_url || "/placeholder.svg?height=200&width=200&text=飲品"}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* 供應狀態標籤 */}
          <div className="absolute top-3 right-3">
            <Badge
              variant={item.available ? "default" : "secondary"}
              className={item.available ? "bg-green-600 text-white" : "bg-gray-500 text-white"}
            >
              {item.available ? "供應中" : "暫停供應"}
            </Badge>
          </div>
        </div>

        {/* 飲品資訊 */}
        <div className="p-4">
          <div className="mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
          </div>

          {item.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>}

          <div className="flex justify-between items-center">
            <span className="text-xl font-bold text-orange-600">NT$ {item.price}</span>
            <Button
              onClick={() => onAddToCart(item)}
              disabled={!item.available}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              加入購物車
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
