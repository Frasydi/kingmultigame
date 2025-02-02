import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    plugins: [
        react(),
    ],
    server: {
        port: 9000,
        host : true,
        proxy : {
            '/socket' : {
                target : 'http://localhost:9090',
                // rewrite : (text) => text.replace("/socket", ""),
            }
        }
    },
    
    
})
