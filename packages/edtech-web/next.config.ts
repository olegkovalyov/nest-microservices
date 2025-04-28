/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'via.placeholder.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'placehold.co',
                port: '', 
                pathname: '/**', 
            },
            {
                protocol: 'https',
                hostname: 'source.unsplash.com', // Add Unsplash Source
                port: '', 
                pathname: '/**', 
            },
        ],
    },
};

export default nextConfig;
