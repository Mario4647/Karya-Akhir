import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AdminNavbar from '../components/AdminNavbar';

const AdminDapodik = () => {
  const [students, setStudents] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [rankingRequests, setRankingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editData, setEditData] = useState({});
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadSemester, setUploadSemester] = useState('');
  const [uploading, setUploading] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectType, setRejectType] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
    fetchData();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: userData, error } = await supabase
        .from('profiles')
        .select('roles')
        .eq('id', session.user.id)
        .single();

      if (error || !userData || userData.roles !== 'admin') {
        navigate('/');
        return;
      }

      setUserRole(userData.roles);
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/auth');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: studentData, error: studentError } = await supabase
        .from('profiles')
        .select('*')
        .eq('roles', 'user-raport')
        .order('created_at', { ascending: false });

      if (studentError) throw studentError;

      const { data: pendingData, error: pendingError } = await supabase
        .from('profiles')
        .select('id, email, name, class, akses_raport_status, akses_raport_requested_at')
        .eq('roles', 'user-raport')
        .eq('akses_raport_status', 'pending')
        .order('akses_raport_requested_at', { ascending: true });

      if (pendingError) throw pendingError;

      const { data: rankingData, error: rankingError } = await supabase
        .from('profiles')
        .select('id, email, name, class, ranking, nilai_rata_rata, semester, permintaan_ranking_status, permintaan_ranking_tanggal')
        .eq('roles', 'user-raport')
        .eq('permintaan_ranking_status', 'pending')
        .order('permintaan_ranking_tanggal', { ascending: true });

      if (rankingError) throw rankingError;

      setStudents(studentData || []);
      setPendingRequests(pendingData || []);
      setRankingRequests(rankingData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setErrorMessage('Gagal memuat data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setEditData({
      name: student.name || '',
      class: student.class || '',
      asal_sekolah: student.asal_sekolah || '',
      nisn: student.nisn || '',
      tanggal_lahir: student.tanggal_lahir || '',
      nomor_telepon: student.nomor_telepon || '',
      nama_ayah: student.nama_ayah || '',
      nama_ibu: student.nama_ibu || '',
      alamat: student.alamat || '',
      tanggal_diterima: student.tanggal_diterima || '',
      semester: student.semester || '',
      ranking: student.ranking || '',
      nilai_rata_rata: student.nilai_rata_rata || ''
    });
    setShowEditModal(true);
  };

  const openUploadModal = (student) => {
    setSelectedStudent(student);
    setUploadSemester(student.semester || '');
    setUploadFile(null);
    setShowUploadModal(true);
  };

  const openDeleteModal = (student) => {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  };

  const openRejectModal = (student, type) => {
    setSelectedStudent(student);
    setRejectType(type);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleEditSubmit = async () => {
    try {
      // Validasi data numerik
      if (editData.ranking && editData.ranking.trim() !== '') {
        const rankingNum = parseInt(editData.ranking);
        if (isNaN(rankingNum)) {
          setErrorMessage('Ranking harus berupa angka (contoh: 1, 2, 3)');
          return;
        }
      }

      if (editData.nilai_rata_rata && editData.nilai_rata_rata.trim() !== '') {
        const nilaiNum = parseFloat(editData.nilai_rata_rata);
        if (isNaN(nilaiNum)) {
          setErrorMessage('Nilai rata-rata harus berupa angka (contoh: 85.5, 90.0)');
          return;
        }
      }

      // Prepare data untuk update
      const updateData = {
        name: editData.name || null,
        class: editData.class || null,
        asal_sekolah: editData.asal_sekolah || null,
        nisn: editData.nisn || null,
        tanggal_lahir: editData.tanggal_lahir || null,
        nomor_telepon: editData.nomor_telepon || null,
        nama_ayah: editData.nama_ayah || null,
        nama_ibu: editData.nama_ibu || null,
        alamat: editData.alamat || null,
        tanggal_diterima: editData.tanggal_diterima || null,
        semester: editData.semester || null,
        updated_at: new Date().toISOString()
      };

      // Handle numeric fields
      if (editData.ranking && editData.ranking.trim() !== '') {
        updateData.ranking = parseInt(editData.ranking);
      } else {
        updateData.ranking = null;
      }

      if (editData.nilai_rata_rata && editData.nilai_rata_rata.trim() !== '') {
        updateData.nilai_rata_rata = parseFloat(editData.nilai_rata_rata);
      } else {
        updateData.nilai_rata_rata = null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', selectedStudent.id);

      if (error) throw error;

      setShowEditModal(false);
      setSuccessMessage('Data siswa berhasil diperbarui');
      fetchData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating student:', error);
      setErrorMessage('Gagal memperbarui data: ' + error.message);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile || !uploadSemester) {
      setErrorMessage('File dan semester harus diisi');
      return;
    }

    if (!uploadFile.type.includes('pdf')) {
      setErrorMessage('Hanya file PDF yang diperbolehkan');
      return;
    }

    if (uploadFile.size > 10 * 1024 * 1024) {
      setErrorMessage('Ukuran file maksimal 10MB');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target.result.split(',')[1];
          
          const { error } = await supabase
            .from('profiles')
            .update({
              raport_file: base64Data,
              raport_filename: uploadFile.name,
              raport_mimetype: uploadFile.type,
              semester: uploadSemester,
              updated_at: new Date().toISOString()
            })
            .eq('id', selectedStudent.id);

          if (error) throw error;

          setShowUploadModal(false);
          setSuccessMessage('Raport berhasil diupload');
          fetchData();
          setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
          console.error('Error uploading PDF:', error);
          setErrorMessage('Gagal upload raport: ' + error.message);
        } finally {
          setUploading(false);
        }
      };
      
      reader.readAsDataURL(uploadFile);
    } catch (error) {
      console.error('Error in upload:', error);
      setErrorMessage('Gagal upload raport: ' + error.message);
      setUploading(false);
    }
  };

  const handleDeleteStudent = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          asal_sekolah: null,
          nisn: null,
          tanggal_lahir: null,
          nomor_telepon: null,
          nama_ayah: null,
          nama_ibu: null,
          alamat: null,
          tanggal_diterima: null,
          semester: null,
          ranking: null,
          nilai_rata_rata: null,
          raport_file: null,
          raport_filename: null,
          raport_mimetype: null,
          akses_raport_status: 'belum_disetujui',
          akses_raport_requested_at: null,
          permintaan_ranking_status: 'belum_disetujui',
          permintaan_ranking_tanggal: null,
          keterangan_ditolak: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedStudent.id);

      if (error) throw error;

      setShowDeleteModal(false);
      setSuccessMessage('Data siswa berhasil direset');
      fetchData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting student:', error);
      setErrorMessage('Gagal menghapus data: ' + error.message);
    }
  };

  const handleAccessAction = async (studentId, action, reason = '') => {
    try {
      let updateData = {};
      
      if (action === 'approve') {
        updateData = {
          akses_raport_status: 'disetujui',
          keterangan_ditolak: null,
          updated_at: new Date().toISOString()
        };
      } else if (action === 'reject') {
        updateData = {
          akses_raport_status: 'belum_disetujui',
          keterangan_ditolak: reason,
          updated_at: new Date().toISOString()
        };
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', studentId);

      if (error) throw error;

      setSuccessMessage(action === 'approve' ? 'Akses berhasil disetujui' : 'Permintaan ditolak');
      fetchData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating access:', error);
      setErrorMessage('Gagal memperbarui akses: ' + error.message);
    }
  };

  const handleRankingAction = async (studentId, action, reason = '') => {
    try {
      let updateData = {};
      
      if (action === 'approve') {
        updateData = {
          permintaan_ranking_status: 'disetujui',
          keterangan_ditolak: null,
          updated_at: new Date().toISOString()
        };
      } else if (action === 'reject') {
        updateData = {
          permintaan_ranking_status: 'belum_disetujui',
          keterangan_ditolak: reason,
          updated_at: new Date().toISOString()
        };
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', studentId);

      if (error) throw error;

      setSuccessMessage(action === 'approve' ? 'Permintaan ranking disetujui' : 'Permintaan ranking ditolak');
      fetchData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating ranking:', error);
      setErrorMessage('Gagal memperbarui ranking: ' + error.message);
    }
  };

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) {
      setErrorMessage('Alasan penolakan harus diisi');
      return;
    }

    if (rejectType === 'access') {
      handleAccessAction(selectedStudent.id, 'reject', rejectReason);
    } else if (rejectType === 'ranking') {
      handleRankingAction(selectedStudent.id, 'reject', rejectReason);
    }

    setShowRejectModal(false);
    setRejectReason('');
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
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
        <span className="mr-1">{statusInfo.icon}</span>
        {statusInfo.text}
      </span>
    );
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.nisn?.includes(searchTerm) ||
                         student.asal_sekolah?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || student.akses_raport_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-blue-700 font-medium">Memuat data...</span>
        </div>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <div className="w-16 h-16 text-red-500 mx-auto mb-4 text-4xl">🚫</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Akses Ditolak</h2>
          <p className="text-gray-700">Halaman ini hanya untuk administrator</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <AdminNavbar />
      
      <div className="pt-16">
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

          {/* Pending Access Requests */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-yellow-600">⏱️</span>
                Persetujuan Akses Download Raport
              </h2>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                {pendingRequests.length} Permintaan
              </span>
            </div>
            
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl text-gray-300 mb-3 block">✅</span>
                <p className="text-gray-600">Tidak ada permintaan akses yang menunggu</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full min-w-max">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nama Siswa</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Kelas</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tanggal Permintaan</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{request.name || '-'}</p>
                            <p className="text-sm text-gray-600">{request.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {request.class || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {formatDate(request.akses_raport_requested_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleAccessAction(request.id, 'approve')}
                              className="inline-flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              ✅ Setujui
                            </button>
                            <button
                              onClick={() => openRejectModal(request, 'access')}
                              className="inline-flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                              ❌ Tolak
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Ranking Requests */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-purple-600">📊</span>
                Permintaan Naikan Ranking
              </h2>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                {rankingRequests.length} Permintaan
              </span>
            </div>
            
            {rankingRequests.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl text-gray-300 mb-3 block">📊</span>
                <p className="text-gray-600">Tidak ada permintaan naikan ranking</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full min-w-max">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nama Siswa</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Semester</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ranking Saat Ini</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nilai Rata-rata</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {rankingRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{request.name || '-'}</p>
                            <p className="text-sm text-gray-600">{request.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {request.semester || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-lg font-bold text-purple-600">
                            {request.ranking ? `#${request.ranking}` : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-lg font-bold text-green-600">
                            {request.nilai_rata_rata || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleRankingAction(request.id, 'approve')}
                              className="inline-flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              ✅ Setujui
                            </button>
                            <button
                              onClick={() => openRejectModal(request, 'ranking')}
                              className="inline-flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                              ❌ Tolak
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* All Students */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-indigo-600">👨‍🎓</span>
                Data Dapodik Siswa
              </h2>
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    placeholder="Cari siswa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="all">Semua Status</option>
                    <option value="disetujui">Disetujui</option>
                    <option value="pending">Menunggu</option>
                    <option value="belum_disetujui">Belum Disetujui</option>
                  </select>
                </div>
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl text-gray-300 mb-3 block">👨‍🎓</span>
                <p className="text-gray-600">Tidak ada data siswa yang ditemukan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">NISN</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nama Siswa</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Asal Sekolah</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ranking</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nilai Rata-rata</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status Akses</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-gray-800">{student.nisn || '-'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{student.name || '-'}</p>
                            <p className="text-sm text-gray-600">Kelas: {student.class || '-'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-800">{student.asal_sekolah || '-'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-lg font-bold text-purple-600">
                            {student.ranking ? `#${student.ranking}` : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-lg font-bold text-green-600">
                            {student.nilai_rata_rata || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(student.akses_raport_status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => openEditModal(student)}
                              className="inline-flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                            >
                              ✏️ Edit
                            </button>
                            
                            <button
                              onClick={() => openUploadModal(student)}
                              className="inline-flex items-center gap-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                            >
                              📤 Upload Raport
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Edit Data Siswa</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(editData).map((key) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                      {key.replace(/_/g, ' ')}
                    </label>
                    {key === 'alamat' ? (
                      <textarea
                        value={editData[key]}
                        onChange={(e) => setEditData({...editData, [key]: e.target.value})}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    ) : key === 'tanggal_lahir' || key === 'tanggal_diterima' ? (
                      <input
                        type="date"
                        value={editData[key]}
                        onChange={(e) => setEditData({...editData, [key]: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    ) : key === 'ranking' ? (
                      <input
                        type="number"
                        min="1"
                        max="999"
                        step="1"
                        value={editData[key]}
                        onChange={(e) => setEditData({...editData, [key]: e.target.value})}
                        placeholder="Contoh: 1, 2, 3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    ) : key === 'nilai_rata_rata' ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={editData[key]}
                        onChange={(e) => setEditData({...editData, [key]: e.target.value})}
                        placeholder="Contoh: 85.5, 90.0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    ) : (
                      <input
                        type="text"
                        value={editData[key]}
                        onChange={(e) => setEditData({...editData, [key]: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleEditSubmit}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                💾 Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Upload Raport</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Siswa</label>
                  <p className="text-lg font-medium text-gray-900">{selectedStudent?.name || '-'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
                  <input
                    type="text"
                    value={uploadSemester}
                    onChange={(e) => setUploadSemester(e.target.value)}
                    placeholder="Contoh: Semester 1 2024/2025"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="inline-flex items-center gap-1">
                      📄 File Raport (PDF)
                    </span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-4xl text-gray-400 mb-2 block">📤</span>
                      <p className="text-sm text-gray-600">
                        {uploadFile ? uploadFile.name : 'Klik untuk memilih file'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Maksimal 10MB, format PDF</p>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleUploadSubmit}
                disabled={uploading || !uploadFile || !uploadSemester}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  uploading || !uploadFile || !uploadSemester
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Mengupload...
                  </>
                ) : (
                  <>
                    📤 Upload Raport
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-xl font-bold text-gray-800">Konfirmasi Reset Data</h3>
            </div>
            
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <span className="text-red-600 text-2xl">🗑️</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-2">Reset data siswa: {selectedStudent?.name}</p>
                  <p className="text-gray-600 text-sm">
                    Data yang akan direset kecuali: Nama, Email, dan Kelas.
                    Apakah Anda yakin?
                  </p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteStudent}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                🗑️ Reset Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-xl font-bold text-gray-800">
                {rejectType === 'access' ? 'Tolak Permintaan Akses' : 'Tolak Permintaan Ranking'}
              </h3>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  Siswa: <span className="font-semibold">{selectedStudent?.name}</span>
                </p>
                <p className="text-sm text-gray-600">
                  {rejectType === 'access' 
                    ? 'Berikan alasan penolakan akses download raport:' 
                    : 'Berikan alasan penolakan naikan ranking:'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alasan Penolakan
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows="4"
                  placeholder="Masukkan alasan penolakan..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={!rejectReason.trim()}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  !rejectReason.trim()
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                ❌ Kirim Penolakan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDapodik;
