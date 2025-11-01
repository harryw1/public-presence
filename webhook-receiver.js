#!/usr/bin/env node

/**
 * GitHub Webhook Receiver for publicpresence.org
 *
 * Listens for GitHub push events and automatically triggers site rebuild
 * when changes are pushed to the repository.
 *
 * Security:
 * - Verifies GitHub webhook signature
 * - Only responds to push events on main/master branch
 * - Rate limiting to prevent abuse
 */

import http from 'http';
import crypto from 'crypto';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== CONFIGURATION =====
const CONFIG = {
  port: 9000,
  host: '127.0.0.1', // Only listen on localhost (nginx will proxy)
  secret: process.env.WEBHOOK_SECRET || '',
  deployScript: '/home/harryweiss/update-blog.sh',
  logFile: path.join(__dirname, 'logs/webhook.log'),
  allowedBranches: ['main', 'master'], // Only deploy these branches
  cooldownMs: 60000, // Minimum 60s between deployments (rate limit)
};

// ===== STATE =====
let lastDeployTime = 0;
let isDeploying = false;

// ===== LOGGING =====
const logger = {
  log: (message, data = null) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    if (data) console.log(JSON.stringify(data, null, 2));

    // Append to log file
    try {
      const logDir = path.dirname(CONFIG.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      fs.appendFileSync(CONFIG.logFile, logMessage + (data ? '\n' + JSON.stringify(data) : '') + '\n');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  },

  error: (message, error) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR: ${message}`;
    console.error(logMessage);
    if (error) console.error(error);

    try {
      fs.appendFileSync(CONFIG.logFile, logMessage + (error ? '\n' + error.stack : '') + '\n');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }
};

// ===== SECURITY =====
/**
 * Verify GitHub webhook signature
 * GitHub signs the payload with HMAC-SHA256 using the webhook secret
 */
function verifySignature(payload, signature) {
  if (!CONFIG.secret) {
    logger.error('No webhook secret configured!');
    return false;
  }

  const hmac = crypto.createHmac('sha256', CONFIG.secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch (err) {
    return false;
  }
}

// ===== DEPLOYMENT =====
/**
 * Execute the deployment script
 */
function runDeployment(payload) {
  const { ref, repository, pusher } = payload;
  const branch = ref.replace('refs/heads/', '');

  logger.log('🚀 Starting deployment...', {
    repository: repository.full_name,
    branch,
    pusher: pusher.name,
    commits: payload.commits?.length || 0
  });

  isDeploying = true;
  const startTime = Date.now();

  exec(CONFIG.deployScript, (error, stdout, stderr) => {
    isDeploying = false;
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (error) {
      logger.error('Deployment failed', error);
      logger.error('stderr:', stderr);
      return;
    }

    logger.log(`✅ Deployment completed successfully in ${duration}s`);
    if (stdout) logger.log('Deployment output:', { stdout });
  });
}

// ===== HTTP SERVER =====
const server = http.createServer((req, res) => {
  // Only accept POST requests to /webhook
  if (req.method !== 'POST' || req.url !== '/webhook') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  // Read the request body
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      // Verify signature
      const signature = req.headers['x-hub-signature-256'];
      if (!signature) {
        logger.error('Missing signature header');
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized - missing signature' }));
        return;
      }

      if (!verifySignature(body, signature)) {
        logger.error('Invalid signature');
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized - invalid signature' }));
        return;
      }

      // Parse the payload
      const payload = JSON.parse(body);
      const event = req.headers['x-github-event'];

      logger.log('Received webhook', {
        event,
        repository: payload.repository?.full_name,
        ref: payload.ref
      });

      // Only handle push events
      if (event !== 'push') {
        logger.log('Ignoring non-push event');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Event ignored (not a push)' }));
        return;
      }

      // Check if it's a branch we care about
      const branch = payload.ref.replace('refs/heads/', '');
      if (!CONFIG.allowedBranches.includes(branch)) {
        logger.log(`Ignoring push to branch: ${branch}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: `Branch ${branch} not configured for deployment` }));
        return;
      }

      // Check if we're already deploying
      if (isDeploying) {
        logger.log('Deployment already in progress, skipping');
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Deployment already in progress' }));
        return;
      }

      // Check cooldown (rate limiting)
      const now = Date.now();
      const timeSinceLastDeploy = now - lastDeployTime;
      if (timeSinceLastDeploy < CONFIG.cooldownMs) {
        const waitTime = Math.ceil((CONFIG.cooldownMs - timeSinceLastDeploy) / 1000);
        logger.log(`Cooldown active, wait ${waitTime}s`);
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Rate limited, try again in ${waitTime}s` }));
        return;
      }

      // All checks passed, trigger deployment
      lastDeployTime = now;
      runDeployment(payload);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Deployment triggered' }));

    } catch (err) {
      logger.error('Error processing webhook', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });
});

// ===== STARTUP =====
function main() {
  // Check configuration
  if (!CONFIG.secret) {
    logger.error('WEBHOOK_SECRET environment variable not set!');
    logger.error('Please set it before starting the service.');
    process.exit(1);
  }

  if (!fs.existsSync(CONFIG.deployScript)) {
    logger.error(`Deployment script not found: ${CONFIG.deployScript}`);
    process.exit(1);
  }

  // Start server
  server.listen(CONFIG.port, CONFIG.host, () => {
    console.log('═══════════════════════════════════════════════');
    console.log('  GitHub Webhook Receiver');
    console.log('  publicpresence.org');
    console.log('═══════════════════════════════════════════════');
    logger.log(`🎣 Webhook receiver listening on ${CONFIG.host}:${CONFIG.port}`);
    logger.log(`📂 Deploy script: ${CONFIG.deployScript}`);
    logger.log(`🔒 Secret: ${CONFIG.secret.substring(0, 8)}...`);
    logger.log(`🌿 Watching branches: ${CONFIG.allowedBranches.join(', ')}`);
    logger.log('');
    logger.log('Ready to receive webhooks from GitHub!');
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    logger.log('\n👋 Shutting down webhook receiver...');
    server.close(() => {
      logger.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    logger.log('\n👋 Shutting down webhook receiver...');
    server.close(() => {
      logger.log('Server closed');
      process.exit(0);
    });
  });
}

// Run the server
main();
