import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Build configuration optimized for Raspberry Pi deployment
  build: {
    // Generate smaller chunks for better performance on low-resource devices
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split vendor code into separate chunk for better caching
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          markdown: ['react-markdown', 'remark-gfm', 'remark-math', 'rehype-katex', 'rehype-highlight']
        }
      }
    },
    // Minify for production
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console logs in production
        drop_console: true,
      }
    }
  },
  
  // Server configuration for development
  server: {
    port: 3000,
    host: true // Allow access from network (useful for testing on Pi)
  },
  
  // Ensure proper base path for deployment
  base: '/'
})
