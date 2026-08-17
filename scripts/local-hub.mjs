#!/usr/bin/env node
/**
 * Serve o export estático (out/) e faz proxy de /github-api → api.github.com.
 * Contorna CORS/bloqueio do browser em redes corporativas.
 *
 * Uso: npm run local
 * Abra: http://localhost:4173/
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "out");
const PORT = Number(process.env.PORT || 4173);
const UPSTREAM = "https://api.github.com";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

async function proxyGitHub(req, res) {
  const raw = req.url || "/github-api/";
  const withoutPrefix = raw.replace(/^\/github-api/, "") || "/";
  const url = `${UPSTREAM}${withoutPrefix.startsWith("/") ? withoutPrefix : `/${withoutPrefix}`}`;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);

  const headers = {};
  for (const key of ["authorization", "content-type", "accept", "user-agent"]) {
    const v = req.headers[key];
    if (v) headers[key] = Array.isArray(v) ? v[0] : v;
  }
  if (!headers["user-agent"]) headers["user-agent"] = "hub-gestao-local-proxy";

  let upstream;
  try {
    upstream = await fetch(url, {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method || "GET") ? undefined : body,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "proxy error";
    send(res, 502, `Proxy falhou ao falar com api.github.com: ${msg}`);
    return;
  }

  const buf = Buffer.from(await upstream.arrayBuffer());
  const outHeaders = {
    "content-type":
      upstream.headers.get("content-type") || "application/octet-stream",
    "cache-control": "no-store",
  };
  send(res, upstream.status, buf, outHeaders);
}

function resolveStatic(urlPath) {
  let rel = decodeURIComponent(urlPath.split("?")[0]);
  if (rel === "/") rel = "/index.html";
  if (rel.endsWith("/")) rel = `${rel}index.html`;

  const filePath = path.normalize(path.join(outDir, rel));
  if (!filePath.startsWith(outDir)) return null;
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return filePath;

  // SPA-ish: /login → /login/index.html (Next export trailingSlash)
  const withIndex = path.join(outDir, rel.replace(/^\//, ""), "index.html");
  if (fs.existsSync(withIndex)) return withIndex;

  const htmlFallback = path.join(outDir, `${rel.replace(/^\//, "")}.html`);
  if (fs.existsSync(htmlFallback)) return htmlFallback;

  return null;
}

if (!fs.existsSync(outDir)) {
  console.error("Pasta out/ não encontrada. Rode: npm run build");
  process.exit(1);
}

const server = http.createServer(async (req, res) => {
  const url = req.url || "/";

  if (url === "/github-api" || url.startsWith("/github-api/")) {
    await proxyGitHub(req, res);
    return;
  }

  const file = resolveStatic(url);
  if (!file) {
    send(res, 404, "Not found");
    return;
  }
  const ext = path.extname(file);
  const type = MIME[ext] || "application/octet-stream";
  send(res, 200, fs.readFileSync(file), { "content-type": type });
});

server.listen(PORT, () => {
  console.log(`BF local em http://localhost:${PORT}/`);
  console.log(`Proxy GitHub: http://localhost:${PORT}/github-api → ${UPSTREAM}`);
  console.log("Use o mesmo token classic (gist). Ctrl+C para sair.");
});
