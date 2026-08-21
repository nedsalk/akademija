#!/bin/bash

echo "📦 Building production bundle..."
bun scripts/prod-build.ts

echo "🚀 Deploying to server..."
# Create directories first
ssh hetzner 'mkdir -p /opt/akademija/{app,db/migrations,scripts}'

# Now sync files
rsync -avz --delete out/ hetzner:/opt/akademija/app/
rsync -avz db/migrations/ hetzner:/opt/akademija/db/migrations/
rsync -avz scripts/run-migrations.ts hetzner:/opt/akademija/scripts/

echo "🗄️ Running migrations..."
ssh -t hetzner bash << 'EOF'
cd /opt/akademija
chown -R apps:apps /opt/akademija
DATABASE_URL=./db/akademija.db bun scripts/run-migrations.ts
systemctl daemon-reload
systemctl restart akademija
EOF

echo "✅ Deployment complete!"