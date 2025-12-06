import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseAdmin, uploadRaportPDF } from '../supabaseClient';

const AdminDapodik = () => {
  const [students, setStudents] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editData, setEditData] = useState({});
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadSemester, setUploadSemester] = useState('');
  const [uploading, setUploading] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
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
      
      // Fetch all user-raport students
      const { data: studentData, error: studentError } = await supabase
        .from('profiles')
        .select('*')
        .eq('roles', 'user-raport')
        .order('created_at', { ascending: false });

      if (studentError) throw studentError;

      // Fetch pending access requests
      const { data: pendingData, error: pendingError } = await supabase
        .from('profiles')
        .select('id, email, name, class, akses_raport_status, akses_raport_requested_at')
        .eq('roles', 'user-raport')
        .eq('akses_raport_status', 'pending')
        .order('akses_raport_requested_at', { ascending: true });

      if (pendingError) throw pendingError;

      setStudents(studentData || []);
      setPendingRequests(pendingData || []);
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
      semester: student.semester || ''
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

  const handleEditSubmit = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...editData,
          updated_at: new Date().toISOString()
        })
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

    if (uploadFile.size > 10 * 1024 * 1024) { // 10MB limit
      setErrorMessage('Ukuran file maksimal 10MB');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadRaportPDF(selectedStudent.id, uploadFile, uploadSemester);
      
      if (!result.success) {
        throw new Error(result.error);
      }

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

  const handleDeleteStudent = async () => {
    try {
      // Delete student data except name, email, and class
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
          raport_file: null,
          raport_filename: null,
          raport_mimetype: null,
          akses_raport_status: 'belum_akses',
          akses_raport_requested_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedStudent.id);

      if (error) throw error;

      setShowDeleteModal(false);
      setSuccessMessage('Data siswa berhasil dihapus');
      fetchData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting student:', error);
      setErrorMessage('Gagal menghapus data: ' + error.message);
    }
  };

  const handleApproveAccess = async (studentId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          akses_raport_status: 'disetujui',
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (error) throw error;

      setSuccessMessage('Akses berhasil disetujui');
      fetchData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error approving access:', error);
      setErrorMessage('Gagal menyetujui akses: ' + error.message);
    }
  };

  const handleRevokeAccess = async (studentId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          akses_raport_status: 'belum_akses',
          akses_raport_requested_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (error) throw error;

      setSuccessMessage('Akses berhasil dicabut');
      fetchData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error revoking access:', error);
      setErrorMessage('Gagal mencabut akses: ' + error.message);
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
          <span className="text-gray-700">Memuat data...</span>
        </div>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Akses Ditolak</h2>
          <p className="text-gray-700 mt-2">Halaman ini hanya untuk admin</p>
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
            <h1 className="text-2xl font-bold text-gray-800">Admin Dapodik Raport</h1>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Dashboard Admin
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Kembali ke Dashboard
              </button>
            </div>
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

        {/* Pending Access Requests */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Persetujuan Akses Download Raport</h2>
          
          {pendingRequests.length === 0 ? (
            <p className="text-gray-600 text-center py-4">Tidak ada permintaan akses yang menunggu</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Nama</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Kelas</th>
                    <th className="px-6 py-3">Tanggal Permintaan</th>
                    <th className="px-6 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map((request) => (
                    <tr key={request.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4">{request.name || '-'}</td>
                      <td className="px-6 py-4">{request.email}</td>
                      <td className="px-6 py-4">{request.class || '-'}</td>
                      <td className="px-6 py-4">{formatDate(request.akses_raport_requested_at)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleApproveAccess(request.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 mr-2"
                        >
                          Setujui
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* All Students */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Data Dapodik Siswa</h2>
          
          {students.length === 0 ? (
            <p className="text-gray-600 text-center py-4">Tidak ada data siswa</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Nama</th>
                    <th className="px-6 py-3">Kelas</th>
                    <th className="px-6 py-3">NISN</th>
                    <th className="px-6 py-3">Asal Sekolah</th>
                    <th className="px-6 py-3">Status Akses</th>
                    <th className="px-6 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4">{student.name || '-'}</td>
                      <td className="px-6 py-4">{student.class || '-'}</td>
                      <td className="px-6 py-4">{student.nisn || '-'}</td>
                      <td className="px-6 py-4">{student.asal_sekolah || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          student.akses_raport_status === 'disetujui' 
                            ? 'bg-green-100 text-green-800'
                            : student.akses_raport_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {student.akses_raport_status === 'disetujui' 
                            ? 'Disetujui' 
                            : student.akses_raport_status === 'pending'
                            ? 'Pending'
                            : 'Belum Akses'}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        <button
                          onClick={() => openEditModal(student)}
                          className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openUploadModal(student)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Upload Raport
                        </button>
                        <button
                          onClick={() => openDeleteModal(student)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Hapus
                        </button>
                        {student.akses_raport_status === 'disetujui' ? (
                          <button
                            onClick={() => handleRevokeAccess(student.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Cabut Akses
                          </button>
                        ) : student.akses_raport_status === 'pending' ? (
                          <button
                            onClick={() => handleApproveAccess(student.id)}
                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            Setujui
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Edit Data Siswa</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                  <input
                    type="text"
                    value={editData.class}
                    onChange={(e) => setEditData({...editData, class: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asal Sekolah</label>
                  <input
                    type="text"
                    value={editData.asal_sekolah}
                    onChange={(e) => setEditData({...editData, asal_sekolah: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NISN</label>
                  <input
                    type="text"
                    value={editData.nisn}
                    onChange={(e) => setEditData({...editData, nisn: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={editData.tanggal_lahir}
                    onChange={(e) => setEditData({...editData, tanggal_lahir: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
                  <input
                    type="text"
                    value={editData.nomor_telepon}
                    onChange={(e) => setEditData({...editData, nomor_telepon: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Ayah</label>
                  <input
                    type="text"
                    value={editData.nama_ayah}
                    onChange={(e) => setEditData({...editData, nama_ayah: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Ibu</label>
                  <input
                    type="text"
                    value={editData.nama_ibu}
                    onChange={(e) => setEditData({...editData, nama_ibu: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Diterima</label>
                  <input
                    type="date"
                    value={editData.tanggal_diterima}
                    onChange={(e) => setEditData({...editData, tanggal_diterima: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <input
                    type="text"
                    value={editData.semester}
                    onChange={(e) => setEditData({...editData, semester: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <textarea
                  value={editData.alamat}
                  onChange={(e) => setEditData({...editData, alamat: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                Batal
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Upload Raport</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Siswa</label>
                <p className="text-gray-900">{selectedStudent?.name || '-'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <input
                  type="text"
                  value={uploadSemester}
                  onChange={(e) => setUploadSemester(e.target.value)}
                  placeholder="Contoh: Semester 1 2024/2025"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File Raport (PDF)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-sm text-gray-600 mt-1">Maksimal 10MB, format PDF</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                Batal
              </button>
              <button
                onClick={handleUploadSubmit}
                disabled={uploading || !uploadFile || !uploadSemester}
                className={`px-4 py-2 rounded-md text-white ${
                  uploading || !uploadFile || !uploadSemester
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {uploading ? 'Mengupload...' : 'Upload Raport'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Konfirmasi Hapus</h3>
            <p className="text-gray-700 mb-6">
              Apakah Anda yakin ingin menghapus data siswa {selectedStudent?.name}?
              <br />
              <span className="text-sm text-gray-600">(Data yang dihapus kecuali: Nama, Email, Kelas)</span>
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteStudent}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDapodik;
