const HA_URL = process.env.HA_URL || "http://127.0.0.1:8123";
const HA_TOKEN = process.env.HA_TOKEN || "";

function headers() {
  return {
    Authorization: `Bearer ${HA_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export async function getState(entityId: string) {
  const res = await fetch(`${HA_URL}/api/states/${entityId}`, { headers: headers(), cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export async function callService(domain: string, service: string, data: Record<string, unknown>) {
  const res = await fetch(`${HA_URL}/api/services/${domain}/${service}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(data),
  });
  return res.ok;
}

// Entidad del media_player de Spotify configurada en Home Assistant.
export const SPOTIFY_ENTITY = process.env.HA_SPOTIFY_ENTITY || "media_player.spotify";
