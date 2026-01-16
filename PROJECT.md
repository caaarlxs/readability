# Lector RSVP desde URL (Extractor + Reproductor de lectura)

## Objetivo

Construir una web donde el usuario pega un enlace (URL), el sistema **intenta extraer el texto principal** (tipo artículo/post/hilo visible) y lo muestra en un **lector RSVP/ORP** (una palabra cada vez, con un punto fijo de reconocimiento).

La solución debe ser **la misma para cualquier dominio**, sin reglas “custom” por sitio.

---

## Alcance y no-objetivos

### Alcance (MVP)

- Pegar una URL.
- Extraer:
  - `title` (si existe)
  - `text` (texto principal limpio)
  - `language` (opcional)
  - `source_url`
- Visualizar el texto con lector RSVP:
  - Control de WPM (palabras por minuto)
  - Pausa / reanudar
  - Retroceder / avanzar (por palabra o por frase)
  - Barra de progreso
  - Ajustes ORP (marcado de letra/punto fijo)

### No-objetivos

- Garantizar extracción en el 100% de URLs (paywalls, login, bloqueo anti-bot, contenido solo multimedia).
- Saltarse sistemas de pago, login o restricciones.
- Extraer contenido de páginas privadas.

---

## Arquitectura (misma solución para todo)

### Idea central

Usar un pipeline único con dos fases:

1. **Obtención de HTML renderizado**
2. **Extracción del contenido principal desde ese HTML**

Esto evita depender de “trucos” por dominio. Si la página se construye con JavaScript, la fase 1 (render) la deja lista como si fuese un navegador real.

### Componentes

- **Frontend**
  - UI: input URL + lector RSVP
  - Lógica de reproducción: temporizador, controles, tokenizado
- **Backend API**
  - Endpoint de extracción (fetch + render + parse)
  - Caché y rate limiting
- **Extractor**
  - Limpieza y extracción del “main content”
  - Normalización a texto plano

---

## Flujo de datos

### 1) Usuario envía URL

Frontend -> `POST /api/extract` con `{ url }`

### 2) Backend extrae contenido

Pipeline recomendado (en orden):

1. Validar URL (es http/https, tamaño, lista de bloqueos básica)
2. Obtener HTML (dos modos):
   - **Modo rápido**: HTTP fetch normal
   - **Modo render**: navegador headless (si el rápido no da suficiente texto o si la página es SPA)
3. Aplicar extracción de “main content”:
   - Algoritmo tipo Readability (o equivalente)
4. Post-procesado:
   - quitar duplicados, normalizar espacios
   - conservar saltos de párrafo (para navegación)
   - opcional: detectar idioma

### 3) Frontend reproduce con RSVP

Backend responde:

```json
{
  "source_url": "https://...",
  "title": "…",
  "text": "…",
  "byline": "…",
  "site_name": "…",
  "extraction": {
    "method": "readability",
    "used_render": true,
    "char_count": 12345
  }
}
Frontend:

segmenta text en tokens (palabras y signos)

calcula ORP por token

reproduce a WPM configurado

Decisiones clave
¿Render headless siempre o solo a veces?
Recomendación práctica: “rápido primero, render si hace falta”.

Reduce coste/latencia.

Mantiene una solución única: no cambias reglas por dominio, solo escalas el mismo pipeline según señales.

Señales típicas para activar render:

char_count bajo tras extracción rápida (p.ej. < 800 chars)

HTML con muy poco texto pero muchos scripts

<noscript> que indica contenido dinámico

¿Cómo decidir si “hay un texto estilo artículo”?
Definir un “umbral de éxito”:

char_count >= N (ej. 800–1200)

word_count >= M (ej. 150)

ratio texto/HTML aceptable
Si no cumple:

devolver respuesta “no extraíble” con explicación breve

Ejemplo:

json
Copy code
{
  "ok": false,
  "reason": "not_enough_readable_text",
  "details": { "char_count": 312 }
}
Lector RSVP/ORP (frontend)
Tokenizado
Reglas básicas:

separar por espacios

conservar puntuación como tokens (opcional)

mantener saltos de párrafo como “marcadores”

Cálculo ORP (heurístico)
Regla simple (suficiente para MVP):

Longitud 1–5: ORP en índice 1 (o centro)

6–9: ORP cerca del centro-izquierda

10+: ORP un poco más a la izquierda del centro

Se marca el carácter ORP en color y se alinea el token para que el ORP quede en el mismo x (posición fija).

Controles
WPM: 200–800 (slider)

Pausa (space)

Retroceder 10 palabras

Avanzar 10 palabras

Modo “frase” (opcional): agrupar 2–4 palabras por frame

Backend: endpoints y responsabilidades
POST /api/extract
Input

json
Copy code
{ "url": "https://..." }
Output (éxito)

ok: true

title, text, metadatos

info de extracción

Output (fallo)

ok: false

reason enumerado

details útiles para debugging

GET /api/health
estado del servicio

Seguridad y abuso (imprescindible)
Validación de URL:

solo http:// o https://

bloquear IPs internas (evitar SSRF: 127.0.0.1, 10.0.0.0/8, etc.)

Rate limit por IP/usuario

Timeouts:

fetch normal: p.ej. 10s

render headless: p.ej. 20–30s

Tamaño máximo:

limitar bytes descargados

cortar textos gigantes (p.ej. 200k chars)

User-Agent y headers razonables

Caché:

cache por URL (p.ej. 1–24h) para no re-scrapear

Rendimiento y costes
Render headless es lo más caro:

ejecutar en un pool con concurrencia limitada

cache agresiva

“Fast path” con fetch + extractor cubre muchas páginas.

Instrumentación:

tiempos de fetch/render

ratio de éxito

principales razones de fallo

Casos complicados (esperables)
Paywalls/login: poco o nada extraíble

Anti-bot: bloqueos intermitentes

Contenido solo vídeo/imagen: no hay texto

Páginas con contenido fragmentado en iframes

Textos muy cortos (posts breves): igual se puede reproducir, pero puede no pasar umbrales “artículo”

Estructura del repo (sugerida)
bash
Copy code
/apps
  /web        # frontend (Next.js/React)
  /api        # backend (Node/Express o Next API)
/packages
  /extractor  # lógica: fetch/render + readability + normalización
  /rsvp       # tokenizador + ORP + helpers
Stack sugerido (ejemplo)
Frontend: Next.js + React

Backend: Python FastAPI

Render: Playwright (Chromium headless)

Extractor: Readability (o similar)

Cache: Redis (opcional en MVP) o cache en memoria con TTL

Observabilidad: logs + métricas básicas

(El proyecto es agnóstico: puedes montar esto igual con Python/FastAPI + Playwright.)

Plan de implementación (MVP)
Frontend:

pantalla input URL

lector RSVP con tokenizado y ORP

Backend:

POST /api/extract con fetch normal + readability

umbrales de éxito

Añadir render headless como fallback

Cache + rate limit + SSRF guardrails

UX: manejo de errores claro (por qué no se pudo extraer)

“Definition of done” (MVP)
Pego URL -> obtengo texto limpio en un porcentaje alto de páginas públicas tipo artículo.

Si no hay texto suficiente, recibo un error explicativo.

El lector RSVP funciona fluido con controles básicos.

No hay agujeros obvios de seguridad (SSRF, abuso masivo).
```
