import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getNowPlaying } from "@/lib/spotify"

export async function GET() {
  const cookieStore = cookies()
  const token = (await cookieStore).get("spotify_access_token")
  const refreshToken = (await cookieStore).get("spotify_refresh_token")

  if (!token) {
    console.log("No token found")
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const nowPlaying = await getNowPlaying(token.value, refreshToken?.value)
    console.log("Now playing track:", nowPlaying?.name)
    
    if (!nowPlaying) {
      console.log("No track currently playing")
      return NextResponse.json({ error: "No track playing" }, { status: 404 })
    }

    // Generate dynamic features based on track properties
    const features = {
      energy: nowPlaying.popularity / 100, // Use popularity as energy
      danceability: Math.random() * 0.5 + 0.5, // Random but biased towards higher values
      valence: Math.random(), // Random mood
      tempo: 120 + (nowPlaying.popularity - 50) // Base tempo modified by popularity
    }

    // Generate synthetic beats
    const beatsPerMinute = features.tempo
    const beatInterval = 60 / beatsPerMinute // seconds per beat
    const duration = nowPlaying.duration_ms / 1000 // convert to seconds
    const progress = (nowPlaying.progress_ms || 0) / 1000 // current playback position
    const beats = []
    
    for (let time = 0; time < duration; time += beatInterval) {
      beats.push({
        start: time,
        duration: beatInterval,
        confidence: 1.0
      })
    }

    // Create synthetic sections (verse/chorus structure)
    const sectionDuration = 16 * beatInterval // Assume 16 beats per section
    const sections = []
    
    for (let time = 0; time < duration; time += sectionDuration) {
      sections.push({
        start: time,
        duration: Math.min(sectionDuration, duration - time),
        loudness: -30 + features.energy * 20, // Louder for more popular songs
        tempo: features.tempo,
        key: Math.floor(Math.random() * 12), // Random key
        mode: Math.random() > 0.5 ? 1 : 0, // Random major/minor
        time_signature: 4
      })
    }

    console.log("Generated features for track:", {
      name: nowPlaying.name,
      duration: duration,
      progress: progress,
      features: features,
      beats: beats.length,
      sections: sections.length
    })

    return NextResponse.json({
      features,
      synthetic: {
        beats,
        sections
      },
      trackId: nowPlaying.id,
      progress_ms: nowPlaying.progress_ms
    })
  } catch (error) {
    console.error("Failed to fetch track data:", error)
    return NextResponse.json(
      { error: "Failed to fetch track data" },
      { status: 500 }
    )
  }
} 