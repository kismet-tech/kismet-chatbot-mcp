/**
 * Mapping of loyalty program names to their corresponding badge image URLs
 * This file provides the foundation for displaying loyalty badges with proper images
 */

export interface LoyaltyBadgeMapping {
  [loyaltyProgram: string]: string; // program name -> image URL
}

/**
 * Loyalty badge image mappings
 * Using actual loyalty program badge images
 */
export const LOYALTY_BADGE_MAPPING: LoyaltyBadgeMapping = {
  'Marriott Bonvoy': 'https://storage.googleapis.com/synxis-demo-images-2024/LoyaltyPrograms/MarriottBonvoy.png',
  'Hilton Honors': 'https://storage.googleapis.com/synxis-demo-images-2024/LoyaltyPrograms/HiltonHonors.png',
  'IHG Rewards': 'https://storage.googleapis.com/synxis-demo-images-2024/LoyaltyPrograms/IHGRewards.png',
  'Wyndham Rewards': 'https://storage.googleapis.com/synxis-demo-images-2024/LoyaltyPrograms/WyndhamRewards.png',
  'Vale Rewards': 'https://storage.googleapis.com/synxis-demo-images-2024/LoyaltyPrograms/ValeRewards.png'
};

/**
 * Helper function to get badge image URL for a loyalty program
 * Returns undefined if no mapping exists
 */
export function getLoyaltyBadgeUrl(loyaltyProgram: string): string | undefined {
  return LOYALTY_BADGE_MAPPING[loyaltyProgram];
}

/**
 * Helper function to check if a loyalty program has a badge image
 */
export function hasLoyaltyBadge(loyaltyProgram: string): boolean {
  return loyaltyProgram in LOYALTY_BADGE_MAPPING;
} 