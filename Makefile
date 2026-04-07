.PHONY: help build start stop restart logs ps logs-api logs-web logs-worker migrate seed status clean

# Default target
help:
	@echo "AgentOps Studio - Deployment Commands"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  build       Build all Docker images"
	@echo "  start       Start all services"
	@echo "  stop        Stop all services"
	@echo "  restart     Restart all services"
	@echo "  logs        View all logs (Ctrl+C to exit)"
	@echo "  logs-api    View API logs"
	@echo "  logs-web    View Web logs"
	@echo "  logs-worker View Worker logs"
	@echo "  ps          Show service status"
	@echo "  migrate     Run database migrations"
	@echo "  seed        Seed database with initial data"
	@echo "  status      Show health status of all services"
	@echo "  clean       Stop and remove all containers and volumes"
	@echo "  deploy      Full deployment (build + migrate + start)"

# Build Docker images
build:
	docker-compose -f docker-compose.prod.yml build

# Start all services
start:
	docker-compose -f docker-compose.prod.yml up -d

# Stop all services
stop:
	docker-compose -f docker-compose.prod.yml down

# Restart all services
restart:
	docker-compose -f docker-compose.prod.yml restart

# View all logs
logs:
	docker-compose -f docker-compose.prod.yml logs -f

# View API logs
logs-api:
	docker-compose -f docker-compose.prod.yml logs -f api

# View Web logs
logs-web:
	docker-compose -f docker-compose.prod.yml logs -f web

# View Worker logs
logs-worker:
	docker-compose -f docker-compose.prod.yml logs -f worker

# Show service status
ps:
	docker-compose -f docker-compose.prod.yml ps

# Run database migrations
migrate:
	docker-compose -f docker-compose.prod.yml run --rm api bun run db:migrate

# Seed database
seed:
	docker-compose -f docker-compose.prod.yml run --rm api bun run db:seed

# Show health status
status:
	@echo "=== Container Status ===" && \
	docker-compose -f docker-compose.prod.yml ps && \
	@echo "" && \
	@echo "=== Health Checks ===" && \
	echo "API: $$(curl -sf http://localhost:3001/health 2>/dev/null && echo 'OK' || echo 'FAIL')" && \
	echo "Web: $$(curl -sf http://localhost:3000 2>/dev/null && echo 'OK' || echo 'FAIL')"

# Full deployment
deploy: build migrate start

# Clean up everything (WARNING: deletes all data)
clean:
	docker-compose -f docker-compose.prod.yml down -v
	docker volume rm agentops_postgres_data agentops_redis_data agentops_minio_data 2>/dev/null || true
