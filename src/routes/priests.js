function buildPriestPayload(body = {}) {
  return {
    state: String(body.state || "active-diocese").trim(),
    name: String(body.name || body.fullName || "").trim(),
    nickname: String(body.nickname || "").trim(),
    avatarUrl: String(body.avatarUrl || "").trim(),
    sinhNam: String(body.sinhNam || "").trim(),
    leQuanThay: String(body.leQuanThay || "").trim(),
    thuPhongLinhMuc: String(body.thuPhongLinhMuc || "").trim(),
    diaChi: String(body.diaChi || "").trim(),
    giaoVu: String(body.giaoVu || "").trim(),
    queQuan: String(body.queQuan || "").trim(),
    ngayMat: String(body.ngayMat || "").trim(),
    noiAnTang: String(body.noiAnTang || "").trim(),
  };
}

function toDocument(priest) {
  return {
    id: String(priest._id),
    state: priest.state,
    name: priest.name,
    nickname: priest.nickname,
    avatarUrl: priest.avatarUrl,
    sinhNam: priest.sinhNam,
    leQuanThay: priest.leQuanThay,
    thuPhongLinhMuc: priest.thuPhongLinhMuc,
    diaChi: priest.diaChi,
    giaoVu: priest.giaoVu,
    queQuan: priest.queQuan,
    ngayMat: priest.ngayMat,
    noiAnTang: priest.noiAnTang,
    createdAt: priest.createdAt,
    updatedAt: priest.updatedAt,
  };
}

function getLastWord(name = "") {
  const trimmed = String(name).trim();
  if (!trimmed) {
    return "";
  }

  const parts = trimmed.split(/\s+/);
  return parts[parts.length - 1].toLowerCase();
}

function sortByLastWord(items = []) {
  return [...items].sort((a, b) => {
    const aKey = getLastWord(a.name);
    const bKey = getLastWord(b.name);
    const lastWordCmp = aKey.localeCompare(bKey, "vi", { sensitivity: "base" });

    if (lastWordCmp !== 0) {
      return lastWordCmp;
    }

    return String(a.name || "").localeCompare(String(b.name || ""), "vi", { sensitivity: "base" });
  });
}

async function priestRoutes(fastify) {
  const priests = () => fastify.mongo.db.collection("priest");

  fastify.get("/priests", async function listPriests() {
    const docs = await priests().find({}).toArray();
    return sortByLastWord(docs.map(toDocument));
  });

  fastify.get("/priests/by-status/:status", async function listPriestsByStatus(request, reply) {
    const status = String(request.params.status || "").trim();

    if (!status) {
      return reply.code(400).send({ error: "status is required." });
    }

    const docs = await priests().find({ state: status }).toArray();
    return sortByLastWord(docs.map(toDocument));
  });

  fastify.post("/priests", async function createPriest(request, reply) {
    const payload = buildPriestPayload(request.body);

    if (!payload.name) {
      return reply.code(400).send({ error: "name is required." });
    }

    const now = new Date();
    const doc = {
      ...payload,
      createdAt: now,
      updatedAt: now,
    };

    const result = await priests().insertOne(doc);
    return reply.code(201).send({ id: String(result.insertedId), ...payload, createdAt: now, updatedAt: now });
  });

  fastify.put("/priests/:id", async function updatePriest(request, reply) {
    const { id } = request.params;
    const payload = buildPriestPayload(request.body);

    if (!payload.name) {
      return reply.code(400).send({ error: "name is required." });
    }

    if (!fastify.mongo.ObjectId.isValid(id)) {
      return reply.code(400).send({ error: "Invalid id." });
    }

    const objectId = new fastify.mongo.ObjectId(id);
    const now = new Date();

    const result = await priests().findOneAndUpdate(
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
      return reply.code(404).send({ error: "Priest not found." });
    }

    return toDocument(result.value);
  });

  fastify.delete("/priests/:id", async function deletePriest(request, reply) {
    const { id } = request.params;

    if (!fastify.mongo.ObjectId.isValid(id)) {
      return reply.code(400).send({ error: "Invalid id." });
    }

    const objectId = new fastify.mongo.ObjectId(id);
    const result = await priests().deleteOne({ _id: objectId });

    if (!result.deletedCount) {
      return reply.code(404).send({ error: "Priest not found." });
    }

    return reply.code(204).send();
  });
}

module.exports = priestRoutes;