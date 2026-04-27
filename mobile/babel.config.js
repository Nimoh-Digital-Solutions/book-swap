module.exports = function (api) {
  api.cache(true);
  const isTest = process.env.NODE_ENV === 'test';
  const plugins = [
    [
      'module-resolver',
      {
        alias: {
          '@': './src',
          '@shared': '../packages/shared/src',
        },
      },
    ],
  ];
  if (isTest) {
    plugins.push('babel-plugin-dynamic-import-node');
  }
  return {
    presets: [['babel-preset-expo', isTest ? { reanimated: false } : {}]],
    plugins,
  };
};
