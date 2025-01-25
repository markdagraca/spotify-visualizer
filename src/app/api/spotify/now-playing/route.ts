import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getNowPlaying } from "@/lib/spotify"

export async function GET() {
  try {
    const cookieStore = cookies()
    const token = (await cookieStore).get("spotify_access_token")

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const track = await getNowPlaying(token.value)
    return NextResponse.json(track)
  } catch (error) {
    console.error("Error fetching now playing:", error)
    return NextResponse.json(
      { error: "Failed to fetch now playing" },
      { status: 500 }
    )
  }
} 