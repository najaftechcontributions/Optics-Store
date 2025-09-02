import Swal from 'sweetalert2';

// Default theme colors to match the app
const swalTheme = {
  confirmButtonColor: '#2563eb', // primary-600
  cancelButtonColor: '#6b7280',  // gray-500
  customClass: {
    popup: 'rounded-lg',
    confirmButton: 'rounded-md px-4 py-2 font-medium',
    cancelButton: 'rounded-md px-4 py-2 font-medium'
  }
};

/**
 * Show a confirmation dialog
 * @param {string} title - The title of the confirmation
 * @param {string} text - The description text
 * @param {string} confirmText - Text for confirm button (default: 'Yes, confirm!')
 * @param {string} cancelText - Text for cancel button (default: 'Cancel')
 * @returns {Promise<boolean>} - Promise that resolves to true if confirmed, false if cancelled
 */
export const showConfirmDialog = async (
  title, 
  text, 
  confirmText = 'Yes, confirm!', 
  cancelText = 'Cancel'
) => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    ...swalTheme
  });

  return result.isConfirmed;
};

/**
 * Show a delete confirmation dialog
 * @param {string} itemName - Name of the item being deleted
 * @param {string} additionalText - Additional warning text
 * @returns {Promise<boolean>} - Promise that resolves to true if confirmed, false if cancelled
 */
export const showDeleteConfirmation = async (itemName, additionalText = '') => {
  const text = additionalText || `This action cannot be undone.`;
  
  const result = await Swal.fire({
    title: `Delete ${itemName}?`,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#dc2626', // red-600 for delete actions
    reverseButtons: true,
    ...swalTheme
  });

  return result.isConfirmed;
};

/**
 * Show a logout confirmation dialog
 * @param {string} logoutType - Type of logout (e.g., 'store', 'super admin', 'everything')
 * @returns {Promise<boolean>} - Promise that resolves to true if confirmed, false if cancelled
 */
export const showLogoutConfirmation = async (logoutType = '') => {
  const title = logoutType ? `Logout from ${logoutType}?` : 'Logout?';
  
  const result = await Swal.fire({
    title,
    text: 'Are you sure you want to logout?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, logout',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    ...swalTheme
  });

  return result.isConfirmed;
};

/**
 * Show a success message
 * @param {string} title - The title of the success message
 * @param {string} text - The description text
 * @param {number} timer - Auto close timer in milliseconds (default: 3000)
 */
export const showSuccess = (title, text = '', timer = 3000) => {
  Swal.fire({
    title,
    text,
    icon: 'success',
    timer,
    showConfirmButton: false,
    ...swalTheme
  });
};

/**
 * Show an error message
 * @param {string} title - The title of the error message
 * @param {string} text - The description text
 */
export const showError = (title, text = '') => {
  Swal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonText: 'OK',
    ...swalTheme
  });
};

/**
 * Show an info/warning message
 * @param {string} title - The title of the message
 * @param {string} text - The description text
 */
export const showInfo = (title, text = '') => {
  Swal.fire({
    title,
    text,
    icon: 'info',
    confirmButtonText: 'OK',
    ...swalTheme
  });
};
