import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { pausePlayback, resumePlayback, skipToNext, skipToPrevious } from "@/lib/spotify"

export async function POST(request: Request) {
  const token = (await cookies()).get("spotify_access_token")?.value

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const { action } = await request.json()
    let success = false

    switch (action) {
      case "pause":
        success = await pausePlayback(token)
        break
      case "play":
        success = await resumePlayback(token)
        break
      case "next":
        success = await skipToNext(token)
        break
      case "previous":
        success = await skipToPrevious(token)
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to control playback" }, { status: 500 })
    }
  } catch (error) {
    console.error("Playback control error:", error)
    return NextResponse.json({ error: "Failed to control playback" }, { status: 500 })
  }
} 