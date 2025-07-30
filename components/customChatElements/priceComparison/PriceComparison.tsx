import React, { useState } from 'react';
import { MapPin, TrendingDown, ChevronUp, ChevronDown, Calendar, Info } from 'lucide-react';
import { buildBookingUrl, BookingParameters, HotelBookingConfig } from './bookingUrlUtils';

// Logo mapping for exact matches
const OTA_LOGOS: Record<string, string> = {
  'Booking.com': 'https://storage.googleapis.com/synxis-demo-images-2024/ota-logo/booking.png',
  'Expedia': 'https://storage.googleapis.com/synxis-demo-images-2024/ota-logo/expedia.png',
  'Hotels.com': 'https://storage.googleapis.com/synxis-demo-images-2024/ota-logo/hotels.png',
  'TripAdvisor': 'https://storage.googleapis.com/synxis-demo-images-2024/ota-logo/tripadvisor.png',
};

const getSiteLogo = (siteName: string): string | null => {
  // Direct exact match
  if (OTA_LOGOS[siteName]) {
    return OTA_LOGOS[siteName]; // Return the full URL directly
  }
  
  // Special handling for Direct Booking
  if (siteName === 'Direct Booking') {
    return null; // Will use fallback icon
  }
  
  return null;
};

const getFallbackIcon = (): string => '🏨';

// 🚨 IMPORTANT: When creating new custom elements, remember to:
// 1. Add the element type to messageSuppressionLogic.ts isCustomElement() function
// 2. Add default suppression setting to config/defaults.ts SUPPRESSION_DEFAULTS
// 3. Add the element type to MessageList.tsx rendering logic
// 4. Add the element type to processMessages.ts tool processing logic
// 5. Export the component from customChatElements/index.ts
// 6. Update this comment with the new element type for future reference

interface PriceComparisonItem {
  siteName: string;
  price: number; // Price in dollars
  currency: string;
  url: string;
  isDirectBooking?: boolean; // Indicates if this is a direct booking option
  discountPercentage?: number; // Discount percentage (e.g., 20 for 20% off)
  originalPrice?: number; // Original price before discount (in dollars)
  appliedCoupon?: {
    code: string;
    name: string;
    description: string;
    discount: number;
    discountType: 'Amount' | 'Percentage';
  };
  // New fields for enhanced booking functionality
  urlTemplate?: string; // Template URL with placeholders
  bookingParameters?: BookingParameters; // Booking parameters for URL construction
  hotelConfig?: HotelBookingConfig; // Hotel-specific booking configuration
}

interface PriceComparisonProps {
  priceComparisons: PriceComparisonItem[];
  hotelName?: string;
  hotelLocation?: string;
  hotelImage?: string;
  checkInDate?: string;
  checkOutDate?: string;
}

export function PriceComparison({ 
  priceComparisons, 
  hotelName = "Hotel", 
  hotelLocation,
  hotelImage,
  checkInDate, 
  checkOutDate,
}: PriceComparisonProps) {
  // Sorting state
  const [sortField, setSortField] = useState<'price' | 'total'>('price');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Use numberOfNights from props or calculate from dates if available
  const nights = (checkInDate && checkOutDate ? 
    Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)) : 
    1
  );

  // Calculate total price for each site using actual numberOfNights
  const calculateTotal = (pricePerNight: number) => {
    return pricePerNight * nights; // Use actual numberOfNights instead of hardcoded 2
  };

  // Format price for display (prices are already in dollars)
  const formatPrice = (priceInDollars: number) => {
    return priceInDollars.toFixed(0);
  };

  // Format dates for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "selected dates";
    try {
      // Parse date as local time to avoid timezone issues
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return "selected dates";
    }
  };

  const handleBookingClick = (item: PriceComparisonItem) => {
    try {
      // Build booking URL using the new utility
      const bookingUrl = buildBookingUrl({
        url: item.url, // For backward compatibility
        urlTemplate: item.urlTemplate,
        bookingParameters: {
          ...item.bookingParameters,
          checkInDate,
          checkOutDate,
        },
        hotelConfig: item.hotelConfig,
      });

      if (!bookingUrl) {
        console.error('handleBookingClick: Failed to construct booking URL');
        return;
      }

      // Open the constructed URL
      window.open(bookingUrl, '_blank', 'noopener,noreferrer');
      
    } catch (error) {
      console.error('handleBookingClick: Error opening booking URL:', error);
      // Fallback to original URL if available
      if (item.url) {
        window.open(item.url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Handle sorting
  const handleSort = (field: 'price' | 'total') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort comparisons based on current sort field and direction
  const sortedComparisons = [...priceComparisons].sort((a, b) => {
    const aValue = sortField === 'price' ? a.price / nights : a.price;
    const bValue = sortField === 'price' ? b.price / nights : b.price;
    
    if (sortDirection === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  // Find the lowest price for summary
  const lowestPrice = sortedComparisons.length > 0 ? sortedComparisons[0].price : 0;

  return (
    <div className="kismet-price-comparison w-full max-w-4xl mx-auto @container">
      {/* Header Section with Hotel Image Background */}
      <div className="relative rounded-t-2xl overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          {hotelImage ? (
            <img 
              src={hotelImage} 
              alt={`${hotelName} background`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const errorDiv = document.createElement('div');
                errorDiv.className = 'w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500';
                e.currentTarget.parentNode?.appendChild(errorDiv);
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" />
          )}
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        {/* Content overlay */}
        <div className="relative text-white">
          <div className="p-6 @md:p-8">
            <h3 className="text-xl @md:text-2xl font-semibold mb-3 drop-shadow-lg">
              {hotelName}
            </h3>
            <div className="flex flex-col @md:flex-row @md:items-center gap-3 @md:gap-6 text-sm mb-6">
              <div className="flex items-center gap-2 drop-shadow-md">
                <MapPin className="w-4 h-4 text-white drop-shadow-sm" />
                <span className="font-medium drop-shadow-md">{hotelLocation || "Location not specified"}</span>
              </div>
              <div className="flex items-center gap-2 drop-shadow-md">
                <Calendar className="w-4 h-4 text-white drop-shadow-sm" />
                <span className="font-medium drop-shadow-md">
                  {formatDate(checkInDate)} - {formatDate(checkOutDate)} ({nights} {nights === 1 ? 'night' : 'nights'})
                </span>
              </div>
            </div>
          </div>
          
          {/* Table Header - Now part of the image area */}
          <div className="border-t border-white/30">
            <div className="bg-gradient-to-b from-transparent via-white/10 to-white/30 backdrop-blur-sm px-6 @md:px-8 py-4">
              <div className="grid grid-cols-12 gap-4 items-center text-xs font-semibold text-white">
                <div className="col-span-4 drop-shadow-md">Booking Site</div>
                <div 
                  className="col-span-3 text-center cursor-pointer hover:text-blue-200 transition-colors flex items-center justify-center gap-1 drop-shadow-md"
                  onClick={() => handleSort('price')}
                >
                  Price per Night
                  {sortField === 'price' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
                <div 
                  className="col-span-3 text-center cursor-pointer hover:text-blue-200 transition-colors flex items-center justify-center gap-1 drop-shadow-md"
                  onClick={() => handleSort('total')}
                >
                  Total ({nights} {nights === 1 ? 'night' : 'nights'})
                  {sortField === 'total' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
                <div className="col-span-2 text-center drop-shadow-md">Book Now</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Price Comparison Table */}
      <div className="bg-white rounded-b-2xl border border-gray-200 shadow-lg overflow-hidden">

        {/* Table Rows */}
        <div className="divide-y divide-gray-100">
          {sortedComparisons.map((item, index) => {
            const isLowest = index === 0;
            const siteLogo = getSiteLogo(item.siteName);
            
            return (
              <div
                key={index}
                className={`group relative px-6 py-5 transition-all duration-200 hover:bg-gray-50 ${
                  index < sortedComparisons.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Site Name */}
                  <div className="col-span-4">
                    <div className="flex items-center gap-3">
                      {/* Site Logo */}
                      <div className="flex-shrink-0">
                        {siteLogo ? (
                          <img 
                            src={siteLogo} 
                            alt={`${item.siteName} logo`}
                            className={`${isLowest ? 'w-20 h-20' : 'w-16 h-16'} object-contain rounded-lg shadow-sm transition-all duration-200`}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const errorDiv = document.createElement('div');
                              errorDiv.className = `${isLowest ? 'w-20 h-20' : 'w-16 h-16'} bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center`;
                              errorDiv.innerHTML = `<svg class="${isLowest ? 'w-10 h-10' : 'w-8 h-8'} text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
                              e.currentTarget.parentNode?.appendChild(errorDiv);
                            }}
                          />
                        ) : (
                          <div className={`${isLowest ? 'w-20 h-20' : 'w-16 h-16'} bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center`}>
                            <svg className={`${isLowest ? 'w-10 h-10' : 'w-8 h-8'} text-white`} fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-gray-900">
                            {item.siteName}
                          </h4>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price per Night */}
                  <div className="col-span-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className={`text-sm font-bold ${item.isDirectBooking ? 'text-green-700' : 'text-gray-900'}`}>
                        ${formatPrice(item.price / nights)}
                        {item.appliedCoupon && (
                          <div className="text-xs text-green-500 mt-1">
                            with {item.appliedCoupon.code}
                          </div>
                        )}
                      </div>
                      {item.isDirectBooking && item.appliedCoupon && (
                        <div className="relative group">
                          <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                          <div className="fixed bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-[99999] max-w-xs" style={{ pointerEvents: 'none' }}>
                            <div className="font-semibold mb-1">{item.appliedCoupon.name}</div>
                            <div className="text-xs opacity-90">{item.appliedCoupon.description}</div>
                            <div className="text-xs opacity-75 mt-1">Code: {item.appliedCoupon.code}</div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">per night</div>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <div className="text-xs text-gray-400 line-through">
                        ${formatPrice(item.originalPrice / nights)} per night
                      </div>
                    )}
                  </div>

                  {/* Total Price */}
                  <div className="col-span-3 text-center">
                    <div className="text-sm font-bold text-gray-900">
                      ${formatPrice(item.price)}
                    </div>
                    <div className="text-xs text-gray-500">total</div>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <div className="text-xs text-gray-400 line-through">
                        ${formatPrice(item.originalPrice)} total
                      </div>
                    )}
                  </div>

                  {/* Book Now Button */}
                  <div className="col-span-2 text-center">
                    <button
                      onClick={() => handleBookingClick(item)}
                      className={`px-2 py-1 rounded-md font-medium text-xs transition-all duration-200 ${
                        isLowest 
                          ? 'bg-green-500 text-white hover:bg-green-600' 
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-full">
          <MapPin className="w-3 h-3" />
          Click "Book Now" to book directly with the provider
        </div>
      </div>
    </div>
  );
} 