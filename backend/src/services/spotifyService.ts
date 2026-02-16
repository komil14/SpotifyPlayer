import axios from "axios";
import querystring from "querystring";
import User, { IUser } from "../models/User";

// Helper: Actually hit the Spotify API to refresh
export const refreshAccessToken = async (
  user: IUser,
): Promise<string | null> => {
  try {
    console.log("Refreshing Spotify Token...");
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        grant_type: "refresh_token",
        refresh_token: user.spotifyRefreshToken,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(
              process.env.SPOTIFY_CLIENT_ID +
                ":" +
                process.env.SPOTIFY_CLIENT_SECRET,
            ).toString("base64"),
        },
      },
    );

    const { access_token } = response.data;

    // Save new token
    user.spotifyAccessToken = access_token;
    await user.save();

    return access_token;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
};

// 3. Core Function: Get Currently Playing Track
export const getCurrentlyPlaying = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user || !user.spotifyAccessToken)
    throw new Error("User not connected to Spotify");

  let token = user.spotifyAccessToken;

  try {
    // Attempt 1: Fetch Data
    const response = await axios.get(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    return response.data;
  } catch (error: any) {
    // If 401 (Unauthorized), token is expired. Refresh and retry once.
    if (error.response && error.response.status === 401) {
      const newToken = await refreshAccessToken(user);
      if (newToken) {
        // Attempt 2: Retry with new token
        const retryResponse = await axios.get(
          "https://api.spotify.com/v1/me/player/currently-playing",
          {
            headers: { Authorization: `Bearer ${newToken}` },
          },
        );
        return retryResponse.data;
      }
    }
    // If it wasn't a 401 or refresh failed, throw error
    throw error;
  }
};
