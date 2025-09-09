import React from 'react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/material_blue.css';
import { Calendar } from 'lucide-react';

const DatePicker = ({
  value,
  onChange,
  placeholder = "dd/mm/yyyy",
  className = "",
  required = false,
  disabled = false,
  name,
  id,
  readOnly = false,
  ...props
}) => {
  const handleDateChange = (selectedDates) => {
    const date = selectedDates[0];
    if (date) {
      // Convert to yyyy-MM-dd format for compatibility with existing system
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const isoDate = `${year}-${month}-${day}`;
      
      // Create synthetic event object for compatibility
      const syntheticEvent = {
        target: {
          name: name,
          value: isoDate
        }
      };
      
      onChange && onChange(syntheticEvent);
    } else {
      // Handle empty/cleared date
      const syntheticEvent = {
        target: {
          name: name,
          value: ''
        }
      };
      
      onChange && onChange(syntheticEvent);
    }
  };

  // Convert yyyy-MM-dd value to Date object for Flatpickr
  const getDateValue = () => {
    if (!value) return '';
    try {
      // Handle both yyyy-MM-dd and dd/mm/yyyy formats
      let dateStr = value;
      
      // If it's in dd/mm/yyyy format, convert to yyyy-MM-dd first
      if (value.includes('/')) {
        const parts = value.split('/');
        if (parts.length === 3) {
          dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      
      const date = new Date(dateStr);
      return date;
    } catch (error) {
      console.error('Error parsing date:', error);
      return '';
    }
  };

  return (
    <div className="relative">
      <Flatpickr
        value={getDateValue()}
        onChange={handleDateChange}
        options={{
          dateFormat: "d/m/Y",
          altInput: true,
          altFormat: "d/m/Y",
          allowInput: true,
          disableMobile: true, // Force flatpickr UI on mobile instead of native
          clickOpens: true,
          allowInvalidPreload: false,
          // Mobile-friendly positioning
          static: false,
          position: "auto",
          // Touch-friendly close behavior
          closeOnSelect: true,
          parseDate: (datestr, format) => {
            // Custom parser to handle dd/mm/yyyy input
            if (datestr) {
              const parts = datestr.split('/');
              if (parts.length === 3) {
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1; // months are 0-indexed in Date
                const year = parseInt(parts[2]);
                return new Date(year, month, day);
              }
            }
            return new Date(datestr);
          },
          formatDate: (date, format) => {
            // Format date as dd/mm/yyyy for display
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          }
        }}
        className={`input-field pr-10 ${className}`}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        id={id}
        {...props}
      />
      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
    </div>
  );
};

export default DatePicker;
