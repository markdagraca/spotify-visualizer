"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function Home() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-4xl font-bold mb-6">Spotify Visualizer</h1>
      <p className="text-lg mb-8 max-w-md">
        Experience your music in a whole new way with our real-time 3D visualizations
      </p>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-lg mb-6">
          {error === "auth_failed" 
            ? "Authentication failed. Please try again." 
            : "An error occurred. Please try again."}
        </div>
      )}

      <Button
        size="lg"
        onClick={() => window.location.href = "/api/login"}
        className="bg-[#1DB954] hover:bg-[#1DB954]/90"
      >
        Connect with Spotify
      </Button>
    </div>
  )
}
