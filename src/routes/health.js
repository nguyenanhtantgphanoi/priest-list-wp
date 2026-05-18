async function healthRoutes(fastify) {
  fastify.get("/health", async function handler() {
    return {
      status: "ok",
      service: "priest-list-wp",
      mongoConnected: Boolean(fastify.mongo && fastify.mongo.client),
      timestamp: new Date().toISOString(),
    };
  });
}

module.exports = healthRoutes;