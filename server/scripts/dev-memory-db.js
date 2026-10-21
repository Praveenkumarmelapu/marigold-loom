// Starts a throwaway in-memory MongoDB for local testing (no Atlas needed).
const { MongoMemoryServer } = require('mongodb-memory-server');
(async () => {
  const m = await MongoMemoryServer.create({ instance: { port: 27555 } });
  console.log('MEMORY_URI', m.getUri('marigold-loom'));
  process.on('SIGTERM', async () => { await m.stop(); process.exit(0); });
  setInterval(() => {}, 1 << 30);
})();
