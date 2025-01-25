import SpotifyWebApi from "spotify-web-api-node"

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI,
})

export async function getAccessToken(code: string) {
  try {
    const data = await spotifyApi.authorizationCodeGrant(code)
    return data.body["access_token"]
  } catch (error) {
    console.error("Error in getAccessToken:", error)
    throw error
  }
}

export async function getCurrentTrack(accessToken: string) {
  spotifyApi.setAccessToken(accessToken)
  const data = await spotifyApi.getMyCurrentPlayingTrack()
  return data.body
}

export async function getAudioFeatures(trackId: string, accessToken: string) {
  spotifyApi.setAccessToken(accessToken)
  const data = await spotifyApi.getAudioFeaturesForTrack(trackId)
  return data.body
}

