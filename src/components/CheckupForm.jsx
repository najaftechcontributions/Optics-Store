import React, { useState } from 'react';
import { X, Save, Eye, Calendar, User, Stethoscope } from 'lucide-react';
import { checkupService } from '../utils/database';
import { useStore } from '../contexts/StoreContext';
import { getCurrentDateForInput } from '../utils/dateUtils';
import DatePicker from './DatePicker';

const CheckupForm = ({ customer, checkup, onClose }) => {
  const { currentStore } = useStore();
  const [formData, setFormData] = useState({
    date: checkup?.date || getCurrentDateForInput(),
    // Right Eye
    right_eye_spherical_dv: checkup?.right_eye_spherical_dv || '',
    right_eye_cylindrical_dv: checkup?.right_eye_cylindrical_dv || '',
    right_eye_axis_dv: checkup?.right_eye_axis_dv || '',
    right_eye_add: checkup?.right_eye_add || '',
    right_eye_spherical_nv: checkup?.right_eye_spherical_nv || '',
    right_eye_cylindrical_nv: checkup?.right_eye_cylindrical_nv || '',
    right_eye_axis_nv: checkup?.right_eye_axis_nv || '',
    // Left Eye
    left_eye_spherical_dv: checkup?.left_eye_spherical_dv || '',
    left_eye_cylindrical_dv: checkup?.left_eye_cylindrical_dv || '',
    left_eye_axis_dv: checkup?.left_eye_axis_dv || '',
    left_eye_add: checkup?.left_eye_add || '',
    left_eye_spherical_nv: checkup?.left_eye_spherical_nv || '',
    left_eye_cylindrical_nv: checkup?.left_eye_cylindrical_nv || '',
    left_eye_axis_nv: checkup?.left_eye_axis_nv || '',
    ipd_bridge: checkup?.ipd_bridge || checkup?.bifocal_details || '',
    tested_by: checkup?.tested_by || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!currentStore) {
      setError('No store selected. Please login to a store first.');
      setLoading(false);
      return;
    }

    // Validate required fields
    if (!formData.tested_by || formData.tested_by.trim() === '') {
      setError('Tested by field is required.');
      setLoading(false);
      return;
    }

    try {
      const checkupData = {
        ...formData,
        customer_id: customer.id
      };

      if (checkup) {
        // Update existing checkup
        await checkupService.update(checkup.id, checkupData, currentStore.id);
      } else {
        // Create new checkup
        await checkupService.create(checkupData, currentStore.id);
      }

      onClose();
    } catch (error) {
      console.error('Error saving checkup:', error);
      setError('Error saving checkup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 no_margin_top">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-6xl max-h-[95vh] overflow-auto">
        {/* Header */}
        <div className="bg-gray-900 text-white p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <Eye className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-sm sm:text-xl lg:text-2xl font-bold truncate">{checkup ? 'Edit' : 'New'} Eye Examination - {import.meta.env.VITE_STORE_NAME_FULL || 'KASHMIR OPTICAL CENTRE'}</h1>
                <p className="text-xs sm:text-sm text-gray-300 hidden sm:block">{import.meta.env.VITE_STORE_ADDRESS || 'Lekhar Road Near Sukhana Foundation, Jhang Syedan, Islamabad Capital Territory'}</p>
                <p className="text-sm sm:text-lg font-semibold mt-1 hidden md:block">{import.meta.env.VITE_STORE_TAGLINE || 'SUNGLASSES & EYEWEAR STORE'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white ml-2"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Customer Info Section */}
          <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div>
                <span className="font-medium text-gray-700">Name:</span>
                <span className="ml-2">{customer.name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Phone:</span>
                <span className="ml-2">{customer.phone}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="font-medium text-gray-700">Address:</span>
                <span className="ml-2">{customer.address || 'Not provided'}</span>
              </div>
              {customer.remarks && (
                <div className="sm:col-span-3">
                  <span className="font-medium text-gray-700">Remarks:</span>
                  <span className="ml-2">{customer.remarks}</span>
                </div>
              )}
            </div>
          </div>

          {/* Eye Examination Grid */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Eye className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Eye Examination
            </h3>

            <div className="border-2 border-gray-900 rounded-lg overflow-x-auto">
              <div className="min-w-[500px]">
                {/* Header Row */}
                <div className="grid grid-cols-7 bg-gray-100 border-b-2 border-gray-900">
                  <div className="p-2 sm:p-3 border-r border-gray-900 font-bold text-center text-xs sm:text-sm">Serial #</div>
                  <div className="col-span-3 border-r-2 border-gray-900 text-center">
                    <div className="p-2 border-b border-gray-900 font-bold text-sm sm:text-lg">RIGHT EYE</div>
                    <div className="grid grid-cols-3">
                      <div className="p-1 sm:p-2 border-r border-gray-900 font-semibold text-xs sm:text-sm">SPHERICAL</div>
                      <div className="p-1 sm:p-2 border-r border-gray-900 font-semibold text-xs sm:text-sm">CYLINDRICAL</div>
                      <div className="p-1 sm:p-2 font-semibold text-xs sm:text-sm">AXIS</div>
                    </div>
                  </div>
                  <div className="col-span-3 text-center">
                    <div className="p-2 border-b border-gray-900 font-bold text-sm sm:text-lg">LEFT EYE</div>
                    <div className="grid grid-cols-3">
                      <div className="p-1 sm:p-2 border-r border-gray-900 font-semibold text-xs sm:text-sm">SPHERICAL</div>
                      <div className="p-1 sm:p-2 border-r border-gray-900 font-semibold text-xs sm:text-sm">CYLINDRICAL</div>
                      <div className="p-1 sm:p-2 font-semibold text-xs sm:text-sm">AXIS</div>
                    </div>
                  </div>
                </div>

                {/* D.V Row */}
                <div className="grid grid-cols-7 border-b border-gray-900">
                  <div className="p-2 sm:p-3 border-r border-gray-900 font-semibold bg-gray-50 flex items-center text-xs sm:text-sm">D.V</div>
                  <div className="p-1 sm:p-2 border-r border-gray-900">
                    <input
                      type="text"
                      name="right_eye_spherical_dv"
                      value={formData.right_eye_spherical_dv}
                      onChange={handleChange}
                      className="w-full p-1 border border-gray-300 rounded text-center text-xs sm:text-sm"
                      placeholder="-"
                    />
                  </div>
                  <div className="p-1 sm:p-2 border-r border-gray-900">
                    <input
                      type="text"
                      name="right_eye_cylindrical_dv"
                      value={formData.right_eye_cylindrical_dv}
                      onChange={handleChange}
                      className="w-full p-1 border border-gray-300 rounded text-center text-xs sm:text-sm"
                      placeholder="-"
                    />
                  </div>
                  <div className="p-1 sm:p-2 border-r-2 border-gray-900">
                    <input
                      type="text"
                      name="right_eye_axis_dv"
                      value={formData.right_eye_axis_dv}
                      onChange={handleChange}
                      className="w-full p-1 border border-gray-300 rounded text-center text-xs sm:text-sm"
                      placeholder="-"
                    />
                  </div>
                  <div className="p-1 sm:p-2 border-r border-gray-900">
                    <input
                      type="text"
                      name="left_eye_spherical_dv"
                      value={formData.left_eye_spherical_dv}
                      onChange={handleChange}
                      className="w-full p-1 border border-gray-300 rounded text-center text-xs sm:text-sm"
                      placeholder="-"
                    />
                  </div>
                  <div className="p-1 sm:p-2 border-r border-gray-900">
                    <input
                      type="text"
                      name="left_eye_cylindrical_dv"
                      value={formData.left_eye_cylindrical_dv}
                      onChange={handleChange}
                      className="w-full p-1 border border-gray-300 rounded text-center text-xs sm:text-sm"
                      placeholder="-"
                    />
                  </div>
                  <div className="p-1 sm:p-2">
                    <input
                      type="text"
                      name="left_eye_axis_dv"
                      value={formData.left_eye_axis_dv}
                      onChange={handleChange}
                      className="w-full p-1 border border-gray-300 rounded text-center text-xs sm:text-sm"
                      placeholder="-"
                    />
                  </div>
                </div>

                {/* N.V Row */}
                <div className="grid grid-cols-7 border-b border-gray-900">
                  <div className="p-2 sm:p-3 border-r border-gray-900 font-semibold bg-gray-50 flex items-center text-xs sm:text-sm">N.V</div>
                  <div className="p-1 sm:p-2 border-r border-gray-900">
                    <input
                      type="text"
                      name="right_eye_spherical_nv"
                      value={formData.right_eye_spherical_nv}
                      onChange={handleChange}
                      className="w-full p-1 border border-gray-300 rounded text-center text-xs sm:text-sm"
                      placeholder="-"
                    />
                  </div>
                  <div className="p-1 sm:p-2 border-r border-gray-900">
                    <input
                      type="text"
                      name="right_eye_cylindrical_nv"
                      value={formData.right_eye_cylindrical_nv}
                      onChange={handleChange}
                      className="w-full p-1 border border-gray-300 rounded text-center text-xs sm:text-sm"
                      placeholder="-"
                    />
                  </div>
                  <div className="p-1 sm:p-2 border-r-2 border-gray-900">
                    <input
                      type="text"
                      name="right_eye_axis_nv"
                      value={formData.right_eye_axis_nv}
                      onChange={handleChange}
                      className="w-full p-1 border border-gray-300 rounded text-center text-xs sm:text-sm"
                      placeholder="-"
                    />
                  </div>
                  <div className="p-1 sm:p-2 border-r border-gray-900">
                    <input
                      type="text"
                      name="left_eye_spherical_nv"
                      value={formData.left_eye_spherical_nv}
                      onChange={handleChange}
                      className="w-full p-1 border border-gray-300 rounded text-center text-xs sm:text-sm"
                      placeholder="-"
                    />
                  </div>
                  <div className="p-1 sm:p-2 border-r border-gray-900">
                    <input
                      type="text"
                      name="left_eye_cylindrical_nv"
                      value={formData.left_eye_cylindrical_nv}
                      onChange={handleChange}
                      className="w-full p-1 border border-gray-300 rounded text-center text-xs sm:text-sm"
                      placeholder="-"
                    />
                  </div>
                  <div className="p-1 sm:p-2">
                    <input
                      type="text"
                      name="left_eye_axis_nv"
                      value={formData.left_eye_axis_nv}
                      onChange={handleChange}
                      className="w-full p-1 border border-gray-300 rounded text-center text-xs sm:text-sm"
                      placeholder="-"
                    />
                  </div>
                </div>
                {/* ADD Section */}
                <div className="grid grid-cols-7">
                  <div className="p-2 sm:p-3 border-r border-gray-900 font-semibold bg-gray-50 flex items-center text-xs sm:text-sm">ADD</div>
                  <div className="p-1 sm:p-2 border-r-2 border-gray-900 col-span-3">
                    <input
                      type="text"
                      name="right_eye_add"
                      value={formData.right_eye_add}
                      onChange={handleChange}
                      placeholder="ADD value"
                      className="w-full p-1 border border-gray-300 rounded text-center text-xs sm:text-sm"
                    />
                  </div>
                  <div className="p-1 sm:p-2 border-r border-gray-900 col-span-3">
                    <input
                      type="text"
                      name="left_eye_add"
                      value={formData.left_eye_add}
                      onChange={handleChange}
                      placeholder="ADD value"
                      className="w-full p-1 border border-gray-300 rounded text-center text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* IPD Bridge Details */}
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 border-2 border-gray-900 rounded-lg bg-gray-50">
              <h4 className="font-bold text-left text-sm sm:text-lg mb-3">IPD BRIDGE</h4>
              <textarea
                name="ipd_bridge"
                value={formData.ipd_bridge}
                onChange={handleChange}
                rows={3}
                className="w-full p-2 sm:p-3 border border-gray-300 rounded text-xs sm:text-sm"
                placeholder="Enter IPD Bridge details..."
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Examination Date *
                </label>
                <DatePicker
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  placeholder="dd/mm/yyyy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Stethoscope className="h-4 w-4 inline mr-1" />
                  Tested By *
                </label>
                <input
                  type="text"
                  name="tested_by"
                  value={formData.tested_by}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter examiner name"
                  required
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:space-x-3 pt-4 sm:pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 order-2 sm:order-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center space-x-2 order-1 sm:order-2"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{checkup ? 'Update Checkup' : 'Save Checkup'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckupForm;
