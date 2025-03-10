import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import PublisherGithub from "@electron-forge/publisher-github";
import * as dotenv from 'dotenv';
import * as process from "process";
dotenv.config();


const config: ForgeConfig = {
  publishers: [

    new PublisherGithub({
      repository: {
        name: 'e-kasa-desktop-companion',
        owner: 'dev-uros',
      },
      authToken: process.env.GITHUB_TOKEN,
      prerelease: true,
    }),

  ],
  packagerConfig: {
    asar: true,
    icon: './public/icons/icon',
    name: 'EKasaDesktopCompanion',
  },
  rebuildConfig: {},
  makers: [new MakerSquirrel({
    authors: 'Uros Minic',
    description: 'E-kasa desktop companion app',
    setupIcon: './public/icons/icon.ico',
    iconUrl: 'https://94.127.4.220/media/icons/desktop-app-icon.ico'
  }), new MakerZIP({}, ['darwin']), new MakerRpm({}), new MakerDeb({})],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {}
    },
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
