import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import { createServer } from '../src/server';

let server: Server;
let base: string;

beforeAll(async () => {
  server = createServer();
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  base = `http://localhost:${port}`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

const post = (path: string, body: unknown) =>
  fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json());

const negroni = [
  { ingredientId: 'gin', role: 'base', bucket: 'full' },
  { ingredientId: 'campari', role: 'modifier', bucket: 'full' },
  { ingredientId: 'sweet_vermouth', role: 'modifier', bucket: 'full' },
];

describe('HTTP API', () => {
  it('GET /api/ingredients returns the list', async () => {
    const res = await fetch(`${base}/api/ingredients`);
    const json = await res.json();
    expect(json.ingredients.some((i: { id: string }) => i.id === 'gin')).toBe(true);
  });

  it('POST /api/identify identifies a Negroni', async () => {
    const json = await post('/api/identify', { components: negroni });
    expect(json.status).toBe('exact');
    expect(json.matches.map((c: { id: string }) => c.id)).toContain('negroni');
  });

  it('POST /api/explore suggests completing a Negroni', async () => {
    const json = await post('/api/explore', {
      components: [
        { ingredientId: 'gin', role: 'base', bucket: 'full' },
        { ingredientId: 'campari', role: 'modifier', bucket: 'full' },
      ],
    });
    const negroniCand = json.candidates.find(
      (c: { cocktail: { id: string } }) => c.cocktail.id === 'negroni',
    );
    expect(negroniCand).toBeDefined();
    expect(negroniCand.missing.map((m: { ingredientId: string }) => m.ingredientId)).toEqual([
      'sweet_vermouth',
    ]);
  });

  it('POST /api/swap turns a Negroni into a Boulevardier', async () => {
    const json = await post('/api/swap', {
      components: negroni,
      componentIndex: 0,
      newIngredientId: 'bourbon',
    });
    expect(json.status).toBe('exact');
    expect(json.matches.map((c: { id: string }) => c.id)).toContain('boulevardier');
  });

  it('POST /api/nearest ranks Negroni nearest to an aperol variant', async () => {
    const json = await post('/api/nearest', {
      components: [
        { ingredientId: 'gin', role: 'base', bucket: 'full' },
        { ingredientId: 'aperol', role: 'modifier', bucket: 'full' },
        { ingredientId: 'sweet_vermouth', role: 'modifier', bucket: 'full' },
      ],
    });
    expect(json.results[0].cocktail.id).toBe('negroni');
    expect(json.results[0].distance).toBe(2);
  });
});
