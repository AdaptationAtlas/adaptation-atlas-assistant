import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: '../backend/openapi.json',

  output: {
    path: 'src/types/generated',
  },

  // Plugins: ONLY TypeScript for types, no SDK generation
  plugins: [
    '@hey-api/typescript',
  ],
});
