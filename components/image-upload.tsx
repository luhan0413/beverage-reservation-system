"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, ImageIcon, X } from "lucide-react"
import Image from "next/image"

interface ImageUploadProps {
  currentImageUrl?: string
  onImageChange: (imageUrl: string) => void
  trigger?: React.ReactNode
}

export function ImageUpload({ currentImageUrl, onImageChange, trigger }: ImageUploadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [urlInput, setUrlInput] = useState(currentImageUrl || "")
  const [uploading, setUploading] = useState(false)
  const [uploadMethod, setUploadMethod] = useState<"file" | "url">("file")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // 檢查文件類型
      if (!file.type.startsWith("image/")) {
        alert("請選擇圖片文件")
        return
      }

      // 檢查文件大小 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("圖片大小不能超過 5MB")
        return
      }

      setSelectedFile(file)

      // 創建預覽 URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const compressImage = (file: File, maxWidth = 400, quality = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = document.createElement("img")

      img.onload = () => {
        // 計算新尺寸，保持比例
        let { width, height } = img
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height
            height = maxWidth
          }
        }

        canvas.width = width
        canvas.height = height

        // 繪製並壓縮圖片
        ctx?.drawImage(img, 0, 0, width, height)
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality)
        resolve(compressedDataUrl)
      }

      img.src = URL.createObjectURL(file)
    })
  }

  const handleUpload = async () => {
    if (uploadMethod === "url") {
      if (!urlInput.trim()) {
        alert("請輸入圖片 URL")
        return
      }
      onImageChange(urlInput.trim())
      setIsOpen(false)
      return
    }

    if (!selectedFile) {
      alert("請選擇圖片文件")
      return
    }

    try {
      setUploading(true)

      // 壓縮圖片
      const compressedImage = await compressImage(selectedFile)

      // 在實際應用中，這裡會上傳到雲端服務
      // 現在我們模擬上傳過程並使用 base64 數據
      await new Promise((resolve) => setTimeout(resolve, 1000)) // 模擬上傳延遲

      // 生成一個模擬的圖片 URL（在實際應用中這會是雲端服務返回的 URL）
      const mockImageUrl = compressedImage

      onImageChange(mockImageUrl)
      setIsOpen(false)
      setSelectedFile(null)
      setPreviewUrl("")

      // 清理 URL 對象
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl)
      }
    } catch (error) {
      console.error("圖片上傳失敗:", error)
      alert("圖片上傳失敗，請稍後再試")
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    onImageChange("")
    setIsOpen(false)
    setSelectedFile(null)
    setPreviewUrl("")
    setUrlInput("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full">
            <ImageIcon className="h-4 w-4 mr-2" />
            {currentImageUrl ? "更換圖片" : "上傳圖片"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>圖片設定</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 當前圖片預覽 */}
          {currentImageUrl && (
            <div className="space-y-2">
              <Label>當前圖片</Label>
              <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={currentImageUrl || "/placeholder.svg"}
                  alt="當前圖片"
                  fill
                  className="object-cover"
                  sizes="(max-width: 400px) 100vw, 400px"
                />
              </div>
            </div>
          )}

          {/* 上傳方式選擇 */}
          <div className="flex gap-2">
            <Button
              variant={uploadMethod === "file" ? "default" : "outline"}
              onClick={() => setUploadMethod("file")}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              上傳文件
            </Button>
            <Button
              variant={uploadMethod === "url" ? "default" : "outline"}
              onClick={() => setUploadMethod("url")}
              className="flex-1"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              圖片 URL
            </Button>
          </div>

          {uploadMethod === "file" ? (
            <div className="space-y-4">
              {/* 文件選擇 */}
              <div>
                <Label htmlFor="file-upload">選擇圖片文件</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">支援 JPG、PNG、WebP 格式，最大 5MB</p>
              </div>

              {/* 圖片預覽 */}
              {previewUrl && (
                <div className="space-y-2">
                  <Label>圖片預覽</Label>
                  <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={previewUrl || "/placeholder.svg"}
                      alt="圖片預覽"
                      fill
                      className="object-cover"
                      sizes="(max-width: 400px) 100vw, 400px"
                    />
                  </div>
                  <p className="text-xs text-gray-500">圖片將自動壓縮和優化</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="url-input">圖片 URL</Label>
              <Input
                id="url-input"
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-gray-500">請輸入有效的圖片 URL</p>
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={
                uploading || (uploadMethod === "file" && !selectedFile) || (uploadMethod === "url" && !urlInput.trim())
              }
              className="flex-1"
            >
              {uploading ? "上傳中..." : "確認"}
            </Button>
            {currentImageUrl && (
              <Button variant="destructive" onClick={handleRemoveImage}>
                <X className="h-4 w-4 mr-2" />
                移除圖片
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
