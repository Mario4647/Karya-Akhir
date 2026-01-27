import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AdminNavbar from '../../components/AdminNavbar';
import * as XLSX from 'xlsx';

// Import icon dari react-icons
import { 
  FiUpload, FiSearch, FiDownload, FiEdit, FiTrash2, FiEye,
  FiChevronLeft, FiChevronRight, FiX, FiSave, FiUser, FiDollarSign,
  FiCheckCircle, FiClock, FiUsers, FiFileText, FiDatabase, FiHome,
  FiPercent, FiCalendar, FiCreditCard, FiBook, FiMapPin, FiGrid
} from 'react-icons/fi';
import { 
  MdSchool, MdAttachMoney, MdAccountBalance, MdDescription,
  MdPerson, MdEmail, MdPhone, MdLocationOn, MdDateRange
} from 'react-icons/md';

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

  // Kolom dari Excel PIP dengan icon
  const columns = [
    { key: 'no', header: 'No', width: '70px', icon: <FiGrid size={14} /> },
    { key: 'nama_pd', header: 'Nama Siswa', width: '220px', icon: <FiUser size={14} /> },
    { key: 'nisn', header: 'NISN', width: '130px', icon: <MdSchool size={14} /> },
    { key: 'kelas', header: 'Kelas', width: '90px', icon: <FiBook size={14} /> },
    { key: 'rombel', header: 'Rombel', width: '110px', icon: <FiUsers size={14} /> },
    { key: 'tanggal_lahir', header: 'Tgl Lahir', width: '120px', icon: <FiCalendar size={14} /> },
    { key: 'nominal', header: 'Nominal', width: '140px', icon: <FiDollarSign size={14} /> },
    { key: 'no_rekening', header: 'No Rekening', width: '150px', icon: <FiCreditCard size={14} /> },
    { key: 'status_cair', header: 'Status', width: '120px', icon: <FiCheckCircle size={14} /> },
    { key: 'nomor_sk', header: 'Nomor SK', width: '180px', icon: <FiFileText size={14} /> },
    { key: 'tanggal_sk', header: 'Tgl SK', width: '120px', icon: <MdDateRange size={14} /> },
    { key: 'layak_pip', header: 'Layak PIP', width: '110px', icon: <FiPercent size={14} /> }
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

  // Fungsi untuk parsing tanggal yang aman
  const parseExcelDate = (excelDate) => {
    if (!excelDate) return null;
    
    try {
      // Jika sudah dalam format string ISO
      if (typeof excelDate === 'string' && excelDate.includes('-')) {
        const date = new Date(excelDate);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
      
      // Jika adalah serial Excel date (angka)
      if (typeof excelDate === 'number') {
        const date = XLSX.SSF.parse_date_code(excelDate);
        if (date) {
          const jsDate = new Date(date.y, date.m - 1, date.d);
          return jsDate.toISOString().split('T')[0];
        }
      }
      
      // Coba parsing langsung
      const date = new Date(excelDate);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      
      return null;
    } catch (error) {
      console.warn('Error parsing date:', excelDate, error);
      return null;
    }
  };

  // Fungsi untuk memeriksa apakah kolom ada di tabel
  const checkColumnExists = async (columnName) => {
    try {
      // Coba query kecil untuk memeriksa kolom
      const { error } = await supabase
        .from('pip_data')
        .select(columnName)
        .limit(1);
      
      return !error;
    } catch (error) {
      return false;
    }
  };

  const importExcelToDatabase = async () => {
    if (!excelFile) {
      setErrorMessage('Pilih file Excel terlebih dahulu');
      return;
    }

    setUploading(true);
    setErrorMessage('');
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { 
            type: 'array',
            cellDates: true,
            cellNF: false,
            cellText: false
          });
          
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            raw: false,
            dateNF: 'yyyy-mm-dd'
          });

          console.log('Excel data loaded, total rows:', jsonData.length);

          // Cari baris header (biasanya baris ke-3 dari file Excel)
          const headerRow = jsonData[2] || [];
          console.log('Header row:', headerRow);

          const pipList = [];
          const batchId = `batch_${Date.now()}`;

          // Periksa apakah kolom imported_at ada di database
          const hasImportedAtColumn = await checkColumnExists('imported_at');
          const hasImportBatchColumn = await checkColumnExists('import_batch');

          // Mulai dari baris 4 (indeks 3) - sesuaikan dengan struktur Excel Anda
          for (let i = 3; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || !row[0]) continue;

            // Map kolom Excel ke struktur database
            // Sesuaikan indeks array dengan struktur file Excel Anda
            const pip = {
              peserta_didik_id: String(row[0] || ''),
              sekolah_id: String(row[1] || ''),
              npsn: String(row[2] || ''),
              nomenklatur: String(row[3] || ''),
              kelas: String(row[4] || ''),
              rombel: String(row[5] || ''),
              nama_pd: String(row[6] || ''),
              nama_ibu_kandung: String(row[7] || ''),
              nama_ayah: String(row[8] || ''),
              tanggal_lahir: parseExcelDate(row[9]),
              tempat_lahir: String(row[10] || ''),
              nisn: String(row[11] || ''),
              nik: String(row[12] || ''),
              jenis_kelamin: String(row[13] || ''),
              nominal: parseInt(row[14]) || 0,
              no_rekening: String(row[15] || ''),
              tahap_id: parseInt(row[16]) || 0,
              nomor_sk: String(row[17] || ''),
              tanggal_sk: parseExcelDate(row[18]),
              nama_rekening: String(row[19] || ''),
              tanggal_cair: parseExcelDate(row[20]),
              status_cair: String(row[21] || 'Belum Cair'),
              no_kip: String(row[22] || ''),
              no_kks: String(row[23] || ''),
              no_kps: String(row[24] || ''),
              virtual_acc: String(row[25] || ''),
              nama_kartu: String(row[26] || ''),
              semester_id: String(row[27] || ''),
              layak_pip: String(row[28] || ''),
              keterangan_pencairan: String(row[29] || ''),
              confirmation_text: String(row[30] || ''),
              tahap_keterangan: String(row[31] || ''),
              nama_pengusul: String(row[32] || ''),
              // Hanya tambah kolom berikut jika ada di database
              ...(hasImportedAtColumn && { imported_at: new Date().toISOString() }),
              ...(hasImportBatchColumn && { import_batch: batchId })
            };

            pipList.push(pip);
          }

          console.log(`Processed ${pipList.length} rows from Excel`);

          if (pipList.length === 0) {
            throw new Error('Tidak ada data yang ditemukan dalam file Excel');
          }

          // Insert data dalam batch
          const batchSize = 50; // Ukuran batch lebih kecil untuk menghindari timeout
          let totalInserted = 0;
          let errors = [];
          
          for (let i = 0; i < pipList.length; i += batchSize) {
            const batch = pipList.slice(i, i + batchSize);
            
            // Validasi batch sebelum insert
            const validBatch = batch.filter(item => item.nama_pd && item.peserta_didik_id);
            
            if (validBatch.length > 0) {
              try {
                const { error: insertError } = await supabase
                  .from('pip_data')
                  .upsert(validBatch, {
                    onConflict: 'peserta_didik_id',
                    ignoreDuplicates: false
                  });

                if (insertError) {
                  console.error('Error inserting batch:', insertError);
                  errors.push(insertError.message);
                  
                  // Coba insert tanpa kolom yang mungkin bermasalah
                  const cleanBatch = validBatch.map(item => {
                    const { imported_at, import_batch, ...cleanItem } = item;
                    return cleanItem;
                  });
                  
                  const { error: retryError } = await supabase
                    .from('pip_data')
                    .upsert(cleanBatch, {
                      onConflict: 'peserta_didik_id',
                      ignoreDuplicates: false
                    });
                  
                  if (retryError) {
                    throw new Error(`Gagal menyimpan data: ${retryError.message}`);
                  }
                }
                
                totalInserted += validBatch.length;
                console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}: ${validBatch.length} records`);
              } catch (batchError) {
                console.error('Batch error:', batchError);
                errors.push(batchError.message);
              }
            }
          }

          setShowImportModal(false);
          setExcelFile(null);
          
          if (errors.length > 0) {
            setSuccessMessage(`Berhasil mengimport ${totalInserted} data dari ${pipList.length} data. Beberapa error: ${errors.slice(0, 3).join(', ')}`);
          } else {
            setSuccessMessage(`Berhasil mengimport ${totalInserted} data PIP dari total ${pipList.length} data`);
          }
          
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
      
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        setErrorMessage('Gagal membaca file Excel');
        setUploading(false);
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
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
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

  // Filter data berdasarkan pencarian
  const filteredData = pipData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.nama_pd?.toLowerCase().includes(searchLower) ||
      item.nisn?.toLowerCase().includes(searchLower) ||
      item.kelas?.toLowerCase().includes(searchLower) ||
      item.no_rekening?.includes(searchTerm)
    );
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
      return <span className="text-gray-400">-</span>;
    }

    if (column.key === 'tanggal_lahir' || column.key === 'tanggal_sk' || column.key === 'tanggal_cair') {
      return formatDate(value);
    }

    if (column.key === 'nominal') {
      return (
        <div className="font-semibold text-purple-700">
          {formatCurrency(value)}
        </div>
      );
    }

    if (column.key === 'status_cair') {
      return (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${value === 'Sudah Cair' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === 'Sudah Cair' 
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}>
            {value}
          </span>
        </div>
      );
    }

    if (column.key === 'nama_pd') {
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
            <FiUser size={14} className="text-blue-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500">{item.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
          </div>
        </div>
      );
    }

    return <div className="text-gray-700">{String(value)}</div>;
  };

  // Fungsi untuk export data ke Excel
  const exportToExcel = async () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(pipData.map(item => {
        const { no, imported_at, import_batch, ...rest } = item;
        return rest;
      }));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data PIP");
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `data-pip-${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      
      setSuccessMessage('Data berhasil diexport ke Excel');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setErrorMessage('Gagal mengexport data: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <span className="text-gray-700 font-medium">Memuat data PIP...</span>
        </div>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiX size={32} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
          <p className="text-gray-600 mb-6">Halaman ini hanya untuk administrator</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <AdminNavbar />
      
      <div className="pt-16">
        <div className="container mx-auto px-4 py-8">
          {/* Messages */}
          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <FiCheckCircle className="text-emerald-600" size={18} />
                </div>
                <span className="text-emerald-800 font-medium">{successMessage}</span>
              </div>
              <button 
                onClick={() => setSuccessMessage('')}
                className="text-emerald-600 hover:text-emerald-800 p-1 rounded-full hover:bg-emerald-100"
              >
                <FiX size={20} />
              </button>
            </div>
          )}
          
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm flex items-center gap-3 animate-fadeIn">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FiX className="text-red-600" size={18} />
              </div>
              <div>
                <span className="text-red-800 font-medium">{errorMessage}</span>
                {errorMessage.includes('schema cache') && (
                  <div className="mt-2">
                    <p className="text-sm text-red-600">
                      Periksa struktur tabel pip_data di database
                    </p>
                    <button
                      onClick={() => window.open('https://supabase.com/dashboard/project/_/editor', '_blank')}
                      className="text-sm text-blue-600 hover:text-blue-800 underline mt-1"
                    >
                      Buka Supabase Table Editor →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8">
              <div className="flex items-center gap-4 mb-6 lg:mb-0">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                  <MdSchool size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">
                    Data Penerima PIP
                  </h1>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FiHome size={16} />
                    <span className="font-medium">SMAN 1 REJOTANGAN</span>
                    <span className="text-gray-400">•</span>
                    <span>Program Indonesia Pintar 2025</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="inline-flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg hover:shadow-xl font-medium"
                >
                  <FiUpload size={20} />
                  <span>Import Excel</span>
                </button>
                <button
                  onClick={exportToExcel}
                  className="inline-flex items-center gap-3 px-6 py-3.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  <FiDownload size={20} />
                  <span>Export Excel</span>
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Penerima */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 hover:border-blue-200 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                    <FiUsers size={24} className="text-blue-600" />
                  </div>
                  <span className="text-3xl font-bold text-blue-700">{stats.total}</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Total Penerima</h3>
                <p className="text-xs text-gray-500">Seluruh Kelas</p>
              </div>

              {/* Sudah Cair */}
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-100 hover:border-emerald-200 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg flex items-center justify-center">
                    <FiCheckCircle size={24} className="text-emerald-600" />
                  </div>
                  <span className="text-3xl font-bold text-emerald-700">{stats.sudahCair}</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Sudah Cair</h3>
                <p className="text-xs text-emerald-600 font-medium">
                  {stats.total > 0 ? `${((stats.sudahCair / stats.total) * 100).toFixed(1)}% dari total` : '0% dari total'}
                </p>
              </div>

              {/* Belum Cair */}
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border border-amber-100 hover:border-amber-200 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center">
                    <FiClock size={24} className="text-amber-600" />
                  </div>
                  <span className="text-3xl font-bold text-amber-700">{stats.belumCair}</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Belum Cair</h3>
                <p className="text-xs text-amber-600 font-medium">
                  {stats.total > 0 ? `${((stats.belumCair / stats.total) * 100).toFixed(1)}% dari total` : '0% dari total'}
                </p>
              </div>

              {/* Total Dana */}
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-100 hover:border-purple-200 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                    <FiDollarSign size={24} className="text-purple-600" />
                  </div>
                  <span className="text-2xl font-bold text-purple-700">
                    {formatCurrency(stats.totalNominal).replace('Rp', '')}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Total Dana</h3>
                <p className="text-xs text-gray-500">Seluruh penerima</p>
              </div>
            </div>

            {/* Search and Controls */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <FiSearch size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Cari berdasarkan Nama, NISN, Kelas, atau No Rekening..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-sm"
                />
              </div>
              
              <div className="flex gap-3">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
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
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Table Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Daftar Penerima PIP</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredData.length} data ditemukan dari total {stats.total}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                    {columns.length} Kolom
                  </div>
                </div>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((column) => (
                      <th 
                        key={column.key}
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border-r border-gray-200 last:border-r-0"
                        style={{ minWidth: column.width }}
                      >
                        <div className="flex items-center gap-2">
                          {column.icon}
                          <span>{column.header}</span>
                        </div>
                      </th>
                    ))}
                    <th 
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-50"
                      style={{ minWidth: '160px' }}
                    >
                      <div className="flex items-center gap-2">
                        <FiGrid size={14} />
                        <span>Aksi</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentItems.map((item) => (
                    <tr 
                      key={item.peserta_didik_id} 
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      {columns.map((column) => (
                        <td 
                          key={`${item.peserta_didik_id}-${column.key}`}
                          className="px-6 py-4 text-sm border-r border-gray-100 last:border-r-0 group-hover:bg-blue-50/30"
                        >
                          <div className="truncate" style={{ maxWidth: column.width }} title={item[column.key]}>
                            {renderCell(item, column)}
                          </div>
                        </td>
                      ))}
                      <td className="px-6 py-4 group-hover:bg-blue-50/30">
                        <div className="flex flex-col gap-2 min-w-[160px]">
                          <button
                            onClick={() => openDetailModal(item)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 rounded-lg hover:from-blue-200 hover:to-blue-100 transition-all text-sm font-medium border border-blue-200 hover:border-blue-300"
                          >
                            <FiEye size={16} />
                            <span>Detail</span>
                          </button>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal(item)}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 rounded-lg hover:from-emerald-200 hover:to-emerald-100 transition-all text-sm font-medium border border-emerald-200 hover:border-emerald-300"
                            >
                              <FiEdit size={14} />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => openDeleteModal(item)}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-red-100 to-red-50 text-red-700 rounded-lg hover:from-red-200 hover:to-red-100 transition-all text-sm font-medium border border-red-200 hover:border-red-300"
                            >
                              <FiTrash2 size={14} />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredData.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FiDatabase size={32} className="text-gray-400" />
                  </div>
                  <p className="text-gray-700 text-lg font-medium mb-2">Tidak ada data PIP</p>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    {searchTerm ? `Tidak ditemukan data dengan pencarian "${searchTerm}"` : 'Klik tombol "Import Excel" untuk menambahkan data PIP'}
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {filteredData.length > 0 && (
              <div className="px-6 py-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Menampilkan <span className="font-semibold text-gray-900">{indexOfFirstItem + 1}</span> -{' '}
                  <span className="font-semibold text-gray-900">{Math.min(indexOfLastItem, filteredData.length)}</span> dari{' '}
                  <span className="font-semibold text-gray-900">{filteredData.length}</span> data
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2.5 rounded-lg transition-all ${
                      currentPage === 1 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FiChevronLeft size={20} />
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
                        className={`w-10 h-10 rounded-lg transition-all font-medium ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md'
                            : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2.5 rounded-lg transition-all ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FiChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <FiUpload size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Import Data PIP</h3>
                  <p className="text-sm text-gray-600">Dari file Excel SK PIP SMA 2025</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setExcelFile(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-8">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer bg-gradient-to-br from-gray-50 to-blue-50/50">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="pip-excel-upload"
                />
                <label htmlFor="pip-excel-upload" className="cursor-pointer block">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiDatabase size={28} className="text-blue-600" />
                  </div>
                  <p className="text-gray-900 font-medium mb-1">
                    {excelFile ? (
                      <span className="text-blue-600">{excelFile.name}</span>
                    ) : (
                      'Klik untuk memilih file Excel'
                    )}
                  </p>
                  <p className="text-sm text-gray-500">
                    Format: .xlsx atau .xls (Template PIP)
                  </p>
                </label>
              </div>
              
              {/* Petunjuk Import */}
              <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h4 className="font-medium text-amber-800 mb-2">Petunjuk Import:</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Pastikan file Excel sesuai template PIP</li>
                  <li>• Data akan dimulai dari baris ke-4</li>
                  <li>• Header berada di baris ke-3</li>
                  <li>• Data yang sama akan diupdate (upsert)</li>
                  <li>• Jika error, periksa struktur tabel pip_data di database</li>
                </ul>
              </div>
              
              {/* Database Structure Info */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Struktur Tabel pip_data:</h4>
                <p className="text-sm text-blue-700 mb-2">
                  Pastikan tabel memiliki kolom berikut minimal:
                </p>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li>• peserta_didik_id (text, primary key)</li>
                  <li>• nama_pd (text)</li>
                  <li>• nisn (text)</li>
                  <li>• nominal (integer)</li>
                  <li>• status_cair (text)</li>
                </ul>
                <button
                  onClick={() => window.open('https://supabase.com/dashboard/project/_/editor', '_blank')}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Periksa tabel di Supabase →
                </button>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-8 py-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setExcelFile(null);
                }}
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
              >
                Batal
              </button>
              <button
                onClick={importExcelToDatabase}
                disabled={!excelFile || uploading}
                className={`inline-flex items-center gap-3 px-6 py-2.5 rounded-lg transition-all font-medium ${
                  !excelFile || uploading
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800 shadow-md hover:shadow-lg'
                }`}
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Mengimport...</span>
                  </>
                ) : (
                  <>
                    <FiUpload size={18} />
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-gray-200">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-6 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md">
                  <FiUser size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Detail Data PIP</h3>
                  <p className="text-sm text-gray-600">SMAN 1 REJOTANGAN • {selectedData.nama_pd}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-8 space-y-8">
              {/* Profile Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <FiUser size={32} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-2xl text-gray-900 mb-3">{selectedData.nama_pd}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                        <div className="text-xs text-gray-500 mb-1">NISN</div>
                        <div className="font-semibold text-gray-900">{selectedData.nisn}</div>
                      </div>
                      <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                        <div className="text-xs text-gray-500 mb-1">Kelas</div>
                        <div className="font-semibold text-gray-900">{selectedData.kelas} {selectedData.rombel}</div>
                      </div>
                      <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                        <div className="text-xs text-gray-500 mb-1">Tanggal Lahir</div>
                        <div className="font-semibold text-gray-900">{formatDate(selectedData.tanggal_lahir)}</div>
                      </div>
                      <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
                        <div className="text-xs text-gray-500 mb-1">Jenis Kelamin</div>
                        <div className="font-semibold text-gray-900">
                          {selectedData.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid Data */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Data PIP */}
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                        <FiDollarSign size={20} className="text-purple-600" />
                      </div>
                      <h5 className="font-bold text-lg text-gray-900">Data PIP</h5>
                    </div>
                    <div className="space-y-5">
                      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                        <div>
                          <div className="text-sm text-gray-600">Nominal</div>
                          <div className="text-2xl font-bold text-purple-700">{formatCurrency(selectedData.nominal)}</div>
                        </div>
                        <div className={`px-4 py-2 rounded-full font-medium ${
                          selectedData.status_cair === 'Sudah Cair'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {selectedData.status_cair}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Tanggal Cair</div>
                        <div className="font-medium text-gray-900">{formatDate(selectedData.tanggal_cair)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Layak PIP</div>
                        <div className="font-medium text-gray-900">{selectedData.layak_pip}</div>
                      </div>
                    </div>
                  </div>

                  {/* Data Rekening */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                        <FiCreditCard size={20} className="text-blue-600" />
                      </div>
                      <h5 className="font-bold text-lg text-gray-900">Data Rekening</h5>
                    </div>
                    <div className="space-y-5">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">No Rekening</div>
                        <div className="font-medium text-gray-900 text-lg">{selectedData.no_rekening}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Nama Rekening</div>
                        <div className="font-medium text-gray-900">{selectedData.nama_rekening}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Virtual Account</div>
                        <div className="font-medium text-gray-900">{selectedData.virtual_acc}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data SK dan Administrasi */}
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg flex items-center justify-center">
                        <FiFileText size={20} className="text-emerald-600" />
                      </div>
                      <h5 className="font-bold text-lg text-gray-900">Data SK</h5>
                    </div>
                    <div className="space-y-5">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Nomor SK</div>
                        <div className="font-medium text-gray-900">{selectedData.nomor_sk}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Tanggal SK</div>
                        <div className="font-medium text-gray-900">{formatDate(selectedData.tanggal_sk)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Tahap ID</div>
                        <div className="font-medium text-gray-900">{selectedData.tahap_id}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Keterangan Tahap</div>
                        <div className="font-medium text-gray-900">{selectedData.tahap_keterangan}</div>
                      </div>
                    </div>
                  </div>

                  {/* Data Bantuan */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center">
                        <FiUsers size={20} className="text-amber-600" />
                      </div>
                      <h5 className="font-bold text-lg text-gray-900">Data Bantuan</h5>
                    </div>
                    <div className="space-y-5">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">No KIP</div>
                        <div className="font-medium text-gray-900">{selectedData.no_kip || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">No KKS</div>
                        <div className="font-medium text-gray-900">{selectedData.no_kks || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">No KPS</div>
                        <div className="font-medium text-gray-900">{selectedData.no_kps || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Nama Pengusul</div>
                        <div className="font-medium text-gray-900">{selectedData.nama_pengusul}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Keterangan */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                    <MdDescription size={20} className="text-gray-600" />
                  </div>
                  <h5 className="font-bold text-lg text-gray-900">Keterangan Pencairan</h5>
                </div>
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <p className="text-gray-700">{selectedData.keterangan_pencairan || 'Tidak ada keterangan'}</p>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-8 py-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-emerald-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg flex items-center justify-center">
                  <FiEdit size={20} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Edit Data PIP</h3>
                  <p className="text-sm text-gray-600">{selectedData.nama_pd}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>
            
            {/* Form */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status Cair</label>
                  <select
                    value={editForm.status_cair || ''}
                    onChange={(e) => setEditForm({...editForm, status_cair: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                  >
                    <option value="Sudah Cair">Sudah Cair</option>
                    <option value="Belum Cair">Belum Cair</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal Cair</label>
                  <input
                    type="date"
                    value={editForm.tanggal_cair || ''}
                    onChange={(e) => setEditForm({...editForm, tanggal_cair: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nominal (Rp)</label>
                  <input
                    type="number"
                    value={editForm.nominal || 0}
                    onChange={(e) => setEditForm({...editForm, nominal: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">No Rekening</label>
                  <input
                    type="text"
                    value={editForm.no_rekening || ''}
                    onChange={(e) => setEditForm({...editForm, no_rekening: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Keterangan Pencairan</label>
                  <textarea
                    value={editForm.keterangan_pencairan || ''}
                    onChange={(e) => setEditForm({...editForm, keterangan_pencairan: e.target.value})}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                  />
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-8 py-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-5 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleEditPIP}
                className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all font-medium"
              >
                <FiSave size={18} />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-red-50 to-red-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-200 rounded-lg flex items-center justify-center">
                  <FiTrash2 size={20} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Hapus Data PIP</h3>
                  <p className="text-sm text-gray-600">Konfirmasi penghapusan</p>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-red-100 rounded-full">
                  <FiTrash2 size={24} className="text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-3">Anda akan menghapus data PIP:</p>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                    <p className="text-lg font-bold text-red-700 mb-1">{selectedData.nama_pd}</p>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>NISN: {selectedData.nisn || '-'}</p>
                      <p>Kelas: {selectedData.kelas} {selectedData.rombel}</p>
                      <p>Nominal: {formatCurrency(selectedData.nominal)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-start gap-2">
                  <FiX size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800">
                    <span className="font-semibold">Perhatian:</span> Data yang dihapus tidak dapat dikembalikan.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-8 py-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium"
              >
                Batalkan
              </button>
              <button
                onClick={handleDeletePIP}
                className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-medium"
              >
                <FiTrash2 size={18} />
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
