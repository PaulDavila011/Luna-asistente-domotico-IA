const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

export const tools = [
  {
    type: "function",
    function: {
      name: "open_url",
      description:
        "Abre una página web en el navegador del usuario. Úsala cuando el usuario pida buscar algo, ver un video, o abrir un sitio (ej. YouTube, Instagram, una receta).",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL completa y válida a abrir" },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "control_device",
      description:
        "Enciende, apaga, o consulta el estado de un dispositivo domótico conectado en Home Assistant.",
      parameters: {
        type: "object",
        properties: {
          entity_id: { type: "string", description: "ID de la entidad en Home Assistant, ej. light.sala" },
          action: { type: "string", enum: ["turn_on", "turn_off", "get_state"] },
        },
        required: ["entity_id", "action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "control_music",
      description:
        "Controla la reproducción de música en Spotify (a través de Home Assistant). Úsala cuando el usuario pida poner, pausar, o cambiar de canción.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["play", "pause", "next", "previous"],
          },
        },
        required: ["action"],
      },
    },
  },
];

type ChatMessage = { role: string; content: string };

export async function askDeepSeek(messages: ChatMessage[], lang: "es" | "en") {
  const systemPrompt =
    lang === "es"
      ? "Eres Luna, un asistente de voz para el hogar. Responde breve y natural, en español, en texto plano, si emojis, sin negritas, sin markdown ni formato especial porque tu respuesta se va a leer e voz alta. Si el usuario pide algo domótico o web, usa las herramientas disponibles."
      : "You are Luna, a home voice assistant. Reply briefly and naturally, in English, in plain text with no emojis, no bold, no markdown or special formatting, since your response will be read aloud.. Use the available tools for smart-home or web requests.";

  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      tools,
    }),
  });

  if (!res.ok) throw new Error(`DeepSeek error: ${res.status}`);
  return res.json();
}
