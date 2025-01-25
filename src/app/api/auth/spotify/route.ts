import { NextResponse } from "next/server"
import { getSpotifyAuthUrl } from "@/lib/spotify"

export async function GET() {
  try {
    const authUrl = getSpotifyAuthUrl()
    return NextResponse.json({ url: authUrl })
  } catch (error) {
    console.error("Failed to generate Spotify auth URL:", error)
    return NextResponse.json(
      { error: "Failed to generate authentication URL" },
      { status: 500 }
    )
  }
} 