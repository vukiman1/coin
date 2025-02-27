import { NextResponse } from "next/server"

// Replace this URL with your actual backend API endpoint
const BACKEND_API_URL = "http://localhost:3000/btc/list"

export async function GET() {
  try {
    console.log("Attempting to fetch list from:", BACKEND_API_URL)

    // Add timeout and additional options to fetch
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(BACKEND_API_URL, {
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 }, // Cache for 1 minute
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timeoutId)
    })

    if (!response.ok) {
      throw new Error(`Backend API responded with status: ${response.status}`)
    }

    const data = await response.json()
    console.log("Successfully fetched list data from backend")

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in list API route:", error)

    // Generate realistic mock data with slight price variations
    const basePrice = 86300
    const mockData = {
      errors: {},
      data: Array.from({ length: 10 }, (_, i) => {
        const timeOffset = i * 5 * 1000 // 5 seconds between each point
        const randomVariation = (Math.random() - 0.5) * 100 // Random price variation ±50

        return {
          _id: `mock_${Date.now() - timeOffset}`,
          price: +(basePrice + randomVariation).toFixed(2),
          createdAt: new Date(Date.now() - timeOffset).toISOString(),
          __v: 0,
        }
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), // Sort by date descending
    }

    // console.log("Returning mock list data due to error:", error.message)
    return NextResponse.json(mockData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}

