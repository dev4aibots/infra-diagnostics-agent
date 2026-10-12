/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fluent v9 ships untranspiled module code in places; transpile it for App Router.
  transpilePackages: ["@fluentui/react-components"],
};

export default nextConfig;
