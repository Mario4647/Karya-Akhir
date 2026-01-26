import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

const CekPIP = () => {
  const [nisn, setNisn] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchMade, setSearchMade] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSearchMade(true);

    try {
      // Cari data di database
      const { data, error: fetchError } = await supabase
        .from('pip_data')
        .select('*')
        .eq('nisn', nisn)
        .eq('tanggal_lahir', tanggalLahir)
        .single();

      if (fetchError || !data) {
        setError('Data tidak ditemukan. Periksa kembali NISN dan Tanggal Lahir Anda.');
        setResult(null);
        
        // Log search history (failed)
        await logSearchHistory(false);
        return;
      }

      setResult(data);
      
      // Log search history (success)
      await logSearchHistory(true, data);
      
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const logSearchHistory = async (success, data = null) => {
    try {
      // Dapatkan IP pengguna
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      
      // Dapatkan informasi user jika login
      const { data: { session } } = await supabase.auth.getSession();
      
      await supabase.from('search_history').insert({
        user_id: session?.user?.id || null,
        user_email: session?.user?.email || 'guest',
        user_name: session?.user?.user_metadata?.name || 'Pengunjung',
        ip_address: ipData.ip,
        nisn_searched: nisn,
        tanggal_lahir_searched: tanggalLahir,
        search_result: success ? {
          nama_pd: data.nama_pd,
          nisn: data.nisn,
          kelas: data.kelas,
          rombel: data.rombel,
          nomenklatur: data.nomenklatur,
          status_cair: data.status_cair,
          nominal: data.nominal,
          no_rekening: data.no_rekening,
          nomor_sk: data.nomor_sk,
          tanggal_sk: data.tanggal_sk,
          layak_pip: data.layak_pip
        } : null
      });
    } catch (err) {
      console.error('Error logging search history:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('id-ID');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-6">
            <span className="text-4xl text-white">🎓</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            Cek Status Penerima PIP
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            SMAN 1 REJOTANGAN - Program Indonesia Pintar Tahun 2025
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Masukkan NISN dan Tanggal Lahir Anda untuk mengecek status PIP
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NISN (Nomor Induk Siswa Nasional)
                </label>
                <input
                  type="text"
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value)}
                  placeholder="Contoh: 0101431938"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  value={tanggalLahir}
                  onChange={(e) => setTanggalLahir(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Mencari...</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">🔍</span>
                    <span>Cek Status PIP</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <span className="text-red-600 text-xl">⚠️</span>
              </div>
              <div>
                <h3 className="font-medium text-red-800 mb-1">Data Tidak Ditemukan</h3>
                <p className="text-red-600">{error}</p>
                <p className="text-sm text-red-500 mt-2">
                  Pastikan NISN dan Tanggal Lahir yang dimasukkan sesuai dengan data di sekolah.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header Result */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-100 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Status PIP Ditemukan</h2>
                  <p className="text-sm text-gray-600">Data valid untuk {result.nama_pd}</p>
                </div>
                <div className="p-2 bg-white rounded-full shadow-sm">
                  <span className="text-green-600 text-xl">✅</span>
                </div>
              </div>
            </div>

            {/* Main Result */}
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column - Personal Info */}
                <div className="space-y-6">
                  {/* Personal Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <span className="text-white text-lg">👤</span>
                      </div>
                      <h3 className="font-semibold text-gray-800">Data Pribadi</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600">Nama Lengkap</span>
                        <p className="font-bold text-lg text-gray-900">{result.nama_pd}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-600">NISN</span>
                          <p className="font-medium text-gray-900">{result.nisn}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Kelas</span>
                          <p className="font-medium text-gray-900">{result.kelas} {result.rombel}</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Sekolah</span>
                        <p className="font-medium text-gray-900">{result.nomenklatur}</p>
                      </div>
                    </div>
                  </div>

                  {/* PIP Status Card */}
                  <div className={`rounded-xl p-5 ${
                    result.status_cair === 'Sudah Cair' 
                      ? 'bg-gradient-to-br from-green-50 to-green-100' 
                      : 'bg-gradient-to-br from-yellow-50 to-yellow-100'
                  }`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${
                        result.status_cair === 'Sudah Cair' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}>
                        <span className="text-white text-lg">
                          {result.status_cair === 'Sudah Cair' ? '💰' : '⏳'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">Status PIP</h3>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          result.status_cair === 'Sudah Cair' 
                            ? 'bg-green-200 text-green-800' 
                            : 'bg-yellow-200 text-yellow-800'
                        }`}>
                          {result.status_cair}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600">Layak PIP</span>
                        <p className="font-medium text-gray-900">{result.layak_pip}</p>
                      </div>
                      {result.tanggal_cair && (
                        <div>
                          <span className="text-sm text-gray-600">Tanggal Cair</span>
                          <p className="font-medium text-gray-900">{formatDate(result.tanggal_cair)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - PIP Details */}
                <div className="space-y-6">
                  {/* Financial Card */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <span className="text-white text-lg">💵</span>
                      </div>
                      <h3 className="font-semibold text-gray-800">Data Keuangan</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="text-center">
                        <span className="text-sm text-gray-600">Total Dana PIP</span>
                        <p className="text-2xl font-bold text-purple-700 mt-1">
                          {formatCurrency(result.nominal)}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">No Rekening</span>
                        <p className="font-medium text-gray-900 font-mono">{result.no_rekening}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Nama Rekening</span>
                        <p className="font-medium text-gray-900">{result.nama_rekening}</p>
                      </div>
                    </div>
                  </div>

                  {/* SK Details Card */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-gray-600 rounded-lg">
                        <span className="text-white text-lg">📋</span>
                      </div>
                      <h3 className="font-semibold text-gray-800">Data SK</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600">Nomor SK</span>
                        <p className="font-medium text-gray-900 text-sm">{result.nomor_sk}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Tanggal SK</span>
                        <p className="font-medium text-gray-900">{formatDate(result.tanggal_sk)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Keterangan</span>
                        <p className="text-gray-700 text-sm">{result.tahap_keterangan}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Keterangan Tambahan */}
              {result.keterangan_pencairan && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-600">ℹ️</span>
                      <span className="font-medium text-blue-800">Informasi Penting</span>
                    </div>
                    <p className="text-blue-700 text-sm">{result.keterangan_pencairan}</p>
                  </div>
                </div>
              )}

              {/* Warning for Belum Cair */}
              {result.status_cair === 'Belum Cair' && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-yellow-600">⚠️</span>
                      <span className="font-medium text-yellow-800">Perhatian</span>
                    </div>
                    <p className="text-yellow-700 text-sm">
                      Dana PIP Anda belum dicairkan. Silakan hubungi pihak sekolah atau bank penyalur untuk informasi lebih lanjut.
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Data terakhir diperbarui: {formatDate(result.updated_at)}
                </div>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                >
                  <span>🖨️</span>
                  <span>Cetak</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Result Placeholder */}
        {searchMade && !result && !error && (
          <div className="text-center py-12">
            <div className="text-5xl text-gray-300 mb-4">🔍</div>
            <p className="text-gray-600 text-lg mb-2">Silakan masukkan NISN dan Tanggal Lahir Anda</p>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Gunakan form di atas untuk mengecek status PIP Anda. Pastikan data yang dimasukkan sesuai dengan data sekolah.
            </p>
          </div>
        )}

        {/* Information Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-blue-600">🎓</span>
              </div>
              <h4 className="font-semibold text-gray-800">Apa itu PIP?</h4>
            </div>
            <p className="text-sm text-gray-600">
              Program Indonesia Pintar (PIP) adalah bantuan berupa uang tunai untuk peserta didik dari keluarga kurang mampu.
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-green-600">💡</span>
              </div>
              <h4 className="font-semibold text-gray-800">Cara Mencairkan</h4>
            </div>
            <p className="text-sm text-gray-600">
              Bawa KIP/KKS dan buka rekening di bank penyalur. Proses pencairan sesuai jadwal yang ditetapkan.
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-purple-600">📞</span>
              </div>
              <h4 className="font-semibold text-gray-800">Bantuan</h4>
            </div>
            <p className="text-sm text-gray-600">
              Hubungi operator PIP sekolah atau Cabang Dinas Pendidikan setempat jika mengalami kendala.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-600 text-sm">
            © 2024 SMAN 1 REJOTANGAN - Sistem Informasi PIP
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Data diperbarui secara berkala. Pastikan informasi yang diberikan sesuai dengan data resmi sekolah.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CekPIP;
