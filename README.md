# SessionFlow API

Backend service for session management and authentication, built with NestJS and MongoDB.

## Tech stack

- Runtime: Node.js
- Framework: NestJS
- Database: MongoDB (Mongoose)
- Auth: JWT (access + refresh)
- Validation: class-validator + class-transformer
- Testing: Jest + Supertest
- Tooling: pnpm, Biome

## Folder structure

```text
src/
	common/           # Shared abstractions, DTOs, filters, interceptors
	infrastructure/   # Cross-cutting infrastructure (e.g., database modules)
	modules/          # Feature modules (auth, session, user)
		<module>/
			application/  # Commands, handlers, services, use-cases
			domain/       # Entities, repository interfaces
			infrastructure/ # Mappers, repositories, schemas
			presentation/ # Controllers, guards, DTOs
	app.module.ts
	main.ts
test/               # E2E tests and helpers
```

## Requirements

- Node.js (LTS recommended)
- pnpm
- MongoDB (local) or Docker

## Configuration

Copy the example env file and adjust values.

```bash
cp .env.example .env
```

## Run locally (Node + MongoDB)

```bash
pnpm install
pnpm run start:dev
```

The API starts on `http://localhost:8888` by default, with the base path `api/v1`.

## Run with Docker

```bash
docker compose up -d --build
```

This starts the NestJS app and a MongoDB container using the values from `.env`.

## Tests

```bash
pnpm run test
pnpm run test:e2e
pnpm run test:cov
```

## Key design decisions

- Modular, feature-based layout under `src/modules` to keep boundaries clear and make vertical slices easy to evolve.
- CQRS for auth/session flows to separate write and read responsibilities and keep use-case handlers focused.
- Mongoose integration with repository abstractions to isolate persistence details from domain logic.
- Global validation pipe and response interceptor for consistent API contracts and safer input handling.
- JWT access + refresh token flow for stateless auth while keeping refresh rotations isolated in the auth module.

## Challenges encountered

- Coordinating CQRS handlers across module boundaries without leaking infrastructure details.
- Keeping validation rules consistent across shared DTOs in controllers and use-cases.
- Managing MongoDB connection lifecycles in tests while keeping e2e runs fast and reliable.
- Balancing strict input validation with backward compatibility for evolving request payloads.
