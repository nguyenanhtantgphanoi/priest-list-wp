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