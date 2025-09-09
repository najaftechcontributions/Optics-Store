import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';

/**
 * Centralized date utility functions with dd/mm/yyyy format
 */

// Date display format configuration
const DATE_LOCALE = 'en-GB'; // Uses dd/mm/yyyy format by default

/**
 * Format a date string or Date object for display in dd/mm/yyyy format
 * @param {string|Date} dateString - Date string or Date object
 * @param {Object} options - Optional formatting options
 * @returns {string} Formatted date string in dd/mm/yyyy format
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '';

  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };

  const formatted = new Date(dateString).toLocaleDateString(DATE_LOCALE, { ...defaultOptions, ...options });

  // Ensure consistent dd/mm/yyyy format regardless of browser locale variations
  if (!options.month && !options.day && !options.year) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return formatted;
};

/**
 * Format a date for display with short month name (e.g., "01 Jan 2024")
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date string with short month
 */
export const formatDateWithShortMonth = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleDateString('en-GB', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

/**
 * Format a date for display with long month name (e.g., "01 January 2024")
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date string with long month
 */
export const formatDateWithLongMonth = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleDateString('en-GB', { month: 'long' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

/**
 * Format a date for display with weekday (e.g., "Monday, 01/01/2024")
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date string with weekday
 */
export const formatDateWithWeekday = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' });
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${weekday}, ${day}/${month}/${year}`;
};

/**
 * Get current date formatted for HTML date inputs (yyyy-MM-dd)
 * @returns {string} Date string in yyyy-MM-dd format
 */
export const getCurrentDateForInput = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Format a date for HTML date inputs (yyyy-MM-dd)
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Date string in yyyy-MM-dd format
 */
export const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toISOString().split('T')[0];
};

/**
 * Get current ISO timestamp for database operations
 * @returns {string} ISO timestamp string
 */
export const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Get today's date in yyyy-MM-dd format using date-fns
 * @returns {string} Today's date in yyyy-MM-dd format
 */
export const getTodayFormatted = () => {
  return format(new Date(), 'yyyy-MM-dd');
};

/**
 * Get start of week in yyyy-MM-dd format
 * @param {Date} date - Optional date, defaults to today
 * @returns {string} Start of week in yyyy-MM-dd format
 */
export const getWeekStart = (date = new Date()) => {
  return format(startOfWeek(date), 'yyyy-MM-dd');
};

/**
 * Get end of week in yyyy-MM-dd format
 * @param {Date} date - Optional date, defaults to today
 * @returns {string} End of week in yyyy-MM-dd format
 */
export const getWeekEnd = (date = new Date()) => {
  return format(endOfWeek(date), 'yyyy-MM-dd');
};

/**
 * Get start of month in yyyy-MM-dd format
 * @param {Date} date - Optional date, defaults to today
 * @returns {string} Start of month in yyyy-MM-dd format
 */
export const getMonthStart = (date = new Date()) => {
  return format(startOfMonth(date), 'yyyy-MM-dd');
};

/**
 * Get end of month in yyyy-MM-dd format
 * @param {Date} date - Optional date, defaults to today
 * @returns {string} End of month in yyyy-MM-dd format
 */
export const getMonthEnd = (date = new Date()) => {
  return format(endOfMonth(date), 'yyyy-MM-dd');
};

/**
 * Check if first date is on or before second date
 * @param {string|Date} date1 - First date
 * @param {string|Date} date2 - Second date
 * @returns {boolean} True if date1 is on or before date2
 */
export const isOnOrBefore = (date1, date2) => {
  return new Date(date1) <= new Date(date2);
};

/**
 * Check if first date is after second date
 * @param {string|Date} date1 - First date
 * @param {string|Date} date2 - Second date
 * @returns {boolean} True if date1 is after date2
 */
export const isAfter = (date1, date2) => {
  return new Date(date1) > new Date(date2);
};

/**
 * Convert date from dd/mm/yyyy format to yyyy-MM-dd format
 * @param {string} dateString - Date string in dd/mm/yyyy format
 * @returns {string} Date string in yyyy-MM-dd format
 */
export const convertDDMMYYYYToYYYYMMDD = (dateString) => {
  if (!dateString) return '';

  try {
    // Handle both dd/mm/yyyy and d/m/yyyy formats
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    return dateString; // Return as-is if not in expected format
  } catch (error) {
    console.error('Error converting date from dd/mm/yyyy to yyyy-MM-dd:', error);
    return dateString;
  }
};

/**
 * Convert date from yyyy-MM-dd format to dd/mm/yyyy format
 * @param {string} dateString - Date string in yyyy-MM-dd format
 * @returns {string} Date string in dd/mm/yyyy format
 */
export const convertYYYYMMDDToDDMMYYYY = (dateString) => {
  if (!dateString) return '';

  try {
    // Handle yyyy-MM-dd format
    if (dateString.includes('-')) {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1];
        const day = parts[2];
        return `${day}/${month}/${year}`;
      }
    }
    return dateString; // Return as-is if not in expected format
  } catch (error) {
    console.error('Error converting date from yyyy-MM-dd to dd/mm/yyyy:', error);
    return dateString;
  }
};

/**
 * Parse date string in dd/mm/yyyy format to Date object
 * @param {string} dateString - Date string in dd/mm/yyyy format
 * @returns {Date|null} Date object or null if invalid
 */
export const parseDDMMYYYY = (dateString) => {
  if (!dateString) return null;

  try {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // months are 0-indexed in Date
      const year = parseInt(parts[2]);
      return new Date(year, month, day);
    }
    return null;
  } catch (error) {
    console.error('Error parsing dd/mm/yyyy date:', error);
    return null;
  }
};

/**
 * Get current date in dd/mm/yyyy format
 * @returns {string} Current date in dd/mm/yyyy format
 */
export const getCurrentDateDDMMYYYY = () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  return `${day}/${month}/${year}`;
};
