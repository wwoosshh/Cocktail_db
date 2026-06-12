import { createServer as createHttpServer } from 'node:http';
import type { IncomingMessage, ServerResponse, Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { CocktailEngine } from './index';
import { SEED_TREE, SEED_INGREDIENTS, SEED_COCKTAILS } from './data/seed';

const engine = new CocktailEngine({
  cocktails: SEED_COCKTAILS,
  tree: SEED_TREE,
  ingredients: SEED_INGREDIENTS,
});

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(HERE, '..', 'public');

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

export function createServer(): Server {
  return createHttpServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const path = url.pathname;

      if (req.method === 'GET' && (path === '/' || path === '/index.html')) {
        const html = await readFile(join(PUBLIC_DIR, 'index.html'));
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }

      if (req.method === 'GET' && path === '/api/ingredients') {
        const ingredients = SEED_INGREDIENTS.map((i) => ({
          id: i.id,
          name: i.canonicalName,
          defaultRole: i.defaultRole,
        }));
        sendJson(res, 200, { ingredients });
        return;
      }

      if (req.method === 'POST' && path === '/api/identify') {
        const body = await readBody(req);
        sendJson(res, 200, engine.identify({ components: (body.components as never) ?? [] }));
        return;
      }

      if (req.method === 'POST' && path === '/api/explore') {
        const body = await readBody(req);
        sendJson(res, 200, {
          candidates: engine.explore({ components: (body.components as never) ?? [] }),
        });
        return;
      }

      if (req.method === 'POST' && path === '/api/swap') {
        const body = await readBody(req);
        const result = engine.swap(
          { components: (body.components as never) ?? [] },
          body.componentIndex as number,
          body.newIngredientId as string,
        );
        sendJson(res, 200, result);
        return;
      }

      if (req.method === 'POST' && path === '/api/nearest') {
        const body = await readBody(req);
        sendJson(res, 200, {
          results: engine.nearest(
            { components: (body.components as never) ?? [] },
            (body.k as number) ?? 3,
          ),
        });
        return;
      }

      sendJson(res, 404, { error: 'not found' });
    } catch (err) {
      sendJson(res, 400, { error: String(err) });
    }
  });
}

export function start(port = 3000): Server {
  const server = createServer();
  server.listen(port, () => {
    console.log(`🍸 Cocktail Engine running at http://localhost:${port}`);
  });
  return server;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  start(Number(process.env.PORT) || 3000);
}
