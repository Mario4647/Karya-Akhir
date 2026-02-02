import React from 'react';

const DeviceInfoModal = ({ deviceInfo, onClose }) => {
  const deviceData = [
    { label: 'Browser', value: deviceInfo.browser, icon: 'bx-globe' },
    { label: 'Sistem Operasi', value: deviceInfo.os, icon: 'bx-chip' },
    { label: 'Platform', value: deviceInfo.platform, icon: 'bx-devices' },
    { label: 'Resolusi Layar', value: deviceInfo.screenResolution, icon: 'bx-desktop' },
    { label: 'Bahasa', value: deviceInfo.languages, icon: 'bx-world' },
    { label: 'Zona Waktu', value: deviceInfo.timezone, icon: 'bx-time' },
    { label: 'Cookies', value: deviceInfo.cookieEnabled ? 'Aktif' : 'Nonaktif', icon: 'bx-cookie' },
    { label: 'Do Not Track', value: deviceInfo.doNotTrack, icon: 'bx-shield' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <i className="bx bx-devices text-2xl text-blue-600"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Detail Device</h3>
                <p className="text-gray-600">Informasi lengkap perangkat yang terdeteksi</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <i className="bx bx-x text-2xl text-gray-500"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* User Agent */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Agent
            </label>
            <div className="bg-gray-50 p-4 rounded-xl overflow-x-auto">
              <code className="text-sm text-gray-800 font-mono">
                {deviceInfo.userAgent}
              </code>
            </div>
          </div>

          {/* Device Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {deviceData.map((item, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <i className={`bx ${item.icon} text-gray-500`}></i>
                  <span className="text-sm font-medium text-gray-600">{item.label}</span>
                </div>
                <p className="font-semibold text-gray-800 break-words">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Security Status */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <i className="bx bx-shield-alt"></i>
              Status Keamanan
            </h4>
            <div className={`p-4 rounded-xl ${deviceInfo.javaEnabled === 'Yes' || deviceInfo.pdfEnabled === 'Yes' ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${deviceInfo.javaEnabled === 'Yes' || deviceInfo.pdfEnabled === 'Yes' ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <i className={`bx ${deviceInfo.javaEnabled === 'Yes' || deviceInfo.pdfEnabled === 'Yes' ? 'bx-check-shield text-green-600' : 'bx-shield text-gray-600'}`}></i>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Plugin Keamanan</p>
                    <p className="text-sm text-gray-600">
                      {deviceInfo.javaEnabled === 'Yes' || deviceInfo.pdfEnabled === 'Yes' 
                        ? 'Plugin standar terdeteksi' 
                        : 'Tidak ada plugin khusus'}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${deviceInfo.javaEnabled === 'Yes' || deviceInfo.pdfEnabled === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {deviceInfo.javaEnabled === 'Yes' || deviceInfo.pdfEnabled === 'Yes' ? 'Aman' : 'Standar'}
                </span>
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div className="text-center text-sm text-gray-500">
            <i className="bx bx-time"></i> Data diambil: {new Date().toLocaleString('id-ID')}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl font-semibold hover:from-gray-800 hover:to-gray-900 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <i className="bx bx-check text-lg"></i>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceInfoModal;
