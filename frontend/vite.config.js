import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

const siteMetadata = {
  title: 'TaskFlow — Project Management System',
  description: 'Streamline your workflow with an intuitive tool designed to enhance productivity and simplify complex tasks for professionals and teams.',
  robots: {
    index: false,
  },
  accessibility: {
    addBypassLinks: false,
    ignoreReducedMotion: false,
  },
}

// Vite config — https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    taskflowSiteMetadata(siteMetadata),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '8443'),
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '8443'),
  },
})

function taskflowSiteMetadata(metadata) {
  const robotsTxt = metadata.robots?.index === false ? 'User-agent: *\nDisallow: /\n' : ''

  return {
    name: 'taskflow-site-metadata',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!robotsTxt || req.url?.split('?')[0] !== '/robots.txt') return next()

        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end(robotsTxt)
      })
    },
    generateBundle() {
      if (!robotsTxt) return

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: robotsTxt,
      })
    },
    transformIndexHtml: {
      order: 'pre',
      handler() {
        const tags = [
          { tag: 'title', children: metadata.title, injectTo: 'head' },
          { tag: 'meta', attrs: { name: 'description', content: metadata.description }, injectTo: 'head' },
          { tag: 'meta', attrs: { property: 'og:title', content: metadata.title }, injectTo: 'head' },
          { tag: 'meta', attrs: { property: 'og:description', content: metadata.description }, injectTo: 'head' },
        ]

        if (metadata.robots?.index === false) {
          tags.push({ tag: 'meta', attrs: { name: 'robots', content: 'noindex, nofollow' }, injectTo: 'head' })
        }

        return { tags }
      },
    },
  }
}
