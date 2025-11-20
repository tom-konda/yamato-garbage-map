import { defineConfig } from 'vite'


const isGithub = process.env.IS_GITHUB;
const base = isGithub?.length ? '/yamato-garbage-map/' : undefined;

// https://vite.dev/config/
export default defineConfig({
  base,
})
