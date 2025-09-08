import React from 'react';
import { Eye, Calendar, User as UserIcon, Edit, Trash2 } from 'lucide-react';

const CheckupDisplay = ({ checkup, showHeader = true, compact = false, onEdit, onDelete, showActions = false }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrescription = (sph, cyl, axis) => {
    const spherical = sph || '---';
    const cylindrical = cyl || '---';
    const axisValue = axis || '---';

    return { spherical, cylindrical, axisValue };
  };

  const renderEyeData = (title, sphDV, cylDV, axisDV, sphNV, cylNV, axisNV) => {
    const dvData = formatPrescription(sphDV, cylDV, axisDV);
    const nvData = formatPrescription(sphNV, cylNV, axisNV);

    return (
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 text-center pb-2 border-b border-gray-200">{title}</h4>

        {/* Distance Vision */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-sm font-medium text-blue-800 mb-2 flex items-center">
            <Eye className="h-4 w-4 mr-1" />
            Distance Vision (D.V)
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">SPH</div>
              <div className="font-mono bg-white px-2 py-1 rounded border font-semibold text-blue-900">
                {dvData.spherical}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">CYL</div>
              <div className="font-mono bg-white px-2 py-1 rounded border font-semibold text-blue-900">
                {dvData.cylindrical}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">AXIS</div>
              <div className="font-mono bg-white px-2 py-1 rounded border font-semibold text-blue-900">
                {dvData.axisValue}
              </div>
            </div>
          </div>
        </div>

        {/* Near Vision */}
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-sm font-medium text-green-800 mb-2">
            Near Vision (N.V)
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">SPH</div>
              <div className="font-mono bg-white px-2 py-1 rounded border font-semibold text-green-900">
                {nvData.spherical}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">CYL</div>
              <div className="font-mono bg-white px-2 py-1 rounded border font-semibold text-green-900">
                {nvData.cylindrical}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">AXIS</div>
              <div className="font-mono bg-white px-2 py-1 rounded border font-semibold text-green-900">
                {nvData.axisValue}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`border border-gray-200 rounded-lg ${compact ? 'p-2 sm:p-3' : 'p-3 sm:p-4'} hover:shadow-md transition-shadow`}>
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-gray-200">
          <div className="flex items-center space-x-2 min-w-0">
            <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <span className="font-semibold text-gray-900 text-sm sm:text-base">{formatDate(checkup.date)}</span>
            {checkup.tested_by && (
              <>
                <span className="text-gray-400 hidden sm:inline">•</span>
                <span className="text-xs sm:text-sm text-gray-600 truncate">Tested by {checkup.tested_by}</span>
              </>
            )}
          </div>
          <div className="flex items-center justify-between sm:justify-end space-x-2">
            {checkup.created_at && (
              <div className="text-xs text-gray-500">
                Recorded: {formatDate(checkup.created_at)}
              </div>
            )}
            {showActions && (
              <div className="flex items-center space-x-1 sm:space-x-2 sm:ml-4">
                <button
                  onClick={() => onEdit && onEdit(checkup)}
                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                  title="Edit checkup"
                >
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
                <button
                  onClick={() => onDelete && onDelete(checkup)}
                  className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                  title="Delete checkup"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Right Eye */}
        {renderEyeData(
          "RIGHT EYE",
          checkup.right_eye_spherical_dv,
          checkup.right_eye_cylindrical_dv,
          checkup.right_eye_axis_dv,
          checkup.right_eye_spherical_nv,
          checkup.right_eye_cylindrical_nv,
          checkup.right_eye_axis_nv
        )}

        {/* Left Eye */}
        {renderEyeData(
          "LEFT EYE",
          checkup.left_eye_spherical_dv,
          checkup.left_eye_cylindrical_dv,
          checkup.left_eye_axis_dv,
          checkup.left_eye_spherical_nv,
          checkup.left_eye_cylindrical_nv,
          checkup.left_eye_axis_nv
        )}
      </div>

      {/* ADD Section */}
      {(checkup.right_eye_add || checkup.left_eye_add) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="bg-orange-50 rounded-lg p-3">
            <h5 className="text-sm font-semibold text-orange-800 mb-3">ADD</h5>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">Right Eye</div>
                <div className="font-mono bg-white px-3 py-2 rounded border font-semibold text-orange-900">
                  {checkup.right_eye_add || '---'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">Left Eye</div>
                <div className="font-mono bg-white px-3 py-2 rounded border font-semibold text-orange-900">
                  {checkup.left_eye_add || '---'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {(checkup.ipd_bridge || checkup.bifocal_details) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="bg-purple-50 rounded-lg p-3">
            <h5 className="text-sm font-semibold text-purple-800 mb-2">IPD Bridge</h5>
            <p className="text-sm text-purple-900">{checkup.ipd_bridge || checkup.bifocal_details}</p>
          </div>
        </div>
      )}

      {/* Prescription Summary */}
      {!compact && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h5 className="text-sm font-semibold text-gray-700 mb-3">Prescription Summary</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-medium text-gray-700">Right Eye D.V:</div>
              <div className="font-mono">
                SPH: {checkup.right_eye_spherical_dv || '---'} |
                CYL: {checkup.right_eye_cylindrical_dv || '---'} |
                AXIS: {checkup.right_eye_axis_dv || '---'}
              </div>
              <div className="font-medium text-gray-700 mt-1">Right Eye N.V:</div>
              <div className="font-mono">
                SPH: {checkup.right_eye_spherical_nv || '---'} |
                CYL: {checkup.right_eye_cylindrical_nv || '---'} |
                AXIS: {checkup.right_eye_axis_nv || '---'}
              </div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-medium text-gray-700">Left Eye D.V:</div>
              <div className="font-mono">
                SPH: {checkup.left_eye_spherical_dv || '---'} |
                CYL: {checkup.left_eye_cylindrical_dv || '---'} |
                AXIS: {checkup.left_eye_axis_dv || '---'}
              </div>
              <div className="font-medium text-gray-700 mt-1">Left Eye N.V:</div>
              <div className="font-mono">
                SPH: {checkup.left_eye_spherical_nv || '---'} |
                CYL: {checkup.left_eye_cylindrical_nv || '---'} |
                AXIS: {checkup.left_eye_axis_nv || '---'}
              </div>
            </div>
            {(checkup.right_eye_add || checkup.left_eye_add) && (
              <div className="bg-gray-50 p-2 rounded md:col-span-2">
                <div className="font-medium text-gray-700">ADD Values:</div>
                <div className="font-mono">
                  Right Eye: {checkup.right_eye_add || '---'} | Left Eye: {checkup.left_eye_add || '---'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckupDisplay;
