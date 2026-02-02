import React from 'react';

const AppealMessageModal = ({ appeal, onRespond, onClose }) => {
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return 'bx-time';
      case 'approved': return 'bx-check-circle';
      case 'rejected': return 'bx-x-circle';
      default: return 'bx-question-mark';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <i className="bx bx-message-square-detail text-2xl text-blue-600"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Pesan Banding</h3>
                <p className="text-gray-600">Detail pengajuan banding dari user</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appeal.appeal_status)} flex items-center gap-1`}>
                <i className={`bx ${getStatusIcon(appeal.appeal_status)}`}></i>
                {appeal.appeal_status === 'pending' ? 'Menunggu' : 
                 appeal.appeal_status === 'approved' ? 'Disetujui' : 'Ditolak'}
              </span>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <i className="bx bx-x text-2xl text-gray-500"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Appeal */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <i className="bx bx-user text-gray-500"></i>
              <h4 className="font-semibold text-gray-800">Pesan dari User</h4>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-gray-800 whitespace-pre-wrap">{appeal.appeal_message}</p>
            </div>
            <div className="text-right mt-2">
              <span className="text-sm text-gray-500">
                <i className="bx bx-time"></i> {formatDate(appeal.created_at)}
              </span>
            </div>
          </div>

          {/* Admin Response (if exists) */}
          {appeal.admin_response && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <i className="bx bx-shield-alt text-gray-500"></i>
                <h4 className="font-semibold text-gray-800">Respon Admin</h4>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-800 whitespace-pre-wrap">{appeal.admin_response}</p>
              </div>
              {appeal.responded_at && (
                <div className="text-right mt-2">
                  <span className="text-sm text-gray-500">
                    <i className="bx bx-time"></i> {formatDate(appeal.responded_at)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Response Form (if pending) */}
          {appeal.appeal_status === 'pending' && onRespond && (
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <i className="bx bx-edit-alt text-gray-500"></i>
                Berikan Respon
              </h4>
              <div className="flex gap-3">
                <button
                  onClick={() => onRespond(appeal.id, 'approved')}
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <i className="bx bx-check text-lg"></i>
                  Setujui Banding
                </button>
                <button
                  onClick={() => onRespond(appeal.id, 'rejected')}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <i className="bx bx-x text-lg"></i>
                  Tolak Banding
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <i className="bx bx-id-card"></i>
              <span>ID: {appeal.id.substring(0, 8)}...</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppealMessageModal;
