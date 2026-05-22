function asString(value) {
  return String(value || "").trim();
}

function toIdString(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && value.toString) {
    return String(value.toString());
  }

  return "";
}

function toDeaneryDocument(doc) {
  return {
    id: toIdString(doc._id),
    name: asString(doc.name || doc.ten || doc.title),
    href: asString(doc.href || ""),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toParishDocument(doc, deaneryMap) {
  const deaneryId = toIdString(doc.giao_hat);
  const parishName = asString((doc.giao_xu && doc.giao_xu.text) || doc.name || doc.ten || doc.title);
  const parishHref = asString((doc.giao_xu && doc.giao_xu.href) || "");
  return {
    id: toIdString(doc._id),
    STT: asString(doc.STT || ""),
    name: parishName,
    href: parishHref,
    ten_khac: asString(doc.ten_khac || ""),
    dia_chi: asString(doc.dia_chi || ""),
    giao_hat: deaneryId,
    deaneryName: deaneryMap.get(deaneryId) || "",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toParishWithDeaneryClone(doc, deaneryDoc) {
  const parishName = asString((doc.giao_xu && doc.giao_xu.text) || doc.name || doc.ten || doc.title);
  const parishHref = asString((doc.giao_xu && doc.giao_xu.href) || "");

  return {
    id: toIdString(doc._id),
    STT: asString(doc.STT || ""),
    name: parishName,
    href: parishHref,
    ten_khac: asString(doc.ten_khac || ""),
    dia_chi: asString(doc.dia_chi || ""),
    giao_hat_detail: deaneryDoc
      ? {
          name: asString(deaneryDoc.name || deaneryDoc.ten || deaneryDoc.title),
          href: asString(deaneryDoc.href || ""),
          createdAt: deaneryDoc.createdAt,
          updatedAt: deaneryDoc.updatedAt,
        }
      : null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function buildDeaneryPayload(body = {}) {
  return {
    name: asString(body.name),
    href: asString(body.href),
  };
}

function buildParishPayload(body = {}) {
  return {
    STT: asString(body.STT || body.stt),
    name: asString(body.name || (body.giao_xu && body.giao_xu.text)),
    href: asString(body.href || body.giaoXuHref || ((body.giao_xu && body.giao_xu.href) || "")),
    ten_khac: asString(body.ten_khac || body.tenKhac),
    dia_chi: asString(body.dia_chi || body.diaChi),
    giao_hat: asString(body.giao_hat),
  };
}

async function parishManagementRoutes(fastify) {
  const deaneries = () => fastify.mongo.db.collection("deanery");
  const parishes = () => fastify.mongo.db.collection("parish");

  async function getDeaneryMap() {
    const docs = await deaneries().find({}).toArray();
    return new Map(docs.map((doc) => [toIdString(doc._id), asString(doc.name || doc.ten || doc.title)]));
  }

  function parseObjectId(id) {
    if (!fastify.mongo.ObjectId.isValid(id)) {
      return null;
    }

    return new fastify.mongo.ObjectId(id);
  }

  fastify.get("/deaneries", async function listDeaneries() {
    const docs = await deaneries().find({}).toArray();
    return docs.map(toDeaneryDocument).sort((a, b) => a.name.localeCompare(b.name, "vi", { sensitivity: "base" }));
  });

  fastify.post("/deaneries", async function createDeanery(request, reply) {
    const payload = buildDeaneryPayload(request.body);

    if (!payload.name) {
      return reply.code(400).send({ error: "name is required." });
    }

    const now = new Date();
    const doc = {
      ...payload,
      createdAt: now,
      updatedAt: now,
    };

    const result = await deaneries().insertOne(doc);
    return reply.code(201).send({ id: toIdString(result.insertedId), ...payload, createdAt: now, updatedAt: now });
  });

  fastify.put("/deaneries/:id", async function updateDeanery(request, reply) {
    const payload = buildDeaneryPayload(request.body);
    const objectId = parseObjectId(request.params.id);

    if (!objectId) {
      return reply.code(400).send({ error: "Invalid id." });
    }

    if (!payload.name) {
      return reply.code(400).send({ error: "name is required." });
    }

    const now = new Date();
    const result = await deaneries().findOneAndUpdate(
      { _id: objectId },
      {
        $set: {
          ...payload,
          updatedAt: now,
        },
      },
      {
        returnDocument: "after",
      }
    );

    if (!result.value) {
      return reply.code(404).send({ error: "Deanery not found." });
    }

    return toDeaneryDocument(result.value);
  });

  fastify.delete("/deaneries/:id", async function deleteDeanery(request, reply) {
    const objectId = parseObjectId(request.params.id);

    if (!objectId) {
      return reply.code(400).send({ error: "Invalid id." });
    }

    const linkedParishCount = await parishes().countDocuments({
      $or: [{ giao_hat: toIdString(objectId) }, { giao_hat: objectId }],
    });
    if (linkedParishCount > 0) {
      return reply.code(409).send({
        error: "Cannot delete deanery with linked parishes.",
      });
    }

    const result = await deaneries().deleteOne({ _id: objectId });
    if (!result.deletedCount) {
      return reply.code(404).send({ error: "Deanery not found." });
    }

    return reply.code(204).send();
  });

  fastify.get("/parishes", async function listParishes() {
    const [docs, deaneryMap] = await Promise.all([parishes().find({}).toArray(), getDeaneryMap()]);

    return docs
      .map((doc) => toParishDocument(doc, deaneryMap))
      .sort((a, b) => a.name.localeCompare(b.name, "vi", { sensitivity: "base" }));
  });

  fastify.get("/parishes/with-deanery", async function listParishesWithDeaneryClone() {
    const [parishDocs, deaneryDocs] = await Promise.all([parishes().find({}).toArray(), deaneries().find({}).toArray()]);
    const deaneryById = new Map(deaneryDocs.map((doc) => [toIdString(doc._id), doc]));

    return parishDocs
      .map((doc) => toParishWithDeaneryClone(doc, deaneryById.get(toIdString(doc.giao_hat))))
      .sort((a, b) => a.name.localeCompare(b.name, "vi", { sensitivity: "base" }));
  });

  fastify.post("/parishes", async function createParish(request, reply) {
    const payload = buildParishPayload(request.body);
    const deaneryId = parseObjectId(payload.giao_hat);

    if (!payload.name) {
      return reply.code(400).send({ error: "name is required." });
    }

    if (!deaneryId) {
      return reply.code(400).send({ error: "giao_hat must be a valid deanery id." });
    }

    const deanery = await deaneries().findOne({ _id: deaneryId });
    if (!deanery) {
      return reply.code(404).send({ error: "Deanery not found." });
    }

    const deaneryIdString = toIdString(deaneryId);
    const now = new Date();
    const doc = {
      STT: payload.STT,
      giao_xu: {
        text: payload.name,
        href: payload.href,
      },
      ten_khac: payload.ten_khac,
      dia_chi: payload.dia_chi,
      giao_hat: deaneryIdString,
      createdAt: now,
      updatedAt: now,
    };

    const result = await parishes().insertOne(doc);
    return reply.code(201).send({
      id: toIdString(result.insertedId),
      STT: payload.STT,
      name: payload.name,
      href: payload.href,
      ten_khac: payload.ten_khac,
      dia_chi: payload.dia_chi,
      giao_hat: deaneryIdString,
      deaneryName: asString(deanery.name || deanery.ten || deanery.title),
      createdAt: now,
      updatedAt: now,
    });
  });

  fastify.put("/parishes/:id", async function updateParish(request, reply) {
    const payload = buildParishPayload(request.body);
    const parishId = parseObjectId(request.params.id);
    const deaneryId = parseObjectId(payload.giao_hat);

    if (!parishId) {
      return reply.code(400).send({ error: "Invalid id." });
    }

    if (!payload.name) {
      return reply.code(400).send({ error: "name is required." });
    }

    if (!deaneryId) {
      return reply.code(400).send({ error: "giao_hat must be a valid deanery id." });
    }

    const deanery = await deaneries().findOne({ _id: deaneryId });
    if (!deanery) {
      return reply.code(404).send({ error: "Deanery not found." });
    }

    const deaneryIdString = toIdString(deaneryId);
    const now = new Date();
    const result = await parishes().findOneAndUpdate(
      { _id: parishId },
      {
        $set: {
          STT: payload.STT,
          giao_xu: {
            text: payload.name,
            href: payload.href,
          },
          ten_khac: payload.ten_khac,
          dia_chi: payload.dia_chi,
          giao_hat: deaneryIdString,
          updatedAt: now,
        },
      },
      {
        returnDocument: "after",
      }
    );

    if (!result.value) {
      return reply.code(404).send({ error: "Parish not found." });
    }

    return {
      ...toParishDocument(result.value, new Map([[toIdString(deanery._id), asString(deanery.name || deanery.ten || deanery.title)]])),
      deaneryName: asString(deanery.name || deanery.ten || deanery.title),
    };
  });

  fastify.delete("/parishes/:id", async function deleteParish(request, reply) {
    const parishId = parseObjectId(request.params.id);

    if (!parishId) {
      return reply.code(400).send({ error: "Invalid id." });
    }

    const result = await parishes().deleteOne({ _id: parishId });
    if (!result.deletedCount) {
      return reply.code(404).send({ error: "Parish not found." });
    }

    return reply.code(204).send();
  });
}

module.exports = parishManagementRoutes;
