import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AdminNavbar from '../components/AdminNavbar';
import * as XLSX from 'xlsx';

const AdminPIP = () => {
  const [pipData, setPipData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    sudahCair: 0,
    belumCair: 0,
    totalNominal: 0
  });
  
  const navigate = useNavigate();

  // Kolom dari Excel PIP
  const columns = [
    { key: 'no', header: 'No', width: '60px' },
    { key: 'nama_pd', header: 'Nama Peserta Didik', width: '200px' },
    { key: 'nisn', header: 'NISN', width: '120px' },
    { key: 'kelas', header: 'Kelas', width: '80px' },
    { key: 'rombel', header: 'Rombel', width: '100px' },
    { key: 'tanggal_lahir', header: 'Tanggal Lahir', width: '120px' },
    { key: 'nominal', header: 'Nominal', width: '120px' },
    { key: 'no_rekening', header: 'No Rekening', width: '140px' },
    { key: 'status_cair', header: 'Status Cair', width: '100px' },
    { key: 'nomor_sk', header: 'Nomor SK', width: '180px' },
    { key: 'tanggal_sk', header: 'Tanggal SK', width: '120px' },
    { key: 'layak_pip', header: 'Layak PIP', width: '100px' },
    { key: 'keterangan_pencairan', header: 'Keterangan', width: '200px' }
  ];

  useEffect(() => {
    checkAdminAccess();
    fetchPIPData();
    fetchStats();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: userData } = await supabase
        .from('profiles')
        .select('roles')
        .eq('id', session.user.id)
        .single();

      if (!userData || userData.roles !== 'admin') {
        navigate('/');
        return;
      }

      setUserRole(userData.roles);
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/auth');
    }
  };

  const fetchPIPData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pip_data')
        .select('*')
        .order('nama_pd', { ascending: true });

      if (error) throw error;
      
      // Tambahkan nomor urut
      const dataWithNo = data.map((item, index) => ({
        ...item,
        no: index + 1
      }));
      
      setPipData(dataWithNo);
    } catch (error) {
      console.error('Error fetching PIP data:', error);
      setErrorMessage('Gagal memuat data PIP: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('pip_data')
        .select('nominal, status_cair');

      if (error) throw error;

      const total = data.length;
      const sudahCair = data.filter(item => item.status_cair === 'Sudah Cair').length;
      const belumCair = data.filter(item => item.status_cair === 'Belum Cair').length;
      const totalNominal = data.reduce((sum, item) => sum + (item.nominal || 0), 0);

      setStats({
        total,
        sudahCair,
        belumCair,
        totalNominal
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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

          // Cari baris header (baris ke-3 dari file Excel)
          const headerRow = jsonData[2];
          const pipList = [];

          // Mulai dari baris 4 (indeks 3)
          for (let i = 3; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row[0]) continue;

            const pip = {
              peserta_didik_id: row[0] || '',
              sekolah_id: row[1] || '',
              npsn: row[2] || '',
              nomenklatur: row[3] || '',
              kelas: row[4] || '',
              rombel: row[5] || '',
              nama_pd: row[6] || '',
              nama_ibu_kandung: row[7] || '',
              nama_ayah: row[8] || '',
              tanggal_lahir: row[9] ? new Date(row[9]).toISOString().split('T')[0] : null,
              tempat_lahir: row[10] || '',
              nisn: row[11]?.toString() || '',
              nik: row[12]?.toString() || '',
              jenis_kelamin: row[13] || '',
              nominal: parseInt(row[14]) || 0,
              no_rekening: row[15]?.toString() || '',
              tahap_id: parseInt(row[16]) || 0,
              nomor_sk: row[17] || '',
              tanggal_sk: row[18] ? new Date(row[18]).toISOString().split('T')[0] : null,
              nama_rekening: row[19] || '',
              tanggal_cair: row[20] ? new Date(row[20]).toISOString().split('T')[0] : null,
              status_cair: row[21] || '',
              no_KIP: row[22] || '',
              no_KKS: row[23] || '',
              no_KPS: row[24] || '',
              virtual_acc: row[25] || '',
              nama_kartu: row[26] || '',
              semester_id: row[27] || '',
              layak_pip: row[28] || '',
              keterangan_pencairan: row[29] || '',
              confirmation_text: row[30] || '',
              tahap_keterangan: row[31] || '',
              nama_pengusul: row[32] || ''
            };

            pipList.push(pip);
          }

          // Clear existing data first
          const { error: deleteError } = await supabase
            .from('pip_data')
            .delete()
            .gte('peserta_didik_id', '');

          if (deleteError) console.warn('Warning clearing data:', deleteError.message);

          // Insert new data in batches
          const batchSize = 100;
          for (let i = 0; i < pipList.length; i += batchSize) {
            const batch = pipList.slice(i, i + batchSize);
            const { error: insertError } = await supabase
              .from('pip_data')
              .upsert(batch);

            if (insertError) {
              console.error('Error inserting batch:', insertError);
              throw insertError;
            }
            
            console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}: ${batch.length} records`);
          }

          setShowImportModal(false);
          setExcelFile(null);
          setSuccessMessage(`Berhasil mengimport ${pipList.length} data PIP`);
          fetchPIPData();
          fetchStats();
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

  const openDetailModal = (data) => {
    setSelectedData(data);
    setShowDetailModal(true);
  };

  const openEditModal = (data) => {
    setSelectedData(data);
    setEditForm(data);
    setShowEditModal(true);
  };

  const openDeleteModal = (data) => {
    setSelectedData(data);
    setShowDeleteModal(true);
  };

  const handleEditPIP = async () => {
    try {
      const { error } = await supabase
        .from('pip_data')
        .update(editForm)
        .eq('peserta_didik_id', selectedData.peserta_didik_id);

      if (error) throw error;

      setShowEditModal(false);
      setSuccessMessage('Data PIP berhasil diperbarui');
      fetchPIPData();
      fetchStats();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating PIP:', error);
      setErrorMessage('Gagal memperbarui data: ' + error.message);
    }
  };

  const handleDeletePIP = async () => {
    try {
      const { error } = await supabase
        .from('pip_data')
        .delete()
        .eq('peserta_didik_id', selectedData.peserta_didik_id);

      if (error) throw error;

      setShowDeleteModal(false);
      setSuccessMessage('Data PIP berhasil dihapus');
      fetchPIPData();
      fetchStats();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting PIP:', error);
      setErrorMessage('Gagal menghapus data: ' + error.message);
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

  // Filter data berdasarkan pencarian NAMA
  const filteredData = pipData.filter(item => {
    return item.nama_pd?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.nisn?.includes(searchTerm) ||
           item.kelas?.includes(searchTerm);
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const renderCell = (item, column) => {
    const value = item[column.key];
    
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    if (column.key === 'tanggal_lahir' || column.key === 'tanggal_sk') {
      return formatDate(value);
    }

    if (column.key === 'nominal') {
      return formatCurrency(value);
    }

    if (column.key === 'status_cair') {
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Sudah Cair' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {value}
        </span>
      );
    }

    if (column.key === 'nama_pd') {
      return <div className="font-medium text-gray-900">{value}</div>;
    }

    return String(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-blue-700 font-medium">Memuat data PIP...</span>
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
          {/* Messages */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl shadow-sm flex items-center justify-between animate-fadeIn">
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
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm animate-fadeIn">
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
                  Data Penerima PIP SMAN 1 REJOTANGAN
                </h1>
                <p className="text-gray-600">
                  Program Indonesia Pintar Tahun 2025
                </p>
              </div>
              
              <button
                onClick={() => setShowImportModal(true)}
                className="mt-4 md:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
              >
                <span className="text-lg">📊</span>
                <span>Import Excel</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="text-sm text-blue-600 mb-1">Total Penerima</div>
                <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
                <div className="text-xs text-blue-500 mt-1">Seluruh Kelas</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="text-sm text-green-600 mb-1">Sudah Cair</div>
                <div className="text-2xl font-bold text-green-700">{stats.sudahCair}</div>
                <div className="text-xs text-green-500 mt-1">
                  {((stats.sudahCair / stats.total) * 100 || 0).toFixed(1)}%
                </div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
                <div className="text-sm text-yellow-600 mb-1">Belum Cair</div>
                <div className="text-2xl font-bold text-yellow-700">{stats.belumCair}</div>
                <div className="text-xs text-yellow-500 mt-1">
                  {((stats.belumCair / stats.total) * 100 || 0).toFixed(1)}%
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="text-sm text-purple-600 mb-1">Total Dana</div>
                <div className="text-2xl font-bold text-purple-700">
                  {formatCurrency(stats.totalNominal)}
                </div>
                <div className="text-xs text-purple-500 mt-1">Seluruh penerima</div>
              </div>
            </div>

            {/* Search and Controls */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Cari berdasarkan Nama, NISN, atau Kelas..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                >
                  <option value="10">10 per halaman</option>
                  <option value="20">20 per halaman</option>
                  <option value="50">50 per halaman</option>
                  <option value="100">100 per halaman</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Daftar Penerima PIP</h2>
                <p className="text-sm text-gray-600">
                  Menampilkan {columns.length} kolom data
                </p>
              </div>
              <div className="text-sm text-gray-600">
                {filteredData.length} data ditemukan (dari total {stats.total})
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-max">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((column) => (
                      <th 
                        key={column.key}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border-r border-gray-200 last:border-r-0"
                        style={{ minWidth: column.width }}
                      >
                        <div className="flex items-center gap-1">
                          <span>{column.header}</span>
                        </div>
                      </th>
                    ))}
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-50 border-l border-gray-200"
                      style={{ minWidth: '140px' }}
                    >
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentItems.map((item) => (
                    <tr key={item.peserta_didik_id} className="hover:bg-gray-50 transition-colors group">
                      {columns.map((column) => (
                        <td 
                          key={`${item.peserta_didik_id}-${column.key}`}
                          className="px-4 py-2.5 text-sm text-gray-800 whitespace-nowrap border-r border-gray-100 last:border-r-0 group-hover:bg-gray-50"
                        >
                          <div className="truncate" style={{ maxWidth: column.width }} title={renderCell(item, column)}>
                            {renderCell(item, column)}
                          </div>
                        </td>
                      ))}
                      <td className="px-4 py-2.5 bg-white group-hover:bg-gray-50 border-l border-gray-100">
                        <div className="flex flex-col gap-1.5 min-w-[140px]">
                          <button
                            onClick={() => openDetailModal(item)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 transition-all text-xs shadow-sm hover:shadow"
                          >
                            <span className="text-sm">👁️</span>
                            <span>Detail</span>
                          </button>
                          <button
                            onClick={() => openEditModal(item)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-md hover:from-green-600 hover:to-green-700 transition-all text-xs shadow-sm hover:shadow"
                          >
                            <span className="text-sm">✏️</span>
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => openDeleteModal(item)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-md hover:from-red-600 hover:to-red-700 transition-all text-xs shadow-sm hover:shadow"
                          >
                            <span className="text-sm">🗑️</span>
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredData.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-5xl text-gray-300 mb-4">📋</div>
                  <p className="text-gray-600 text-lg mb-2">Tidak ada data PIP</p>
                  <p className="text-sm text-gray-500">
                    {searchTerm ? `Tidak ditemukan data dengan pencarian "${searchTerm}"` : 'Klik tombol "Import Excel" untuk menambahkan data'}
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {filteredData.length > 0 && (
              <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Menampilkan <span className="font-semibold">{indexOfFirstItem + 1}</span> - <span className="font-semibold">{Math.min(indexOfLastItem, filteredData.length)}</span> dari <span className="font-semibold">{filteredData.length}</span> data
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      currentPage === 1 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 shadow-sm'
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
                        className={`px-3 py-1.5 rounded-md transition-all ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 shadow-sm'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 shadow-sm'
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
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Import Data PIP</h3>
                <p className="text-sm text-gray-600 mt-1">Dari file Excel SK PIP SMA 2025</p>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setExcelFile(null);
                }}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 rounded-full transition-colors"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>
            
            <div className="p-6">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-400 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="pip-excel-upload"
                />
                <label htmlFor="pip-excel-upload" className="cursor-pointer block">
                  <span className="text-5xl text-gray-400 mb-3 block">📊</span>
                  <p className="text-gray-700 font-medium">
                    {excelFile ? excelFile.name : 'Klik untuk memilih file'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    File Excel PIP SMAN 1 REJOTANGAN
                  </p>
                </label>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setExcelFile(null);
                }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
              >
                Batal
              </button>
              <button
                onClick={importExcelToDatabase}
                disabled={!excelFile || uploading}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all font-medium ${
                  !excelFile || uploading
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg'
                }`}
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Mengimport...</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">📊</span>
                    <span>Import Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Detail Data PIP</h3>
                <p className="text-sm text-gray-600 mt-1">SMAN 1 REJOTANGAN</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Info Utama */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl p-4 shadow-md">
                    <span className="text-2xl">🎓</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-2xl text-gray-800 mb-2">{selectedData.nama_pd}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">NISN:</span>
                        <p className="font-medium">{selectedData.nisn}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Kelas:</span>
                        <p className="font-medium">{selectedData.kelas} {selectedData.rombel}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Tanggal Lahir:</span>
                        <p className="font-medium">{formatDate(selectedData.tanggal_lahir)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Jenis Kelamin:</span>
                        <p className="font-medium">{selectedData.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Data PIP */}
                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h5 className="font-semibold text-gray-800 mb-3 pb-2 border-b">Data PIP</h5>
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-600 text-sm">Nominal:</span>
                        <p className="text-lg font-bold text-purple-700">{formatCurrency(selectedData.nominal)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 text-sm">Status Cair:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedData.status_cair === 'Sudah Cair' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedData.status_cair}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 text-sm">Tanggal Cair:</span>
                        <p className="font-medium">{formatDate(selectedData.tanggal_cair)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 text-sm">Layak PIP:</span>
                        <p className="font-medium">{selectedData.layak_pip}</p>
                      </div>
                    </div>
                  </div>

                  {/* Data Rekening */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h5 className="font-semibold text-gray-800 mb-3 pb-2 border-b">Data Rekening</h5>
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-600 text-sm">No Rekening:</span>
                        <p className="font-medium">{selectedData.no_rekening}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 text-sm">Nama Rekening:</span>
                        <p className="font-medium">{selectedData.nama_rekening}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 text-sm">Virtual Account:</span>
                        <p className="font-medium">{selectedData.virtual_acc}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data SK dan Administrasi */}
                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h5 className="font-semibold text-gray-800 mb-3 pb-2 border-b">Data SK</h5>
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-600 text-sm">Nomor SK:</span>
                        <p className="font-medium text-sm">{selectedData.nomor_sk}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 text-sm">Tanggal SK:</span>
                        <p className="font-medium">{formatDate(selectedData.tanggal_sk)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 text-sm">Tahap ID:</span>
                        <p className="font-medium">{selectedData.tahap_id}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 text-sm">Keterangan Tahap:</span>
                        <p className="font-medium text-sm">{selectedData.tahap_keterangan}</p>
                      </div>
                    </div>
                  </div>

                  {/* Data Bantuan */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h5 className="font-semibold text-gray-800 mb-3 pb-2 border-b">Data Bantuan</h5>
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-600 text-sm">No KIP:</span>
                        <p className="font-medium">{selectedData.no_KIP || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 text-sm">No KKS:</span>
                        <p className="font-medium">{selectedData.no_KKS || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 text-sm">No KPS:</span>
                        <p className="font-medium">{selectedData.no_KPS || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 text-sm">Nama Pengusul:</span>
                        <p className="font-medium">{selectedData.nama_pengusul}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Keterangan */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h5 className="font-semibold text-gray-800 mb-3 pb-2 border-b">Keterangan Pencairan</h5>
                <p className="text-gray-700">{selectedData.keterangan_pencairan}</p>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Edit Data PIP</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedData.nama_pd}</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status Cair</label>
                  <select
                    value={editForm.status_cair || ''}
                    onChange={(e) => setEditForm({...editForm, status_cair: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="Sudah Cair">Sudah Cair</option>
                    <option value="Belum Cair">Belum Cair</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Cair</label>
                  <input
                    type="date"
                    value={editForm.tanggal_cair || ''}
                    onChange={(e) => setEditForm({...editForm, tanggal_cair: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
                  <input
                    type="number"
                    value={editForm.nominal || 0}
                    onChange={(e) => setEditForm({...editForm, nominal: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No Rekening</label>
                  <input
                    type="text"
                    value={editForm.no_rekening || ''}
                    onChange={(e) => setEditForm({...editForm, no_rekening: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan Pencairan</label>
                  <textarea
                    value={editForm.keterangan_pencairan || ''}
                    onChange={(e) => setEditForm({...editForm, keterangan_pencairan: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleEditPIP}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-medium"
              >
                <span>💾</span>
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-red-50 to-red-100 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Hapus Data PIP</h3>
                <p className="text-sm text-gray-600 mt-1">Konfirmasi penghapusan</p>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 rounded-full transition-colors"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-red-100 rounded-full">
                  <span className="text-red-600 text-2xl">🗑️</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-2">Anda akan menghapus data PIP:</p>
                  <p className="text-lg font-bold text-red-700 mb-1">{selectedData.nama_pd}</p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>NISN: {selectedData.nisn || '-'}</p>
                    <p>Kelas: {selectedData.kelas} {selectedData.rombel}</p>
                    <p>Nominal: {formatCurrency(selectedData.nominal)}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700">
                  ⚠️ <span className="font-semibold">Perhatian:</span> Data yang dihapus tidak dapat dikembalikan.
                </p>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
              >
                Batalkan
              </button>
              <button
                onClick={handleDeletePIP}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-medium"
              >
                <span className="text-lg">🗑️</span>
                <span>Hapus Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPIP;
