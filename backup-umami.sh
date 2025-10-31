#!/bin/bash

# Umami Database Backup Script
# Backs up the PostgreSQL umami database with automatic rotation

# Configuration
BACKUP_DIR="/home/harryweiss/backups/umami"
DATABASE="umami"
POSTGRES_USER="postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/umami_$DATE.sql"
LOG_FILE="$BACKUP_DIR/backup.log"

# Number of backups to keep (older backups will be deleted)
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Log function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Start backup
log "Starting Umami database backup..."

# Perform the backup
if sudo -u "$POSTGRES_USER" pg_dump "$DATABASE" > "$BACKUP_FILE" 2>> "$LOG_FILE"; then
    # Compress the backup to save space
    if gzip "$BACKUP_FILE" 2>> "$LOG_FILE"; then
        BACKUP_FILE="${BACKUP_FILE}.gz"
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log "✓ Backup successful: $BACKUP_FILE ($BACKUP_SIZE)"
    else
        log "⚠ Backup created but compression failed: $BACKUP_FILE"
    fi
else
    log "✗ Backup failed!"
    exit 1
fi

# Remove old backups (keep only last N days)
log "Cleaning up old backups (keeping last $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "umami_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete 2>> "$LOG_FILE"

# Count remaining backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "umami_*.sql.gz" -type f | wc -l)
log "Current backup count: $BACKUP_COUNT"

# Check disk usage
DISK_USAGE=$(df -h "$BACKUP_DIR" | awk 'NR==2 {print $5}')
log "Disk usage: $DISK_USAGE"

log "Backup completed successfully!"
