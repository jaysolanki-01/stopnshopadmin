// Centralised app configuration — swap values here to rebrand or localise

export const APP_NAME = 'Product Manager';

export const CURRENCY = {
  symbol: '₹',
  code: 'INR',
} as const;

export const PAGINATION = {
  defaultPerPage: 20,
  options: [20, 50, 100] as const,
} as const;

export const PRODUCT_IMAGE = {
  maxSizeMB: 10,
  maxSizeBytes: 10 * 1024 * 1024,
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  acceptedExtensions: ['.jpg', '.jpeg', '.png', '.webp'] as const,
} as const;
