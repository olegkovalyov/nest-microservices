const { composePlugins, withNx } = require('@nx/webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = composePlugins(withNx(), (config) => {
  // Exclude node_modules from bundling
  config.externals = [nodeExternals()];

  // Enable source maps for debugging
  config.devtool = 'source-map';

  return config;
}); 