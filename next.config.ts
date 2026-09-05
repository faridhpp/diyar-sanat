import type { NextConfig } from 'next';
const legacyMediaUrl=process.env.LEGACY_MEDIA_URL;
const nextConfig:NextConfig={
  output:'standalone',
  images:legacyMediaUrl?{remotePatterns:[{protocol:new URL(legacyMediaUrl).protocol.replace(':','') as 'http'|'https',hostname:new URL(legacyMediaUrl).hostname,pathname:'/storage/v1/object/public/**'}]}:undefined,
};
export default nextConfig;
