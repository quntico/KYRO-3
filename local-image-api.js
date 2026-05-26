/**
 * PANDORA LOCAL IMAGE API
 * Servidor local para generación de imágenes con DALL-E 3
 * Ejecutar con: node local-image-api.js
 * Corre en puerto 3002 paralelo al servidor Vite (3001)
 */

import http from 'http';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Cargar variables de entorno desde .env.local
function loadEnv() {
  try {
    const envPath = resolve(__dirname, '.env.local');
    const content = readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
      const [key, ...vals] = line.split('=');
      if (key && vals.length > 0) {
        process.env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
      }
    });
    console.log('✅ Variables de entorno cargadas desde .env.local');
  } catch (e) {
    console.warn('⚠️  No se encontró .env.local — crea el archivo con OPENAI_API_KEY=sk-...');
  }
}

loadEnv();

const PORT = 3002;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY no está configurada. Crea .env.local con tu key.');
  process.exit(1);
}

// Importar OpenAI (instalado en el proyecto)
const { default: OpenAI } = await import('openai');
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const server = http.createServer(async (req, res) => {
  // Headers CORS para permitir llamadas desde localhost:3001
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/generate-image') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { prompt } = JSON.parse(body);
        console.log(`🎨 Generando imagen: "${prompt.substring(0, 60)}..."`);

        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt: `${prompt}, high quality, detailed, professional`,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        });

        const imageUrl = response.data[0].url;
        console.log(`✅ Imagen generada: ${imageUrl.substring(0, 60)}...`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ imageUrl }));
      } catch (err) {
        console.error('❌ Error DALL-E:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`\n🚀 PANDORA Image API running on http://localhost:${PORT}`);
  console.log(`   Endpoint: POST http://localhost:${PORT}/generate-image`);
  console.log(`   Modelo: DALL-E 3 (1024x1024)\n`);
});
