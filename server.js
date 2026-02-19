const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DATA_FILE = path.join(ROOT, 'osm.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

async function readGeoJson() {
  const content = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(content);
}

async function handleUpdateAttributes(req, res) {
  let rawBody = '';

  req.on('data', (chunk) => {
    rawBody += chunk;
  });

  req.on('end', async () => {
    try {
      const { ids, attributeName, attributeValue } = JSON.parse(rawBody || '{}');

      if (!Array.isArray(ids) || ids.length === 0) {
        return sendJson(res, 400, { error: 'Envie ao menos um id_trecho_qualidade.' });
      }

      if (!attributeName || typeof attributeName !== 'string') {
        return sendJson(res, 400, { error: 'attributeName é obrigatório.' });
      }

      const geojson = await readGeoJson();
      const selectedIds = new Set(ids);
      let updatedCount = 0;

      for (const feature of geojson.features || []) {
        const trechoId = feature?.properties?.id_trecho_qualidade;
        if (selectedIds.has(trechoId)) {
          feature.properties[attributeName] = attributeValue;
          updatedCount += 1;
        }
      }

      await fs.writeFile(DATA_FILE, `${JSON.stringify(geojson, null, 2)}\n`, 'utf8');
      return sendJson(res, 200, { updatedCount });
    } catch (error) {
      return sendJson(res, 500, { error: 'Não foi possível atualizar o arquivo osm.json.' });
    }
  });
}

async function serveStaticFile(res, pathname) {
  const normalizedPath = pathname === '/' ? '/index.html' : pathname;
  const requestedPath = path.normalize(path.join(PUBLIC_DIR, normalizedPath));

  if (!requestedPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const file = await fs.readFile(requestedPath);
    const ext = path.extname(requestedPath);
    const type = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(file);
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Arquivo não encontrado.');
  }
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'GET' && parsedUrl.pathname === '/api/geojson') {
    try {
      const geojson = await readGeoJson();
      return sendJson(res, 200, geojson);
    } catch (error) {
      return sendJson(res, 500, { error: 'Falha ao carregar osm.json.' });
    }
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/api/update-attributes') {
    return handleUpdateAttributes(req, res);
  }

  if (req.method === 'GET') {
    return serveStaticFile(res, parsedUrl.pathname);
  }

  res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Método não permitido.');
});

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
