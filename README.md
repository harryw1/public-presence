# publicpresence.org

A professional blog platform built with React + Vite, focused on sustainability science, public planning, policy, and public transportation.

## 🌟 Features

- **Static Site Generation** - Pre-rendered HTML for optimal performance
- **Markdown-based Content** - Write posts in Markdown with frontmatter metadata
- **Automatic Rebuilds** - File watcher monitors content directory and rebuilds automatically
- **Full Markdown Support** - GitHub Flavored Markdown, code syntax highlighting, LaTeX math equations
- **Search & Filter** - Search posts by keyword and filter by tags
- **RSS Feed** - Auto-generated RSS feed for feed readers
- **Responsive Design** - Clean, academic aesthetic that works on all devices
- **SEO Optimized** - Proper meta tags and semantic HTML
- **Lightweight** - Optimized for Raspberry Pi deployment

## 📋 Prerequisites

- Node.js (v18 or higher recommended)
- npm (comes with Node.js)
- A Raspberry Pi (or any Linux server) for deployment
- nginx web server

## 🚀 Quick Start

### 1. Installation

```bash
# Navigate to project directory
cd public-presence

# Install dependencies
npm install
```

### 2. Development

Run the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to see your site.

### 3. Adding Blog Posts

Create a new Markdown file in `content/posts/`:

```markdown
---
title: "My Blog Post Title"
date: "2025-01-30"
excerpt: "A brief description that appears in previews"
tags: ["sustainability", "policy"]
author: "Harrison Weiss"
---

# Your Content Here

Write your post using Markdown...
```

### 4. Building for Production

```bash
npm run build
```

Outputs to `dist/` directory.

## 🔄 Automatic Rebuilds

Run the file watcher:

```bash
npm run watch
```

For production, set up as systemd service (see full README in project).

## 🌐 Quick Deployment

1. Build: `npm run build`
2. Copy `dist/` to your Pi
3. Configure nginx to serve from `dist/`
4. Set up watcher as systemd service

See full deployment instructions in the complete README.

## 📁 Project Structure

```
public-presence/
├── content/posts/      # Your markdown posts
├── scripts/            # Build and watcher scripts
├── src/
│   ├── components/     # React components
│   ├── pages/         # Page components
│   ├── styles/        # CSS
│   └── utils/         # Helper functions
└── dist/              # Build output
```

## 📚 Full Documentation

See the complete README in `/home/claude/public-presence/` for:
- Detailed deployment instructions
- nginx configuration
- Systemd service setup
- Analytics integration
- Troubleshooting guide
- Customization options

---

Built for the public good 🌱
