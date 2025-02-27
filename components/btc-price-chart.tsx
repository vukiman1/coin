"use client"

import { useEffect, useState, useCallback } from "react"
import { formatDistanceToNow } from "date-fns"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

interface BtcData {
  _id: string
  price: number
  createdAt: string
  __v: number
}

interface ApiResponse {
  errors: Record<string, any>
  data: BtcData[]
}

interface ApiResponseLastest {
  errors: Record<string, any>
  data: BtcData
}

export default function BtcPriceChart() {
  const [btcData, setBtcData] = useState<BtcData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date())
  console.log(btcData)

  // Fetch initial historical data
  const fetchHistoricalData = useCallback(async () => {
    try {
      const response = await fetch("/api/btc/list")
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      const data: ApiResponse = await response.json()

      if (!data || !Array.isArray(data.data)) {
        throw new Error("Invalid historical data format received from API")
      }

      setBtcData(data.data)
      setLastUpdateTime(new Date())
      setLoading(false)
    } catch (err) {
      console.error("Error fetching historical BTC data:", err)
      setError("Error fetching historical BTC data. Using mock data instead.")
      setLoading(false)
    }
  }, [])

  // Fetch latest data for real-time updates
  const fetchLatestData = useCallback(async () => {
    try {
      const response = await fetch("/api/btc/latest")
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      const data: ApiResponseLastest = await response.json()

      // if (!data || !Array.isArray(data.data) || data.data.length === 0) {
      //   throw new Error("Invalid latest data format received from API")
      // }

      // disable typescript


      // Only update if we have new data that's different from our latest
      const latestDataPoint = data.data
      if (true) {
        setBtcData((prevData) => {
          // Combine new data with existing data, keeping only the last 10 entries
          const combinedData = [data.data, ...prevData]
          return combinedData.slice(0, 10)
        })
        setLastUpdateTime(new Date())
        console.log(123)
      }
    } catch (err) {
      console.error("Error fetching latest BTC data:", err)
      // Don't set error state here to avoid disrupting the chart display
    }
  }, [btcData])

  useEffect(() => {
    // Initial load of historical data
    const intervalId = setInterval(fetchLatestData, 5000)

    return () => clearInterval(intervalId)
  }, [ fetchLatestData])

  useEffect(() => {
    fetchHistoricalData()
  }, [fetchHistoricalData])

  const latestPrice = btcData.length > 0 ? btcData[0].price : 0
  const previousPrice = btcData.length > 1 ? btcData[1].price : 0
  const priceChange = latestPrice - previousPrice
  const priceChangePercentage = previousPrice ? (priceChange / previousPrice) * 100 : 0
  const isPriceUp = priceChange >= 0

  // Sort data by date and format for display
  const formattedData = [...btcData]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((item) => ({
      ...item,
      formattedDate: new Date(item.createdAt).toLocaleTimeString(),
    }))
    console.log(formattedData);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-yellow-700 dark:text-yellow-400">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Current BTC Price</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold">${latestPrice.toLocaleString()}</span>
            <div className={`ml-4 flex items-center ${isPriceUp ? "text-green-500" : "text-red-500"}`}>
              {isPriceUp ? <ArrowUpIcon className="h-4 w-4 mr-1" /> : <ArrowDownIcon className="h-4 w-4 mr-1" />}
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
                <LineChart data={formattedData} margin={{ top: 10, right: 30, left: 20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="formattedDate" tick={{ fontSize: 12 }} tickMargin={10} />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                    width={80}
                  />
                  <Tooltip
                    content={<ChartTooltipContent formatter={(value) => `$${Number(value).toLocaleString()}`} />}
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

