import BtcPriceChart from "@/components/btc-price-chart"

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">BTC Price Chart</h1>
        <BtcPriceChart />
      </div>
    </main>
  )
}

