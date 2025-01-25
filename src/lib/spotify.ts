const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI!

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REDIRECT_URI) {
  throw new Error('Missing required Spotify environment variables')
}

interface SpotifyTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  scope: string
}

interface SpotifyUserProfile {
  id: string
  display_name: string
  email: string
  images: { url: string }[]
}

interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string }[]
  album: {
    name: string
    images: { url: string }[]
  }
  duration_ms: number
  popularity: number
  explicit: boolean
  type: string
  is_playing: boolean
  progress_ms?: number
}

interface SpotifyAudioFeatures {
  energy: number
  danceability: number
  valence: number
  tempo: number
  loudness: number
  key: number
  mode: number
  acousticness: number
  instrumentalness: number
  liveness: number
  speechiness: number
  time_signature: number
  duration_ms: number
  analysis_url: string
}

export async function getAccessToken(code: string): Promise<string | undefined> {
  const params = new URLSearchParams()
  params.append('grant_type', 'authorization_code')
  params.append('code', code)
  params.append('redirect_uri', SPOTIFY_REDIRECT_URI)

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: params,
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = (await response.json()) as SpotifyTokenResponse
  return data.access_token
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const params = new URLSearchParams()
  params.append('grant_type', 'refresh_token')
  params.append('refresh_token', refreshToken)

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: params,
  })

  if (!response.ok) {
    throw new Error(`Failed to refresh token: ${response.status}`)
  }

  const data = await response.json()
  return data.access_token
}

async function handleSpotifyRequest<T>(
  url: string,
  accessToken: string,
  refreshToken: string | undefined
): Promise<T> {
  let response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  // If token is expired, refresh it and try again
  if ((response.status === 401 || response.status === 403) && refreshToken) {
    console.log("Token expired, refreshing...")
    const newToken = await refreshAccessToken(refreshToken)
    
    // Retry the request with new token
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${newToken}`,
      },
    })
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export async function getCurrentUser(accessToken: string, refreshToken?: string): Promise<SpotifyUserProfile> {
  return handleSpotifyRequest('https://api.spotify.com/v1/me', accessToken, refreshToken)
}

export async function getNowPlaying(accessToken: string, refreshToken?: string): Promise<SpotifyTrack | null> {
  const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (response.status === 204) {
    return null // No track playing
  }

  if ((response.status === 401 || response.status === 403) && refreshToken) {
    const newToken = await refreshAccessToken(refreshToken)
    return getNowPlaying(newToken, refreshToken)
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  return {
    ...data.item,
    is_playing: data.is_playing,
    progress_ms: data.progress_ms
  } as SpotifyTrack
}

export async function getTrackFeatures(trackId: string, accessToken: string, refreshToken?: string): Promise<SpotifyAudioFeatures> {
  console.log("Fetching audio features for track:", trackId)
  try {
    const data = await handleSpotifyRequest<SpotifyAudioFeatures>(
      `https://api.spotify.com/v1/audio-features/${trackId}`,
      accessToken,
      refreshToken
    )
    console.log("Audio features received:", {
      energy: data.energy,
      danceability: data.danceability,
      valence: data.valence,
      tempo: data.tempo,
      key: data.key,
      mode: data.mode,
      acousticness: data.acousticness,
      instrumentalness: data.instrumentalness
    })
    return data
  } catch (error) {
    console.error("Failed to fetch audio features:", error)
    throw error
  }
}

export function getSpotifyAuthUrl(): string {
  const scope = [
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'user-read-playback-position',
    'user-read-recently-played',
    'streaming'
  ].join(' ')

  const params = new URLSearchParams()
  params.append('client_id', SPOTIFY_CLIENT_ID)
  params.append('response_type', 'code')
  params.append('redirect_uri', SPOTIFY_REDIRECT_URI)
  params.append('scope', scope)

  return `https://accounts.spotify.com/authorize?${params.toString()}`
} 