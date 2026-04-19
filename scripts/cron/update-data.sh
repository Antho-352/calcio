#!/bin/bash

# Daily data update script for vai-calcio.fr
# Updates standings, matches, and triggers cache invalidation
# Run via cron: 0 6 * * * /path/to/update-data.sh

set -e

# Configuration
PROJECT_DIR="/var/www/vai-calcio"
LOG_FILE="/var/log/vai-calcio-cron.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Log function
log() {
    echo "[$DATE] $1" | tee -a "$LOG_FILE"
}

log "Starting daily data update..."

# Change to project directory
cd "$PROJECT_DIR" || exit 1

# Clear API cache (force fresh data fetch)
if [ -f ".cache/api-cache.json" ]; then
    log "Clearing API cache..."
    rm -f ".cache/api-cache.json"
fi

# Trigger rebuild for static pages
# This will fetch fresh data from APIs and rebuild pages
log "Rebuilding static pages..."
npm run build >> "$LOG_FILE" 2>&1

# Restart PM2 to pick up new build
log "Restarting PM2..."
pm2 restart vai-calcio >> "$LOG_FILE" 2>&1

log "Daily data update completed successfully"

# Optional: Send notification
# curl -X POST "https://api.brevo.com/v3/smtp/email" \
#   -H "api-key: YOUR_API_KEY" \
#   -H "Content-Type: application/json" \
#   -d '{"to":[{"email":"admin@vai-calcio.fr"}],"subject":"Cron Success","htmlContent":"Daily update completed"}'

exit 0
