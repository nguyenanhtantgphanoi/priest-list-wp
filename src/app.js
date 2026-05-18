const Fastify = require("fastify");
const mongodbPlugin = require("./plugins/mongodb");
const healthRoutes = require("./routes/health");

function buildApp(options = {}) {
  const app = Fastify(options);

  app.register(mongodbPlugin);
  app.register(healthRoutes, { prefix: "/api" });

  return app;
}

module.exports = buildApp;