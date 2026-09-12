import type { NextConfig } from 'next';
const nextConfig:NextConfig={
  output:'standalone',
  // Dokploy supplies this per release at build time. Next uses it to detect
  // stale client assets during a rolling deployment and force a hard reload.
  deploymentId: process.env.NEXT_DEPLOYMENT_ID || undefined,
};
export default nextConfig;
