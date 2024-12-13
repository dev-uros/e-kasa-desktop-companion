import type {ConfigEnv, UserConfig} from 'vite';
import {defineConfig} from 'vite';
import {pluginExposeRenderer} from './vite.base.config';
import vue from '@vitejs/plugin-vue';
import {quasar, transformAssetUrls} from "@quasar/vite-plugin";
// import { fileURLToPath } from 'node:url'
import path, { join } from 'path';
// const __filename = fileURLToPath(import.meta.url);
// https://vitejs.dev/config
export default defineConfig((env) => {
    const forgeEnv = env as ConfigEnv<'renderer'>;
    const {root, mode, forgeConfigSelf} = forgeEnv;
    const name = forgeConfigSelf.name ?? '';

    return {
        root,
        mode,
        base: './',
        build: {
            outDir: `.vite/renderer/${name}`,
        },
        plugins: [
            pluginExposeRenderer(name),
            vue({
                template: {transformAssetUrls}
            }),
            quasar({
                sassVariables: path.join(__dirname, 'src', 'quasar-variables.sass')
            })
        ],
        resolve: {
            preserveSymlinks: true,
        },
        clearScreen: false,
    } as UserConfig;
});
