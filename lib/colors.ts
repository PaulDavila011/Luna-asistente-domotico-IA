export type FavoriteColor = { name: string; rgb_color?: [number, number, number]; color_name?: string; brightness_pct?: number };

// Colores favoritos predefinidos que Luna puede aplicar por voz.
// color_name debe ser un nombre CSS reconocido por Home Assistant (webcolors).
// rgb_color tiene prioridad sobre color_name cuando ambos están presentes.
export const FAVORITE_COLORS: FavoriteColor[] = [
  { name: "calido", rgb_color: [255, 137, 14], brightness_pct: 50 },
  { name: "relax", color_name: "orange" },
  { name: "fiesta", color_name: "purple" },
  { name: "lectura", color_name: "gold" },
  { name: "concentracion", color_name: "white" },
  { name: "noche", color_name: "crimson", brightness_pct: 20 },
  { name: "bosque", color_name: "green" },
  { name: "oceano", color_name: "turquoise" },
  { name: "romantico", color_name: "hotpink" },
];
