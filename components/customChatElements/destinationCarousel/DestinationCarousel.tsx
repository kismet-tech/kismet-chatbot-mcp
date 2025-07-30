import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// 🚨 IMPORTANT: When creating new custom elements, remember to:
// 1. Add the element type to messageSuppressionLogic.ts isCustomElement() function
// 2. Add default suppression setting to config/defaults.ts SUPPRESSION_DEFAULTS
// 3. Add the element type to MessageList.tsx rendering logic
// 4. Add the element type to processMessages.ts tool processing logic
// 5. Export the component from customChatElements/index.ts
// 6. Update this comment with the new element type for future reference

interface Destination {
  name: string;
  description: string;
  image: string;
  whyGoodForActivity?: string;
}

interface DestinationCarouselProps {
  destinations: Destination[];
  activityPrefix?: string;
  activity?: string;
}

export function DestinationCarousel({
  destinations,
  activityPrefix,
  activity,
}: DestinationCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const hasMultiple = destinations.length > 1;

  const nextSlide = () => {
    if (!hasMultiple) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % destinations.length);
  };

  const prevSlide = () => {
    if (!hasMultiple) return;
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + destinations.length) % destinations.length
    );
  };

  const handleLearnMore = async () => {
    // TODO: Implement learn more functionality when chat integration is ready
    console.log(`Learn more about ${destination.name}`);
  };

  const handleSelect = async () => {
    // TODO: Implement select functionality when chat integration is ready
    console.log(`Select ${destination.name}`);
  };

  // Defensive: fallback if no destinations
  if (!destinations || destinations.length === 0) {
    return (
      <div className="relative">
        <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-gray-800">
          Popular destinations for <span className="italic">{activity}</span>
        </h2>
        <div className="p-8 text-center text-gray-500 bg-gray-100 rounded-lg">
          No destinations available.
        </div>
      </div>
    );
  }

  // Clamp currentIndex if destinations array changes
  const safeIndex = Math.min(currentIndex, destinations.length - 1);
  const destination = destinations[safeIndex];

  return (
    <div className="w-full mx-auto kismet-destination-carousel @container">
      <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Image Container */}
        <div className="relative h-[400px] md:h-[500px] group">
          <img
            src={destination.image}
            alt={destination.name}
            className="w-full h-full object-cover"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Title Overlay at Top */}
          <div className="absolute top-0 left-0 w-full p-6 md:p-10 z-10">
            <h2 className="text-2xl md:text-3xl font-light text-white [text-shadow:_2px_2px_6px_rgba(0,0,0,0.8)]">
              Popular destinations
              {(activityPrefix || activity) && (
                <>
                  {activityPrefix && ` ${activityPrefix}`}
                  {activity && <span> <span className="italic">{activity}</span></span>}
                </>
              )}
            </h2>
          </div>

          {/* Navigation - always visible if multiple destinations */}
          {hasMultiple && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-3 opacity-100 transition-opacity duration-300 z-10 bg-black/20 hover:bg-black/40 text-white rounded-full"
                aria-label="Previous destination"
              >
                <ChevronLeft size={28} className="text-white/80 hover:text-white transition-colors" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-3 opacity-100 transition-opacity duration-300 z-10 bg-black/20 hover:bg-black/40 text-white rounded-full"
                aria-label="Next destination"
              >
                <ChevronRight size={28} className="text-white/80 hover:text-white transition-colors" />
              </button>
            </>
          )}

          {/* Info Overlay at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <div className="max-w-2xl">
              <h3 className="text-lg md:text-xl font-light text-white mb-2 [text-shadow:_2px_2px_6px_rgba(0,0,0,0.8)]">
                {destination.name}
              </h3>
              <p className="text-xs text-white/80 mb-4 [text-shadow:_1px_1px_4px_rgba(0,0,0,0.7)]">
                {destination.description}
              </p>
              {destination.whyGoodForActivity && (
                <p className="text-xs text-white/70 mb-4 italic [text-shadow:_1px_1px_3px_rgba(0,0,0,0.6)]">
                  {destination.whyGoodForActivity}
                </p>
              )}
              {/* Action Buttons */}
              <div className="flex gap-4 mt-4">
                <button 
                  onClick={handleLearnMore}
                  className="px-6 py-2 bg-white text-black font-medium rounded-lg shadow hover:bg-white/90 transition-all duration-200"
                >
                  Learn More
                </button>
                <button 
                  onClick={handleSelect}
                  className="px-6 py-2 border border-white text-white font-medium rounded-lg hover:bg-white/10 transition-all duration-200"
                >
                  Select
                </button>
              </div>
            </div>
          </div>

          {/* Slide Indicators */}
          {hasMultiple && (
            <div className="absolute bottom-6 right-6 md:right-10 flex gap-2">
              {destinations.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-[2px] transition-all duration-300 ${
                    index === safeIndex
                      ? 'w-10 bg-white'
                      : 'w-5 bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Go to destination ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 