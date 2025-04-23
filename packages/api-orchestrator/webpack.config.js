const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = (config, context) => {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // Базовая конфигурация
  config.output = {
    ...config.output,
    path: join(__dirname, '../../dist/packages/api-orchestrator'),
  };

  // Добавляем плагин NX
  config.plugins = [
    ...(config.plugins || []),
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: !isDevelopment,
      outputHashing: 'none',
      generatePackageJson: true,
    }),
  ];

  // Настройка для режима разработки
  if (isDevelopment) {
    config.mode = 'development';
    config.watch = true;
    config.watchOptions = {
      poll: 1000, // Проверять изменения каждую секунду
      ignored: /node_modules/,
    };
  }

  // Исключаем node_modules из сборки
  config.externals = [nodeExternals()];

  return config;
};
