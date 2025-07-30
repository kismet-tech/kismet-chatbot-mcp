'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Users, Bed, Maximize } from 'lucide-react'
import { proxyImageUrl, proxyImageUrls } from '../../../lib/utils/imageProxy';

interface Room {
  name: string;
  description: string;
  occupancy: {
    maxValue: number;
    unitText: string;
  };
  bed: {
    typeOfBed: string;
  };
  floorSize: {
    value: number;
    unitText: string;
  };
  price: {
    price: string;
    priceCurrency: string;
  };
  amenityFeature: string[];
  image: string | string[]; // Handle both single string and array
}

interface HotelRoomsCarouselProps {
  rooms: Room[];
  theme?: {
    radius?: string;
    background?: string;
    text?: string;
  };
}

export function HotelRoomsCarousel({ rooms, theme = { radius: '8px', background: '#ffffff', text: '#000000' } }: HotelRoomsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!rooms || rooms.length === 0) {
    return (
      <div className="kismet-hotel-rooms-carousel w-full mx-auto @container">
        <div className="bg-white rounded-lg shadow-lg p-6" style={{ backgroundColor: theme.background, borderRadius: theme.radius }}>
          <p className="text-sm @md:text-base opacity-60 text-left" style={{ color: theme.text }}>No rooms available</p>
        </div>
      </div>
    )
  }

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % rooms.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + rooms.length) % rooms.length)
  }

  const room = rooms[currentIndex]
  
  // Handle both string and array image formats
  let roomImages: string[] = []
  if (room.image) {
    if (Array.isArray(room.image)) {
      roomImages = proxyImageUrls(room.image)
    } else if (typeof room.image === 'string') {
      roomImages = [proxyImageUrl(room.image)]
    }
  }
  
  const currentImageIndex = 0 // For now, just show first image

  return (
    <div className="relative mb-12">
      <div className="group cursor-pointer overflow-hidden shadow-md" style={{ borderRadius: theme.radius }}>
        {/* Room navigation - Previous/Next buttons */}
        {rooms.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-black/20 hover:bg-black/40 text-white p-1 rounded-full transition-colors duration-200"
              aria-label="Previous room"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-black/20 hover:bg-black/40 text-white p-1 rounded-full transition-colors duration-200"
              aria-label="Next room"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Room Image - 16:9 aspect ratio like hotel */}
        <div className="relative aspect-[16/9] overflow-hidden">
          {roomImages.length > 0 ? (
            <img
              src={roomImages[currentImageIndex]}
              alt={room.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-sm">No image available</span>
            </div>
          )}
          {/* Subtle gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-40" />
          
          {/* Room indicators */}
          {rooms.length > 1 && (
            <div className="absolute bottom-4 left-4 flex gap-2">
              {rooms.map((_, index) => (
                <div
                  key={index}
                  className={`h-0.5 rounded-full transition-all duration-300 ${
                    index === currentIndex ? 'w-8 bg-white' : 'w-4 bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Room Info - Same layout as hotel card, left-aligned text */}
        <div className="p-6 text-left" style={{ backgroundColor: theme.background }}>

          {/* Room Name and Type */}
          <div className="mb-2 @sm:mb-3 @md:mb-4">
            <h3 className="text-xs @sm:text-sm @md:text-base @lg:text-lg font-light mb-1 @sm:mb-2 text-left" style={{ color: theme.text }}>
              {room.name}
            </h3>
            <div className="flex items-center gap-1 @sm:gap-2 text-[9px] @sm:text-[10px] @md:text-xs opacity-70" style={{ color: theme.text }}>
              <Bed size={8} className="@sm:size-3 @md:size-4" />
              <span>{room.bed.typeOfBed} Bed</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-[8px] @sm:text-[9px] @md:text-xs mb-2 @sm:mb-3 @md:mb-4 opacity-80 text-left" style={{ color: theme.text }}>
            {room.description}
          </p>

          {/* Room Details */}
          <div className="flex flex-wrap gap-2 @sm:gap-3 mb-2 @sm:mb-3 @md:mb-4">
            <div className="flex items-center gap-1 text-[8px] @sm:text-[9px] @md:text-[10px] opacity-70" style={{ color: theme.text }}>
              <Maximize size={8} className="@sm:size-3" />
              <span>{room.floorSize.value} {room.floorSize.unitText}</span>
            </div>
            <div className="flex items-center gap-1 text-[8px] @sm:text-[9px] @md:text-[10px] opacity-70" style={{ color: theme.text }}>
              <Users size={8} className="@sm:size-3" />
              <span>Up to {room.occupancy.maxValue} guests</span>
            </div>
          </div>

          {/* Amenities - if available */}
          {room.amenityFeature && room.amenityFeature.length > 0 && (
            <div className="hidden @md:flex flex-wrap gap-2 mb-2 @sm:mb-3 @md:mb-4">
              {room.amenityFeature.slice(0, 3).map((amenity, index) => (
                <span
                  key={index}
                  className="text-[8px] @md:text-[9px] @lg:text-[10px] opacity-70"
                  style={{ color: theme.text }}
                >
                  {amenity}
                  {index < Math.min(room.amenityFeature.length - 1, 2) && ' •'}
                </span>
              ))}
              {room.amenityFeature.length > 3 && (
                <span className="text-[8px] @md:text-[9px] @lg:text-[10px] opacity-70" style={{ color: theme.text }}>
                  +{room.amenityFeature.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Price and CTA */}
          <div className="flex items-end justify-between">
            <div className="text-left">
              <p className="text-[8px] @sm:text-[9px] @md:text-[10px] opacity-60 mb-0.5" style={{ color: theme.text }}>
                From
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] @sm:text-xs @md:text-sm @lg:text-base font-medium" style={{ color: theme.text }}>
                  ${room.price.price}
                </span>
                <span className="text-[7px] @sm:text-[8px] @md:text-[9px] opacity-50" style={{ color: theme.text }}>
                  per night
                </span>
              </div>
            </div>
            <button
              className="py-1.5 @sm:py-2 @md:py-3 px-3 @sm:px-4 @md:px-6 text-[8px] @sm:text-[9px] @md:text-[10px] @lg:text-xs font-medium tracking-wider uppercase transition-all duration-300 border rounded-lg bg-transparent hover:bg-black hover:text-white"
              style={{ 
                borderColor: theme.text, 
                borderRadius: theme.radius, 
                color: theme.text, 
                backgroundColor: 'transparent' 
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = theme.text || '#000'
                e.currentTarget.style.color = theme.background || 'white'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = theme.text || '#000'
              }}
            >
              Reserve
            </button>
          </div>
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