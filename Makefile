COMPOSE_PROD=docker compose -f docker-compose.prod.yml
BACKUP_DIR?=backups
BACKUP_FILE?=$(BACKUP_DIR)/parcel-society-$$(date +%Y%m%d-%H%M%S).sql.gz
RESTORE_FILE?=

.PHONY: dev prod-up prod-down logs migrate seed backup restore

dev:
	pnpm dev

prod-up:
	$(COMPOSE_PROD) up -d --build postgres web

prod-down:
	$(COMPOSE_PROD) down

logs:
	$(COMPOSE_PROD) logs -f --tail=200

migrate:
	$(COMPOSE_PROD) run --rm migrate

seed:
	$(COMPOSE_PROD) run --rm --entrypoint pnpm migrate --filter @parcel-society/db seed

backup:
	mkdir -p $(BACKUP_DIR)
	$(COMPOSE_PROD) exec -T postgres sh -c 'pg_dump -U "$${POSTGRES_USER}" -d "$${POSTGRES_DB}"' | gzip > $(BACKUP_FILE)
	@echo "Backup written to $(BACKUP_FILE)"

restore:
	@test -n "$(RESTORE_FILE)" || (echo "Usage: make restore RESTORE_FILE=backups/file.sql.gz" && exit 1)
	gunzip -c $(RESTORE_FILE) | $(COMPOSE_PROD) exec -T postgres sh -c 'psql -U "$${POSTGRES_USER}" -d "$${POSTGRES_DB}"'
