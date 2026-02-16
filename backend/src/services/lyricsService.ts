import axios from 'axios';
import Lyric, { ILyric } from '../models/Lyric';

const LRCLIB_API = 'https://lrclib.net/api/get';

export const getLyrics = async (trackName: string, artistName: string, spotifyTrackId: string, durationMs: number) => {
  
  // 1. Check Cache (Database)
  const cachedLyric = await Lyric.findOne({ spotifyTrackId });
  if (cachedLyric) {
    console.log(`Lyrics found in cache for: ${trackName}`);
    return cachedLyric;
  }

  console.log(`Fetching lyrics from API for: ${trackName}`);

  // 2. Fetch from External API (Lrclib)
  try {
    // Lrclib requires duration in seconds to match accurately
    const durationSec = Math.round(durationMs / 1000);

    const response = await axios.get(LRCLIB_API, {
      params: {
        track_name: trackName,
        artist_name: artistName,
        duration: durationSec
      }
    });

    const { syncedLyrics, plainLyrics } = response.data;

    // 3. Save to Database (Cache it)
    const newLyric = await Lyric.create({
      spotifyTrackId,
      trackName,
      artistName,
      syncedLyrics, // This is the timestamped string we need
      plainLyrics
    });

    return newLyric;

  } catch (error) {
    console.error('Error fetching lyrics from provider:', error);
    return null;
  }
};