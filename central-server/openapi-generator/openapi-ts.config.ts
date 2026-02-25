import { defineConfig, defaultPlugins } from '@hey-api/openapi-ts';

export default defineConfig({
  input: [
    './openapi.yaml', // add other openapi specs here
  ],
  output: {
    path:'../admin-frontend/src/client', // where generated code will live
    postProcess: ['prettier', 'eslint']
  },
  plugins: [
    ...defaultPlugins,
    {
      name: '@hey-api/client-axios',
      runtimeConfigPath: "../lib/hey-api",
    },
    '@tanstack/react-query',
    'zod'
  ],
});
