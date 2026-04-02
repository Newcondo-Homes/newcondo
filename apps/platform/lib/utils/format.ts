// apps/platform/lib/utils/format.ts

/**
 * Formats a Date object or a date string into a readable date string.
 * @param dateInput The date to format (Date object or string).
 * @param options Optional formatting options for toLocaleDateString.
 * @returns A formatted date string, or 'N/A' if the input is invalid.
 */
export function formatDate(
  dateInput: Date | string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) {
    return 'N/A'; // Or an empty string, depending on desired behavior for null/undefined dates
  }

  try {
    const date = new Date(dateInput);

    if (isNaN(date.getTime())) {
      // Check if the date is valid
      return 'Invalid Date';
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    return date.toLocaleDateString('en-US', options || defaultOptions);
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'Error'; // Return 'Error' for unexpected issues during formatting
  }
}


/**
 * Formats a number as a currency string.
 * @param amount The amount to format.
 * @param currency The ISO 4217 currency code (e.g., 'NGN', 'USD').
 * @returns A formatted currency string (e.g., '₦1,000').
 */
export function formatCurrency(amount: number, currency: string = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}


/**
 * Formats a distance in kilometers to a readable string.
 * @param distanceKm Distance in kilometers.
 * @returns A formatted distance string (e.g., '1.2 km', '500 m').
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}


/**
 * Formats a future date into a human-readable time remaining string.
 * @param expiryDate The future date to calculate time remaining until.
 * @returns A formatted string like '2h 30m', '45m 10s', or 'Expired'.
 */
export function formatTimeRemaining(expiryDate: Date): string {
  const now = new Date();
  const diff = expiryDate.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  if (minutes > 0) return `${minutes}m ${seconds}s remaining`;
  return `${seconds}s remaining`;
}
// You can add other utility formatting functions here if needed, e.g., formatCurrency, formatTime, etc.