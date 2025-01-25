"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Waves, Sparkles, Music4, Globe } from "lucide-react"
import { useRouter } from "next/navigation"

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/spotify/me')
        if (response.ok) {
          setIsAuthenticated(true)
          router.push('/visualizer') // Redirect to visualizer if authenticated
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      }
    }
    checkAuth()
  }, [router])

  const handleConnect = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/spotify')
      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error("No auth URL received")
      }
    } catch (error) {
      console.error("Failed to get auth URL:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Show only the landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-background relative overflow-hidden">
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
      <div className="absolute inset-0 flex items-center justify-center -z-10">
        <div className="w-[800px] h-[800px] rounded-full bg-purple-500/10 blur-3xl animate-pulse" />
        <div className="absolute w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-600 animate-gradient pb-2">
            Spotify Visualizer
          </h1>
          <p className="text-xl text-muted-foreground">
            Transform your music into stunning visual experiences. Watch your favorite tracks come to life with dynamic animations and immersive effects.
          </p>
          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              onClick={handleConnect}
              disabled={isLoading}
            >
              {isLoading ? "Connecting..." : "Connect with Spotify"}
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="bg-background/50 backdrop-blur-lg rounded-xl p-6 border border-border/50 hover:border-purple-500/50 transition-colors group">
            <div className="mb-4 p-3 bg-purple-500/10 rounded-lg w-fit group-hover:bg-purple-500/20 transition-colors">
              <Waves className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Multiple Visualizations</h3>
            <p className="text-muted-foreground">
              Choose from various visualization styles including particle spheres, waveforms, energy lines, and more.
            </p>
          </div>

          <div className="bg-background/50 backdrop-blur-lg rounded-xl p-6 border border-border/50 hover:border-blue-500/50 transition-colors group">
            <div className="mb-4 p-3 bg-blue-500/10 rounded-lg w-fit group-hover:bg-blue-500/20 transition-colors">
              <Sparkles className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Effects</h3>
            <p className="text-muted-foreground">
              Experience dynamic effects that react to your music's energy, rhythm, and mood in real-time.
            </p>
          </div>

          <div className="bg-background/50 backdrop-blur-lg rounded-xl p-6 border border-border/50 hover:border-purple-500/50 transition-colors group">
            <div className="mb-4 p-3 bg-purple-500/10 rounded-lg w-fit group-hover:bg-purple-500/20 transition-colors">
              <Music4 className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Full Playback Control</h3>
            <p className="text-muted-foreground">
              Control your music directly from the visualizer with play, pause, skip, and volume controls.
            </p>
          </div>

          <div className="bg-background/50 backdrop-blur-lg rounded-xl p-6 border border-border/50 hover:border-blue-500/50 transition-colors group">
            <div className="mb-4 p-3 bg-blue-500/10 rounded-lg w-fit group-hover:bg-blue-500/20 transition-colors">
              <Globe className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Customizable Experience</h3>
            <p className="text-muted-foreground">
              Personalize your visualization with adjustable settings for particles, colors, and effects.
            </p>
          </div>
        </div>

        {/* Preview Section */}
        <div className="mt-32 text-center">
          <h2 className="text-3xl font-bold mb-8">Experience Your Music Like Never Before</h2>
          <div className="relative rounded-lg overflow-hidden border border-border/50 shadow-2xl">
            <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur">
              {/* Add a preview video or screenshot here */}
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-lg text-muted-foreground">Preview coming soon...</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-32 text-center text-muted-foreground">
          <p>Built with Next.js, Three.js, and the Spotify Web API</p>
        </footer>
      </div>

      {/* Add some floating particles in the background */}
      <style jsx>{`
        .bg-grid-white {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.02)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 4s linear infinite;
        }
      `}</style>
    </div>
  )
}
