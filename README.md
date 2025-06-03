# 飲品點餐自取系統

## 專案簡介
此專案是一套線上飲品點餐自取系統，支援顧客、員工、經理三種角色使用，提供線上點餐、訂單管理、營業設定與數據統計等功能。

---

## 主要功能與系統設計
- **多角色登入**：顧客、員工、經理分權操作，登入時選擇角色並輸入不同角色帳號密碼，系統驗證後會依據角色導向不同的操作介面。
- **顧客端**：瀏覽菜單、加入購物車、選擇取餐時間與付款方式、下單、查詢與取消訂單。
- **員工端**：查看所有訂單、依訂單狀態進行確認、製作、完成、取消等訂單狀態操作更改。
- **經理端**：菜單管理（新增/編輯/刪除商品）、營業時間與狀態設定、取餐時間選項設定、訂單與營運數據統計。
- **資料流**：此系統平台資料操作皆透過 Supabase API 進行資料的ＣＲＵＤ四大功能，能即時同步更新。
- **前端**：以 Next.js + React 開發，採用元件化設計。
- **後端**：使用 Supabase 作為雲端資料庫與 API 服務，負責用戶、菜單、訂單、營業設定等資料存取。

---

## 使用技術
- **前端框架**：Next.js 14, React 18
- **UI 元件**：Radix UI, Shadcn/ui, Tailwind CSS
- **圖示**：Lucide-react
- **後端服務**：Supabase (PostgreSQL, Auth, Storage)
- **型別管理**：TypeScript

---

## 使用方式

1. **安裝依賴**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **設定環境變數**
   
    於根目錄建立 `.env.local`，設定資料庫 「Supabase」 連線資訊：
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://uoaotcmhprhfaiobnyjo.supabase.co

    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvYW90Y21ocHJoZmFpb2JueWpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5Mjk5OTMsImV4cCI6MjA2NDUwNTk5M30.ZvRXXncjg0T4p4PpK7dd85nmvZUPN-qUGfdfOAPc_9Y
     ```

3. **啟動伺服器**
   ```bash
   npm run dev
   ```

4. **瀏覽系統**
    
    1. 開啟瀏覽器進入 [http://localhost:3000](http://localhost:3000)

    2. 選擇身份（顧客/員工/經理）登入體驗各角色功能

---

## 使用流程

### 顧客
![顧客流程圖](https://drive.google.com/file/d/1nAKFzwrh81gDE-cCjZ7m7rT1MSuZAs_r/view?usp=drive_link)

### 員工
![員工流程圖](https://drive.google.com/file/d/1RmFsaMma32LlE1n5C4WS14Oa98syD5U7/view?usp=drive_link)


### 經理
![經理流程圖](https://drive.google.com/file/d/1Vjuxn9RYZwgnMHW64221E3gAMuozbNsN/view?usp=drive_link)

---