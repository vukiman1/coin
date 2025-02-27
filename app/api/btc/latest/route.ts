import { NextResponse } from "next/server"

// Replace this URL with your actual backend API endpoint
const BACKEND_API_URL = "http://localhost:3000/btc/latest"

export async function GET() {
  try {
    console.log("Attempting to fetch latest from:", BACKEND_API_URL)

    // Add timeout and additional options to fetch
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(BACKEND_API_URL, {
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 5 }, // Revalidate every 5 seconds
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timeoutId)
    })

    if (!response.ok) {
      throw new Error(`Backend API responded with status: ${response.status}`)
    }

    const data = await response.json()
    console.log("Successfully fetched latest data from backend")

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in latest API route:", error)

    // Generate a single mock data point with realistic variation from the last known price
    const mockData = {
      errors: {},
      data: [
        {
          _id: `mock_${Date.now()}`,
          price: +(86300 + (Math.random() - 0.5) * 100).toFixed(2), // Random price around 86300 ±50
          createdAt: new Date().toISOString(),
          __v: 0,
        },
      ],
    }

    console.log("Returning mock latest data due to error:", error.message)
    return NextResponse.json(mockData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}

