# Deploying Parcel Society on a VPS

This guide targets an Ubuntu VPS running Docker Compose with PostgreSQL in a container, the Next.js app in a production container, and either a host-level Nginx reverse proxy or the optional Compose-managed Nginx service.

## Server requirements

- Ubuntu 22.04 LTS or newer.
- 1 vCPU and 2 GB RAM minimum for small pilots; use 2+ vCPU and 4+ GB RAM for heavier experiments.
- 20 GB+ disk, plus enough space for PostgreSQL data and backups.
- A DNS `A`/`AAAA` record pointing your domain to the VPS.
- Open inbound ports `22`, `80`, and `443`; keep PostgreSQL private.

## Install Docker and Compose

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
```

Log out and back in, then verify:

```bash
docker --version
docker compose version
```

## Clone the repository

```bash
sudo mkdir -p /opt/parcel-society
sudo chown "$USER":"$USER" /opt/parcel-society
git clone https://github.com/YOUR_ORG/Parcel-Society.git /opt/parcel-society
cd /opt/parcel-society
```

## Create `.env`

Create `/opt/parcel-society/.env` and keep it out of source control:

```dotenv
POSTGRES_USER=parcel
POSTGRES_PASSWORD=replace-with-a-long-random-database-password
POSTGRES_DB=parcel_society
DATABASE_URL=postgresql://parcel:replace-with-a-long-random-database-password@postgres:5432/parcel_society?schema=public

ADMIN_EMAIL=admin@example.org
ADMIN_PASSWORD=replace-with-a-strong-admin-password
APP_SECRET=replace-with-at-least-32-random-bytes
NEXTAUTH_SECRET=replace-with-the-same-or-another-32-random-bytes
WEB_PORT=3000
NODE_ENV=production
```

Generate secrets with:

```bash
openssl rand -base64 32
```

Use the same PostgreSQL password in `POSTGRES_PASSWORD` and `DATABASE_URL`. The production Compose file keeps PostgreSQL on the private Docker network and binds the web app to `127.0.0.1:3000` for reverse proxying.

## Build and start production containers

```bash
make prod-up
```

This builds the standalone Next.js image and starts `postgres` and `web` with `restart: unless-stopped`.

## Run migrations

Run database schema deployment after the database is healthy:

```bash
make migrate
```

Production deployments use versioned Prisma migrations via `prisma migrate deploy`; do not use `db push` against production data.

## Create the first admin

The application authenticates the environment admin with `ADMIN_EMAIL` and `ADMIN_PASSWORD`. To ensure the admin user/profile exists in the database and to create demo servers, run:

```bash
make seed
```

You can then open `/admin/login`, enter those credentials, and manage servers. Rotate the password after sharing temporary access.

## Configure Nginx and HTTPS

### Recommended: host-level Nginx

Install Nginx and Certbot on the VPS:

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
sudo cp deploy/nginx/parcel-society.conf.example /etc/nginx/sites-available/parcel-society
sudo sed -i 's/your-domain.com/example.org/g' /etc/nginx/sites-available/parcel-society
sudo ln -s /etc/nginx/sites-available/parcel-society /etc/nginx/sites-enabled/parcel-society
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d example.org
```

The sample config proxies `https://your-domain.com` to `http://127.0.0.1:3000`.

### Optional: Compose-managed Nginx

If you prefer the included Nginx container, adapt `deploy/nginx/parcel-society.conf.example` for container networking and certificate paths, then run:

```bash
docker compose -f docker-compose.prod.yml --profile nginx up -d nginx
```

For most VPS deployments, host-level Nginx plus Certbot is simpler.

## Check health and logs

```bash
curl -fsS http://127.0.0.1:3000/api/health
make logs
```

A healthy response looks like:

```json
{
  "ok": true,
  "database": "connected",
  "timestamp": "2026-05-10T00:00:00.000Z"
}
```

## Update deployment

```bash
cd /opt/parcel-society
git pull
make prod-up
make migrate
make logs
```

If dependencies or Docker layers changed, `make prod-up` rebuilds the web image.

## Backup PostgreSQL

Backups are compressed SQL dumps written to `backups/` by default:

```bash
make backup
```

Copy backups off the VPS, for example to object storage or another server. Test restore procedures regularly.

## Restore PostgreSQL

Stop application traffic before restoring if you are replacing production data:

```bash
make restore RESTORE_FILE=backups/parcel-society-YYYYMMDD-HHMMSS.sql.gz
```

For a destructive full restore, you may need to drop/recreate the database or restore into a fresh volume first, depending on the dump contents and target database state.

## Security notes

- Use a strong, unique `ADMIN_PASSWORD` and rotate it when staff roles change.
- Do not expose PostgreSQL publicly; keep it on the Docker network or localhost only.
- Enable a firewall, for example `ufw allow OpenSSH`, `ufw allow 80/tcp`, `ufw allow 443/tcp`, then `ufw enable`.
- Use HTTPS for all real deployments; do not send admin credentials over plain HTTP.
- Back up the database before updates and on a regular schedule.
- Rotate `APP_SECRET`, `NEXTAUTH_SECRET`, database passwords, and admin credentials if they are shared or suspected to be exposed.
- Keep Ubuntu, Docker, and base images patched.

## Common troubleshooting

### `web` exits during startup

Check logs:

```bash
make logs
```

Verify `.env` contains `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and at least one of `APP_SECRET` or `NEXTAUTH_SECRET`.

### Health check reports `database: "disconnected"`

Confirm PostgreSQL is healthy and `DATABASE_URL` uses the Compose service name `postgres`:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs postgres
```

### Migrations fail

Run the migration command again after PostgreSQL is healthy:

```bash
make migrate
```

If schema drift is reported, back up the database before applying manual fixes.

### Nginx returns 502

Ensure the app is listening locally:

```bash
curl -v http://127.0.0.1:3000/api/health
```

Then validate and reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Certificates fail to issue

Verify DNS points to the VPS and ports `80` and `443` are reachable from the internet. Temporarily disable conflicting services that already bind those ports.
