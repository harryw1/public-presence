/**
 * watcher.js - File watcher for automatic rebuilds
 * 
 * This script monitors the content/posts directory for changes and
 * automatically triggers a rebuild when:
 * - New posts are added
 * - Existing posts are modified
 * - Posts are deleted
 * 
 * Designed to run as a systemd service on Raspberry Pi
 * Resource-conscious with configurable check intervals
 * 
 * Usage:
 *   node scripts/watcher.js
 *   npm run watch
 */

import chokidar from 'chokidar';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  // Directory to watch
  watchPath: path.join(__dirname, '../content/posts'),
  
  // Debounce delay (milliseconds)
  // Prevents multiple rebuilds if several files change at once
  debounceDelay: 5000, // 5 seconds
  
  // Build command to execute
  buildCommand: 'npm run build',
  
  // Log file path (optional)
  logFile: path.join(__dirname, '../logs/watcher.log'),
  
  // Enable verbose logging
  verbose: true
};

/**
 * Logger utility
 */
const logger = {
  log: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    // Optionally append to log file
    // fs.appendFileSync(CONFIG.logFile, logMessage + '\n');
  },
  
  error: (message, error) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR: ${message}`;
    console.error(logMessage);
    if (error) console.error(error);
  },
  
  info: (message) => {
    if (CONFIG.verbose) {
      logger.log(`INFO: ${message}`);
    }
  }
};

/**
 * Execute build command
 */
function runBuild() {
  logger.log('🔨 Starting build process...');
  
  exec(CONFIG.buildCommand, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
    if (error) {
      logger.error('Build failed', error);
      logger.error('stderr:', stderr);
      return;
    }
    
    if (CONFIG.verbose && stdout) {
      console.log(stdout);
    }
    
    logger.log('✅ Build completed successfully');
  });
}

/**
 * Debounced build function
 * Prevents multiple builds from triggering in quick succession
 */
let buildTimeout = null;

function debouncedBuild() {
  // Clear existing timeout
  if (buildTimeout) {
    clearTimeout(buildTimeout);
  }
  
  // Set new timeout
  buildTimeout = setTimeout(() => {
    runBuild();
  }, CONFIG.debounceDelay);
  
  logger.info('Build scheduled (debounced)');
}

/**
 * Initialize file watcher
 */
function initWatcher() {
  logger.log('👀 Starting file watcher...');
  logger.log(`📂 Watching directory: ${CONFIG.watchPath}`);
  logger.log(`⏱️  Debounce delay: ${CONFIG.debounceDelay}ms\n`);
  
  // Create watcher instance
  const watcher = chokidar.watch(CONFIG.watchPath, {
    // Only watch markdown files
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    
    // Watch options
    persistent: true,
    ignoreInitial: true, // Don't trigger on initial scan
    
    // Performance options (important for Raspberry Pi)
    usePolling: false, // Use native fsevents (more efficient)
    awaitWriteFinish: {
      stabilityThreshold: 2000, // Wait 2s after last change
      pollInterval: 100
    }
  });
  
  // Event handlers
  watcher
    .on('add', filepath => {
      logger.log(`📝 New post detected: ${path.basename(filepath)}`);
      debouncedBuild();
    })
    .on('change', filepath => {
      logger.log(`✏️  Post modified: ${path.basename(filepath)}`);
      debouncedBuild();
    })
    .on('unlink', filepath => {
      logger.log(`🗑️  Post deleted: ${path.basename(filepath)}`);
      debouncedBuild();
    })
    .on('error', error => {
      logger.error('Watcher error', error);
    })
    .on('ready', () => {
      logger.log('✅ File watcher ready and monitoring for changes\n');
      logger.log('Press Ctrl+C to stop\n');
    });
  
  // Handle process termination
  process.on('SIGINT', () => {
    logger.log('\n👋 Shutting down file watcher...');
    watcher.close();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    logger.log('\n👋 Shutting down file watcher...');
    watcher.close();
    process.exit(0);
  });
}

/**
 * Main execution
 */
function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Public Presence - File Watcher');
  console.log('═══════════════════════════════════════════════\n');
  
  try {
    initWatcher();
  } catch (error) {
    logger.error('Failed to start watcher', error);
    process.exit(1);
  }
}

// Run the watcher
main();
