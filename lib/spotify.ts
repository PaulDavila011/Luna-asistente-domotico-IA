const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_SEARCH_URL = "https://api.spotify.com/v1/search";

let cachedToken: string | null = null;
let cachedTokenExpiresAt = 0;

export async function getSpotifyToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedTokenExpiresAt) {
    return cachedToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID || "";
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || "";
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) throw new Error(`Spotify token error: ${res.status}`);

  const data = await res.json();
  cachedToken = data.access_token;
  cachedTokenExpiresAt = Date.now() + data.expires_in * 1000;
  return cachedToken as string;
}

export type SpotifySearchResult = { uri: string; name: string };
export type SpotifySearchType = "track" | "artist" | "playlist" | "album";

const RESULT_KEY: Record<SpotifySearchType, string> = {
  track: "tracks",
  artist: "artists",
  playlist: "playlists",
  album: "albums",
};

export async function searchSpotify(
  query: string,
  type: SpotifySearchType
): Promise<SpotifySearchResult | null> {
  const token = await getSpotifyToken();

  const params = new URLSearchParams({ q: query, type, limit: "1" });
  const res = await fetch(`${SPOTIFY_SEARCH_URL}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;

  const data = await res.json();
  const item = data[RESULT_KEY[type]]?.items?.[0];
  if (!item) return null;

  return { uri: item.uri, name: item.name };
}
