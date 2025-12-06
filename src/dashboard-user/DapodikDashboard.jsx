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

      // Fetch user profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      // Check if user has access
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

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setErrorMessage('Ukuran file maksimal 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      // Convert image to base64 for storage
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

      // Create download link
      const a = document.createElement('a');
      a.href = result.url;
      a.download = result.filename || 'raport.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up URL
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard Dapodik Raport</h1>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Kembali ke Dashboard
            </button>
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

        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
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
              <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700">
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
              <h2 className="text-2xl font-bold text-gray-800">{userData.name}</h2>
              <div className="mt-2 space-y-2">
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
            </div>
          </div>

          <div className="border-t border-gray-200 my-6 pt-6">
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
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Lihat Detail Lengkap
              </button>
            </div>
          </div>
        </div>

        {/* Raport Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Raport Siswa</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Semester</th>
                  <th className="px-6 py-3">Status Akses</th>
                  <th className="px-6 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {userData.semester || 'Belum ditentukan'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      userData.akses_raport_status === 'disetujui' 
                        ? 'bg-green-100 text-green-800'
                        : userData.akses_raport_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {userData.akses_raport_status === 'disetujui' 
                        ? 'Disetujui' 
                        : userData.akses_raport_status === 'pending'
                        ? 'Menunggu Persetujuan'
                        : 'Belum Memiliki Akses'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {userData.akses_raport_status === 'belum_akses' ? (
                      <button
                        onClick={handleRequestAccess}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Minta Akses Download
                      </button>
                    ) : userData.akses_raport_status === 'pending' ? (
                      <button
                        disabled
                        className="px-4 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed"
                      >
                        Menunggu Persetujuan
                      </button>
                    ) : (
                      <button
                        onClick={handleDownloadRaport}
                        disabled={downloadingPDF || !userData.raport_file}
                        className={`px-4 py-2 rounded-md flex items-center gap-2 ${
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
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
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
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">Alamat Lengkap</label>
                <p className="mt-1 text-gray-900 whitespace-pre-line">{userData.alamat || '-'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">Status Akses Raport</label>
                <p className="mt-1 text-gray-900">
                  {userData.akses_raport_status === 'disetujui' 
                    ? '✅ Disetujui' 
                    : userData.akses_raport_status === 'pending'
                    ? '⏳ Menunggu Persetujuan Admin'
                    : '❌ Belum Memiliki Akses'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DapodikDashboard;
