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

## Admin Profile Manager

Open `/admin` in your browser to manage priest profiles.

- Creates and updates profile records from the form.
- Lists priest documents in MongoDB collection `priest`.
- Supports editing and deleting existing records.
- Form fields are aligned to current document keys:
  `state`, `name`, `nickname`, `avatarUrl`, `sinhNam`, `leQuanThay`, `thuPhongLinhMuc`, `diaChi`, `giaoVu`, `queQuan`, `ngayMat`, `noiAnTang`.

  https://lmwp.tgphanoi.org/api/priests/by-status/