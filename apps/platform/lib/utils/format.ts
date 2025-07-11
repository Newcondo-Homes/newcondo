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

// You can add other utility formatting functions here if needed, e.g., formatCurrency, formatTime, etc.