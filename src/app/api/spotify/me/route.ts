import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getCurrentUser } from "@/lib/spotify"

export async function GET() {
  try {
    const cookieStore = cookies()
    const token = (await cookieStore).get("spotify_access_token")

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const user = await getCurrentUser(token.value)
    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    )
  }
} 