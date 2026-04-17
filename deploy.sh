#!/bin/bash
set -e

# Configuration
REMOTE_USER="user"  # À remplacer par l'utilisateur SSH
REMOTE_HOST="kimsufi-ip"  # À remplacer par l'IP du serveur
REMOTE_PATH="/var/www/vai-calcio"

echo "🚀 Déploiement de vai-calcio.fr"
echo "================================"

# Check if .env exists locally
if [ ! -f ".env" ]; then
  echo "❌ Erreur : fichier .env manquant"
  echo "Copiez .env.example vers .env et configurez les variables"
  exit 1
fi

# Build
echo ""
echo "📦 Build du projet..."
npm run build

# Create deployment package
echo ""
echo "📦 Création du package de déploiement..."
DEPLOY_DIR="deploy-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEPLOY_DIR"

# Copy necessary files
cp -r dist "$DEPLOY_DIR/"
cp -r node_modules "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"
cp package-lock.json "$DEPLOY_DIR/"
cp ecosystem.config.js "$DEPLOY_DIR/"
cp .env "$DEPLOY_DIR/"

# Create tarball
tar -czf "${DEPLOY_DIR}.tar.gz" "$DEPLOY_DIR"
rm -rf "$DEPLOY_DIR"

echo ""
echo "📤 Envoi vers le serveur..."
scp "${DEPLOY_DIR}.tar.gz" "${REMOTE_USER}@${REMOTE_HOST}:/tmp/"

echo ""
echo "🔧 Déploiement sur le serveur..."
ssh "${REMOTE_USER}@${REMOTE_HOST}" << EOF
  set -e

  # Extract
  cd /tmp
  tar -xzf ${DEPLOY_DIR}.tar.gz

  # Backup current version
  if [ -d "${REMOTE_PATH}" ]; then
    mv ${REMOTE_PATH} ${REMOTE_PATH}.backup-\$(date +%Y%m%d-%H%M%S)
  fi

  # Deploy new version
  mkdir -p ${REMOTE_PATH}
  mv ${DEPLOY_DIR}/* ${REMOTE_PATH}/

  # Cleanup
  rm -rf ${DEPLOY_DIR} ${DEPLOY_DIR}.tar.gz

  # Create logs directory
  mkdir -p ${REMOTE_PATH}/logs

  # Restart PM2
  cd ${REMOTE_PATH}
  pm2 delete vai-calcio || true
  pm2 start ecosystem.config.js
  pm2 save

  # Keep only last 3 backups
  cd /var/www
  ls -t | grep "vai-calcio.backup-" | tail -n +4 | xargs -r rm -rf

  echo "✅ Déploiement terminé !"
EOF

# Cleanup local tarball
rm -f "${DEPLOY_DIR}.tar.gz"

echo ""
echo "✅ Déploiement réussi !"
echo ""
echo "🔗 Site : https://vai-calcio.fr"
echo "📊 PM2 : ssh ${REMOTE_USER}@${REMOTE_HOST} 'pm2 status'"
echo "📋 Logs : ssh ${REMOTE_USER}@${REMOTE_HOST} 'pm2 logs vai-calcio'"
