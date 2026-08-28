import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.tsx',
            ],
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@/Components': path.resolve(import.meta.dirname, './resources/js/components'),
            '@/components': path.resolve(import.meta.dirname, './resources/js/components'),
            '@': path.resolve(import.meta.dirname, './resources/js'),
        },
    },
});