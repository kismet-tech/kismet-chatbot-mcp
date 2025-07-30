import React, { useState, useEffect } from 'react';
import { LOYALTY_BADGE_MAPPING, getLoyaltyBadgeUrl } from '../hotelCarousel/loyaltyBadgeMapping';

interface LoyaltyBadgeCyclerProps {
  loyaltyAffiliations?: string[];
  theme?: any;
}

export function LoyaltyBadgeCycler({ loyaltyAffiliations, theme }: LoyaltyBadgeCyclerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Filter out loyalty programs that don't have badge images
  const validAffiliations = loyaltyAffiliations?.filter(affiliation => 
    getLoyaltyBadgeUrl(affiliation)
  ) || [];

  useEffect(() => {
    if (validAffiliations.length <= 1) return;

    const interval = setInterval(() => {
      // Start fade out
      setIsVisible(false);
      
      // After fade out, change badge and fade in
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % validAffiliations.length);
        setIsVisible(true);
      }, 300); // Half of the fade transition duration
    }, 5000);

    return () => clearInterval(interval);
  }, [validAffiliations.length]);

  // Don't render anything if no valid affiliations
  if (validAffiliations.length === 0) {
    return null;
  }

  const currentAffiliation = validAffiliations[currentIndex];
  const badgeUrl = getLoyaltyBadgeUrl(currentAffiliation);

  if (!badgeUrl) {
    return null;
  }

  return (
    <div className="relative">
      {/* Badge Image */}
      <div 
        className={`transition-opacity duration-3000 ease-in-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <img
          src={badgeUrl}
          alt={`${currentAffiliation} loyalty program`}
          className="w-20 h-16 object-contain"
          style={{
            filter: theme?.isDark ? 'brightness(0.9) contrast(1.1)' : 'none'
          }}
          onError={(e) => {
            setImageError(true);
          }}
          onLoad={() => {
            setImageError(false);
          }}
        />
      </div>
    </div>
  );
} 