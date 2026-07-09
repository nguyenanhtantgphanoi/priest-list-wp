function asString(value) {
  return String(value || "").trim();
}

function normalizeAttachments(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      return {
        name: asString(item.name),
        type: asString(item.type),
        size: Number(item.size) || 0,
        dataUrl: asString(item.dataUrl),
      };
    })
    .filter((item) => item && item.name);
}

function normalizeSubParishes(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      return {
        parish_name: asString(item.parish_name || item.parishName || item.name),
        other_name: asString(item.other_name || item.otherName),
        parish_link: asString(item.parish_link || item.parishLink || item.href),
        address: asString(item.address),
        ngay_thanh_lap: asString(item.ngay_thanh_lap || item.ngayThanhLap),
        ten_thanh_quan_thay: asString(item.ten_thanh_quan_thay || item.tenThanhQuanThay),
        ngay_mung_le_quan_thay: asString(item.ngay_mung_le_quan_thay || item.ngayMungLeQuanThay),
        so_nhan_danh: asString(item.so_nhan_danh || item.soNhanDanh),
        documents: normalizeAttachments(item.documents),
        media: normalizeAttachments(item.media),
      };
    })
    .filter((item) => item && item.parish_name);
}

function isValidDateOrYear(value) {
  if (!value) {
    return true;
  }

  return /^(\d{1,2}\/\d{1,2}\/\d{4}|\d{4})$/.test(value);
}

function isValidDayMonth(value) {
  if (!value) {
    return true;
  }

  return /^\d{1,2}\/\d{1,2}$/.test(value);
}

function getParishPayloadValidationError(payload) {
  if (!isValidDateOrYear(payload.ngay_thanh_lap)) {
    return "ngay_thanh_lap must be in dd/mm/yyyy or yyyy format.";
  }

  if (!isValidDateOrYear(payload.ngay_cung_hien)) {
    return "ngay_cung_hien must be in dd/mm/yyyy or yyyy format.";
  }

  if (!isValidDayMonth(payload.ngay_mung_le_quan_thay)) {
    return "ngay_mung_le_quan_thay must be in dd/mm format.";
  }

  for (const subParish of payload.giao_ho_truc_thuoc) {
    if (!isValidDateOrYear(subParish.ngay_thanh_lap)) {
      return "Each giao_ho_truc_thuoc.ngay_thanh_lap must be in dd/mm/yyyy or yyyy format.";
    }

    if (!isValidDayMonth(subParish.ngay_mung_le_quan_thay)) {
      return "Each giao_ho_truc_thuoc.ngay_mung_le_quan_thay must be in dd/mm format.";
    }
  }

  return "";
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
    ngay_thanh_lap: asString(doc.ngay_thanh_lap || ""),
    ten_thanh_quan_thay: asString(doc.ten_thanh_quan_thay || ""),
    ngay_mung_le_quan_thay: asString(doc.ngay_mung_le_quan_thay || ""),
    ngay_cung_hien: asString(doc.ngay_cung_hien || ""),
    so_nhan_danh: asString(doc.so_nhan_danh || ""),
    linh_muc_chinh_xu: asString(doc.linh_muc_chinh_xu || ""),
    giao_ho_truc_thuoc: normalizeSubParishes(doc.giao_ho_truc_thuoc),
    documents: normalizeAttachments(doc.documents),
    media: normalizeAttachments(doc.media),
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
    ngay_thanh_lap: asString(body.ngay_thanh_lap || body.ngayThanhLap),
    ten_thanh_quan_thay: asString(body.ten_thanh_quan_thay || body.tenThanhQuanThay),
    ngay_mung_le_quan_thay: asString(body.ngay_mung_le_quan_thay || body.ngayMungLeQuanThay),
    ngay_cung_hien: asString(body.ngay_cung_hien || body.ngayCungHien),
    so_nhan_danh: asString(body.so_nhan_danh || body.soNhanDanh),
    linh_muc_chinh_xu: asString(body.linh_muc_chinh_xu || body.linhMucChinhXu),
    giao_ho_truc_thuoc: normalizeSubParishes(body.giao_ho_truc_thuoc || body.giaoHoTrucThuoc),
    documents: normalizeAttachments(body.documents),
    media: normalizeAttachments(body.media),
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

    const payloadError = getParishPayloadValidationError(payload);
    if (payloadError) {
      return reply.code(400).send({ error: payloadError });
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
      ngay_thanh_lap: payload.ngay_thanh_lap,
      ten_thanh_quan_thay: payload.ten_thanh_quan_thay,
      ngay_mung_le_quan_thay: payload.ngay_mung_le_quan_thay,
      ngay_cung_hien: payload.ngay_cung_hien,
      so_nhan_danh: payload.so_nhan_danh,
      linh_muc_chinh_xu: payload.linh_muc_chinh_xu,
      giao_ho_truc_thuoc: payload.giao_ho_truc_thuoc,
      documents: payload.documents,
      media: payload.media,
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
      ngay_thanh_lap: payload.ngay_thanh_lap,
      ten_thanh_quan_thay: payload.ten_thanh_quan_thay,
      ngay_mung_le_quan_thay: payload.ngay_mung_le_quan_thay,
      ngay_cung_hien: payload.ngay_cung_hien,
      so_nhan_danh: payload.so_nhan_danh,
      linh_muc_chinh_xu: payload.linh_muc_chinh_xu,
      giao_ho_truc_thuoc: payload.giao_ho_truc_thuoc,
      documents: payload.documents,
      media: payload.media,
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

    const payloadError = getParishPayloadValidationError(payload);
    if (payloadError) {
      return reply.code(400).send({ error: payloadError });
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
          ngay_thanh_lap: payload.ngay_thanh_lap,
          ten_thanh_quan_thay: payload.ten_thanh_quan_thay,
          ngay_mung_le_quan_thay: payload.ngay_mung_le_quan_thay,
          ngay_cung_hien: payload.ngay_cung_hien,
          so_nhan_danh: payload.so_nhan_danh,
          linh_muc_chinh_xu: payload.linh_muc_chinh_xu,
          giao_ho_truc_thuoc: payload.giao_ho_truc_thuoc,
          documents: payload.documents,
          media: payload.media,
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
