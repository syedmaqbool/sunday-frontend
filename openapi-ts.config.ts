export default {
  input: 'api-documentation.json',
  output: {
    path: 'src/types/generated-api',
    postProcess: ['eslint'],
  },
  parser: {
    hooks: {
      symbols: {
        getFilePath: (symbol: { meta: { resourceId: string } }) => symbol.meta.resourceId,
      },
    },
  },
  plugins: ['@hey-api/typescript'],
};
