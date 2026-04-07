#!/bin/bash

# ==========================================
# AgentOps Studio - Deployment Script
# ==========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}  AgentOps Studio - Deployment Script   ${NC}"
echo -e "${GREEN}==========================================${NC}"

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}Warning: .env.production not found!${NC}"
    echo -e "${YELLOW}Copy .env.production.example to .env.production and configure it.${NC}"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env.production | xargs)

# Step 1: Pull latest code
echo -e "${GREEN}[1/6] Pulling latest code...${NC}"
if [ -d .git ]; then
    git pull origin main
else
    echo -e "${YELLOW}Not a git repository, skipping git pull${NC}"
fi

# Step 2: Build Docker images
echo -e "${GREEN}[2/6] Building Docker images...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache

# Step 3: Start infrastructure services first
echo -e "${GREEN}[3/6] Starting infrastructure services...${NC}"
docker-compose -f docker-compose.prod.yml up -d postgres redis minio

# Wait for infrastructure to be healthy
echo -e "${GREEN}Waiting for infrastructure to be ready...${NC}"
sleep 10

# Step 4: Run database migrations
echo -e "${GREEN}[4/6] Running database migrations...${NC}"
docker-compose -f docker-compose.prod.yml run --rm api sh -c "bun run db:migrate"

# Step 5: Seed database (optional)
read -p "Do you want to seed the database? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Seeding database...${NC}"
    docker-compose -f docker-compose.prod.yml run --rm api sh -c "bun run db:seed"
fi

# Step 6: Start all services
echo -e "${GREEN}[6/6] Starting all services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Show status
echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}  Deployment Complete!                    ${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo -e "Services:"
echo -e "  - Web UI:        http://localhost:3000"
echo -e "  - API:           http://localhost:3001"
echo -e "  - WebSocket:     ws://localhost:3002"
echo -e "  - MinIO Console: http://localhost:9001"
echo ""
echo -e "To check logs: docker-compose -f docker-compose.prod.yml logs -f"
echo -e "To stop:      docker-compose -f docker-compose.prod.yml down"
