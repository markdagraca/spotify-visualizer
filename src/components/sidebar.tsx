"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { 
  ChevronLeft, 
  ChevronRight, 
  Music2, 
  Settings, 
  LogIn, 
  LogOut, 
  Waves,
  Play,
  Pause,
  SkipBack,
  SkipForward
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./theme-toggle"
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"
import { Skeleton } from "./ui/skeleton"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"

interface UserProfile {
  display_name: string
  images: { url: string }[]
}

interface NowPlaying {
  name: string
  artists: { name: string }[]
  album: {
    name: string
    images: { url: string }[]
  }
  is_playing: boolean
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/spotify/me")
        if (response.ok) {
          const data = await response.json()
          setUser(data)
        }
      } catch (error) {
        console.error("Failed to fetch user:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const response = await fetch("/api/spotify/now-playing")
        if (response.ok) {
          const data = await response.json()
          setNowPlaying(data)
        }
      } catch (error) {
        console.error("Failed to fetch now playing:", error)
      }
    }

    // Initial fetch
    fetchNowPlaying()

    // Poll every 5 seconds
    const interval = setInterval(fetchNowPlaying, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleLogin = () => {
    window.location.href = "/api/login"
  }

  const handleLogout = async () => {
    // Clear the cookie
    await fetch("/api/auth/logout", { method: "POST" })
    // Refresh the page
    router.refresh()
  }

  const handlePlaybackAction = async (action: 'play' | 'pause' | 'next' | 'previous') => {
    if (!nowPlaying && action !== 'play') return
    setIsLoading(true)
    try {
      const response = await fetch('/api/spotify/playback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        if (action === 'play' || action === 'pause') {
          setNowPlaying(prev => prev ? { ...prev, is_playing: action === 'play' } : null)
        } else {
          // For next/previous, fetch the new track
          const nowPlayingRes = await fetch("/api/spotify/now-playing")
          if (nowPlayingRes.ok) {
            const data = await nowPlayingRes.json()
            setNowPlaying(data)
          }
        }
      }
    } catch (error) {
      console.error("Failed to control playback:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlayPause = () => {
    handlePlaybackAction(nowPlaying?.is_playing ? 'pause' : 'play')
  }

  const handleSkipNext = () => {
    handlePlaybackAction('next')
  }

  const handleSkipPrevious = () => {
    handlePlaybackAction('previous')
  }

  return (
    <div
      className={cn(
        "h-screen bg-background border-r flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex-1 p-4">
        <div className="flex items-center justify-between mb-6">
          {!collapsed && <h2 className="text-lg font-semibold">Visualizer</h2>}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </Button>
        </div>

        {/* Now Playing Section */}
        {user && (
          <div className="mb-6">
            {nowPlaying ? (
              <div className={cn("space-y-2", collapsed && "text-center")}>
                <div className="relative aspect-square w-full max-w-[200px] mx-auto overflow-hidden rounded-md">
                  <img
                    src={nowPlaying.album.images[0]?.url}
                    alt={nowPlaying.album.name}
                    className="object-cover"
                  />
                </div>
                {!collapsed && (
                  <>
                    <p className="font-medium truncate">{nowPlaying.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {nowPlaying.artists.map(a => a.name).join(", ")}
                    </p>
                    {/* Playback Controls */}
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSkipPrevious}
                        disabled={isLoading}
                      >
                        <SkipBack className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePlayPause}
                        disabled={isLoading}
                      >
                        {nowPlaying.is_playing ? (
                          <Pause className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSkipNext}
                        disabled={isLoading}
                      >
                        <SkipForward className="h-5 w-5" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                {!collapsed && <p>No track playing</p>}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              collapsed ? "px-2" : "px-4",
              pathname === "/" && "bg-muted"
            )}
            asChild
          >
            <Link href="/">
              <Music2 className="h-5 w-5" />
              {!collapsed && <span className="ml-2">Now Playing</span>}
            </Link>
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              collapsed ? "px-2" : "px-4",
              pathname === "/visualizer" && "bg-muted"
            )}
            asChild
          >
            <Link href="/visualizer">
              <Waves className="h-5 w-5" />
              {!collapsed && <span className="ml-2">Visualizer</span>}
            </Link>
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              collapsed ? "px-2" : "px-4"
            )}
          >
            <Settings className="h-5 w-5" />
            {!collapsed && <span className="ml-2">Settings</span>}
          </Button>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-t">
        {loading ? (
          <div className={cn("flex items-center gap-4", collapsed && "justify-center")}>
            <Skeleton className="h-10 w-10 rounded-full" />
            {!collapsed && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            )}
          </div>
        ) : user ? (
          <div className={cn("flex items-center gap-4", collapsed && "justify-center")}>
            <Avatar>
              <AvatarImage src={user.images[0]?.url} />
              <AvatarFallback>{user.display_name[0]}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1">
                <p className="font-medium truncate">{user.display_name}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-sm text-muted-foreground hover:text-foreground -ml-2 mt-1"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              collapsed ? "px-2" : "px-4"
            )}
            onClick={handleLogin}
          >
            <LogIn className="h-5 w-5" />
            {!collapsed && <span className="ml-2">Login</span>}
          </Button>
        )}
        <div className="mt-4">
          <ThemeToggle collapsed={collapsed} />
        </div>
      </div>
    </div>
  )
} 