import React, { useState } from 'react';
import AppealForm from './AppealForm';

const BanPopup = ({ ban, onClose, onSubmitAppeal }) => {
  const [showAppealForm, setShowAppealForm] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeLeft = () => {
    if (ban.is_permanent) return 'Permanen';
    
    const now = new Date();
    const until = new Date(ban.banned_until);
    const diff = until - now;
    
    if (diff <= 0) return 'Berakhir';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days} hari ${hours} jam`;
    if (hours > 0) return `${hours} jam ${minutes} menit`;
    return `${minutes} menit`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-xl">
                <i className="bx bx-shield-x text-2xl text-red-600"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Akses Dibatasi</h3>
                <p className="text-gray-600">Device Anda terdeteksi dalam daftar pembatasan</p>
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
          {!showAppealForm ? (
            <>
              {/* Alert */}
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <i className="bx bx-error-circle text-xl text-red-500 mt-0.5"></i>
                  <div>
                    <p className="font-medium text-red-800">Alasan Pembatasan:</p>
                    <p className="text-red-700 mt-1">{ban.reason || 'Pelanggaran terhadap ketentuan penggunaan sistem'}</p>
                  </div>
                </div>
              </div>

              {/* Ban Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="bx bx-calendar text-gray-500"></i>
                    <span className="text-sm font-medium text-gray-600">Mulai</span>
                  </div>
                  <p className="font-semibold text-gray-800">{formatDate(ban.banned_at)}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="bx bx-time text-gray-500"></i>
                    <span className="text-sm font-medium text-gray-600">Sisa Waktu</span>
                  </div>
                  <p className="font-semibold text-gray-800">{getTimeLeft()}</p>
                </div>

                {!ban.is_permanent && (
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <i className="bx bx-calendar-check text-gray-500"></i>
                      <span className="text-sm font-medium text-gray-600">Berakhir Pada</span>
                    </div>
                    <p className="font-semibold text-gray-800">{formatDate(ban.banned_until)}</p>
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="bx bx-device text-gray-500"></i>
                    <span className="text-sm font-medium text-gray-600">Jenis Pembatasan</span>
                  </div>
                  <p className="font-semibold text-gray-800">
                    {ban.is_permanent ? 'Permanen' : 'Sementara'}
                  </p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <i className="bx bx-info-circle"></i>
                  Informasi Tambahan
                </h4>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-blue-800">
                    Device fingerprint telah terekam di sistem. Jika Anda merasa ini adalah kesalahan,
                    Anda dapat mengajukan banding untuk meninjau kembali pembatasan ini.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowAppealForm(true)}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <i className="bx bx-message-square-edit text-lg"></i>
                  Ajukan Banding
                </button>
                
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <i className="bx bx-exit text-lg"></i>
                  Tutup
                </button>
              </div>
            </>
          ) : (
            <AppealForm
              banId={ban.id}
              onSubmit={onSubmitAppeal}
              onCancel={() => setShowAppealForm(false)}
            />
          )}
        </div>

        {/* Footer */}
        {!showAppealForm && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <i className="bx bx-shield-alt text-gray-500"></i>
              <span>Sistem Keamanan • {new Date().getFullYear()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BanPopup;
