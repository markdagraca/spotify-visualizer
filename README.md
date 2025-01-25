# Spotify Visualizer

A proof-of-concept project exploring the feasibility of creating a Windows Media Player-style music visualizer using Spotify's Web API.

## Project Goal

The goal was to investigate if it's possible to create real-time music visualizations using Spotify's API data. The project specifically aimed to recreate the classic waveform visualizations from Windows Media Player.

## Key Finding

**The project revealed that this is no longer feasible with Spotify's current API.** The audio analysis endpoints that would have made this possible have been deprecated. This makes it impossible to get the detailed audio data needed for traditional waveform visualizations.

## What Was Built

- Basic Spotify authentication and playback controls
- A simple Three.js visualization using available track metadata
- A responsive UI with play/pause, next/previous controls
- Dark/light theme support

## Tech Stack

- Next.js 14
- TypeScript
- Three.js
- Spotify Web API
- Tailwind CSS
- Shadcn UI

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Add Spotify credentials to `.env.local`:
```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback
```
4. Run with: `npm run dev`

## Conclusion

While the original goal of creating a classic music visualizer wasn't achievable due to API limitations, this project serves as a useful reference for:
- Working with Spotify's Web API
- Implementing OAuth authentication
- Basic Three.js integration in Next.js
- Modern React patterns and TypeScript usage

---

*Built as an afternoon exploration of Spotify API capabilities and limitations.*
