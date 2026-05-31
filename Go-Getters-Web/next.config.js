/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { webpack, isServer }) => {
    config.plugins.push(
      new webpack.DefinePlugin({
        __dirname: '"/"',
      })
    );
    return config;
  },
};

module.exports = nextConfig;
