const Fastify = require("fastify");
const mongodbPlugin = require("./plugins/mongodb");
const healthRoutes = require("./routes/health");
const priestRoutes = require("./routes/priests");
const adminRoutes = require("./routes/admin");

function buildApp(options = {}) {
  const app = Fastify(options);

  app.register(mongodbPlugin);
  app.register(healthRoutes, { prefix: "/api" });
  app.register(priestRoutes, { prefix: "/api" });
  app.register(adminRoutes);

  return app;
}

module.exports = buildApp;