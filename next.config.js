/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Disable telemetry for production builds
  telemetry: {
    enabled: false,
  },
  
  // Production-optimized settings
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Disable image optimization in multi-service setup for simplicity
    unoptimized: true,
  },
  
  // API routes configuration
  async rewrites() {
    return [
      // Health check aliases
      {
        source: '/health',
        destination: '/api/health',
      },
      {
        source: '/status',
        destination: '/api/health',
      },
    ];
  },
  
  // Environment variable configuration
  env: {
    // Make service name available to the application
    SERVICE_NAME: process.env.SERVICE_NAME || 'omnipost-web',
    
    // Service URLs for inter-service communication
    WORKER_SERVICE_URL: process.env.WORKER_SERVICE_URL || 'http://omnipost-worker:3001',
    AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://omnipost-ai:3002',
    
    // Build-time configuration
    BUILD_TIME: new Date().toISOString(),
    BUILD_ENVIRONMENT: process.env.NODE_ENV || 'development',
  },
  
  // Experimental features for production optimization
  experimental: {
    // Enable server components optimization
    serverComponentsExternalPackages: ['@supabase/postgrest-js'],
    
    // Optimize package imports
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      '@supabase/supabase-js',
    ],
  },
  
  // Webpack configuration for multi-service setup
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize for production builds
    if (!dev && isServer) {
      // Externalize packages that should not be bundled in server
      config.externals.push({
        // Keep database connections external
        'pg': 'commonjs pg',
        'sqlite3': 'commonjs sqlite3',
        'mysql2': 'commonjs mysql2',
      });
    }
    
    // Add alias for service communication
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/services': require('path').resolve(__dirname, 'src/lib/service-communication'),
    };
    
    return config;
  },
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Service-Name',
            value: process.env.SERVICE_NAME || 'omnipost-web',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/health',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  
  // Redirect configuration
  async redirects() {
    return [
      // Redirect old health check paths
      {
        source: '/health-check',
        destination: '/api/health',
        permanent: true,
      },
    ];
  },
  
  // Development-specific configuration
  ...(process.env.NODE_ENV === 'development' && {
    // Enable faster development builds
    swcMinify: true,
    
    // Development server configuration
    devIndicators: {
      buildActivity: true,
      buildActivityPosition: 'bottom-right',
    },
  }),
  
  // Production-specific configuration
  ...(process.env.NODE_ENV === 'production' && {
    // Enable all production optimizations
    swcMinify: true,
    compiler: {
      // Remove console.log in production (except errors)
      removeConsole: {
        exclude: ['error'],
      },
    },
    
    // Optimize bundle splitting
    modularizeImports: {
      '@radix-ui/react-icons': {
        transform: '@radix-ui/react-icons/dist/{{member}}',
      },
      'lucide-react': {
        transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
      },
    },
  }),
};

module.exports = nextConfig;
