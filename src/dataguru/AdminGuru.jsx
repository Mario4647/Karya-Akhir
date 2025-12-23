import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AdminNavbar from '../components/AdminNavbar';
import * as XLSX from 'xlsx';

const AdminGuru = () => {
  const [guruData, setGuruData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGuru, setSelectedGuru] = useState(null);
  const [editData, setEditData] = useState({});
  const [excelFile, setExcelFile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
    fetchGuruData();
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

  const fetchGuruData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('guru')
        .select('*')
        .order('no_urut', { ascending: true });

      if (error) throw error;

      setGuruData(data || []);
    } catch (error) {
      console.error('Error fetching guru data:', error);
      setErrorMessage('Gagal memuat data guru: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setErrorMessage('Hanya file Excel (.xlsx atau .xls) yang diperbolehkan');
      return;
    }

    setExcelFile(file);
  };

  const importExcelToDatabase = async () => {
    if (!excelFile) {
      setErrorMessage('Pilih file Excel terlebih dahulu');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // Cari baris mulai data (setelah header metadata)
          let startRow = 0;
          for (let i = 0; i < jsonData.length; i++) {
            if (jsonData[i][0] === 'No') {
              startRow = i + 1;
              break;
            }
          }

          const guruList = [];
          
          // Proses setiap baris data
          for (let i = startRow; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row[0] || row[0] === '' || isNaN(row[0])) continue;

            const guru = {
              no_urut: parseInt(row[0]) || 0,
              nama: row[1] || '',
              nuptk: row[2] || '',
              jenis_kelamin: row[3] || '',
              tempat_lahir: row[4] || '',
              tanggal_lahir: row[5] ? new Date(row[5]).toISOString().split('T')[0] : null,
              nip: row[6] || '',
              status_kepegawaian: row[7] || '',
              jenis_ptk: row[8] || '',
              agama: row[9] || '',
              alamat_jalan: row[10] || '',
              rt: row[11]?.toString() || '',
              rw: row[12]?.toString() || '',
              nama_dusun: row[13] || '',
              desa_kelurahan: row[14] || '',
              kecamatan: row[15] || '',
              kode_pos: row[16]?.toString() || '',
              telepon: row[17]?.toString() || '',
              hp: row[18]?.toString() || '',
              email: row[19] || '',
              tugas_tambahan: row[20] || '',
              sk_cpns: row[21] || '',
              tanggal_cpns: row[22] ? new Date(row[22]).toISOString().split('T')[0] : null,
              sk_pengangkatan: row[23] || '',
              tmt_pengangkatan: row[24] ? new Date(row[24]).toISOString().split('T')[0] : null,
              lembaga_pengangkatan: row[25] || '',
              pangkat_golongan: row[26] || '',
              sumber_gaji: row[27] || '',
              nama_ibu_kandung: row[28] || '',
              status_perkawinan: row[29] || '',
              nama_suami_istri: row[30] || '',
              nip_suami_istri: row[31] || '',
              pekerjaan_suami_istri: row[32] || '',
              tmt_pns: row[33] ? new Date(row[33]).toISOString().split('T')[0] : null,
              sudah_lisensi_kepala_sekolah: row[34] || '',
              pernah_diklat_kepengawasan: row[35] || '',
              keahlian_braille: row[36] || '',
              keahlian_bahasa_isyarat: row[37] || '',
              npwp: row[38] || '',
              nama_wajib_pajak: row[39] || '',
              kewarganegaraan: row[40] || '',
              bank: row[41] || '',
              nomor_rekening_bank: row[42] || '',
              rekening_atas_nama: row[43] || '',
              nik: row[44]?.toString() || '',
              no_kk: row[45]?.toString() || '',
              karpeg: row[46] || '',
              karis_karsu: row[47] || '',
              lintang: row[48] ? parseFloat(row[48]) : null,
              bujur: row[49] ? parseFloat(row[49]) : null,
              nuks: row[50] || '',
              status_aktif: row[51] || 'Ya',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            guruList.push(guru);
          }

          // Insert ke database
          const { error } = await supabase
            .from('guru')
            .upsert(guruList, { onConflict: 'nuptk' });

          if (error) throw error;

          setShowImportModal(false);
          setExcelFile(null);
          setSuccessMessage(`Berhasil mengimport ${guruList.length} data guru`);
          fetchGuruData();
          setTimeout(() => setSuccessMessage(''), 5000);
        } catch (error) {
          console.error('Error processing Excel:', error);
          setErrorMessage('Error processing Excel file: ' + error.message);
        } finally {
          setUploading(false);
        }
      };
      
      reader.readAsArrayBuffer(excelFile);
    } catch (error) {
      console.error('Error in import:', error);
      setErrorMessage('Gagal mengimport data: ' + error.message);
      setUploading(false);
    }
  };

  const openEditModal = (guru) => {
    setSelectedGuru(guru);
    setEditData({
      nama: guru.nama || '',
      nuptk: guru.nuptk || '',
      jenis_kelamin: guru.jenis_kelamin || '',
      tempat_lahir: guru.tempat_lahir || '',
      tanggal_lahir: guru.tanggal_lahir || '',
      nip: guru.nip || '',
      status_kepegawaian: guru.status_kepegawaian || '',
      jenis_ptk: guru.jenis_ptk || '',
      agama: guru.agama || '',
      alamat_jalan: guru.alamat_jalan || '',
      rt: guru.rt || '',
      rw: guru.rw || '',
      nama_dusun: guru.nama_dusun || '',
      desa_kelurahan: guru.desa_kelurahan || '',
      kecamatan: guru.kecamatan || '',
      kode_pos: guru.kode_pos || '',
      telepon: guru.telepon || '',
      hp: guru.hp || '',
      email: guru.email || '',
      tugas_tambahan: guru.tugas_tambahan || '',
      status_aktif: guru.status_aktif || 'Ya'
    });
    setShowEditModal(true);
  };

  const openDetailModal = (guru) => {
    setSelectedGuru(guru);
    setShowDetailModal(true);
  };

  const openDeleteModal = (guru) => {
    setSelectedGuru(guru);
    setShowDeleteModal(true);
  };

  const handleEditSubmit = async () => {
    try {
      const { error } = await supabase
        .from('guru')
        .update({
          ...editData,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedGuru.id);

      if (error) throw error;

      setShowEditModal(false);
      setSuccessMessage('Data guru berhasil diperbarui');
      fetchGuruData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating guru:', error);
      setErrorMessage('Gagal memperbarui data: ' + error.message);
    }
  };

  const handleDeleteGuru = async () => {
    try {
      const { error } = await supabase
        .from('guru')
        .delete()
        .eq('id', selectedGuru.id);

      if (error) throw error;

      setShowDeleteModal(false);
      setSuccessMessage('Data guru berhasil dihapus');
      fetchGuruData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting guru:', error);
      setErrorMessage('Gagal menghapus data: ' + error.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  // Filter data berdasarkan pencarian
  const filteredGuru = guruData.filter(guru => {
    return (
      guru.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guru.nuptk?.includes(searchTerm) ||
      guru.nip?.includes(searchTerm) ||
      guru.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guru.status_kepegawaian?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredGuru.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredGuru.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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

          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Data Guru SMAN 1 REJOTANGAN
                </h1>
                <p className="text-gray-600">
                  Kecamatan Kec. Rejotangan, Kabupaten Kab. Tulungagung, Provinsi Prov. Jawa Timur
                </p>
              </div>
              
              <button
                onClick={() => setShowImportModal(true)}
                className="mt-4 md:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                📊 Import Excel
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <div className="text-sm text-blue-600 mb-1">Total Guru</div>
                <div className="text-2xl font-bold text-blue-700">{guruData.length}</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <div className="text-sm text-green-600 mb-1">PNS</div>
                <div className="text-2xl font-bold text-green-700">
                  {guruData.filter(g => g.status_kepegawaian?.includes('PNS')).length}
                </div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <div className="text-sm text-purple-600 mb-1">PPPK</div>
                <div className="text-2xl font-bold text-purple-700">
                  {guruData.filter(g => g.status_kepegawaian?.includes('PPPK')).length}
                </div>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                <div className="text-sm text-orange-600 mb-1">Honor</div>
                <div className="text-2xl font-bold text-orange-700">
                  {guruData.filter(g => g.status_kepegawaian?.includes('Honor')).length}
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Cari guru (nama, NIP, NUPTK, email)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="10">10 data</option>
                  <option value="20">20 data</option>
                  <option value="50">50 data</option>
                  <option value="100">100 data</option>
                </select>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-300 my-8"></div>

          {/* Table Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">No</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nama</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">NUPTK</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Jenis Kelamin</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tempat Lahir</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tanggal Lahir</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">NIP</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status Kepegawaian</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Jenis PTK</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Agama</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status Aktif</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentItems.map((guru) => (
                    <tr key={guru.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-800">{guru.no_urut}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{guru.nama}</p>
                          <p className="text-xs text-gray-500">{guru.tugas_tambahan || '-'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">{guru.nuptk || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          guru.jenis_kelamin === 'L' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-pink-100 text-pink-800'
                        }`}>
                          {guru.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">{guru.tempat_lahir || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{formatDate(guru.tanggal_lahir)}</td>
                      <td className="px-4 py-3 text-sm text-gray-800 font-mono">{guru.nip || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          guru.status_kepegawaian?.includes('PNS') 
                            ? 'bg-green-100 text-green-800'
                            : guru.status_kepegawaian?.includes('PPPK')
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {guru.status_kepegawaian || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">{guru.jenis_ptk || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{guru.agama || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{guru.email || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          guru.status_aktif === 'Ya' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {guru.status_aktif || 'Ya'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openDetailModal(guru)}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                          >
                            👁️ Detail
                          </button>
                          <button
                            onClick={() => openEditModal(guru)}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => openDeleteModal(guru)}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                          >
                            🗑️ Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredGuru.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl text-gray-300 mb-3">👨‍🏫</div>
                  <p className="text-gray-600">Belum ada data guru</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Klik tombol "Import Excel" untuk menambahkan data
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {filteredGuru.length > 0 && (
              <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredGuru.length)} dari {filteredGuru.length} data
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded ${
                      currentPage === 1 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ← Prev
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => paginate(pageNum)}
                        className={`px-3 py-1 rounded ${
                          currentPage === pageNum
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Import Data Guru dari Excel</h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setExcelFile(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  Upload file Excel yang berisi data guru SMAN 1 REJOTANGAN
                </p>
                <p className="text-sm text-gray-600">
                  Pastikan format file sesuai dengan template Dapodik
                </p>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excel-upload"
                />
                <label htmlFor="excel-upload" className="cursor-pointer block">
                  <span className="text-4xl text-gray-400 mb-2 block">📊</span>
                  <p className="text-sm text-gray-600">
                    {excelFile ? excelFile.name : 'Klik untuk memilih file Excel'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Format: .xlsx atau .xls
                  </p>
                </label>
              </div>
              
              {excelFile && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    File terpilih: <span className="font-medium">{excelFile.name}</span>
                  </p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setExcelFile(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={importExcelToDatabase}
                disabled={!excelFile || uploading}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  !excelFile || uploading
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Mengimport...
                  </>
                ) : (
                  '📊 Import Data'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedGuru && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Detail Data Guru</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-bold text-lg text-gray-800 mb-2">{selectedGuru.nama}</h4>
                <p className="text-sm text-gray-600">
                  No: {selectedGuru.no_urut} | NIP: {selectedGuru.nip || '-'} | NUPTK: {selectedGuru.nuptk || '-'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kolom Kiri */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status Kepegawaian</label>
                    <p className="text-gray-900">{selectedGuru.status_kepegawaian || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jenis PTK</label>
                    <p className="text-gray-900">{selectedGuru.jenis_ptk || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tempat & Tanggal Lahir</label>
                    <p className="text-gray-900">
                      {selectedGuru.tempat_lahir || '-'}, {formatDate(selectedGuru.tanggal_lahir)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
                    <p className="text-gray-900">{selectedGuru.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agama</label>
                    <p className="text-gray-900">{selectedGuru.agama || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{selectedGuru.email || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telepon/HP</label>
                    <p className="text-gray-900">{selectedGuru.telepon || '-'} / {selectedGuru.hp || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tugas Tambahan</label>
                    <p className="text-gray-900">{selectedGuru.tugas_tambahan || '-'}</p>
                  </div>
                </div>

                {/* Kolom Kanan */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                    <p className="text-gray-900">
                      {selectedGuru.alamat_jalan || '-'}<br />
                      RT {selectedGuru.rt || '-'}/RW {selectedGuru.rw || '-'}, {selectedGuru.nama_dusun || '-'}<br />
                      {selectedGuru.desa_kelurahan || '-'}, {selectedGuru.kecamatan || '-'}<br />
                      Kode Pos: {selectedGuru.kode_pos || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SK Pengangkatan</label>
                    <p className="text-gray-900">{selectedGuru.sk_pengangkatan || '-'}</p>
                    <p className="text-sm text-gray-600">TMT: {formatDate(selectedGuru.tmt_pengangkatan)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pangkat/Golongan</label>
                    <p className="text-gray-900">{selectedGuru.pangkat_golongan || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sumber Gaji</label>
                    <p className="text-gray-900">{selectedGuru.sumber_gaji || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status Perkawinan</label>
                    <p className="text-gray-900">{selectedGuru.status_perkawinan || '-'}</p>
                    {selectedGuru.nama_suami_istri && (
                      <p className="text-sm text-gray-600">Suami/Istri: {selectedGuru.nama_suami_istri}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Ibu Kandung</label>
                    <p className="text-gray-900">{selectedGuru.nama_ibu_kandung || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIK & No KK</label>
                    <p className="text-gray-900">
                      NIK: {selectedGuru.nik || '-'}<br />
                      No KK: {selectedGuru.no_kk || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Data Tambahan */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-800 mb-3">Data Tambahan</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">NPWP:</span>
                    <p className="text-gray-900">{selectedGuru.npwp || '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Nama Wajib Pajak:</span>
                    <p className="text-gray-900">{selectedGuru.nama_wajib_pajak || '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Bank:</span>
                    <p className="text-gray-900">{selectedGuru.bank || '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">No Rekening:</span>
                    <p className="text-gray-900">{selectedGuru.nomor_rekening_bank || '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">NUKS:</span>
                    <p className="text-gray-900">{selectedGuru.nuks || '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status Aktif:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedGuru.status_aktif === 'Ya' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedGuru.status_aktif || 'Ya'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  openEditModal(selectedGuru);
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                ✏️ Edit Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedGuru && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Edit Data Guru</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700">
                  Edit data untuk: <span className="font-semibold">{selectedGuru.nama}</span>
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={editData.nama}
                    onChange={(e) => setEditData({...editData, nama: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NUPTK
                    </label>
                    <input
                      type="text"
                      value={editData.nuptk}
                      onChange={(e) => setEditData({...editData, nuptk: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NIP
                    </label>
                    <input
                      type="text"
                      value={editData.nip}
                      onChange={(e) => setEditData({...editData, nip: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jenis Kelamin
                    </label>
                    <select
                      value={editData.jenis_kelamin}
                      onChange={(e) => setEditData({...editData, jenis_kelamin: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Pilih</option>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status Kepegawaian
                    </label>
                    <select
                      value={editData.status_kepegawaian}
                      onChange={(e) => setEditData({...editData, status_kepegawaian: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Pilih Status</option>
                      <option value="PNS">PNS</option>
                      <option value="PPPK">PPPK</option>
                      <option value="Honor Daerah TK.I Provinsi">Honor Daerah TK.I Provinsi</option>
                      <option value="Guru Honor Sekolah">Guru Honor Sekolah</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tempat Lahir
                    </label>
                    <input
                      type="text"
                      value={editData.tempat_lahir}
                      onChange={(e) => setEditData({...editData, tempat_lahir: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      value={editData.tanggal_lahir}
                      onChange={(e) => setEditData({...editData, tanggal_lahir: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({...editData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telepon
                  </label>
                  <input
                    type="text"
                    value={editData.telepon}
                    onChange={(e) => setEditData({...editData, telepon: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    HP
                  </label>
                  <input
                    type="text"
                    value={editData.hp}
                    onChange={(e) => setEditData({...editData, hp: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tugas Tambahan
                  </label>
                  <input
                    type="text"
                    value={editData.tugas_tambahan}
                    onChange={(e) => setEditData({...editData, tugas_tambahan: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status Aktif
                  </label>
                  <select
                    value={editData.status_aktif}
                    onChange={(e) => setEditData({...editData, status_aktif: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="Ya">Ya</option>
                    <option value="Tidak">Tidak</option>
                  </select>
                </div>
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

      {/* Delete Modal */}
      {showDeleteModal && selectedGuru && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-xl font-bold text-gray-800">Konfirmasi Hapus Data</h3>
            </div>
            
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <span className="text-red-600 text-2xl">🗑️</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-2">Hapus data guru: {selectedGuru.nama}</p>
                  <p className="text-gray-600 text-sm">
                    Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
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
                onClick={handleDeleteGuru}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                🗑️ Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGuru;
