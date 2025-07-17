module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/screens': './src/screens',
            '@/services': './src/services',
            '@/types': './src/types',
            '@/config': './src/config',
            '@/context': './src/context',
            '@/hooks': './src/hooks',
            '@/utils': './src/utils',
            '@/navigation': './src/navigation',
          },
        },
      ],
    ],
  };
};
