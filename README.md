# Luna — asistente de voz local

GUI en Next.js para el asistente "Luna": escucha continua con wake word, bilingüe
(ES/EN), reproductor de Spotify vía Home Assistant, function calling con DeepSeek
para abrir links y controlar dispositivos.

## Instalación

```bash
npm install
cp .env.local.example .env.local
```

Completa `.env.local` con:
- `DEEPSEEK_API_KEY` — de https://platform.deepseek.com
- `HA_TOKEN` — en Home Assistant: perfil (abajo a la izquierda) → Seguridad →
  "Crear token de acceso de larga duración"
- `HA_SPOTIFY_ENTITY` — el entity_id real de tu media_player de Spotify (lo ves en
  Configuración → Dispositivos y servicios → Spotify)

```bash
npm run dev
```

Abre `http://localhost:3000` en **Chrome** (el reconocimiento de voz del navegador
solo funciona ahí de forma confiable).

## Cómo funciona

- **Wake word "Luna"**: el navegador transcribe todo el tiempo en background; solo
  cuando detecta "Luna" en el texto, activa el estado de escucha y manda el
  siguiente enunciado a DeepSeek.
- **Bilingüe**: di "habla en inglés" / "speak spanish" para cambiar el idioma de
  reconocimiento y de voz.
- **Spotify**: lee y controla el `media_player` de Spotify que ya tienes conectado
  en Home Assistant (play/pause/siguiente/anterior + portada).
- **Abrir links**: DeepSeek puede llamar a la función `open_url`; por seguridad
  solo se permite abrir dominios de una lista blanca (`lib/deepseek.ts` →
  `ALLOWED_DOMAINS` en `app/api/chat/route.ts`) — agrega ahí los que quieras
  habilitar.
- **Control de dispositivos**: DeepSeek puede llamar `control_device` con el
  `entity_id` de Home Assistant para encender/apagar algo.

## Limitación importante: "vuelve a Luna"

Los navegadores **no permiten** que una pestaña cambie el foco a otra pestaña por
razones de seguridad — ninguna app web puede hacer eso, sin importar cómo se
programe. Lo que sí implementamos: cuando dices "vuelve a Luna", si el navegador
tiene permiso de notificaciones, te llega una notificación del sistema — al
hacer clic en ella, ahí sí vuelve a la pestaña de Luna. Es el equivalente más
cercano y confiable disponible en la web.

## Pendiente / siguientes pasos

- Reemplazar Web Speech API por Whisper + Piper (local) para más precisión y
  privacidad — hoy usa el motor de voz del navegador (Google en Chrome).
- El avatar es un halo con color de estado (idle / listening / thinking /
  speaking) — si más adelante quieres un avatar más elaborado (cara, lip-sync),
  se conecta en `components/Avatar.tsx`.
