import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AdminNavbar from '../components/AdminNavbar';
import * as XLSX from 'xlsx';

const AdminSiswa = () => {
  const [siswaData, setSiswaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const tableContainerRef = useRef(null);
  const navigate = useNavigate();

  // Daftar kolom dari Excel
  const columns = [
    { key: 'no', header: 'No', width: '60px' },
    { key: 'nama', header: 'Nama', width: '200px' },
    { key: 'nipd', header: 'NIPD', width: '100px' },
    { key: 'jk', header: 'JK', width: '50px' },
    { key: 'nisn', header: 'NISN', width: '120px' },
    { key: 'tempat_lahir', header: 'Tempat Lahir', width: '130px' },
    { key: 'tanggal_lahir', header: 'Tgl Lahir', width: '100px' },
    { key: 'nik', header: 'NIK', width: '140px' },
    { key: 'agama', header: 'Agama', width: '80px' },
    { key: 'alamat', header: 'Alamat', width: '180px' },
    { key: 'rt', header: 'RT', width: '50px' },
    { key: 'rw', header: 'RW', width: '50px' },
    { key: 'dusun', header: 'Dusun', width: '120px' },
    { key: 'kelurahan', header: 'Kelurahan', width: '130px' },
    { key: 'kecamatan', header: 'Kecamatan', width: '130px' },
    { key: 'kode_pos', header: 'Kode Pos', width: '90px' },
    { key: 'jenis_tinggal', header: 'Jenis Tinggal', width: '110px' },
    { key: 'alat_transportasi', header: 'Alat Transport', width: '120px' },
    { key: 'telepon', header: 'Telepon', width: '110px' },
    { key: 'hp', header: 'HP', width: '110px' },
    { key: 'email', header: 'Email', width: '180px' },
    { key: 'skhun', header: 'SKHUN', width: '90px' },
    { key: 'penerima_kps', header: 'Penerima KPS', width: '100px' },
    { key: 'no_kps', header: 'No KPS', width: '110px' },
    { key: 'nama_ayah', header: 'Nama Ayah', width: '160px' },
    { key: 'tahun_lahir_ayah', header: 'TL Ayah', width: '80px' },
    { key: 'jenjang_ayah', header: 'Jenjang Ayah', width: '110px' },
    { key: 'pekerjaan_ayah', header: 'Pekerjaan Ayah', width: '130px' },
    { key: 'penghasilan_ayah', header: 'Penghasilan Ayah', width: '140px' },
    { key: 'nik_ayah', header: 'NIK Ayah', width: '140px' },
    { key: 'nama_ibu', header: 'Nama Ibu', width: '160px' },
    { key: 'tahun_lahir_ibu', header: 'TL Ibu', width: '80px' },
    { key: 'jenjang_ibu', header: 'Jenjang Ibu', width: '110px' },
    { key: 'pekerjaan_ibu', header: 'Pekerjaan Ibu', width: '130px' },
    { key: 'penghasilan_ibu', header: 'Penghasilan Ibu', width: '140px' },
    { key: 'nik_ibu', header: 'NIK Ibu', width: '140px' },
    { key: 'nama_wali', header: 'Nama Wali', width: '160px' },
    { key: 'tahun_lahir_wali', header: 'TL Wali', width: '80px' },
    { key: 'jenjang_wali', header: 'Jenjang Wali', width: '110px' },
    { key: 'pekerjaan_wali', header: 'Pekerjaan Wali', width: '130px' },
    { key: 'penghasilan_wali', header: 'Penghasilan Wali', width: '140px' },
    { key: 'nik_wali', header: 'NIK Wali', width: '140px' },
    { key: 'rombel', header: 'Rombel', width: '80px' },
    { key: 'no_peserta_ujian', header: 'No Ujian', width: '120px' },
    { key: 'no_seri_ijazah', header: 'No Ijazah', width: '120px' },
    { key: 'penerima_kip', header: 'Penerima KIP', width: '100px' },
    { key: 'nomor_kip', header: 'Nomor KIP', width: '120px' },
    { key: 'nama_di_kip', header: 'Nama di KIP', width: '130px' },
    { key: 'nomor_kks', header: 'No KKS', width: '110px' },
    { key: 'no_reg_akta', header: 'No Akta', width: '120px' },
    { key: 'bank', header: 'Bank', width: '90px' },
    { key: 'no_rekening', header: 'No Rekening', width: '130px' },
    { key: 'rekening_atas_nama', header: 'Rek Atas Nama', width: '160px' },
    { key: 'layak_pip', header: 'Layak PIP', width: '90px' },
    { key: 'alasan_layak_pip', header: 'Alasan PIP', width: '160px' },
    { key: 'kebutuhan_khusus', header: 'Kebutuhan Khusus', width: '130px' },
    { key: 'sekolah_asal', header: 'Sekolah Asal', width: '160px' },
    { key: 'anak_ke', header: 'Anak Ke', width: '70px' },
    { key: 'lintang', header: 'Lintang', width: '110px' },
    { key: 'bujur', header: 'Bujur', width: '110px' },
    { key: 'no_kk', header: 'No KK', width: '130px' },
    { key: 'berat_badan', header: 'Berat Badan', width: '90px' },
    { key: 'tinggi_badan', header: 'Tinggi Badan', width: '90px' },
    { key: 'lingkar_kepala', header: 'Lingkar Kepala', width: '100px' },
    { key: 'jml_saudara', header: 'Jml Saudara', width: '90px' },
    { key: 'jarak_sekolah', header: 'Jarak Sekolah', width: '110px' }
  ];

  useEffect(() => {
    checkAdminAccess();
    fetchSiswaData();
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

  const fetchSiswaData = async () => {
    try {
      setLoading(true);
      
      // Fetch semua data (maksimal 1300 untuk file Excel Anda)
      const { data, error } = await supabase
        .from('siswa')
        .select('*')
        .order('no', { ascending: true })

      if (error) throw error;

      setSiswaData(data || []);
    } catch (error) {
      console.error('Error fetching siswa data:', error);
      setErrorMessage('Gagal memuat data siswa: ' + error.message);
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

          // Cari baris mulai data
          let startRow = 0;
          for (let i = 0; i < jsonData.length; i++) {
            if (jsonData[i][0] === 'No') {
              startRow = i + 1;
              break;
            }
          }

          const siswaList = [];
          
          // Proses data dengan batas 1298 baris
          const maxRows = 2000; // Sesuai data Excel Anda
          for (let i = startRow; i < Math.min(jsonData.length, startRow + maxRows); i++) {
            const row = jsonData[i];
            if (!row[0] || row[0] === '' || isNaN(row[0])) continue;

            const siswa = {
              no: parseInt(row[0]) || 0,
              nama: row[1] || '',
              nipd: row[2]?.toString() || '',
              jk: row[3] || '',
              nisn: row[4]?.toString() || '',
              tempat_lahir: row[5] || '',
              tanggal_lahir: row[6] ? new Date(row[6]).toISOString().split('T')[0] : null,
              nik: row[7]?.toString() || '',
              agama: row[8] || '',
              alamat: row[9] || '',
              rt: row[10]?.toString() || '',
              rw: row[11]?.toString() || '',
              dusun: row[12] || '',
              kelurahan: row[13] || '',
              kecamatan: row[14] || '',
              kode_pos: row[15]?.toString() || '',
              jenis_tinggal: row[16] || '',
              alat_transportasi: row[17] || '',
              telepon: row[18]?.toString() || '',
              hp: row[19]?.toString() || '',
              email: row[20] || '',
              skhun: row[21] || '',
              penerima_kps: row[22] || '',
              no_kps: row[23]?.toString() || '',
              nama_ayah: row[24] || '',
              tahun_lahir_ayah: row[25]?.toString() || '',
              jenjang_ayah: row[26] || '',
              pekerjaan_ayah: row[27] || '',
              penghasilan_ayah: row[28] || '',
              nik_ayah: row[29]?.toString() || '',
              nama_ibu: row[30] || '',
              tahun_lahir_ibu: row[31]?.toString() || '',
              jenjang_ibu: row[32] || '',
              pekerjaan_ibu: row[33] || '',
              penghasilan_ibu: row[34] || '',
              nik_ibu: row[35]?.toString() || '',
              nama_wali: row[36] || '',
              tahun_lahir_wali: row[37]?.toString() || '',
              jenjang_wali: row[38] || '',
              pekerjaan_wali: row[39] || '',
              penghasilan_wali: row[40] || '',
              nik_wali: row[41]?.toString() || '',
              rombel: row[42] || '',
              no_peserta_ujian: row[43] || '',
              no_seri_ijazah: row[44] || '',
              penerima_kip: row[45] || '',
              nomor_kip: row[46]?.toString() || '',
              nama_di_kip: row[47]?.toString() || '',
              nomor_kks: row[48]?.toString() || '',
              no_reg_akta: row[49]?.toString() || '',
              bank: row[50] || '',
              no_rekening: row[51]?.toString() || '',
              rekening_atas_nama: row[52] || '',
              layak_pip: row[53] || '',
              alasan_layak_pip: row[54] || '',
              kebutuhan_khusus: row[55] || '',
              sekolah_asal: row[56] || '',
              anak_ke: row[57]?.toString() || '',
              lintang: row[58]?.toString() || '',
              bujur: row[59]?.toString() || '',
              no_kk: row[60]?.toString() || '',
              berat_badan: row[61] ? parseFloat(row[61]) : null,
              tinggi_badan: row[62] ? parseFloat(row[62]) : null,
              lingkar_kepala: row[63] ? parseFloat(row[63]) : null,
              jml_saudara: row[64]?.toString() || '',
              jarak_sekolah: row[65]?.toString() || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            siswaList.push(siswa);
          }

          // Clear existing data first (optional)
          const { error: deleteError } = await supabase
            .from('siswa')
            .delete()
            .gte('no', 1)
            .lte('no', maxRows);

          if (deleteError) console.warn('Warning clearing data:', deleteError.message);

          // Insert new data in batches
          const batchSize = 100;
          for (let i = 0; i < siswaList.length; i += batchSize) {
            const batch = siswaList.slice(i, i + batchSize);
            const { error: insertError } = await supabase
              .from('siswa')
              .upsert(batch, { onConflict: 'nisn' });

            if (insertError) {
              console.error('Error inserting batch:', insertError);
              throw insertError;
            }
          }

          setShowImportModal(false);
          setExcelFile(null);
          setSuccessMessage(`Berhasil mengimport ${siswaList.length} data siswa`);
          fetchSiswaData();
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

  const openDetailModal = (siswa) => {
    setSelectedSiswa(siswa);
    setShowDetailModal(true);
  };

  const openDeleteModal = (siswa) => {
    setSelectedSiswa(siswa);
    setShowDeleteModal(true);
  };

  const handleDeleteSiswa = async () => {
    try {
      const { error } = await supabase
        .from('siswa')
        .delete()
        .eq('id', selectedSiswa.id);

      if (error) throw error;

      setShowDeleteModal(false);
      setSuccessMessage('Data siswa berhasil dihapus');
      fetchSiswaData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting siswa:', error);
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

  // Filter data berdasarkan pencarian NAMA
  const filteredSiswa = siswaData.filter(siswa => {
    return siswa.nama?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSiswa.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSiswa.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Function to render cell content
  const renderCell = (siswa, column) => {
    const value = siswa[column.key];
    
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    if (column.key === 'jk') {
      return value === 'L' ? 'L' : value === 'P' ? 'P' : value;
    }

    if (column.key === 'tanggal_lahir') {
      return formatDate(value);
    }

    if (column.key === 'nama') {
      return <div className="font-medium text-gray-900">{value}</div>;
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    return String(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-blue-700 font-medium">Memuat data siswa...</span>
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
                  Data Siswa SMAN 1 REJOTANGAN
                </h1>
                <p className="text-gray-600">
                  Kecamatan Kec. Rejotangan, Kabupaten Kab. Tulungagung, Provinsi Prov. Jawa Timur
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
                <div className="text-sm text-blue-600 mb-1">Total Siswa</div>
                <div className="text-2xl font-bold text-blue-700">{siswaData.length}</div>
                <div className="text-xs text-blue-500 mt-1">Maks: 1298 data</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="text-sm text-green-600 mb-1">Laki-laki</div>
                <div className="text-2xl font-bold text-green-700">
                  {siswaData.filter(s => s.jk === 'L').length}
                </div>
                <div className="text-xs text-green-500 mt-1">
                  {((siswaData.filter(s => s.jk === 'L').length / siswaData.length) * 100 || 0).toFixed(1)}%
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="text-sm text-purple-600 mb-1">Perempuan</div>
                <div className="text-2xl font-bold text-purple-700">
                  {siswaData.filter(s => s.jk === 'P').length}
                </div>
                <div className="text-xs text-purple-500 mt-1">
                  {((siswaData.filter(s => s.jk === 'P').length / siswaData.length) * 100 || 0).toFixed(1)}%
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                <div className="text-sm text-orange-600 mb-1">Layak PIP</div>
                <div className="text-2xl font-bold text-orange-700">
                  {siswaData.filter(s => s.layak_pip === 'Ya').length}
                </div>
                <div className="text-xs text-orange-500 mt-1">
                  {((siswaData.filter(s => s.layak_pip === 'Ya').length / siswaData.length) * 100 || 0).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Search and Controls */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Cari siswa berdasarkan nama..."
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
                  <option value="25">25 per halaman</option>
                  <option value="50">50 per halaman</option>
                  <option value="100">100 per halaman</option>
                  <option value="200">200 per halaman</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Daftar Siswa</h2>
                <p className="text-sm text-gray-600">
                  Menampilkan semua {columns.length} kolom data
                </p>
              </div>
              <div className="text-sm text-gray-600">
                {filteredSiswa.length} siswa ditemukan
              </div>
            </div>

            <div 
              className="overflow-x-auto rounded-lg border border-gray-200" 
              ref={tableContainerRef}
              style={{ maxHeight: 'calc(100vh - 300px)' }}
            >
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
                          {column.key === 'nama' && (
                            <span className="text-xs text-gray-400">(search)</span>
                          )}
                        </div>
                      </th>
                    ))}
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-50 border-l border-gray-200"
                      style={{ minWidth: '120px' }}
                    >
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentItems.map((siswa) => (
                    <tr key={siswa.id} className="hover:bg-gray-50 transition-colors group">
                      {columns.map((column) => (
                        <td 
                          key={`${siswa.id}-${column.key}`}
                          className="px-4 py-2.5 text-sm text-gray-800 whitespace-nowrap border-r border-gray-100 last:border-r-0 group-hover:bg-gray-50"
                        >
                          <div className="truncate" style={{ maxWidth: column.width }} title={renderCell(siswa, column)}>
                            {renderCell(siswa, column)}
                          </div>
                        </td>
                      ))}
                      <td className="px-4 py-2.5 bg-white group-hover:bg-gray-50 border-l border-gray-100">
                        <div className="flex flex-col gap-1.5 min-w-[120px]">
                          <button
                            onClick={() => openDetailModal(siswa)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 transition-all text-xs shadow-sm hover:shadow"
                          >
                            <span className="text-sm">👁️</span>
                            <span>Detail</span>
                          </button>
                          <button
                            onClick={() => openDeleteModal(siswa)}
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
              
              {filteredSiswa.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-5xl text-gray-300 mb-4">👨‍🎓</div>
                  <p className="text-gray-600 text-lg mb-2">Tidak ada data siswa</p>
                  <p className="text-sm text-gray-500">
                    {searchTerm ? `Tidak ditemukan siswa dengan nama "${searchTerm}"` : 'Klik tombol "Import Excel" untuk menambahkan data'}
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {filteredSiswa.length > 0 && (
              <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Menampilkan <span className="font-semibold">{indexOfFirstItem + 1}</span> - <span className="font-semibold">{Math.min(indexOfLastItem, filteredSiswa.length)}</span> dari <span className="font-semibold">{filteredSiswa.length}</span> siswa
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Import Data Siswa</h3>
                <p className="text-sm text-gray-600 mt-1">Dari file Excel SMAN 1 REJOTANGAN</p>
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
              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  Upload file Excel yang berisi data siswa
                </p>
                <div className="p-3 bg-blue-50 rounded-lg mb-2">
                  <p className="text-sm text-blue-700">
                    <span className="font-semibold">Format yang didukung:</span> File Excel Dapodik (.xlsx, .xls)
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Maksimal 1298 data (sesuai kapasitas file)
                  </p>
                </div>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-400 transition-colors cursor-pointer bg-gradient-to-br from-gray-50 to-white">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excel-upload"
                />
                <label htmlFor="excel-upload" className="cursor-pointer block">
                  <span className="text-5xl text-gray-400 mb-3 block">📊</span>
                  <p className="text-gray-700 font-medium">
                    {excelFile ? excelFile.name : 'Klik untuk memilih file'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Drag & drop atau klik untuk upload
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Format: .xlsx atau .xls (Maks 5MB)
                  </p>
                </label>
              </div>
              
              {excelFile && (
                <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-800 font-medium">
                        ✅ File siap diimport
                      </p>
                      <p className="text-xs text-green-600">
                        {excelFile.name} • {(excelFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => setExcelFile(null)}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              )}
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
      {showDetailModal && selectedSiswa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Detail Data Siswa</h3>
                <p className="text-sm text-gray-600 mt-1">SMAN 1 REJOTANGAN</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Profile Header */}
              <div className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl p-4 shadow-md">
                    <span className="text-2xl">👨‍🎓</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-2xl text-gray-800 mb-1">{selectedSiswa.nama}</h4>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">No:</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{selectedSiswa.no}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">NISN:</span>
                        <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded">{selectedSiswa.nisn || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">NIPD:</span>
                        <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded">{selectedSiswa.nipd || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Rombel:</span>
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">{selectedSiswa.rombel || '-'}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedSiswa.jk === 'L' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-pink-100 text-pink-800'
                      }`}>
                        {selectedSiswa.jk === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                        Agama: {selectedSiswa.agama || '-'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedSiswa.layak_pip === 'Ya'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        PIP: {selectedSiswa.layak_pip || 'Tidak'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid Layout - 2 Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Data Pribadi Card */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b">
                      <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                        <span className="text-blue-600">📋</span>
                        Data Pribadi
                      </h5>
                    </div>
                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Tempat Lahir</label>
                          <p className="text-gray-900 font-medium">{selectedSiswa.tempat_lahir || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Tanggal Lahir</label>
                          <p className="text-gray-900 font-medium">{formatDate(selectedSiswa.tanggal_lahir)}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">NIK</label>
                          <p className="text-gray-900">{selectedSiswa.nik || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">No KK</label>
                          <p className="text-gray-900">{selectedSiswa.no_kk || '-'}</p>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Alamat Lengkap</label>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-900 text-sm">
                              {selectedSiswa.alamat || '-'}<br/>
                              RT {selectedSiswa.rt || '-'}/RW {selectedSiswa.rw || '-'}, {selectedSiswa.dusun || '-'}<br/>
                              {selectedSiswa.kelurahan || '-'}, {selectedSiswa.kecamatan || '-'}<br/>
                              Kode Pos: {selectedSiswa.kode_pos || '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Kontak & Transportasi Card */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b">
                      <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                        <span className="text-green-600">📞</span>
                        Kontak & Transportasi
                      </h5>
                    </div>
                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Telepon</label>
                          <p className="text-gray-900">{selectedSiswa.telepon || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">HP</label>
                          <p className="text-gray-900">{selectedSiswa.hp || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                          <p className="text-gray-900 break-all">{selectedSiswa.email || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Alat Transportasi</label>
                          <p className="text-gray-900">{selectedSiswa.alat_transportasi || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Jenis Tinggal</label>
                          <p className="text-gray-900">{selectedSiswa.jenis_tinggal || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Jarak Sekolah</label>
                          <p className="text-gray-900">{selectedSiswa.jarak_sekolah || '-'} km</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Data Fisik Card */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b">
                      <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                        <span className="text-orange-600">⚖️</span>
                        Data Fisik
                      </h5>
                    </div>
                    <div className="p-5">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="bg-orange-50 rounded-lg p-3">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Berat Badan</label>
                            <p className="text-xl font-bold text-orange-700">
                              {selectedSiswa.berat_badan || '-'} <span className="text-sm font-normal">kg</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="bg-green-50 rounded-lg p-3">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Tinggi Badan</label>
                            <p className="text-xl font-bold text-green-700">
                              {selectedSiswa.tinggi_badan || '-'} <span className="text-sm font-normal">cm</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="bg-blue-50 rounded-lg p-3">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Lingkar Kepala</label>
                            <p className="text-xl font-bold text-blue-700">
                              {selectedSiswa.lingkar_kepala || '-'} <span className="text-sm font-normal">cm</span>
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Anak Ke</label>
                          <p className="text-gray-900">{selectedSiswa.anak_ke || '-'}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Jumlah Saudara</label>
                          <p className="text-gray-900">{selectedSiswa.jml_saudara || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Data Orang Tua Card */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b">
                      <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                        <span className="text-purple-600">👨‍👩‍👧‍👦</span>
                        Data Keluarga
                      </h5>
                    </div>
                    <div className="p-5">
                      <div className="space-y-4">
                        {/* Ayah */}
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-blue-600">👨</span>
                            <h6 className="font-semibold text-gray-800">Ayah</h6>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Nama:</span>
                              <p className="text-gray-900 font-medium">{selectedSiswa.nama_ayah || '-'}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Tahun Lahir:</span>
                              <p className="text-gray-900">{selectedSiswa.tahun_lahir_ayah || '-'}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Pekerjaan:</span>
                              <p className="text-gray-900">{selectedSiswa.pekerjaan_ayah || '-'}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Penghasilan:</span>
                              <p className="text-gray-900">{selectedSiswa.penghasilan_ayah || '-'}</p>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-600">Jenjang Pendidikan:</span>
                              <p className="text-gray-900">{selectedSiswa.jenjang_ayah || '-'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Ibu */}
                        <div className="bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-pink-600">👩</span>
                            <h6 className="font-semibold text-gray-800">Ibu</h6>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Nama:</span>
                              <p className="text-gray-900 font-medium">{selectedSiswa.nama_ibu || '-'}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Tahun Lahir:</span>
                              <p className="text-gray-900">{selectedSiswa.tahun_lahir_ibu || '-'}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Pekerjaan:</span>
                              <p className="text-gray-900">{selectedSiswa.pekerjaan_ibu || '-'}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Penghasilan:</span>
                              <p className="text-gray-900">{selectedSiswa.penghasilan_ibu || '-'}</p>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-600">Jenjang Pendidikan:</span>
                              <p className="text-gray-900">{selectedSiswa.jenjang_ibu || '-'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Wali */}
                        {selectedSiswa.nama_wali && (
                          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-gray-600">👤</span>
                              <h6 className="font-semibold text-gray-800">Wali</h6>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">Nama:</span>
                                <p className="text-gray-900 font-medium">{selectedSiswa.nama_wali || '-'}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Tahun Lahir:</span>
                                <p className="text-gray-900">{selectedSiswa.tahun_lahir_wali || '-'}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Pekerjaan:</span>
                                <p className="text-gray-900">{selectedSiswa.pekerjaan_wali || '-'}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Penghasilan:</span>
                                <p className="text-gray-900">{selectedSiswa.penghasilan_wali || '-'}</p>
                              </div>
                              <div className="col-span-2">
                                <span className="text-gray-600">Jenjang Pendidikan:</span>
                                <p className="text-gray-900">{selectedSiswa.jenjang_wali || '-'}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Data Sekolah & Bantuan Card */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b">
                      <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                        <span className="text-green-600">🏫</span>
                        Sekolah & Bantuan
                      </h5>
                    </div>
                    <div className="p-5">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Sekolah Asal</label>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-900">{selectedSiswa.sekolah_asal || '-'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">No Peserta Ujian</label>
                            <p className="text-gray-900">{selectedSiswa.no_peserta_ujian || '-'}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">No Seri Ijazah</label>
                            <p className="text-gray-900">{selectedSiswa.no_seri_ijazah || '-'}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">SKHUN</label>
                            <p className="text-gray-900">{selectedSiswa.skhun || '-'}</p>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">No Registrasi Akta</label>
                            <p className="text-gray-900">{selectedSiswa.no_reg_akta || '-'}</p>
                          </div>
                        </div>

                        {/* Bantuan */}
                        <div className="mt-4 space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3 text-center">
                              <div className="text-xs font-medium text-green-800 mb-1">KPS</div>
                              <div className={`text-sm font-bold ${
                                selectedSiswa.penerima_kps === 'Ya' ? 'text-green-700' : 'text-gray-600'
                              }`}>
                                {selectedSiswa.penerima_kps || 'Tidak'}
                              </div>
                              {selectedSiswa.no_kps && (
                                <div className="text-xs text-green-600 mt-1">{selectedSiswa.no_kps}</div>
                              )}
                            </div>
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 text-center">
                              <div className="text-xs font-medium text-blue-800 mb-1">KIP</div>
                              <div className={`text-sm font-bold ${
                                selectedSiswa.penerima_kip === 'Ya' ? 'text-blue-700' : 'text-gray-600'
                              }`}>
                                {selectedSiswa.penerima_kip || 'Tidak'}
                              </div>
                              {selectedSiswa.nomor_kip && (
                                <div className="text-xs text-blue-600 mt-1">{selectedSiswa.nomor_kip}</div>
                              )}
                            </div>
                            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-3 text-center">
                              <div className="text-xs font-medium text-purple-800 mb-1">KKS</div>
                              <div className="text-sm font-bold text-purple-700">
                                {selectedSiswa.nomor_kks || '-'}
                              </div>
                            </div>
                          </div>

                          {/* PIP */}
                          {selectedSiswa.layak_pip === 'Ya' && (
                            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-orange-600">🎯</span>
                                <span className="text-sm font-medium text-orange-800">LAYAK PIP</span>
                              </div>
                              <p className="text-xs text-orange-700">{selectedSiswa.alasan_layak_pip || 'Siswa Miskin/Rentan Miskin'}</p>
                            </div>
                          )}

                          {/* Kebutuhan Khusus */}
                          {selectedSiswa.kebutuhan_khusus && selectedSiswa.kebutuhan_khusus !== 'Tidak ada' && (
                            <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-red-600">⚠️</span>
                                <span className="text-sm font-medium text-red-800">Kebutuhan Khusus</span>
                              </div>
                              <p className="text-xs text-red-700">{selectedSiswa.kebutuhan_khusus}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Data Koordinat & Bank Card */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b">
                      <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                        <span className="text-indigo-600">📍</span>
                        Koordinat & Bank
                      </h5>
                    </div>
                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Lintang</label>
                          <div className="bg-gray-50 p-2 rounded">
                            <p className="text-gray-900 font-mono">{selectedSiswa.lintang || '-'}</p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Bujur</label>
                          <div className="bg-gray-50 p-2 rounded">
                            <p className="text-gray-900 font-mono">{selectedSiswa.bujur || '-'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Data Bank</label>
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Bank:</span>
                              <p className="text-gray-900">{selectedSiswa.bank || '-'}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">No Rekening:</span>
                              <p className="text-gray-900 font-mono">{selectedSiswa.no_rekening || '-'}</p>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-600">Atas Nama:</span>
                              <p className="text-gray-900 font-medium">{selectedSiswa.rekening_atas_nama || '-'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3 bg-gradient-to-r from-gray-50 to-gray-100">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium shadow-sm hover:shadow"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedSiswa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-red-50 to-red-100 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Hapus Data Siswa</h3>
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
                  <p className="font-medium text-gray-900 mb-2">Anda akan menghapus data siswa:</p>
                  <p className="text-lg font-bold text-red-700 mb-1">{selectedSiswa.nama}</p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>No: {selectedSiswa.no} • NISN: {selectedSiswa.nisn || '-'}</p>
                    <p>Rombel: {selectedSiswa.rombel || '-'} • {selectedSiswa.jk === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700">
                  ⚠️ <span className="font-semibold">Perhatian:</span> Tindakan ini akan menghapus data secara permanen dan tidak dapat dikembalikan.
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
                onClick={handleDeleteSiswa}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-medium shadow-md hover:shadow-lg"
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

export default AdminSiswa;
