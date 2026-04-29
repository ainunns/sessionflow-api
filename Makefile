# Import .env file
ifneq (,$(wildcard ./.env))
		include .env
		export $(shell sed 's/=.*//' .env)
endif

# Variables
CONTAINER_NAME=${APP_NAME}-app

# Commands
dep: 
	pnpm install

run: 
	pnpm run start:dev

build: 
	pnpm run build

run-build: build
	pnpm run start:prod

test:
	pnpm run test

init-docker:
	docker compose up -d --build

up: 
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

# Docker commands
container-app:
	docker exec -it ${CONTAINER_NAME} /bin/sh