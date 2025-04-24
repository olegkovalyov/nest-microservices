const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = (config, context) => {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // Base configuration
  config.output = {
    ...config.output,
    path: join(__dirname, '../../dist/packages/api-orchestrator'),
  };

  // Add NX plugin
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

  // Development mode settings
  if (isDevelopment) {
    config.mode = 'development';
    config.watch = true;
    config.watchOptions = {
      poll: 1000, // Check for changes every second
      ignored: /node_modules/,
    };
  }

  // Exclude node_modules from build
  config.externals = [nodeExternals()];

  return config;
};
