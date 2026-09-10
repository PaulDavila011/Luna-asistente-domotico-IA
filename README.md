# Luna: Asistente de voz local para domótica

Luna es un asistente de voz personal, self-hosted y privado por diseño: convierte una laptop reciclada en un centro de control de hogar inteligente con IA conversacional, integración total con Home Assistant y una interfaz propia construida desde cero. Nace como alternativa a un Amazon Echo, sin depender de la nube de un gigante tecnológico para controlar tu propia casa.

> Di "Luna", y ella se encarga del resto: enciende luces, pone música, activa escenas completas, responde preguntas, y sabe volver a mostrarse cuando la necesitas.

---

## Por qué este proyecto

Crear un asistente domótico low-budget, altamente personalizable y escalable reciclando hardware antiguo:

- **Hardware reciclado**: corre en una laptop de gama baja (Intel Pentium N3540, 4GB RAM) que de otra forma estaría en un cajón.
- **Arquitectura local-first**: el backend, la GUI y el control de dispositivos viven en la misma red local; el acceso remoto se hace vía VPN (Tailscale), sin exponer nada directamente a internet.
- **Stack propio, no una app de terceros**: cada pieza (voz, LLM, control de casa, interfaz) se integró y depuró a mano.

---

## Arquitectura

```
Voz del usuario
      |
      v
Web Speech API (reconocimiento continuo + wake word "Luna")
      |
      v
Next.js App Router -- /api/chat --> DeepSeek API (function calling)
      |                                   |
      |                                   v
      |                     Decide: charla, musica, luces o escena
      |                                   |
      v                                   v
SpeechSynthesis (voz)          /api/ha/* --> Home Assistant (Docker)
                                                   |
                                    -------------------------------
                                    |              |               |
                              Luces / enchufes   Spotify        Escenas
                              (Tuya Cloud)     (media_player)  (grupos)
```

**Por qué esta arquitectura:** frontend y backend viven en el mismo proyecto Next.js (API Routes) para que las credenciales (API key de DeepSeek, token de Home Assistant) nunca lleguen al navegador. Home Assistant queda como la única fuente de verdad sobre qué dispositivos existen: Luna nunca "adivina" un entity_id, lo consulta en tiempo real en cada conversación.

---

## Funcionalidades

### Voz e interacción
- Escucha continua en el navegador con activación por palabra clave ("Luna"), sin tocar la pantalla.
- Bilingüe en tiempo real: cambia entre español e inglés con un comando de voz ("habla en inglés" / "speak spanish").
- Avatar visual con estados (idle, listening, thinking, speaking) representado como un halo animado con color y movimiento propios, sin depender de emojis (que en Linux se renderizan a color fijo e ignoran el CSS, un bug que tuve que diagnosticar y resolver con SVG).
- Comando de recuperación de foco ("vuelve a Luna"): dado que ningún navegador permite que una pestaña fuerce el cambio de foco por seguridad, se implementó como alternativa una notificación del sistema operativo que sí es clicable.

### Domótica (Home Assistant)
- Control de luces y enchufes por lenguaje natural, sin frases exactas memorizadas.
- Mapeo dinámico de entidades: antes de cada respuesta, el backend consulta a Home Assistant la lista real y actual de dispositivos (con sus nombres actualizados), evitando que renombrar un dispositivo rompa el reconocimiento por voz.
- Activación de escenas completas (ej. "apaga la sala", "prende el cuarto") en lugar de solo dispositivos individuales.
- Integración con dispositivos Tuya/Nexxt vía la nube oficial de Tuya.

### Música (Spotify vía Home Assistant)
- Reproductor visual con portada, título, artista y controles, alimentado por el media_player real de Home Assistant.
- Control por voz de play, pause, siguiente, anterior y volumen.
- Reproducción de canciones, artistas, álbumes y playlists específicas por nombre, resuelta contra la API pública de búsqueda de Spotify (Client Credentials Flow).
- Modo radio automático: activado para resolver un bug conocido y documentado de Spotify (reproducir un solo track detiene la música al terminar en vez de continuar con contenido similar).

### IA conversacional
- Conectada a la API de DeepSeek con function calling: decide en cada turno si la intención es charlar, controlar un dispositivo, poner música o abrir una página web.
- Apertura de enlaces controlada por lista blanca de dominios (YouTube, Wikipedia, etc.) para que la IA no pueda navegar a cualquier sitio arbitrario.
- Consciente de la fecha y hora real (inyectada en cada prompt, no inventada por el modelo).
- Respuestas en texto plano, sin emojis, negritas ni markdown, porque se convierten a voz con speech synthesis.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 (App Router), React, TypeScript, Tailwind CSS |
| Voz | Web Speech API (reconocimiento y síntesis) |
| IA | DeepSeek API (function calling) |
| Domótica | Home Assistant (Docker, Core), integraciones Tuya y Spotify |
| Infraestructura | Linux Mint, Docker, systemd (arranque automático), Tailscale (acceso remoto) |
| Control de versiones | Git / GitHub |

---

## Retos técnicos resueltos

Este proyecto no fue solo "conectar APIs": varios problemas reales de sistemas e integración tuvieron que diagnosticarse y resolverse.

- **Autoplay de Spotify deteniéndose tras una canción**: bug documentado de la propia Spotify al reproducir tracks individuales vía API, resuelto activando el parámetro radio_mode de Home Assistant.
- **Redirect URI de OAuth con Spotify**: Home Assistant usa un intermediario (my.home-assistant.io) para el flujo OAuth por defecto, no la URL local directa, un detalle no evidente que causaba errores de "redirect_uri mismatch".
- **Fallo de integración de Spotify** por un track con metadata malformada en una playlist de casi 5.000 canciones, diagnosticado como bug de parseo en la librería de Home Assistant y resuelto actualizando la imagen de Docker.
- **Limitación de seguridad del navegador**: ninguna pestaña puede forzar su propio foco desde JavaScript, así que se diseñó una alternativa funcional con notificaciones del sistema en vez de pelear contra una restricción de seguridad del navegador.

---

## Instalación

```bash
npm install
cp .env.local.example .env.local
```

Completa `.env.local` con tu API key de DeepSeek y el token de acceso de larga duración de Home Assistant.

```bash
npm run dev
```

Abre http://localhost:3000 en Chrome (el reconocimiento de voz del navegador requiere su motor).

---

## Roadmap

- [ ] Reemplazar Web Speech API por Whisper y Piper corriendo localmente (más privacidad, sin depender de Google)
- [ ] Avatar más elaborado (lip-sync, expresividad)
- [ ] Despliegue del frontend en Vercel conectado al backend local vía túnel seguro
- [ ] Satélites de voz de bajo costo (ESP32) para cobertura en toda la casa

---

## Licencia

MIT
