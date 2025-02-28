"use client"

import { useEffect, useState, useCallback } from "react"
import io from "socket.io-client"
import { formatDistanceToNow } from "date-fns"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

interface BtcData {
  _id?: string
  price: number
  createdAt: string
  __v?: number
}

export default function BtcPriceChart() {
  // -------------------------
  // STATE
  // -------------------------
  const [btcData, setBtcData] = useState<BtcData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Trạng thái kết nối socket
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false)

  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date())

  // -------------------------
  // 1) FETCH DỮ LIỆU BAN ĐẦU (LỊCH SỬ) - fallback
  // -------------------------
  const fetchHistoricalData = useCallback(async () => {
    try {
      const response = await fetch("/api/btc/list")
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      const data = await response.json()
      // data.data = mảng BtcData
      setBtcData(data.data)
      setLastUpdateTime(new Date())
      setLoading(false)
    } catch (err) {
      console.error("Error fetching historical BTC data:", err)
      setError("Error fetching historical BTC data.")
      setLoading(false)
    }
  }, [])

  // -------------------------
  // 2) KẾT NỐI SOCKET.IO VÀ NHẬN GIÁ
  // -------------------------
  useEffect(() => {
    // Kết nối đến server Socket.IO
    const socket = io("https://fc16-222-252-16-194.ngrok-free.app") // Hoặc ws://localhost:3000

    // Khi kết nối thành công
    socket.on("connect", () => {
      console.log("✅ Socket connected!")
      setIsSocketConnected(true)
    })

    // Khi server gửi sự kiện 'priceUpdate'
    socket.on("priceUpdate", (data) => {
      console.log("📩 Received priceUpdate:", data)
      // data = { currency: 'BTC', price: number, timestamp: string }

      // Cập nhật state btcData, chỉ lưu 10 bản ghi
      setBtcData((prev) => {
        const newEntry: BtcData = {
          price: data.price,
          createdAt: data.timestamp,
        }
        const updated = [newEntry, ...prev]
        return updated.slice(0, 10)
      })

      setLastUpdateTime(new Date())
    })

    // Khi socket bị ngắt kết nối
    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected!")
      setIsSocketConnected(false)
    })

    // Cleanup khi unmount
    return () => {
      socket.disconnect()
    }
  }, [])

  // -------------------------
  // 3) Lấy dữ liệu lịch sử 1 lần lúc khởi tạo
  // -------------------------
  useEffect(() => {
    fetchHistoricalData()
  }, [fetchHistoricalData])

  // -------------------------
  // TÍNH TOÁN PRICE, TĂNG/GIẢM
  // -------------------------
  const latestPrice = btcData.length > 0 ? btcData[0].price : 0
  const previousPrice = btcData.length > 1 ? btcData[1].price : 0
  const priceChange = latestPrice - previousPrice
  const priceChangePercentage = previousPrice ? (priceChange / previousPrice) * 100 : 0
  const isPriceUp = priceChange >= 0

  // Sắp xếp dữ liệu để hiển thị chart
  const formattedData = [...btcData]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((item) => ({
      ...item,
      formattedDate: new Date(item.createdAt).toLocaleTimeString(),
    }))

  // -------------------------
  // HIỂN THỊ LOADING
  // -------------------------
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // -------------------------
  // RENDER GIAO DIỆN
  // -------------------------
  return (
    <div className="space-y-6">
      {/* Thông báo lỗi nếu có */}
      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-yellow-700 dark:text-yellow-400">
          {error}
        </div>
      )}

      {/* Trạng thái kết nối socket */}
      <div className="flex items-center">
        <span>Socket Status: </span>
        {isSocketConnected ? (
          <span className="ml-2 text-green-500 font-semibold">Realtime</span>
        ) : (
          <span className="ml-2 text-red-500 font-semibold">Disconnected</span>
        )}
      </div>

      {/* Hiển thị giá hiện tại */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Current BTC Price</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold">${latestPrice.toLocaleString()}</span>
            <div
              className={`ml-4 flex items-center ${
                isPriceUp ? "text-green-500" : "text-red-500"
              }`}
            >
              {isPriceUp ? (
                <ArrowUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 mr-1" />
              )}
              <span className="font-medium">
                {Math.abs(priceChange).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                ({Math.abs(priceChangePercentage).toFixed(2)}%)
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Last updated: {formatDistanceToNow(lastUpdateTime)} ago
          </p>
        </CardContent>
      </Card>

      {/* Chart lịch sử giá */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Price History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ChartContainer
              config={{
                price: {
                  label: "Price",
                  color: "hsl(var(--chart-1))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={formattedData}
                  margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="formattedDate" tick={{ fontSize: 12 }} tickMargin={10} />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                    width={80}
                  />
                  <Tooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => `$${Number(value).toLocaleString()}`}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="var(--color-price)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
