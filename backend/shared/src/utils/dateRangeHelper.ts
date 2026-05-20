/**
 * Get date range from string format
 */
export function getDateRange(range: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  
  let startDate = new Date();
  
  // Parse range string (e.g., "7d", "30d", "3m", "1y")
  const match = range.match(/^(\d+)([hdwmy])$/);
  
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'h': // hours
        startDate.setHours(startDate.getHours() - value);
        break;
      case 'd': // days
        startDate.setDate(startDate.getDate() - value);
        break;
      case 'w': // weeks
        startDate.setDate(startDate.getDate() - (value * 7));
        break;
      case 'm': // months
        startDate.setMonth(startDate.getMonth() - value);
        break;
      case 'y': // years
        startDate.setFullYear(startDate.getFullYear() - value);
        break;
    }
  } else {
    // Default to 30 days if format is invalid
    startDate.setDate(startDate.getDate() - 30);
  }
  
  startDate.setHours(0, 0, 0, 0);
  
  return { startDate, endDate };
}

/**
 * Get date range for specific periods
 */
export function getPresetDateRange(preset: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  
  switch (preset) {
    case 'today':
      // Start and end are same day
      break;
      
    case 'yesterday':
      startDate.setDate(startDate.getDate() - 1);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case 'this_week':
      startDate.setDate(startDate.getDate() - startDate.getDay());
      break;
      
    case 'last_week':
      startDate.setDate(startDate.getDate() - startDate.getDay() - 7);
      endDate.setDate(endDate.getDate() - endDate.getDay() - 1);
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case 'this_month':
      startDate.setDate(1);
      break;
      
    case 'last_month':
      startDate.setMonth(startDate.getMonth() - 1);
      startDate.setDate(1);
      endDate.setDate(0); // Last day of previous month
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case 'this_quarter':
      const currentQuarter = Math.floor(startDate.getMonth() / 3);
      startDate.setMonth(currentQuarter * 3);
      startDate.setDate(1);
      break;
      
    case 'this_year':
      startDate.setMonth(0);
      startDate.setDate(1);
      break;
      
    default:
      // Default to last 30 days
      startDate.setDate(startDate.getDate() - 30);
  }
  
  return { startDate, endDate };
}

/**
 * Format date for display
 */
export function formatDateHelper(date: Date, format: string = 'YYYY-MM-DD'): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * Get days between two dates
 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((endDate.getTime() - startDate.getTime()) / msPerDay);
}

/**
 * Get all dates in range
 */
export function getDatesInRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Check if date is within range
 */
export function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  return date >= startDate && date <= endDate;
}