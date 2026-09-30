export default {
  input: 'api-documentation.json',
  output: {
    path: 'src/types/generated-api',
    postProcess: ['eslint'],
  },
  parser: {
    hooks: {
      symbols: {
        getFilePath: (symbol: any) => {
          return symbol.meta.resourceId;
        },
      },
    },
  },
  plugins: ['@hey-api/typescript'],
};
