# Conector MCP — SEIA (SEA Chile)

Servidor MCP (Model Context Protocol) que le da a Claude una herramienta
para buscar documentos RCA/ICSARA de un proyecto del SEIA directamente desde
un chat normal (app de Claude, Claude Code, o cualquier cliente MCP) — sin
tener que ejecutar ningún script.

Reutiliza el mismo mecanismo ya probado en el MVP2 de la práctica
(`acta-web/api/buscar-documentos.mjs`): un endpoint interno de
`seia.sea.gob.cl` que trae todos los documentos de un expediente sin login.

## Qué hace (por ahora)

Una sola herramienta: **`buscar_documentos_seia`**. Recibe el `id_expediente`
de un proyecto y devuelve sus documentos RCA e ICSARA (tipo, fecha, link).
Es solo lectura de información pública del SEA — no usa ninguna API key ni
tiene costo, por eso el conector queda sin autenticación por ahora.

**No incluye** la extracción con IA (Gemini) todavía — se dejó fuera a
propósito porque esa parte sí tiene costo/cuota, y si la URL del conector
quedara pública sin protección, cualquiera podría gastarla. Se puede agregar
después si hace falta, con autenticación.

## Publicarlo (una sola vez)

### Paso 1 — Crear el repo en GitHub

Igual que con `acta-web`: [github.com/new](https://github.com/new), nómbralo
`sea-mcp`, vacío (sin README ni .gitignore), y pásame la URL para subir el
código.

### Paso 2 — Conectarlo a Vercel

1. En Vercel: **Add New → Project → Import** el repo `sea-mcp`.
2. Vercel detecta que es Next.js automáticamente — no hace falta configurar
   nada más.
3. Te da una URL tipo `https://sea-mcp.vercel.app`.

### Paso 3 — Agregarlo como conector en la app de Claude

1. En claude.ai: **Settings → Connectors → Add custom connector**.
2. Pega la URL: `https://sea-mcp.vercel.app/api/mcp`
3. Guarda. Ya deberías poder pedirle a Claude, en un chat normal, algo como
   "busca los documentos RCA e ICSARA del expediente 2160034555" y que use
   la herramienta directamente.

## Probarlo antes de conectar a Claude (opcional)

Con el [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector):
apunta a `https://sea-mcp.vercel.app/api/mcp` con transporte "Streamable
HTTP", clic en "List Tools" y prueba `buscar_documentos_seia` con
`id_expediente: 2160034555` (Parque Eólico Wayra, ya usado como caso de
prueba real en el MVP2).

## Estructura

```
sea-mcp/
├── package.json
├── next.config.js
└── app/
    └── api/
        └── mcp/
            └── route.js    <- el servidor MCP y su única herramienta
```
