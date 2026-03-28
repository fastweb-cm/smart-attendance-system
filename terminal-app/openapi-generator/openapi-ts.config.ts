import { defineConfig, defaultPlugins } from '@hey-api/openapi-ts';

export default defineConfig({
  input: [
    './openapi.json', // add other openapi specs here
    './central-openapi.json',
  ],
  output: {
    path:'../terminal-frontend/src/client/facerecognition', // where generated code will live
    postProcess: ['prettier', 'eslint']
  },
  plugins: [
    ...defaultPlugins,
    {
      name: '@hey-api/client-axios',
      runtimeConfigPath: "@/lib/hey-api",
    },
    '@tanstack/react-query',
    'zod'
  ],
});
