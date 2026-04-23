// bin/vector.mjs
const COLLECTION = 'web_ui_skills';
const VECTOR_SIZE = 384;

async function loadQdrant(qdrantUrl) {
  try {
    const { QdrantClient } = await import('@qdrant/js-client-rest');
    const client = new QdrantClient({ url: qdrantUrl });
    await client.getCollections(); // ping
    return client;
  } catch {
    return null;
  }
}

async function loadPipeline() {
  try {
    const { pipeline } = await import('@xenova/transformers');
    return await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  } catch {
    return null;
  }
}

async function embed(pipe, text) {
  const out = await pipe(text, { pooling: 'mean', normalize: true });
  return Array.from(out.data);
}

async function ensureCollection(client) {
  const { collections } = await client.getCollections();
  const exists = collections.some((c) => c.name === COLLECTION);
  if (!exists) {
    await client.createCollection(COLLECTION, {
      vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
    });
  }
}

export class VectorSearch {
  constructor() {
    this._client = null;
    this._pipe = null;
    this._indexed = false;
    this._initPromise = null;
  }

  _init() {
    if (!this._initPromise) {
      const qdrantUrl = process.env.QDRANT_URL;
      this._initPromise = (async () => {
        if (!qdrantUrl) return;
        const [client, pipe] = await Promise.all([loadQdrant(qdrantUrl), loadPipeline()]);
        if (client && pipe) {
          this._client = client;
          this._pipe = pipe;
        }
      })();
    }
    return this._initPromise;
  }

  async available() {
    await this._init();
    return this._client !== null;
  }

  async ensureIndex(skills) {
    if (!(await this.available())) return;
    await ensureCollection(this._client);

    const points = [];
    for (const skill of skills) {
      const text = [skill.name, skill.description, (skill.content || '').slice(0, 500)]
        .filter(Boolean)
        .join(' ');
      const vector = await embed(this._pipe, text);
      points.push({ id: hashCode(skill.name) >>> 0, vector, payload: { name: skill.name } });
    }

    await this._client.upsert(COLLECTION, { points });
    this._indexed = true;
  }

  async search(query, limit = 10) {
    if (!(await this.available())) return null;
    if (!this._indexed) return null;

    const vector = await embed(this._pipe, query);
    const results = await this._client.search(COLLECTION, { vector, limit });
    return results.map((r) => ({ name: r.payload.name, score: r.score }));
  }
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

export const vectorSearch = new VectorSearch();
