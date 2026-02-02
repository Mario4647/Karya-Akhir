import React, { useState } from 'react';

const AppealForm = ({ banId, onSubmit, onCancel }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || message.length < 10) {
      alert('Mohon isi pesan banding minimal 10 karakter');
      return;
    }

    setLoading(true);
    try {
      const result = await onSubmit({
        deviceBanId: banId,
        message: message.trim(),
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onCancel();
        }, 3000);
      } else {
        alert('Gagal mengajukan banding: ' + result.error);
      }
    } catch (error) {
      alert('Terjadi kesalahan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
            <i className="bx bx-check text-3xl text-green-600"></i>
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Banding Terkirim!</h3>
        <p className="text-gray-600 mb-6">
          Banding Anda telah dikirim. Tim admin akan meninjau permohonan Anda.
          Anda akan mendapat notifikasi via email.
        </p>
        <div className="animate-pulse text-sm text-gray-500">
          <i className="bx bx-time"></i> Redirect dalam 3 detik...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <i className="bx bx-message-square-detail text-xl text-blue-600"></i>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Form Pengajuan Banding</h3>
            <p className="text-gray-600">Jelaskan alasan mengapa device ini perlu dibuka kembali</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pesan Banding <span className="text-red-500">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Contoh: Saya merasa ini kesalahan karena device ini baru saja digunakan pertama kali..."
            className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-300 resize-none"
            disabled={loading}
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500">
              Minimal 10 karakter • {message.length}/1000
            </span>
            <span className={`text-xs ${message.length < 10 ? 'text-red-500' : 'text-green-500'}`}>
              {message.length < 10 ? 'Terlalu pendek' : 'Sudah cukup'}
            </span>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <i className="bx bx-bulb text-yellow-500 mt-0.5"></i>
            <div>
              <p className="font-medium text-yellow-800 mb-1">Tips menulis banding yang baik:</p>
              <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                <li>Jelaskan kronologi penggunaan device</li>
                <li>Sebutkan alasan yang logis dan sopan</li>
                <li>Lampirkan bukti jika ada (akan dikonfirmasi via email)</li>
                <li>Pastikan informasi yang diberikan akurat</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading || message.length < 10}
            className={`flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${loading || message.length < 10 ? 'opacity-70 cursor-not-allowed' : 'hover:from-blue-700 hover:to-indigo-700'}`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Mengirim...
              </>
            ) : (
              <>
                <i className="bx bx-send text-lg"></i>
                Kirim Banding
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <i className="bx bx-arrow-back text-lg"></i>
            Kembali
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppealForm;
