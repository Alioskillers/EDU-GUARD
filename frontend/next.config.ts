import type { NextConfig } from "next";
import { config } from "dotenv";
import { resolve } from "path";
import createNextIntlPlugin from 'next-intl/plugin';

// Load environment variables from root .env file
config({ path: resolve(__dirname, "../.env") });

// Specify the path to the i18n request configuration
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);
