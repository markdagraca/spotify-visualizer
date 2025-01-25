export const mockTracks = [
  {
    id: "1",
    name: "Bohemian Rhapsody",
    artists: [{ name: "Queen" }],
    audioFeatures: {
      energy: 0.8,
      danceability: 0.4,
      valence: 0.3,
    },
  },
  {
    id: "2",
    name: "Dancing Queen",
    artists: [{ name: "ABBA" }],
    audioFeatures: {
      energy: 0.7,
      danceability: 0.9,
      valence: 0.8,
    },
  },
  {
    id: "3",
    name: "Stairway to Heaven",
    artists: [{ name: "Led Zeppelin" }],
    audioFeatures: {
      energy: 0.6,
      danceability: 0.3,
      valence: 0.5,
    },
  },
]

export function getMockCurrentTrack() {
  return mockTracks[Math.floor(Math.random() * mockTracks.length)]
}

