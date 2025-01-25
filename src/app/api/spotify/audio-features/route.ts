import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = cookies()
    const token = (await cookieStore).get("spotify_access_token")

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // First get the current track
    const nowPlayingResponse = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    })

    if (!nowPlayingResponse.ok) {
      if (nowPlayingResponse.status === 204) {
        return NextResponse.json(null) // No track playing
      }
      throw new Error(`HTTP error! status: ${nowPlayingResponse.status}`)
    }

    const nowPlaying = await nowPlayingResponse.json()
    const trackId = nowPlaying.item?.id

    if (!trackId) {
      return NextResponse.json(null)
    }

    // Then get the audio features for that track
    const featuresResponse = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    })

    if (!featuresResponse.ok) {
      throw new Error(`HTTP error! status: ${featuresResponse.status}`)
    }

    const features = await featuresResponse.json()
    return NextResponse.json({
      energy: features.energy,
      danceability: features.danceability,
      valence: features.valence,
    })
  } catch (error) {
    console.error("Error fetching audio features:", error)
    return NextResponse.json(
      { error: "Failed to fetch audio features" },
      { status: 500 }
    )
  }
} 