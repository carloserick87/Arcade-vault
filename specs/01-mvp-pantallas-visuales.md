# SPEC 01 — MVP visual: las 5 pantallas de Arcade Vault

> **Estado:** Implementado
> **Depende de:** —
> **Fecha:** 2026-10-07
> **Objetivo:** Portar a Next.js App Router las 5 pantallas de `references/templates/` (Biblioteca, Detalle, Reproductor, Acceso, Salón de la Fama) con datos mock y sin ningún juego real.

---

## Por qué existe esta spec

La plantilla de `references/templates/` es un prototipo SPA (React UMD + Babel en el navegador, rutas en `location.hash`). El tema visual ya está portado a `app/globals.css`, pero `app/page.tsx` sigue siendo el scaffold de Create Next App. Esta spec convierte el prototipo en una app Next real, con rutas del App Router y componentes TypeScript, manteniendo el diseño intacto.

---

## Alcance

**Dentro:**

- Rutas App Router:
  - `/` → Biblioteca (hero, buscador, chips de categoría, grilla de tarjetas con tilt 3D, estado "NO HAY RESULTADOS").
  - `/juegos/[id]` → Detalle (portada, tags, descripción, stat-strip, botones, leaderboard top 10 mock).
  - `/juegos/[id]/jugar` → Reproductor (HUD, CRT con arena falsa, pausa, fin, modal Game Over).
  - `/login` → Acceso (pestañas Iniciar sesión / Crear cuenta, invitado, botones sociales decorativos).
  - `/salon` → Salón de la Fama (pestañas por juego, podio, tabla top 12, fila "TU MEJOR MARCA").
- Nav global (desktop + panel móvil con hamburguesa) y footer en `app/layout.tsx`.
- Link activo en nav vía `usePathname` (Biblioteca activa también en `/juegos/*`).
- Login mock: guarda `{ name }` en `localStorage["av_user"]`; nav muestra el nombre; clic en el nombre cierra sesión.
- Reproductor simulado: puntuación sube sola cada 220 ms, nivel sube, PAUSA/REANUDAR, FIN abre modal, "GUARDAR PUNTUACIÓN" persiste en `localStorage["av_scores"]`, "JUGAR DE NUEVO" reinicia.
- Salón: fila "TU MEJOR MARCA" usa el mejor score real de `av_scores` para el juego y usuario actual; si no hay, muestra "SIN PARTIDAS".
- `app/not-found.tsx` temático para ids de juego inexistentes (`notFound()`).
- Elementos decorativos sin lógica: botones Google/GitHub, contador "CRÉDITOS · 03", footer "v2.6.0".

**Fuera de alcance (para specs futuras):**

- Cualquier juego jugable real (canvas, input, colisiones).
- Autenticación real, OAuth Google/GitHub, validación de formularios.
- Backend, base de datos, API de puntuaciones, rankings reales globales.
- Sistema de créditos/monedas.
- Tests automatizados (no hay test runner configurado).
- Migrar estilos a utilidades Tailwind o CSS Modules.
- Limpieza de assets del scaffold en `public/`.

---

## Modelo de datos

```ts
// lib/games.ts
export type Category = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type NeonColor = "cyan" | "magenta" | "yellow" | "green";

export interface Game {
  id: string;          // slug, ej. "bloque-buster"
  title: string;
  short: string;
  long: string;
  cat: Category;
  cover: string;       // clase CSS, ej. "cover-bricks"
  color: NeonColor;
  best: number;
  plays: string;       // ej. "12.4K"
}

export const GAMES: Game[];                        // los 8 de data.jsx, mismo contenido
export const CATS: ("TODOS" | Category)[];         // ["TODOS","ARCADE","PUZZLE","SHOOTER","VERSUS"]
export function getGame(id: string): Game | undefined;
```

```ts
// lib/scores.ts
export interface ScoreRow { rank: number; name: string; score: number; date: string } // date "DD/MM/2026"
export const PLAYERS: string[];
export function seededScores(seed: number, count?: number): ScoreRow[]; // determinista, mismo algoritmo que data.jsx
```

```ts
// lib/storage.ts
export interface User { name: string }                                    // máx 10 chars, mayúsculas
export interface SavedScore { game: string; score: number; name: string; at: number }

// Claves localStorage (mismas que la plantilla):
//   "av_user"   → User | null
//   "av_scores" → SavedScore[]
export function loadUser(): User | null;
export function saveUser(u: User | null): void;   // null borra la clave
export function loadScores(): SavedScore[];
export function addScore(s: Omit<SavedScore, "at">): void;
export function bestScore(game: string, name: string): SavedScore | null;
```

Todas las funciones de `lib/storage.ts` envuelven el acceso a `localStorage` en `try/catch` y devuelven valores vacíos si falla.

Seeds (idénticos a la plantilla): Detalle `seededScores(id.length * 17 + 3, 10)`; Salón `seededScores(id.length * 23 + 7, 12)`.

---

## Plan de implementación

Usar la skill `/frontend-design` al construir la UI (regla de `CLAUDE.md`). Consultar `node_modules/next/dist/docs/01-app/` para `params` (Promise en Next 16), `generateStaticParams`, `notFound` y `Link` antes de escribir cada página.

1. **Datos mock.** Crear `lib/games.ts` y `lib/scores.ts` con tipos y datos de `data.jsx`. Verificar: `npm run build` pasa.
2. **Persistencia y sesión.** Crear `lib/storage.ts` y `components/user-provider.tsx` (client, React Context: `user`, `login(u)`, `logout()`; lee `av_user` en `useEffect` al montar). Envolver `children` en `app/layout.tsx`. Verificar: build pasa, sin cambios visuales.
3. **Nav y footer.** Crear `components/nav.tsx` (client: `usePathname`, `Link`, panel móvil, botón usuario/login). Añadir `<Nav />`, `<main className="av-main">` y footer al layout. Verificar: nav visible y responsive en `/`.
4. **Biblioteca.** Crear `components/game-card.tsx` (client, tilt con `ref`) y `components/library.tsx` (client, búsqueda + chips). Reemplazar `app/page.tsx` con hero + `<Library />`. Verificar: filtrar por "PUZZLE" deja solo CAÍDA; buscar "zzz" muestra "NO HAY RESULTADOS".
5. **Detalle + 404.** Crear `app/juegos/[id]/page.tsx` (server, `generateStaticParams` con los 8 ids, `notFound()` si no existe) y `app/not-found.tsx` temático. Verificar: `/juegos/caida` renderiza; `/juegos/xyz` muestra 404 arcade.
6. **Reproductor.** Crear `components/game-player.tsx` (client: timers, pausa, modal, guardar con `addScore`) y `app/juegos/[id]/jugar/page.tsx` (server, valida id, pasa `Game`). Verificar: score sube, PAUSA lo detiene, FIN abre modal, guardar añade entrada a `av_scores`.
7. **Acceso.** Crear `components/auth-form.tsx` (client: pestañas, `login()` con nombre en mayúsculas máx 10 chars o "PLAYER1", invitado → `logout()`, ambos `router.push("/")`) y `app/login/page.tsx`. Verificar: entrar como "kai" muestra "KAI ▾" en nav.
8. **Salón de la Fama.** Crear `components/hall-of-fame.tsx` (client: pestañas por juego, podio, tabla, fila de usuario con `bestScore`) y `app/salon/page.tsx`. Verificar: tras guardar un score como KAI en CAÍDA, la pestaña CAÍDA muestra esa marca.
9. **Metadata por página.** Añadir `metadata` / `generateMetadata` con título por pantalla (ej. "CAÍDA · Arcade Vault"). Verificar: título de pestaña cambia por ruta.

---

## Criterios de aceptación

- [ ] `npm run build` termina sin errores de tipos.
- [ ] `npm run lint` termina sin errores.
- [ ] `/`, `/juegos/[id]` (8 ids), `/juegos/[id]/jugar`, `/login`, `/salon` cargan sin errores en consola (incluidos errores de hidratación).
- [ ] `/juegos/no-existe` y `/juegos/no-existe/jugar` muestran `app/not-found.tsx`.
- [ ] Cada pantalla coincide visualmente con su equivalente en `references/templates/Arcade Vault.html` (comparación lado a lado en desktop 1440px y móvil 390px).
- [ ] En `/juegos/caida` el link "Biblioteca" del nav está activo.
- [ ] A ≤ breakpoint móvil, la hamburguesa abre el panel lateral y el backdrop lo cierra.
- [ ] Chip "SHOOTER" muestra exactamente INVASORES y ROCAS.
- [ ] Clic en tarjeta o en "JUGAR" navega a `/juegos/[id]`; "▶ JUGAR AHORA" navega a `/juegos/[id]/jugar`.
- [ ] En el reproductor, la puntuación incrementa mientras no está en pausa y se congela en pausa.
- [ ] FIN abre el modal; "GUARDAR PUNTUACIÓN" muestra "▸ PUNTUACIÓN GUARDADA_" y añade un objeto a `localStorage["av_scores"]`.
- [ ] "JUGAR DE NUEVO" deja score 0, vidas 3, nivel 01 y cierra el modal.
- [ ] Login con usuario "kai" guarda `{"name":"KAI"}` en `av_user`, redirige a `/` y el nav muestra "KAI ▾".
- [ ] Recargar la página mantiene la sesión; clic en "KAI ▾" la cierra y borra `av_user`.
- [ ] "JUGAR COMO INVITADO" deja `av_user` vacío y redirige a `/`.
- [ ] En `/salon`, sin sesión no aparece la fila "TU MEJOR MARCA"; con sesión y sin partidas muestra "SIN PARTIDAS"; con partidas muestra el mejor score guardado.
- [ ] Botones Google/GitHub y "CRÉDITOS · 03" se renderizan y no hacen nada al pulsarlos.
- [ ] No queda ningún rastro del scaffold de Create Next App en `app/page.tsx`.

---

## Decisiones

- **Sí:** rutas reales del App Router en español (`/juegos/[id]`, `/login`, `/salon`). URLs compartibles y botón atrás nativo.
- **No:** SPA con `location.hash` como la plantilla. No idiomático en Next.
- **No:** rutas en inglés. La UI es en español.
- **Sí:** reusar las clases de `app/globals.css` (ya portado de `styles.css`). Fidelidad al diseño con mínimo esfuerzo.
- **No:** migrar a Tailwind utilities ni CSS Modules. Mucho trabajo y riesgo de desviarse del diseño.
- **Sí:** login mock con `localStorage["av_user"]` y React Context. Permite ver estados logueado/invitado sin backend.
- **No:** auth real / OAuth. Otra spec.
- **Sí:** simulación completa del reproductor con persistencia en `av_scores`. Ejercita todos los estados visuales (jugando, pausa, game over, guardado).
- **Sí:** "TU MEJOR MARCA" desde `av_scores` real. Conecta reproductor y salón de forma coherente.
- **No:** rango falso del usuario como en la plantilla. La fila muestra score y fecha reales; el rango se omite o se muestra como "—".
- **Sí:** claves `av_user` / `av_scores` sin versionar. Es mock temporal; se reemplaza por backend en otra spec.
- **Sí:** `lib/` para datos y `components/` para UI. Separación clara, alias `@/`.
- **No:** `app/_lib` / `app/_components`.
- **Sí:** páginas como Server Components con `generateStaticParams`; interactividad aislada en componentes client.
- **Sí:** `notFound()` + `app/not-found.tsx` temático.
- **Sí:** mantener decorativos (sociales, créditos, footer) sin lógica. Fidelidad al diseño.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Error de hidratación al leer `localStorage` durante el render | Leer `av_user` / `av_scores` solo en `useEffect`; estado inicial `null` / `[]`. |
| Parpadeo "Iniciar Sesión" → nombre de usuario tras cargar | Aceptado en MVP mock. |
| `toLocaleString("es-ES")` distinto entre servidor y cliente | Node incluye full ICU; si aparece mismatch, formatear con helper propio en `lib/format.ts`. |
| `localStorage` bloqueado (modo privado) | `try/catch` en `lib/storage.ts`; la app funciona sin persistir. |
| APIs de Next 16 distintas (`params` como Promise) | Leer docs en `node_modules/next/dist/docs/01-app/` antes de cada página. |
| Fila "TU MEJOR MARCA" sin rango real | Mostrar "—" en la columna de rango; documentado en Decisiones. |

---

## Lo que **no** está en esta spec

- Juegos jugables.
- Autenticación real y OAuth.
- Backend / API / base de datos de puntuaciones.
- Sistema de créditos.
- Tests automatizados.
- Refactor de estilos a Tailwind.

Cada uno, si llega, va en su propia spec.
