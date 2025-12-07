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

  const getStatusBadge = (status, type = 'access') => {
    const isAccess = type === 'access';
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
      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-${statusInfo.color}-50 border border-${statusInfo.color}-200 text-${statusInfo.color}-700`}>
        <span className="text-base">{statusInfo.icon}</span>
        <span>{statusInfo.text}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-blue-700 font-medium">Memuat dashboard...</span>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">Data tidak ditemukan</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Dashboard Dapodik Raport</h1>
              <p className="text-gray-600 text-sm mt-1">Halo, {userData.name}!</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ← Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Alerts */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-800">
              <span className="text-lg">✅</span>
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">
              ✕
            </button>
          </div>
        )}
        
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 text-red-800">
              <span className="text-lg">❌</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Keterangan Ditolak */}
        {userData.keterangan_ditolak && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-yellow-600 text-xl mt-1">⚠️</span>
              <div>
                <h3 className="font-medium text-yellow-800 mb-1">Keterangan Penolakan</h3>
                <p className="text-yellow-700">{userData.keterangan_ditolak}</p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-100 shadow-lg">
                {profileImage || userData.profile_image ? (
                  <img 
                    src={profileImage || userData.profile_image} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                    <span className="text-4xl text-indigo-600">👤</span>
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 shadow-lg transition-transform hover:scale-105">
                <span className="text-lg">📷</span>
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
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{userData.name}</h2>
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                  <span className="text-blue-600">📧</span>
                  <span className="text-gray-700">{userData.email}</span>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                  userData.roles === 'admin' 
                    ? 'bg-red-50 text-red-700' 
                    : 'bg-indigo-50 text-indigo-700'
                }`}>
                  <span className={userData.roles === 'admin' ? 'text-red-600' : 'text-indigo-600'}>
                    {userData.roles === 'admin' ? '👑' : '👨‍🎓'}
                  </span>
                  <span>{userData.roles === 'admin' ? 'Administrator' : 'Siswa'}</span>
                </div>
                {userData.class && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
                    <span className="text-green-600">🏫</span>
                    <span className="text-gray-700">Kelas {userData.class}</span>
                  </div>
                )}
              </div>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4">
                <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                  <div className="text-sm text-gray-600 mb-1">Ranking</div>
                  <div className="text-2xl font-bold text-purple-700">
                    {userData.ranking ? `#${userData.ranking}` : 'Belum Ada'}
                  </div>
                </div>
                <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <div className="text-sm text-gray-600 mb-1">Nilai Rata-rata</div>
                  <div className="text-2xl font-bold text-green-700">
                    {userData.nilai_rata_rata || 'Belum Ada'}
                  </div>
                </div>
                <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                  <div className="text-sm text-gray-600 mb-1">Semester</div>
                  <div className="text-2xl font-bold text-blue-700">
                    {userData.semester || 'Belum Ada'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detail Button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowDetailModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              <span>👁️</span>
              Lihat Detail Lengkap
            </button>
          </div>
        </div>

        {/* Raport Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-blue-600">📋</span>
              Data Raport Siswa - {userData.semester || 'Semester Belum Ditentukan'}
            </h3>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Semester</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ranking</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nilai Rata-rata</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status Akses</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status Ranking</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📅</span>
                      <span className="font-medium text-gray-900">
                        {userData.semester || 'Belum ditentukan'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xl font-bold text-purple-600">
                      {userData.ranking ? `#${userData.ranking}` : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xl font-bold text-green-600">
                      {userData.nilai_rata_rata || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(userData.akses_raport_status, 'access')}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(userData.permintaan_ranking_status || 'belum_disetujui', 'ranking')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {/* Access Request/Download Button */}
                      {userData.akses_raport_status === 'belum_disetujui' ? (
                        <button
                          onClick={handleRequestAccess}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          <span>🔓</span>
                          Minta Akses
                        </button>
                      ) : userData.akses_raport_status === 'pending' ? (
                        <button
                          disabled
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                        >
                          <span>⏳</span>
                          Menunggu
                        </button>
                      ) : (
                        <button
                          onClick={handleDownloadRaport}
                          disabled={downloadingPDF || !userData.raport_file}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm ${
                            downloadingPDF || !userData.raport_file
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-green-600 hover:bg-green-700'
                          } text-white`}
                        >
                          {downloadingPDF ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Memproses...
                            </>
                          ) : (
                            <>
                              <span>📥</span>
                              Download Raport
                            </>
                          )}
                        </button>
                      )}

                      {/* Ranking Request Button */}
                      {userData.permintaan_ranking_status === 'belum_disetujui' || 
                       !userData.permintaan_ranking_status ? (
                        <button
                          onClick={handleRequestRanking}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                        >
                          <span>📈</span>
                          Minta Naikan Ranking
                        </button>
                      ) : userData.permintaan_ranking_status === 'pending' ? (
                        <button
                          disabled
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                        >
                          <span>⏳</span>
                          Review Ranking
                        </button>
                      ) : (
                        <button
                          disabled
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-400 text-white rounded-lg cursor-not-allowed"
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

          {/* Info Section */}
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
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal - Tetap sama seperti sebelumnya */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Detail Data Siswa</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              {/* Isi detail modal tetap sama */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DapodikDashboard;
