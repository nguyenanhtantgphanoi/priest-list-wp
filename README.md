# Fastify + MongoDB Starter

This project is a Fastify API starter connected to MongoDB.

## Prerequisites

- Node.js 18+
- MongoDB running locally or a remote MongoDB URI

## Setup

1. Install dependencies:

   npm install

2. Create environment file from the example:

   copy .env.example .env

3. Update `MONGODB_URI` in `.env` if needed.

## Run

- Development mode:

  npm run dev

- Production mode:

  npm start

Server starts on `PORT` (default `3000`).

## Endpoint

- Health check: `GET /api/health`
- Admin page: `GET /admin`
- Priests list: `GET /api/priests`
- Priests create: `POST /api/priests`
- Priests update: `PUT /api/priests/:id`
- Priests delete: `DELETE /api/priests/:id`
- Deaneries list: `GET /api/deaneries`
- Deaneries create: `POST /api/deaneries`
- Deaneries update: `PUT /api/deaneries/:id`
- Deaneries delete: `DELETE /api/deaneries/:id`
- Parishes list: `GET /api/parishes`
- Parishes list with cloned deanery detail: `GET /api/parishes/with-deanery`
- Parishes create: `POST /api/parishes`
- Parishes update: `PUT /api/parishes/:id`
- Parishes delete: `DELETE /api/parishes/:id`

## Admin Profile Manager

Open `/admin` in your browser to manage priest profiles.

- Creates and updates profile records from the form.
- Lists priest documents in MongoDB collection `priest`.
- Supports editing and deleting existing records.
- Form fields are aligned to current document keys:
  `state`, `name`, `nickname`, `avatarUrl`, `sinhNam`, `leQuanThay`, `thuPhongLinhMuc`, `diaChi`, `giaoVu`, `queQuan`, `ngayMat`, `noiAnTang`.

## Deanery + Parish Manager

Open `/admin/parishes` in your browser to manage deaneries and parishes.

- Parish field `giao_hat` stores the deanery `_id`.
- Parish list supports inline editing for parish name and linked deanery.
- Deanery list supports inline editing.
- Parish search hides unmatched rows while typing.

  https://lmwp.tgphanoi.org/api/priests/by-status/