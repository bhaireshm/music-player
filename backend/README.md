# Online Music Player - Backend

Backend API for the online music player application.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Copy `.env.example` to `.env` and configure your environment variables:
```bash
cp .env.example .env
```

3. Install Chromaprint (fpcalc) for audio fingerprinting:
   - **Windows**: Download from https://acoustid.org/chromaprint
   - **macOS**: `brew install chromaprint`
   - **Linux**: `sudo apt-get install libchromaprint-tools`

## Development

Run the development server:
```bash
pnpm dev
```

## Build

Build the TypeScript project:
```bash
pnpm build
```

## Production

Start the production server:
```bash
pnpm start
```

## Linting

Run ESLint:
```bash
pnpm lint
```

Fix linting issues:
```bash
pnpm lint:fix
```

## Format

Format code with Prettier:
```bash
pnpm format
```

## Project Structure

```
src/
├── config/       # Configuration files (DB, Firebase, R2)
├── models/       # Mongoose data models
├── controllers/  # Request handlers
├── services/     # Business logic
├── middleware/   # Express middleware
├── routes/       # API routes
└── index.ts      # Application entry point
```
