'use client'

import React, { useState } from 'react';
import { Star, MapPin } from 'lucide-react';
import { LoyaltyBadgeCycler } from '../shared/LoyaltyBadgeCycler';

// Simple hotel interface (from HotelCarousel)
interface SimpleHotel {
  name: string;
  description: string;
  starRating: number;
  address: string;
  image: string[];
  aggregateRating: number;
  nightlyPrice: string;
  amenityFeature: string[];
  loyaltyAffiliation?: string[]; // Array of loyalty program names
}

// Complex hotel interface (from default data)
interface ComplexHotel {
  name: string;
  description: string;
  starRating: {
    '@type': string;
    ratingValue: string;
    bestRating: string;
  };
  address: {
    '@type': string;
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  image: string[];
  aggregateRating: {
    '@type': string;
    ratingValue: string;
    reviewCount: string;
  };
  nightlyPrice: string;
  amenityFeature: Array<{
    '@type': string;
    name: string;
    value: boolean;
  }>;
  loyaltyAffiliation?: string[]; // Array of loyalty program names
}

type Hotel = SimpleHotel | ComplexHotel;

interface HotelCardProps {
  theme: any;
  hotel?: Hotel; // Make hotel optional for backward compatibility
  hotelIndex?: number;      // index of this hotel in the carousel
  totalHotels?: number;     // total number of hotels in carousel
}

// Dummy hotel data with aspirational imagery (fallback)
const defaultHotelData: ComplexHotel = {
  name: 'Grand Kismet Hotel',
  description: 'A sanctuary where contemporary elegance meets timeless luxury',
  starRating: {
    '@type': 'Rating',
    ratingValue: '5',
    bestRating: '5',
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'One Ocean Drive',
    addressLocality: 'Miami Beach',
    addressRegion: 'Florida',
    postalCode: '33139',
    addressCountry: 'US',
  },
  image: [
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600&h=1200&fit=crop', // Elegant hotel exterior
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&h=1200&fit=crop', // Luxurious pool
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1600&h=1200&fit=crop', // Hotel lobby
  ],
  amenityFeature: [
    {
      '@type': 'LocationFeatureSpecification',
      name: 'Infinity Pool',
      value: true,
    },
    {
      '@type': 'LocationFeatureSpecification',
      name: 'Spa & Wellness',
      value: true,
    },
    {
      '@type': 'LocationFeatureSpecification',
      name: 'Fine Dining',
      value: true,
    },
    {
      '@type': 'LocationFeatureSpecification',
      name: 'Private Beach',
      value: true,
    },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '847',
  },
  nightlyPrice: '$850',
  loyaltyAffiliation: ['Marriott Bonvoy', 'Hilton Honors'],
}

// Helper function to normalize hotel data
function normalizeHotelData(hotel: Hotel): {
  name: string;
  description: string;
  starRating: number;
  address: string;
  image: string[];
  aggregateRating: number;
  reviewCount: string;
  nightlyPrice: string;
  amenityFeature: string[];
  loyaltyAffiliation?: string[];
} {
  // Check if it's a simple hotel structure
  if ('starRating' in hotel && typeof hotel.starRating === 'number') {
    const simpleHotel = hotel as SimpleHotel;
    return {
      name: simpleHotel.name,
      description: simpleHotel.description,
      starRating: simpleHotel.starRating,
      address: simpleHotel.address,
      image: simpleHotel.image,
      aggregateRating: simpleHotel.aggregateRating,
      reviewCount: '0', // Simple hotels don't have review count
      nightlyPrice: simpleHotel.nightlyPrice,
      amenityFeature: simpleHotel.amenityFeature,
      loyaltyAffiliation: simpleHotel.loyaltyAffiliation,
    };
  }
  
  // Complex hotel structure
  const complexHotel = hotel as ComplexHotel;
  return {
    name: complexHotel.name,
    description: complexHotel.description,
    starRating: parseInt(complexHotel.starRating.ratingValue),
    address: complexHotel.address.addressLocality,
    image: complexHotel.image,
    aggregateRating: parseFloat(complexHotel.aggregateRating.ratingValue),
    reviewCount: complexHotel.aggregateRating.reviewCount,
    nightlyPrice: complexHotel.nightlyPrice,
    amenityFeature: complexHotel.amenityFeature.map(a => a.name),
    loyaltyAffiliation: complexHotel.loyaltyAffiliation,
  };
}

export function HotelCard({ theme, hotel, hotelIndex, totalHotels }: HotelCardProps) {
  // Use provided hotel data or fallback to default
  const hotelData = hotel || defaultHotelData;
  const normalizedData = normalizeHotelData(hotelData);
  
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0)
  const [isHovered, setIsHovered] = React.useState(false)

  // Reset image index when hotel changes - use the entire hotel object as dependency
  React.useEffect(() => {
    setCurrentImageIndex(0)
  }, [hotel]) // Reset when the entire hotel object changes

  // Inject CSS keyframes for gradient animation
  React.useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      @keyframes gradientShift {
        0% { background-position: 0% center; }
        100% { background-position: 200% center; }
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const handleExplore = async () => {
    // TODO: Implement explore functionality when chat integration is ready
    console.log(`Explore ${normalizedData.name}`);
  };

  return (
    <div className="relative mb-12">
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelData) }}
      />

      <div
        className="group cursor-pointer overflow-hidden shadow-md"
        style={{ borderRadius: theme.radius }}
      >
        {/* Image Gallery - 16:9 aspect ratio */}
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={normalizedData.image[currentImageIndex]}
            alt={normalizedData.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Subtle gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Hotel indicators - positioned like room carousel */}
          {typeof hotelIndex === 'number' && typeof totalHotels === 'number' && totalHotels > 1 && (
            <div className="absolute bottom-4 left-4 flex gap-2">
              {Array.from({ length: totalHotels }, (_, index) => (
                <div
                  key={index}
                  className={`h-0.5 rounded-full transition-all duration-300 ${
                    index === hotelIndex ? 'w-8 bg-white' : 'w-4 bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Star Rating - Minimal */}
          <div className="absolute top-4 left-4 flex items-center gap-1">
            {[...Array(normalizedData.starRating)].map(
              (_, i) => (
                <Star key={i} size={12} fill="white" className="text-white" />
              )
            )}
          </div>
        </div>

        {/* Hotel Info - Minimal and Elegant */}
        <div className="p-6 relative" style={{ backgroundColor: theme.background }}>
          {/* Loyalty Badge Cycler - positioned in upper right corner */}
          {normalizedData.loyaltyAffiliation && normalizedData.loyaltyAffiliation.length > 0 && (
            <div className="absolute top-2 right-6">
              <LoyaltyBadgeCycler
                loyaltyAffiliations={normalizedData.loyaltyAffiliation}
                theme={theme}
              />
            </div>
          )}

          {/* Name and Location */}
          <div className="mb-4">
            <h3
              className="text-2xl font-light mb-2"
              style={{ color: theme.text }}
            >
              {normalizedData.name}
            </h3>
            <div
              className="flex items-center gap-2 text-sm opacity-70"
              style={{ color: theme.text }}
            >
              <MapPin size={14} />
              <span>{normalizedData.address}</span>
            </div>
          </div>

          {/* Description */}
          <p
            className="text-sm mb-6 opacity-80 leading-relaxed"
            style={{ color: theme.text }}
          >
            {normalizedData.description}
          </p>

          {/* Rating and Price */}
          <div className="flex items-end justify-between mb-6">
            <div className="flex items-center gap-3">
              <span
                className="text-lg font-light"
                style={{ color: theme.text }}
              >
                {normalizedData.aggregateRating}
              </span>
              <span
                className="text-sm opacity-60"
                style={{ color: theme.text }}
              >
                {normalizedData.reviewCount} reviews
              </span>
            </div>
            <div className="text-right">
              <p
                className="text-sm opacity-60 mb-1"
                style={{ color: theme.text }}
              >
                {normalizedData.nightlyPrice}
              </p>
              <p className="text-xs opacity-50" style={{ color: theme.text }}>
                per night
              </p>
            </div>
          </div>

          {/* Amenities - Minimal List */}
          <div className="flex flex-wrap gap-3 mb-6">
            {normalizedData.amenityFeature.map((amenity, index) => (
              <span
                key={index}
                className="text-xs opacity-70"
                style={{ color: theme.text }}
              >
                {amenity}
                {index < normalizedData.amenityFeature.length - 1 && ' •'}
              </span>
            ))}
          </div>

          {/* CTA - Elegant and Minimal */}
          <button
            onClick={handleExplore}
            className="w-full py-3 text-sm font-medium tracking-wider uppercase transition-all duration-300 border"
            style={{
              borderColor: theme.text,
              color: theme.text,
              borderRadius: theme.radius,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.text
              e.currentTarget.style.color = theme.background
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = theme.text
            }}
          >
            Explore
          </button>
        </div>
      </div>

      {/* Powered by Kismet - positioned beneath entire card */}
      <div className="absolute -bottom-8 right-0 text-xs" style={{ color: theme.text }}>
        <span className="text-xs">Powered by </span>
        {/* Gold gradient text with moving sheen, only on text */}
        <span 
          className="text-base font-medium inline-block"
          style={{ 
            fontFamily: 'DM Sans, sans-serif',
            background: 'linear-gradient(135deg, #FFD700 0%, #DAA520 25%, #FFD700 50%, #B8860B 75%, #FFD700 100%)',
            backgroundSize: '200% auto',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            animation: 'gradientShift 3s linear infinite'
          }}
        >
          Kismet
        </span>
      </div>
    </div>
  )
} 