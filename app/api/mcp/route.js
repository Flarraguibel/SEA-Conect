// Conector MCP: expone a Claude una herramienta para buscar RCA/ICSARA en el
// SEIA (seia.sea.gob.cl). Solo lectura de información pública, sin API key ni
// costo — usa el mismo mecanismo ya probado en el MVP2 (acta-web/api/buscar-documentos.mjs).

import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const TIPOS_INTERES = [
  { etiqueta: "RCA", patron: /Resoluci.n de Calificaci.n Ambiental/i },
  { etiqueta: "ICSARA", patron: /aclaraciones, rectificaciones/i },
];

function decodeHtml(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'");
}

async function buscarDocumentosSEIA(idExpediente) {
  const url = `https://seia.sea.gob.cl/expediente/xhr_busqueda_expediente.php?id_expediente=${idExpediente}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`El SEA respondió ${resp.status} al consultar el expediente.`);
  const html = await resp.text();

  const filas = html.split(/(?=<tr[\s>])/).filter((f) => /<tr[\s>]/.test(f));
  const documentos = [];
  for (const fila of filas) {
    const m = fila.match(/<td class='td-primary'><a href="([^"]+)"[^>]*>([^<]+)<\/a>/);
    if (!m) continue;
    const docUrl = decodeHtml(m[1]);
    const tipo = decodeHtml(m[2]).trim();
    const fechaMatch = fila.match(/class='dt-type-numeric'>([^<]+)</);
    const fecha = fechaMatch ? fechaMatch[1].trim() : "";
    const encontrado = TIPOS_INTERES.find((t) => t.patron.test(tipo));
    if (encontrado) {
      documentos.push({ etiqueta: encontrado.etiqueta, tipo, fecha, url: docUrl });
    }
  }
  return { totalDocumentosExpediente: filas.length, documentos };
}

const handler = createMcpHandler((server) => {
  server.registerTool(
    "buscar_documentos_seia",
    {
      title: "Buscar RCA/ICSARA en el SEIA",
      description:
        "Dado el id_expediente de un proyecto en el Sistema de Evaluación de Impacto Ambiental de Chile " +
        "(seia.sea.gob.cl), busca sus documentos de tipo RCA (Resolución de Calificación Ambiental) e " +
        "ICSARA (Informe Consolidado de Solicitud de Aclaraciones, Rectificaciones y/o Ampliaciones), " +
        "devolviendo tipo, fecha y link de descarga de cada uno. El id_expediente se obtiene de la URL " +
        "de la ficha del proyecto en seia.sea.gob.cl (parámetro id_expediente).",
      inputSchema: z.object({
        id_expediente: z.string().describe("Id numérico del expediente del proyecto, ej. 2160034555"),
      }),
    },
    async ({ id_expediente }) => {
      if (!/^\d+$/.test(id_expediente)) {
        return {
          content: [{ type: "text", text: "id_expediente debe ser un número (se obtiene de la URL de la ficha del proyecto en seia.sea.gob.cl)." }],
          isError: true,
        };
      }
      try {
        const data = await buscarDocumentosSEIA(id_expediente);
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (e) {
        return { content: [{ type: "text", text: "Error: " + e.message }], isError: true };
      }
    },
  );
});

export { handler as GET, handler as POST };
