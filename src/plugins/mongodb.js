const fp = require("fastify-plugin");
const fastifyMongo = require("@fastify/mongodb");

async function mongodbPlugin(fastify) {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is required in environment variables.");
  }

  await fastify.register(fastifyMongo, {
    url: uri,
    forceClose: true,
  });
}

module.exports = fp(mongodbPlugin);