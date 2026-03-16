import { useCallback, useEffect, useState } from "react";
import { getProfile } from "../services/spotifyService";

interface SpotifyProfile {
  display_name?: string;
  email?: string;
  images?: { url: string }[];
  product?: string;
  country?: string;
  followers?: { total: number };
  external_urls?: { spotify: string };
}

interface UseSpotifyConnectionResult {
  profile: SpotifyProfile | null;
  spotifyConnected: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

export const useSpotifyConnection = (
  userId?: string,
): UseSpotifyConnectionResult => {
  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [loading, setLoading] = useState(Boolean(userId));

  const refresh = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setSpotifyConnected(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await getProfile(userId);
      const data = response.data as SpotifyProfile;
      const connected = Boolean(data?.display_name);
      setProfile(connected ? data : null);
      setSpotifyConnected(connected);
    } catch {
      setProfile(null);
      setSpotifyConnected(false);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { profile, spotifyConnected, loading, refresh };
};
