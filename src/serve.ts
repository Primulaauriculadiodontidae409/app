import fastify from 'fastify';
import { WebSocketServer } from 'ws';
import { Command } from 'commander';
import { MongoClient } from 'mongodb';

// --- CLI ---
const program = new Command();
program
  .name('mango-serve')
  .description('Mango web companion server')
  .option('--host <hostname>', 'bind address and CORS origin', 'localhost')
  .option('--port <port>', 'HTTP/WebSocket port', '3000')
  .option('--transient', 'disable connection persistence (demo mode)', false)
  .option('--html <path>', 'path to mango.html', 'mango.html')
  .parse();

const opts = program.opts();
const HOST: string = opts.host;
const PORT: number = parseInt(opts.port) || 3000;
const TRANSIENT: boolean = opts.transient;
const HTML_PATH: string = opts.html;

// --- Read HTML file ---
import { readFileSync } from 'fs';

let htmlContent = '';
try {
  htmlContent = readFileSync(HTML_PATH, 'utf-8');
} catch (e: any) {
  console.log('Warning: Could not read ' + HTML_PATH + ' — GET / will return 404');
}

// --- Fastify HTTP server ---
const app = fastify();

app.get('/', async (request: any, reply: any) => {
  if (!htmlContent) {
    reply.code(404).send('mango.html not found');
    return;
  }
  reply.header('Content-Type', 'text/html; charset=utf-8');
  reply.header('Access-Control-Allow-Origin', HOST === 'localhost' ? '*' : 'https://' + HOST);
  reply.send(htmlContent);
});

// --- WebSocket server ---
const wss = new WebSocketServer({ noServer: true });

// Upgrade HTTP to WebSocket on /ws path
app.server.on('upgrade', (request: any, socket: any, head: any) => {
  const url = request.url || '';
  if (url === '/ws' || url.startsWith('/ws?')) {
    wss.handleUpgrade(request, socket, head, (wsConn: any) => {
      wss.emit('connection', wsConn, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (wsConn: any) => {
  let mongoClient: any = null;

  // Send config on connect
  wsConn.send(JSON.stringify({
    type: 'config',
    transient: TRANSIENT,
    host: HOST,
  }));

  wsConn.on('message', async (raw: any) => {
    let msg: any;
    try { msg = JSON.parse(typeof raw === 'string' ? raw : raw.toString()); } catch (e: any) { return; }

    const id = msg.id;
    const action: string = msg.action;
    const params: any = msg.params || {};

    function reply(data: any, error?: string): void {
      const resp: any = { id, ok: !error };
      if (error) resp.error = error;
      else resp.data = data;
      wsConn.send(JSON.stringify(resp));
    }

    try {
      if (action === 'connect') {
        if (mongoClient) {
          try { await mongoClient.close(); } catch (e: any) {}
        }
        mongoClient = await MongoClient.connect(params.uri);
        // Validate by listing databases
        await mongoClient.listDatabases();
        reply(true);

      } else if (action === 'disconnect') {
        if (mongoClient) {
          await mongoClient.close();
          mongoClient = null;
        }
        reply(true);

      } else if (action === 'listDatabases') {
        if (!mongoClient) { reply(null, 'Not connected'); return; }
        const result = await mongoClient.listDatabases();
        reply(result);

      } else if (action === 'listCollections') {
        if (!mongoClient) { reply(null, 'Not connected'); return; }
        const db = mongoClient.db(params.dbName);
        const result = await db.listCollections();
        reply(result);

      } else if (action === 'find') {
        if (!mongoClient) { reply(null, 'Not connected'); return; }
        const db = mongoClient.db(params.dbName);
        const coll = db.collection(params.collName);
        const docs = await coll.find(params.filter || '{}');
        reply(docs);

      } else if (action === 'insertOne') {
        if (!mongoClient) { reply(null, 'Not connected'); return; }
        const db = mongoClient.db(params.dbName);
        const coll = db.collection(params.collName);
        const result = await coll.insertOne(params.doc);
        reply(result);

      } else if (action === 'updateOne') {
        if (!mongoClient) { reply(null, 'Not connected'); return; }
        const db = mongoClient.db(params.dbName);
        const coll = db.collection(params.collName);
        const result = await coll.updateOne(params.filter, params.update);
        reply(result);

      } else if (action === 'deleteOne') {
        if (!mongoClient) { reply(null, 'Not connected'); return; }
        const db = mongoClient.db(params.dbName);
        const coll = db.collection(params.collName);
        const result = await coll.deleteOne(params.filter);
        reply(result);

      } else {
        reply(null, 'Unknown action: ' + action);
      }
    } catch (e: any) {
      reply(null, e.message || 'Server error');
    }
  });

  wsConn.on('close', () => {
    if (mongoClient) {
      try { mongoClient.close(); } catch (e: any) {}
      mongoClient = null;
    }
  });
});

// --- Start ---
const bindHost = HOST === 'localhost' ? '127.0.0.1' : '0.0.0.0';

app.listen({ port: PORT, host: bindHost }, (err: any) => {
  if (err) {
    console.log('Failed to start: ' + (err.message || err));
    return;
  }
  console.log('Mango server running at http://' + HOST + ':' + PORT);
  if (TRANSIENT) console.log('Transient mode: connection profiles will not be persisted');
});
