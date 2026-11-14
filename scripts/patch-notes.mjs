#!/usr/bin/env node
/**
 * Lista (y opcionalmente imprime) las notas oficiales de AION 2 Global publicadas
 * después de una fecha. Lo usa Claude para actualizar src/data/ (ver CLAUDE.md).
 *
 *   npm run patch-notes                      # desde DATA_META.patchNotesReviewedThrough.postedAt
 *   npm run patch-notes -- --since 2026-11-11
 *   npm run patch-notes -- --full            # además imprime el texto de cada nota
 *
 * Fuente: la API pública del foro oficial (la misma que usa aion2.plaync.com).
 * Boards: update_en (patch notes) y notice_en (avisos: mantenimientos, resets…).
 * Si corrés esto detrás de un proxy, Node necesita NODE_USE_ENV_PROXY=1.
 */
import { readFileSync } from "node:fs";

const API = "https://api-global-community.plaync.com/aion2_global/board";
const BOARDS = { update_en: "update", notice_en: "notice" };
const HEADERS = {
  Accept: "application/json",
  Origin: "https://aion2.plaync.com",
  Referer: "https://aion2.plaync.com/",
};

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function defaultSince() {
  const meta = readFileSync(new URL("../src/data/meta.ts", import.meta.url), "utf8");
  const m = /postedAt:\s*"([^"]+)"/.exec(meta);
  return m ? m[1] : "1970-01-01";
}

function toText(html) {
  return html
    .replace(/<(br|\/p|\/li|\/h\d|\/tr|\/div)[^>]*>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<t[dh][^>]*>/gi, " | ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/​/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

async function getJson(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

const since = new Date(arg("--since") ?? defaultSince());
const full = process.argv.includes("--full");
console.log(`Notas oficiales publicadas después de ${since.toISOString()}\n`);

let total = 0;
for (const [alias, path] of Object.entries(BOARDS)) {
  const list = await getJson(`${API}/${alias}/article?size=40`);
  const items = (list.contentList ?? [])
    .map((a) => ({ id: a.id, title: a.title, postedAt: a.timestamps?.postedAt }))
    .filter((a) => a.postedAt && new Date(a.postedAt) > since)
    .sort((x, y) => new Date(x.postedAt) - new Date(y.postedAt));
  console.log(`## ${alias} (${items.length})`);
  for (const a of items) {
    total++;
    console.log(`- ${a.postedAt.slice(0, 10)}  ${a.title}`);
    console.log(`  https://aion2.plaync.com/en-us/board/${path}/view?articleId=${a.id}`);
    if (full) {
      const art = await getJson(`${API}/${alias}/article/${a.id}`);
      const body = art.article?.content?.content ?? "";
      console.log(`\n${toText(typeof body === "string" ? body : JSON.stringify(body))}\n`);
    }
  }
  console.log("");
}
if (total === 0) console.log("No hay notas nuevas: los datos están al día.");
