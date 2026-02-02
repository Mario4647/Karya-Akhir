// src/components/bans/BanDurationModal.jsx
import React, { useState, useEffect } from 'react';

const BanDurationModal = ({ userId, email, deviceInfo, onConfirm, onClose, loading }) => {
  const [duration, setDuration] = useState(24); // hours
  const [isPermanent, setIsPermanent] = useState(false);
  const [reason, setReason] = useState('');
  const [customDuration, setCustomDuration] = useState({ value: 1, unit: 'hours' });
  const [formErrors, setFormErrors] = useState({});

  const durationOptions = [
    { value: 1, label: '1 Jam', unit: 'hours' },
    { value: 6, label: '6 Jam', unit: 'hours' },
    { value: 24, label: '1 Hari', unit: 'hours' },
    { value: 168, label: '7 Hari', unit: 'hours' },
    { value: 720, label: '30 Hari', unit: 'hours' },
  ];

  const unitOptions = [
    { value: 'minutes', label: 'Menit' },
    { value: 'hours', label: 'Jam' },
    { value: 'days', label: 'Hari' },
    { value: 'weeks', label: 'Minggu' },
  ];

  const reasonOptions = [
    'Pelanggaran ToS - Aktivitas mencurigakan',
    'Pelanggaran ToS - Multiple akun',
    'Pelanggaran ToS - Penyalahgunaan sistem',
    'Pelanggaran ToS - Aktivitas ilegal',
    'Suspected fraud',
    'Security breach attempt',
    'Spam activity detected',
    'Other (specify below)',
  ];

  useEffect(() => {
    // Auto-select first reason
    if (!reason && reasonOptions.length > 0) {
      setReason(reasonOptions[0]);
    }
  }, []);

  const calculateBanUntil = () => {
    if (isPermanent) return null;
    
    const now = new Date();
    let hours = duration;
    
    if (customDuration.unit === 'minutes') {
      hours = customDuration.value / 60;
    } else if (customDuration.unit === 'days') {
      hours = customDuration.value * 24;
    } else if (customDuration.unit === 'weeks') {
      hours = customDuration.value * 24 * 7;
    } else {
      hours = customDuration.value;
    }
    
    return new Date(now.getTime() + hours * 60 * 60 * 1000);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!reason.trim()) {
      errors.reason = 'Mohon pilih atau tulis alasan pembatasan';
    }
    
    if (!isPermanent && customDuration.value <= 0) {
      errors.duration = 'Durasi harus lebih dari 0';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const banUntil = calculateBanUntil();
    
    onConfirm({
      userId,
      email,
      deviceInfo,
      bannedUntil: banUntil?.toISOString(),
      isPermanent,
      reason,
      duration: isPermanent ? null : customDuration,
    });
  };

  const formatDate = (date) => {
    if (!date) return 'Permanen';
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-xl">
                <i className="bx bx-shield-x text-2xl text-red-600"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Atur Pembatasan Device</h3>
                <p className="text-gray-600">Konfigurasi waktu pembatasan untuk device ini</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <i className="bx bx-x text-2xl text-gray-500"></i>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Target Info */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Email Target</p>
                <p className="font-semibold text-gray-800 break-words">{email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Device ID</p>
                <p className="font-semibold text-gray-800 font-mono text-sm truncate" title={deviceInfo?.fingerprint}>
                  {deviceInfo?.fingerprint?.substring(0, 30) || '...'}
                </p>
              </div>
            </div>
          </div>

          {/* Duration Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Durasi Pembatasan
            </label>
            
            {/* Permanent Option */}
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isPermanent}
                    onChange={(e) => setIsPermanent(e.target.checked)}
                    className="sr-only"
                    disabled={loading}
                  />
                  <div className={`w-6 h-6 rounded border flex items-center justify-center ${isPermanent ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                    {isPermanent && <i className="bx bx-check text-white text-sm"></i>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <i className="bx bx-infinite text-red-500"></i>
                  <span className="font-medium text-gray-800">Pembatasan Permanen</span>
                </div>
              </label>
              <p className="text-sm text-gray-500 ml-9 mt-1">
                Device tidak akan bisa login selamanya hingga dibuka manual
              </p>
            </div>

            {/* Temporary Options */}
            {!isPermanent && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                  {durationOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setCustomDuration({ value: option.value, unit: 'hours' })}
                      disabled={loading}
                      className={`py-3 px-4 rounded-lg border text-center transition-all duration-200 disabled:opacity-50 ${
                        customDuration.value === option.value && customDuration.unit === 'hours' 
                          ? 'border-blue-500 bg-blue-50 text-blue-600' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>

                {/* Custom Duration */}
                <div className="flex gap-3 items-center">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="1"
                      max="999"
                      value={customDuration.value}
                      onChange={(e) => {
                        const value = Math.max(1, parseInt(e.target.value) || 1);
                        setCustomDuration(prev => ({ ...prev, value }));
                      }}
                      disabled={loading}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none disabled:opacity-50"
                    />
                  </div>
                  <div className="flex-1">
                    <select
                      value={customDuration.unit}
                      onChange={(e) => setCustomDuration(prev => ({ ...prev, unit: e.target.value }))}
                      disabled={loading}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none disabled:opacity-50"
                    >
                      {unitOptions.map((unit) => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {formErrors.duration && (
                  <p className="text-red-500 text-sm mt-2">{formErrors.duration}</p>
                )}
              </>
            )}
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Alasan Pembatasan <span className="text-red-500">*</span>
            </label>
            
            <div className="grid grid-cols-1 gap-2 mb-3">
              {reasonOptions.map((option, index) => (
                <label key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="relative">
                    <input
                      type="radio"
                      name="reason"
                      value={option}
                      checked={reason === option}
                      onChange={(e) => setReason(e.target.value)}
                      className="sr-only"
                      disabled={loading}
                    />
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${reason === option ? 'border-blue-500' : 'border-gray-300'}`}>
                      {reason === option && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>}
                    </div>
                  </div>
                  <span className="text-gray-800">{option}</span>
                </label>
              ))}
            </div>

            {/* Custom Reason */}
            {reason.startsWith('Other') && (
              <textarea
                value={reason.replace('Other: ', '')}
                onChange={(e) => setReason(`Other: ${e.target.value}`)}
                placeholder="Jelaskan alasan lainnya..."
                disabled={loading}
                className="w-full h-24 p-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none disabled:opacity-50"
              />
            )}
            {formErrors.reason && (
              <p className="text-red-500 text-sm mt-2">{formErrors.reason}</p>
            )}
          </div>

          {/* Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <i className="bx bx-info-circle text-blue-500"></i>
              <span className="font-medium text-blue-800">Ringkasan Pembatasan</span>
            </div>
            <div className="space-y-2 text-sm text-blue-700">
              <p>• Email: <span className="font-medium">{email || 'N/A'}</span></p>
              <p>• Tipe: <span className="font-medium">{isPermanent ? 'Permanen' : 'Sementara'}</span></p>
              {!isPermanent && (
                <p>• Durasi: <span className="font-medium">{customDuration.value} {unitOptions.find(u => u.value === customDuration.unit)?.label}</span></p>
              )}
              {!isPermanent && (
                <p>• Berakhir pada: <span className="font-medium">{formatDate(calculateBanUntil())}</span></p>
              )}
              <p>• Alasan: <span className="font-medium">{reason}</span></p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Memproses...
                </>
              ) : (
                <>
                  <i className="bx bx-shield-x text-lg"></i>
                  Terapkan Pembatasan
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <i className="bx bx-x text-lg"></i>
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BanDurationModal;
