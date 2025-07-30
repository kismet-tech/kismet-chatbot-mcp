/**
 * Booking URL Construction Utilities
 * 
 * Provides utilities for constructing booking URLs with parameter interpolation
 * and proper URL encoding, following existing codebase patterns.
 */

/**
 * Interface for booking parameters that can be interpolated into URL templates
 */
export interface BookingParameters {
  checkInDate?: string;
  checkOutDate?: string;
  roomType?: string;
  promoCode?: string;
  adults?: number;
  children?: number;
  rooms?: number;
  currency?: string;
  locale?: string;
}

/**
 * Interface for hotel-specific booking configuration
 */
export interface HotelBookingConfig {
  hotelId: string;
  chainId?: string;
  baseUrl: string;
  urlParameters: Record<string, string | number>;
}

/**
 * Interface for booking URL configuration
 */
export interface BookingUrlConfig {
  url?: string; // Simple URL for backward compatibility
  urlTemplate?: string; // Template URL with placeholders
  bookingParameters?: BookingParameters;
  hotelConfig?: HotelBookingConfig;
}

/**
 * Builds a booking URL by updating specific parameters in a base URL
 * 
 * @param config - The booking URL configuration
 * @returns The constructed booking URL or null if construction fails
 */
export function buildBookingUrl(config: BookingUrlConfig): string | null {
  try {
    // If we have a hotel config with a base URL, use that
    if (config.hotelConfig?.baseUrl) {
      return buildUrlFromBase(config.hotelConfig.baseUrl, config.bookingParameters);
    }

    // If we have a URL template, interpolate parameters
    if (config.urlTemplate) {
      return buildUrlFromTemplate(config.urlTemplate, config.bookingParameters);
    }

    // Fallback to simple URL for backward compatibility
    if (config.url) {
      return config.url;
    }

    console.error('buildBookingUrl: No valid URL configuration provided');
    return null;
  } catch (error) {
    console.error('buildBookingUrl: Error constructing URL:', error);
    return null;
  }
}

/**
 * Builds a booking URL from a base URL by updating specific parameters
 * 
 * @param baseUrl - The base URL with existing parameters
 * @param bookingParams - The booking parameters to update
 * @returns The updated booking URL
 */
function buildUrlFromBase(baseUrl: string, bookingParams?: BookingParameters): string {
  try {
    const url = new URL(baseUrl);
    const searchParams = url.searchParams;

    // Update check-in date (arrive parameter)
    if (bookingParams?.checkInDate) {
      searchParams.set('arrive', bookingParams.checkInDate);
    }

    // Update check-out date (depart parameter)
    if (bookingParams?.checkOutDate) {
      searchParams.set('depart', bookingParams.checkOutDate);
    }

    // Add promo code if provided
    if (bookingParams?.promoCode) {
      searchParams.set('promo', bookingParams.promoCode);
    }

    // Update other parameters if provided
    if (bookingParams?.adults !== undefined) {
      searchParams.set('adult', bookingParams.adults.toString());
    }

    if (bookingParams?.children !== undefined) {
      searchParams.set('child', bookingParams.children.toString());
    }

    if (bookingParams?.rooms !== undefined) {
      searchParams.set('rooms', bookingParams.rooms.toString());
    }

    if (bookingParams?.currency) {
      searchParams.set('currency', bookingParams.currency);
    }

    if (bookingParams?.locale) {
      searchParams.set('locale', bookingParams.locale);
    }

    return url.toString();
  } catch (error) {
    console.error('buildUrlFromBase: Error updating base URL:', error);
    return baseUrl; // Return original URL if update fails
  }
}

/**
 * Builds a booking URL from a template by interpolating parameters
 * 
 * @param template - The URL template with placeholders
 * @param bookingParams - The booking parameters to interpolate
 * @returns The interpolated booking URL
 */
function buildUrlFromTemplate(template: string, bookingParams?: BookingParameters): string {
  let url = template;

  // Replace placeholders with actual values
  if (bookingParams?.checkInDate) {
    url = url.replace(/{checkInDate}/g, bookingParams.checkInDate);
  }

  if (bookingParams?.checkOutDate) {
    url = url.replace(/{checkOutDate}/g, bookingParams.checkOutDate);
  }

  if (bookingParams?.roomType) {
    url = url.replace(/{roomType}/g, encodeURIComponent(bookingParams.roomType));
  }

  if (bookingParams?.promoCode) {
    url = url.replace(/{promoCode}/g, encodeURIComponent(bookingParams.promoCode));
  }

  // Remove any remaining placeholders
  url = url.replace(/\{[^}]+\}/g, '');

  return url;
}

/**
 * Validates a booking URL configuration
 * 
 * @param config - The booking URL configuration to validate
 * @returns True if the configuration is valid, false otherwise
 */
export function validateBookingUrlConfig(config: BookingUrlConfig): boolean {
  // Must have at least one URL source
  if (!config.url && !config.urlTemplate && !config.hotelConfig?.baseUrl) {
    console.error('validateBookingUrlConfig: No URL source provided');
    return false;
  }

  // If using hotel config, must have base URL
  if (config.hotelConfig && !config.hotelConfig.baseUrl) {
    console.error('validateBookingUrlConfig: Hotel config missing base URL');
    return false;
  }

  return true;
}

/**
 * Formats a date string to YYYY-MM-DD format
 * 
 * @param dateString - The date string to format
 * @returns The formatted date string or null if invalid
 */
export function formatDateForUrl(dateString?: string): string | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  } catch (error) {
    console.error('formatDateForUrl: Error formatting date:', error);
    return null;
  }
} 