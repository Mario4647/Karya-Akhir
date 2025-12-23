import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, downloadRaportPDF } from '../supabaseClient';

const DapodikDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [semester, setSemester] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    checkAccessAndFetchData();
  }, []);

  const checkAccessAndFetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      if (profile.roles !== 'user-raport' && profile.roles !== 'admin') {
        navigate('/');
        return;
      }

      setUserData(profile);
      setSemester(profile.semester || '');
    } catch (error) {
      console.error('Error fetching data:', error);
      setErrorMessage('Gagal memuat data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Hanya file gambar yang diperbolehkan');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Ukuran file maksimal 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        
        const { error } = await supabase
          .from('profiles')
          .update({ 
            profile_image: base64String,
            updated_at: new Date().toISOString()
          })
          .eq('id', userData.id);

        if (error) throw error;

        setProfileImage(base64String);
        setSuccessMessage('Foto profil berhasil diubah');
        setTimeout(() => setSuccessMessage(''), 3000);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      setErrorMessage('Gagal mengupload foto: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRequestAccess = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          akses_raport_status: 'pending',
          akses_raport_requested_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.id);

      if (error) throw error;

      setUserData(prev => ({
        ...prev,
        akses_raport_status: 'pending',
        akses_raport_requested_at: new Date().toISOString()
      }));
      
      setSuccessMessage('Permintaan akses berhasil dikirim ke admin');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error requesting access:', error);
      setErrorMessage('Gagal mengirim permintaan: ' + error.message);
    }
  };

  const handleRequestRanking = async () => {
    // Cek timer
    if (userData.ranking_timer_end) {
      const timerEnd = new Date(userData.ranking_timer_end);
      const now = new Date();
      
      if (timerEnd > now) {
        setErrorMessage('Raport belum di rilis oleh wali kelas atau guru yang bersangkutan, belum dapat melihat ranking');
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          permintaan_ranking_status: 'pending',
          permintaan_ranking_tanggal: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.id);

      if (error) throw error;

      setUserData(prev => ({
        ...prev,
        permintaan_ranking_status: 'pending',
        permintaan_ranking_tanggal: new Date().toISOString()
      }));
      
      setSuccessMessage('Permintaan naikan ranking berhasil dikirim ke admin');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error requesting ranking:', error);
      setErrorMessage('Gagal mengirim permintaan ranking: ' + error.message);
    }
  };

  const handleDownloadRaport = async () => {
    if (!userData.raport_file) {
      setErrorMessage('File raport belum tersedia');
      return;
    }

    setDownloadingPDF(true);
    try {
      const result = await downloadRaportPDF(userData.id);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      const a = document.createElement('a');
      a.href = result.url;
      a.download = result.filename || 'raport.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      window.URL.revokeObjectURL(result.url);
      
      setSuccessMessage('Download raport berhasil');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setErrorMessage('Gagal download raport: ' + error.message);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimerStatus = (timerEnd) => {
    if (!timerEnd) return null;
    
    const end = new Date(timerEnd);
    const now = new Date();
    const diffMs = end - now;
    
    if (diffMs <= 0) return null;
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days}h ${hours}j ${minutes}m`;
  };

  const getStatusBadge = (status, type = 'access') => {
    const statusMap = {
      access: {
        disetujui: { color: 'green', text: 'Disetujui', icon: '✅' },
        pending: { color: 'yellow', text: 'Menunggu', icon: '⏳' },
        belum_disetujui: { color: 'gray', text: 'Belum Disetujui', icon: '❌' }
      },
      ranking: {
        disetujui: { color: 'green', text: 'Ranking Disetujui', icon: '🏆' },
        pending: { color: 'yellow', text: 'Review Ranking', icon: '📊' },
        belum_disetujui: { color: 'gray', text: 'Belum Direview', icon: '📝' }
      }
    };

    const statusInfo = statusMap[type][status] || statusMap[type].belum_disetujui;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
        <span>{statusInfo.icon}</span>
        <span>{statusInfo.text}</span>
      </span>
    );
  };

  // Fungsi untuk mendapatkan data TKA (support kedua format)
  const getTKAData = () => {
    if (!userData) return null;
    
    // Jika menggunakan kolom JSONB
    if (userData.nilai_tka_data && typeof userData.nilai_tka_data === 'object') {
      return userData.nilai_tka_data;
    }
    
    // Jika menggunakan kolom terpisah
    if (userData.tka_matematika_wajib || userData.tka_bahasa_inggris || userData.tka_bahasa_indonesia) {
      return {
        tahun_ajaran: userData.tka_tahun_ajaran,
        semester: userData.tka_semester,
        jenis_tes: userData.tka_jenis_tes,
        matematika_wajib: userData.tka_matematika_wajib,
        bahasa_inggris: userData.tka_bahasa_inggris,
        bahasa_indonesia: userData.tka_bahasa_indonesia,
        mapel_pilihan_1: userData.tka_mapel_pilihan_1,
        nilai_pilihan_1: userData.tka_nilai_pilihan_1,
        mapel_pilihan_2: userData.tka_mapel_pilihan_2,
        nilai_pilihan_2: userData.tka_nilai_pilihan_2,
        total_nilai: userData.tka_total_nilai,
        diupdate_pada: userData.tka_diupdate_pada
      };
    }
    
    return null;
  };

  // Fungsi untuk menghitung total nilai TKA
  const calculateTKATotal = (tkaData) => {
    if (!tkaData) return 0;
    
    const nilaiWajib = (parseFloat(tkaData.matematika_wajib) || 0) + 
                      (parseFloat(tkaData.bahasa_inggris) || 0) + 
                      (parseFloat(tkaData.bahasa_indonesia) || 0);
    
    const nilaiPilihan = (parseFloat(tkaData.nilai_pilihan_1) || 0) + 
                        (parseFloat(tkaData.nilai_pilihan_2) || 0);
    
    return nilaiWajib + nilaiPilihan;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <i className="bx bx-loader-alt text-5xl text-indigo-600 animate-spin"></i>
          <span className="text-gray-700">Memuat dashboard...</span>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">Data tidak ditemukan</h2>
        </div>
      </div>
    );
  }

  const tkaData = getTKAData();
  const tkaTotal = tkaData ? calculateTKATotal(tkaData) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Dapodik Raport</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {successMessage}
          </div>
        )}
        
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {errorMessage}
          </div>
        )}

        {/* Keterangan Ditolak */}
        {userData.keterangan_ditolak && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-yellow-600">⚠️</span>
              <div>
                <h3 className="font-medium text-yellow-800 mb-1">Keterangan Penolakan</h3>
                <p className="text-yellow-700 text-sm">{userData.keterangan_ditolak}</p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-100">
                {profileImage || userData.profile_image ? (
                  <img 
                    src={profileImage || userData.profile_image} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-indigo-100 flex items-center justify-center">
                    <i className="bx bx-user text-5xl text-indigo-600"></i>
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors">
                <i className="bx bx-camera text-xl"></i>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfileImageUpload}
                  disabled={uploadingImage}
                />
              </label>
              {uploadingImage && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
                  <i className="bx bx-loader-alt text-white text-xl animate-spin"></i>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{userData.name}</h2>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <i className="bx bx-envelope text-gray-600"></i>
                  <span className="text-gray-700">{userData.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="bx bx-user-circle text-gray-600"></i>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    userData.roles === 'admin' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {userData.roles === 'admin' ? 'Administrator' : 'Siswa'}
                  </span>
                </div>
                {userData.class && (
                  <div className="flex items-center gap-2">
                    <i className="bx bx-book text-gray-600"></i>
                    <span className="text-gray-700">Kelas: {userData.class}</span>
                  </div>
                )}
              </div>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">Ranking</div>
                  <div className="text-xl font-bold text-purple-700">
                    {userData.ranking ? `#${userData.ranking}` : '-'}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">Nilai Rata-rata</div>
                  <div className="text-xl font-bold text-green-700">
                    {userData.nilai_rata_rata || '-'}
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">Semester</div>
                  <div className="text-xl font-bold text-blue-700">
                    {userData.semester || '-'}
                  </div>
                </div>
                {tkaData && (
                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600 mb-1">Total TKA</div>
                    <div className="text-xl font-bold text-red-700">
                      {tkaTotal.toFixed(2)}
                    </div>
                  </div>
                )}
                {userData.ranking_timer_end && getTimerStatus(userData.ranking_timer_end) && (
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600 mb-1">Timer Ranking</div>
                    <div className="text-xl font-bold text-yellow-700">
                      {getTimerStatus(userData.ranking_timer_end)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Data Dapodik Siswa Section */}
          <div className="border-t border-gray-200 mt-6 pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Dapodik Siswa</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Nama Lengkap</label>
                  <p className="mt-1 text-gray-900">{userData.name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Kelas</label>
                  <p className="mt-1 text-gray-900">{userData.class || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Asal Sekolah</label>
                  <p className="mt-1 text-gray-900">{userData.asal_sekolah || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">NISN</label>
                  <p className="mt-1 text-gray-900">{userData.nisn || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Tanggal Lahir</label>
                  <p className="mt-1 text-gray-900">{formatDate(userData.tanggal_lahir)}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Nomor Telepon</label>
                  <p className="mt-1 text-gray-900">{userData.nomor_telepon || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Nama Ayah</label>
                  <p className="mt-1 text-gray-900">{userData.nama_ayah || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Nama Ibu</label>
                  <p className="mt-1 text-gray-900">{userData.nama_ibu || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Alamat</label>
                  <p className="mt-1 text-gray-900">{userData.alamat || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Tanggal Diterima</label>
                  <p className="mt-1 text-gray-900">{formatDate(userData.tanggal_diterima)}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2"
              >
                <i className="bx bx-show"></i>
                Lihat Detail Lengkap
              </button>
            </div>
          </div>
        </div>

        {/* Raport Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Raport Siswa</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Semester</th>
                  <th className="px-6 py-3">Ranking</th>
                  <th className="px-6 py-3">Nilai Rata-rata</th>
                  <th className="px-6 py-3">Timer Ranking</th>
                  <th className="px-6 py-3">Status Akses</th>
                  <th className="px-6 py-3">Status Ranking</th>
                  <th className="px-6 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {userData.semester || 'Belum ditentukan'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-purple-600">
                      {userData.ranking ? `#${userData.ranking}` : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-green-600">
                      {userData.nilai_rata_rata || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {userData.ranking_timer_end ? (
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${
                          new Date(userData.ranking_timer_end) > new Date() 
                            ? 'text-yellow-600' 
                            : 'text-green-600'
                        }`}>
                          {getTimerStatus(userData.ranking_timer_end) || 'Timer selesai'}
                        </span>
                        <span className="text-xs text-gray-500">
                          Selesai: {formatDateTime(userData.ranking_timer_end)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">Belum diatur</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(userData.akses_raport_status, 'access')}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(userData.permintaan_ranking_status || 'belum_disetujui', 'ranking')}
                  </td>
                  <td className="px-6 py-4 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {/* Tombol Akses Raport */}
                      {userData.akses_raport_status === 'belum_disetujui' || userData.akses_raport_status === 'belum_akses' ? (
                        <button
                          onClick={handleRequestAccess}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center gap-1"
                        >
                          <span>🔓</span>
                          Minta Akses
                        </button>
                      ) : userData.akses_raport_status === 'pending' ? (
                        <button
                          disabled
                          className="px-4 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed text-sm flex items-center gap-1"
                        >
                          <span>⏳</span>
                          Menunggu
                        </button>
                      ) : (
                        <button
                          onClick={handleDownloadRaport}
                          disabled={downloadingPDF || !userData.raport_file}
                          className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm ${
                            downloadingPDF || !userData.raport_file
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700'
                          } text-white`}
                        >
                          {downloadingPDF ? (
                            <>
                              <i className="bx bx-loader-alt animate-spin"></i>
                              Memproses...
                            </>
                          ) : (
                            <>
                              <i className="bx bx-download"></i>
                              Download Raport
                            </>
                          )}
                        </button>
                      )}

                      {/* Tombol Permintaan Naikan Ranking */}
                      {userData.permintaan_ranking_status === 'belum_disetujui' || 
                       !userData.permintaan_ranking_status ? (
                        <button
                          onClick={handleRequestRanking}
                          disabled={userData.ranking_timer_end && new Date(userData.ranking_timer_end) > new Date()}
                          className={`px-4 py-2 rounded-md text-sm flex items-center gap-1 ${
                            userData.ranking_timer_end && new Date(userData.ranking_timer_end) > new Date()
                              ? 'bg-gray-400 cursor-not-allowed text-white'
                              : 'bg-purple-600 hover:bg-purple-700 text-white'
                          }`}
                        >
                          <span>📈</span>
                          {userData.ranking_timer_end && new Date(userData.ranking_timer_end) > new Date()
                            ? 'Timer Aktif'
                            : 'Minta Naikan Ranking'}
                        </button>
                      ) : userData.permintaan_ranking_status === 'pending' ? (
                        <button
                          disabled
                          className="px-4 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed text-sm flex items-center gap-1"
                        >
                          <span>⏳</span>
                          Review Ranking
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-4 py-2 bg-green-400 text-white rounded-md cursor-not-allowed text-sm flex items-center gap-1"
                        >
                          <span>✅</span>
                          Ranking Disetujui
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* INFO SECTION */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-blue-600 text-xl">💡</span>
                <h4 className="font-medium text-blue-800">Informasi Akses Raport</h4>
              </div>
              <p className="text-sm text-blue-700">
                Status akses menunjukkan apakah Anda dapat mendownload raport. 
                Jika belum disetujui, klik "Minta Akses" untuk mengirim permintaan ke admin.
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-purple-600 text-xl">🏆</span>
                <h4 className="font-medium text-purple-800">Informasi Ranking</h4>
              </div>
              <p className="text-sm text-purple-700">
                Ranking dan nilai rata-rata dapat di-review oleh admin. 
                Jika ingin meminta perubahan ranking, klik "Minta Naikan Ranking".
                Timer ranking mencegah pengiriman permintaan sebelum waktu yang ditentukan.
              </p>
            </div>
          </div>
        </div>

        {/* Data Nilai TKA Section */}
        {tkaData && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-red-600">📊</span>
              Data Nilai TKA (Try Out / Ujian Nasional)
            </h3>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <span className="text-sm text-gray-600">Tahun Ajaran:</span>
                  <span className="ml-2 font-medium">{tkaData.tahun_ajaran || '-'}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Semester:</span>
                  <span className="ml-2 font-medium">{tkaData.semester || '-'}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Jenis Tes:</span>
                  <span className="ml-2 font-medium">{tkaData.jenis_tes || '-'}</span>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Mapel Wajib</th>
                    <th className="px-6 py-3">Nilai</th>
                    <th className="px-6 py-3">Mapel Pilihan 1</th>
                    <th className="px-6 py-3">Nilai</th>
                    <th className="px-6 py-3">Mapel Pilihan 2</th>
                    <th className="px-6 py-3">Nilai</th>
                    <th className="px-6 py-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white border-b hover:bg-gray-50">
                    {/* Matematika Wajib */}
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">Matematika Wajib</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-gray-900">
                        {tkaData.matematika_wajib || '0'}
                      </span>
                    </td>
                    
                    {/* Mapel Pilihan 1 */}
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {tkaData.mapel_pilihan_1 || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-gray-900">
                        {tkaData.nilai_pilihan_1 || '-'}
                      </span>
                    </td>
                    
                    {/* Mapel Pilihan 2 */}
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {tkaData.mapel_pilihan_2 || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-gray-900">
                        {tkaData.nilai_pilihan_2 || '-'}
                      </span>
                    </td>
                    
                    {/* Total */}
                    <td className="px-6 py-4">
                      <span className="text-xl font-bold text-red-600">
                        {tkaTotal.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                  
                  {/* Baris kedua untuk Bahasa Inggris dan Indonesia */}
                  <tr className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">Bahasa Inggris</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-gray-900">
                        {tkaData.bahasa_inggris || '0'}
                      </span>
                    </td>
                    
                    <td colSpan="2" className="px-6 py-4">
                      {/* Kosong untuk alignment */}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">Bahasa Indonesia</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-gray-900">
                        {tkaData.bahasa_indonesia || '0'}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4">
                      {/* Kosong untuk alignment */}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Ringkasan Nilai */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                <div className="text-sm text-red-600 mb-1">Nilai Wajib</div>
                <div className="text-lg font-bold text-red-700">
                  {(
                    (parseFloat(tkaData.matematika_wajib) || 0) + 
                    (parseFloat(tkaData.bahasa_inggris) || 0) + 
                    (parseFloat(tkaData.bahasa_indonesia) || 0)
                  ).toFixed(2)}
                </div>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                <div className="text-sm text-orange-600 mb-1">Nilai Pilihan</div>
                <div className="text-lg font-bold text-orange-700">
                  {(
                    (parseFloat(tkaData.nilai_pilihan_1) || 0) + 
                    (parseFloat(tkaData.nilai_pilihan_2) || 0)
                  ).toFixed(2)}
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <div className="text-sm text-purple-600 mb-1">Total Nilai</div>
                <div className="text-lg font-bold text-purple-700">
                  {tkaTotal.toFixed(2)}
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Rata-rata</div>
                <div className="text-lg font-bold text-gray-700">
                  {(tkaTotal / 5).toFixed(2)}
                </div>
              </div>
            </div>

            {/* INFO SECTION untuk TKA */}
            <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-100">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-red-600 text-xl">💡</span>
                <h4 className="font-medium text-red-800">Informasi Nilai TKA</h4>
              </div>
              <p className="text-sm text-red-700">
                Data Nilai TKA (Tes Kemampuan Akademik) digunakan untuk evaluasi kemampuan siswa dalam mata pelajaran 
                yang diujikan dalam TKA. Data ini hanya bisa diinput dan diedit oleh admin.
                {tkaData.diupdate_pada && (
                  <span className="block mt-1 text-xs">
                    Terakhir diupdate: {formatDateTime(tkaData.diupdate_pada)}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Jika tidak ada data TKA */}
        {!tkaData && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <span className="text-4xl text-gray-300">📊</span>
              <h3 className="text-lg font-semibold text-gray-800">Belum Ada Data Nilai TKA</h3>
              <p className="text-gray-600 max-w-md">
                Data Nilai TKA akan ditampilkan di sini setelah diinput oleh admin.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Detail Data Siswa</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Nama Lengkap</label>
                    <p className="mt-1 text-gray-900">{userData.name || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Email</label>
                    <p className="mt-1 text-gray-900">{userData.email || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Kelas</label>
                    <p className="mt-1 text-gray-900">{userData.class || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Asal Sekolah</label>
                    <p className="mt-1 text-gray-900">{userData.asal_sekolah || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">NISN</label>
                    <p className="mt-1 text-gray-900">{userData.nisn || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Ranking</label>
                    <p className="mt-1 text-gray-900">{userData.ranking ? `#${userData.ranking}` : '-'}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Tanggal Lahir</label>
                    <p className="mt-1 text-gray-900">{formatDate(userData.tanggal_lahir)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Nomor Telepon</label>
                    <p className="mt-1 text-gray-900">{userData.nomor_telepon || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Nama Ayah</label>
                    <p className="mt-1 text-gray-900">{userData.nama_ayah || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Nama Ibu</label>
                    <p className="mt-1 text-gray-900">{userData.nama_ibu || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Tanggal Diterima</label>
                    <p className="mt-1 text-gray-900">{formatDate(userData.tanggal_diterima)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Nilai Rata-rata</label>
                    <p className="mt-1 text-gray-900">{userData.nilai_rata_rata || '-'}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">Alamat Lengkap</label>
                <p className="mt-1 text-gray-900 whitespace-pre-line">{userData.alamat || '-'}</p>
              </div>
              
              {/* Data TKA di Detail Modal */}
              {tkaData && (
                <div className="border-t pt-6 mt-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Data Nilai TKA</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Jenis Tes</label>
                      <p className="mt-1 text-gray-900">{tkaData.jenis_tes || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Tahun Ajaran</label>
                      <p className="mt-1 text-gray-900">{tkaData.tahun_ajaran || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Matematika Wajib</label>
                      <p className="mt-1 text-gray-900">{tkaData.matematika_wajib || '0'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Bahasa Inggris</label>
                      <p className="mt-1 text-gray-900">{tkaData.bahasa_inggris || '0'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Bahasa Indonesia</label>
                      <p className="mt-1 text-gray-900">{tkaData.bahasa_indonesia || '0'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Total Nilai</label>
                      <p className="mt-1 text-lg font-bold text-red-600">{tkaTotal.toFixed(2)}</p>
                    </div>
                    {tkaData.mapel_pilihan_1 && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-600">Mapel Pilihan 1</label>
                        <p className="mt-1 text-gray-900">{tkaData.mapel_pilihan_1}: {tkaData.nilai_pilihan_1 || '0'}</p>
                      </div>
                    )}
                    {tkaData.mapel_pilihan_2 && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-600">Mapel Pilihan 2</label>
                        <p className="mt-1 text-gray-900">{tkaData.mapel_pilihan_2}: {tkaData.nilai_pilihan_2 || '0'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Status Akses Raport</label>
                  <div className="mt-1">
                    {getStatusBadge(userData.akses_raport_status, 'access')}
                  </div>
                  {userData.akses_raport_approved_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Disetujui: {formatDateTime(userData.akses_raport_approved_at)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Status Permintaan Ranking</label>
                  <div className="mt-1">
                    {getStatusBadge(userData.permintaan_ranking_status || 'belum_disetujui', 'ranking')}
                  </div>
                  {userData.permintaan_ranking_tanggal && (
                    <p className="text-xs text-gray-500 mt-1">
                      Diminta: {formatDateTime(userData.permintaan_ranking_tanggal)}
                    </p>
                  )}
                  {userData.ranking_timer_end && getTimerStatus(userData.ranking_timer_end) && (
                    <p className="text-xs text-yellow-600 mt-1">
                      Timer: {getTimerStatus(userData.ranking_timer_end)} tersisa
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DapodikDashboard;
