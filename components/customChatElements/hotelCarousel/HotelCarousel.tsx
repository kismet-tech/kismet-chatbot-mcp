import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HotelCard } from './HotelCard';

interface Hotel {
  name: string;
  description: string;
  starRating: number;
  address: string;
  image: string[];
  aggregateRating: number;
  nightlyPrice: string;
  amenityFeature: string[];
}

interface HotelCarouselProps {
  hotels: Hotel[];
}

export function HotelCarousel({ hotels }: HotelCarouselProps) {
  const [currentHotelIndex, setCurrentHotelIndex] = useState(0);

  // Hotel carousel navigation functions
  const nextHotel = () => {
    setCurrentHotelIndex((prev) => (prev + 1) % hotels.length);
  };

  const prevHotel = () => {
    setCurrentHotelIndex((prev) => (prev - 1 + hotels.length) % hotels.length);
  };

  const goToHotel = (index: number) => {
    setCurrentHotelIndex(index);
  };

  if (!hotels || hotels.length === 0) {
    return (
      <div className="w-full mx-auto kismet-hotel-carousel @container">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <p className="text-sm @md:text-base opacity-60 text-left">No hotels found.</p>
        </div>
      </div>
    );
  }

  const currentHotel = hotels[currentHotelIndex];

  return (
    <div className="w-full mx-auto kismet-hotel-carousel @container">
      <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Hotel navigation - Previous/Next buttons */}
        {hotels.length > 1 && (
          <>
            <button
              onClick={prevHotel}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-black/20 hover:bg-black/40 text-white p-1 rounded-full transition-colors duration-200"
              aria-label="Previous hotel"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextHotel}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-black/20 hover:bg-black/40 text-white p-1 rounded-full transition-colors duration-200"
              aria-label="Next hotel"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Hotel card content */}
        <HotelCard 
          theme={{ 
            radius: '8px',
            background: '#ffffff',
            text: '#000000'
          }} 
          hotel={currentHotel}
          hotelIndex={currentHotelIndex}
          totalHotels={hotels.length}
        />
      </div>
    </div>
  );
} 