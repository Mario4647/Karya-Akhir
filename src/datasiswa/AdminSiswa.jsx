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
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const tableRef = useRef(null);
  const navigate = useNavigate();

  // Daftar kolom dari Excel (disesuaikan dengan file yang diberikan)
  const columns = [
    { key: 'no', header: 'No', width: '50px' },
    { key: 'nama', header: 'Nama', width: '200px' },
    { key: 'nipd', header: 'NIPD', width: '100px' },
    { key: 'jk', header: 'JK', width: '50px' },
    { key: 'nisn', header: 'NISN', width: '100px' },
    { key: 'tempat_lahir', header: 'Tempat Lahir', width: '120px' },
    { key: 'tanggal_lahir', header: 'Tgl Lahir', width: '100px' },
    { key: 'nik', header: 'NIK', width: '120px' },
    { key: 'agama', header: 'Agama', width: '80px' },
    { key: 'alamat', header: 'Alamat', width: '150px' },
    { key: 'rt', header: 'RT', width: '50px' },
    { key: 'rw', header: 'RW', width: '50px' },
    { key: 'dusun', header: 'Dusun', width: '100px' },
    { key: 'kelurahan', header: 'Kelurahan', width: '120px' },
    { key: 'kecamatan', header: 'Kecamatan', width: '120px' },
    { key: 'kode_pos', header: 'Kode Pos', width: '80px' },
    { key: 'jenis_tinggal', header: 'Jenis Tinggal', width: '100px' },
    { key: 'alat_transportasi', header: 'Alat Transport', width: '100px' },
    { key: 'telepon', header: 'Telepon', width: '100px' },
    { key: 'hp', header: 'HP', width: '100px' },
    { key: 'email', header: 'Email', width: '150px' },
    { key: 'skhun', header: 'SKHUN', width: '80px' },
    { key: 'penerima_kps', header: 'Penerima KPS', width: '80px' },
    { key: 'no_kps', header: 'No KPS', width: '100px' },
    { key: 'nama_ayah', header: 'Nama Ayah', width: '150px' },
    { key: 'tahun_lahir_ayah', header: 'TL Ayah', width: '80px' },
    { key: 'jenjang_ayah', header: 'Jenjang Ayah', width: '100px' },
    { key: 'pekerjaan_ayah', header: 'Pekerjaan Ayah', width: '120px' },
    { key: 'penghasilan_ayah', header: 'Penghasilan Ayah', width: '120px' },
    { key: 'nik_ayah', header: 'NIK Ayah', width: '120px' },
    { key: 'nama_ibu', header: 'Nama Ibu', width: '150px' },
    { key: 'tahun_lahir_ibu', header: 'TL Ibu', width: '80px' },
    { key: 'jenjang_ibu', header: 'Jenjang Ibu', width: '100px' },
    { key: 'pekerjaan_ibu', header: 'Pekerjaan Ibu', width: '120px' },
    { key: 'penghasilan_ibu', header: 'Penghasilan Ibu', width: '120px' },
    { key: 'nik_ibu', header: 'NIK Ibu', width: '120px' },
    { key: 'nama_wali', header: 'Nama Wali', width: '150px' },
    { key: 'tahun_lahir_wali', header: 'TL Wali', width: '80px' },
    { key: 'jenjang_wali', header: 'Jenjang Wali', width: '100px' },
    { key: 'pekerjaan_wali', header: 'Pekerjaan Wali', width: '120px' },
    { key: 'penghasilan_wali', header: 'Penghasilan Wali', width: '120px' },
    { key: 'nik_wali', header: 'NIK Wali', width: '120px' },
    { key: 'rombel', header: 'Rombel', width: '80px' },
    { key: 'no_peserta_ujian', header: 'No Ujian', width: '100px' },
    { key: 'no_seri_ijazah', header: 'No Ijazah', width: '100px' },
    { key: 'penerima_kip', header: 'Penerima KIP', width: '80px' },
    { key: 'nomor_kip', header: 'Nomor KIP', width: '100px' },
    { key: 'nama_di_kip', header: 'Nama di KIP', width: '120px' },
    { key: 'nomor_kks', header: 'No KKS', width: '100px' },
    { key: 'no_reg_akta', header: 'No Akta', width: '100px' },
    { key: 'bank', header: 'Bank', width: '80px' },
    { key: 'no_rekening', header: 'No Rekening', width: '120px' },
    { key: 'rekening_atas_nama', header: 'Rek Atas Nama', width: '150px' },
    { key: 'layak_pip', header: 'Layak PIP', width: '80px' },
    { key: 'alasan_layak_pip', header: 'Alasan PIP', width: '150px' },
    { key: 'kebutuhan_khusus', header: 'Kebutuhan Khusus', width: '120px' },
    { key: 'sekolah_asal', header: 'Sekolah Asal', width: '150px' },
    { key: 'anak_ke', header: 'Anak Ke', width: '60px' },
    { key: 'lintang', header: 'Lintang', width: '100px' },
    { key: 'bujur', header: 'Bujur', width: '100px' },
    { key: 'no_kk', header: 'No KK', width: '120px' },
    { key: 'berat_badan', header: 'Berat Badan', width: '80px' },
    { key: 'tinggi_badan', header: 'Tinggi Badan', width: '80px' },
    { key: 'lingkar_kepala', header: 'Lingkar Kepala', width: '80px' },
    { key: 'jml_saudara', header: 'Jml Saudara', width: '80px' },
    { key: 'jarak_sekolah', header: 'Jarak Sekolah', width: '100px' }
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
      
      const { data, error } = await supabase
        .from('siswa')
        .select('*')
        .order('no', { ascending: true });

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

          // Cari baris mulai data (setelah header metadata)
          let startRow = 0;
          for (let i = 0; i < jsonData.length; i++) {
            if (jsonData[i][0] === 'No') {
              startRow = i + 1;
              break;
            }
          }

          const siswaList = [];
          
          // Proses setiap baris data
          for (let i = startRow; i < jsonData.length; i++) {
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

          // Insert ke database
          const { error } = await supabase
            .from('siswa')
            .upsert(siswaList, { onConflict: 'nisn' });

          if (error) throw error;

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

  // Handle scroll untuk tabel
  const handleScroll = (e) => {
    if (tableRef.current) {
      setScrollPosition({
        x: tableRef.current.scrollLeft,
        y: tableRef.current.scrollTop
      });
    }
  };

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

    return String(value);
  };

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
                  Data Siswa SMAN 1 REJOTANGAN
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
                <div className="text-sm text-blue-600 mb-1">Total Siswa</div>
                <div className="text-2xl font-bold text-blue-700">{siswaData.length}</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <div className="text-sm text-green-600 mb-1">Laki-laki</div>
                <div className="text-2xl font-bold text-green-700">
                  {siswaData.filter(s => s.jk === 'L').length}
                </div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <div className="text-sm text-purple-600 mb-1">Perempuan</div>
                <div className="text-2xl font-bold text-purple-700">
                  {siswaData.filter(s => s.jk === 'P').length}
                </div>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                <div className="text-sm text-orange-600 mb-1">Layak PIP</div>
                <div className="text-2xl font-bold text-orange-700">
                  {siswaData.filter(s => s.layak_pip === 'Ya').length}
                </div>
              </div>
            </div>

            {/* Search */}
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
                  <option value="25">25 data</option>
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
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Menampilkan semua {columns.length} kolom data siswa
              </p>
            </div>

            <div className="overflow-auto rounded-lg border border-gray-200" ref={tableRef} onScroll={handleScroll}>
              <table className="w-full min-w-max">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {columns.map((column) => (
                      <th 
                        key={column.key}
                        className="px-3 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap border-r border-gray-200 last:border-r-0"
                        style={{ minWidth: column.width }}
                      >
                        {column.header}
                      </th>
                    ))}
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap bg-gray-50 sticky right-0">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentItems.map((siswa, index) => (
                    <tr key={siswa.id} className="hover:bg-gray-50 transition-colors">
                      {columns.map((column) => (
                        <td 
                          key={`${siswa.id}-${column.key}`}
                          className="px-3 py-2 text-sm text-gray-800 whitespace-nowrap border-r border-gray-100 last:border-r-0"
                        >
                          <div className="truncate max-w-xs" title={renderCell(siswa, column)}>
                            {renderCell(siswa, column)}
                          </div>
                        </td>
                      ))}
                      <td className="px-3 py-2 bg-white sticky right-0 border-l border-gray-200">
                        <div className="flex flex-col gap-1 min-w-[120px]">
                          <button
                            onClick={() => openDetailModal(siswa)}
                            className="inline-flex items-center justify-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-xs w-full"
                          >
                            👁️ Detail
                          </button>
                          <button
                            onClick={() => openDeleteModal(siswa)}
                            className="inline-flex items-center justify-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-xs w-full"
                          >
                            🗑️ Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredSiswa.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl text-gray-300 mb-3">👨‍🎓</div>
                  <p className="text-gray-600">Belum ada data siswa</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Klik tombol "Import Excel" untuk menambahkan data
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {filteredSiswa.length > 0 && (
              <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredSiswa.length)} dari {filteredSiswa.length} data
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
              <h3 className="text-xl font-bold text-gray-800">Import Data Siswa dari Excel</h3>
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
                  Upload file Excel yang berisi data siswa SMAN 1 REJOTANGAN
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
      {showDetailModal && selectedSiswa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
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
              {/* Header Info */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-bold text-lg text-gray-800 mb-1">{selectedSiswa.nama}</h4>
                <p className="text-sm text-gray-600">
                  No: {selectedSiswa.no} | NISN: {selectedSiswa.nisn || '-'} | NIPD: {selectedSiswa.nipd || '-'}
                </p>
                <p className="text-sm text-gray-600">
                  Rombel: {selectedSiswa.rombel || '-'} | Jenis Kelamin: {selectedSiswa.jk === 'L' ? 'Laki-laki' : 'Perempuan'}
                </p>
              </div>

              {/* Data Siswa dalam Grid 2 Kolom */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Kolom 1: Data Pribadi */}
                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-800 border-b pb-2">Data Pribadi</h5>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Tempat Lahir</label>
                      <p className="text-gray-900">{selectedSiswa.tempat_lahir || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Lahir</label>
                      <p className="text-gray-900">{formatDate(selectedSiswa.tanggal_lahir)}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Agama</label>
                      <p className="text-gray-900">{selectedSiswa.agama || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">NIK</label>
                      <p className="text-gray-900">{selectedSiswa.nik || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Jenis Tinggal</label>
                      <p className="text-gray-900">{selectedSiswa.jenis_tinggal || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Alat Transportasi</label>
                      <p className="text-gray-900">{selectedSiswa.alat_transportasi || '-'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Alamat Lengkap</label>
                    <p className="text-gray-900">
                      {selectedSiswa.alamat || '-'}<br />
                      RT {selectedSiswa.rt || '-'}/RW {selectedSiswa.rw || '-'}, {selectedSiswa.dusun || '-'}<br />
                      {selectedSiswa.kelurahan || '-'}, {selectedSiswa.kecamatan || '-'}<br />
                      Kode Pos: {selectedSiswa.kode_pos || '-'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Telepon</label>
                      <p className="text-gray-900">{selectedSiswa.telepon || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">HP</label>
                      <p className="text-gray-900">{selectedSiswa.hp || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                      <p className="text-gray-900">{selectedSiswa.email || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">SKHUN</label>
                      <p className="text-gray-900">{selectedSiswa.skhun || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Kolom 2: Data Keluarga */}
                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-800 border-b pb-2">Data Keluarga & Sekolah</h5>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">No KK</label>
                    <p className="text-gray-900">{selectedSiswa.no_kk || '-'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Anak Ke</label>
                      <p className="text-gray-900">{selectedSiswa.anak_ke || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Jumlah Saudara</label>
                      <p className="text-gray-900">{selectedSiswa.jml_saudara || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Berat Badan</label>
                      <p className="text-gray-900">{selectedSiswa.berat_badan || '-'} kg</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Tinggi Badan</label>
                      <p className="text-gray-900">{selectedSiswa.tinggi_badan || '-'} cm</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Lingkar Kepala</label>
                      <p className="text-gray-900">{selectedSiswa.lingkar_kepala || '-'} cm</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Jarak Sekolah</label>
                      <p className="text-gray-900">{selectedSiswa.jarak_sekolah || '-'} km</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Sekolah Asal</label>
                    <p className="text-gray-900">{selectedSiswa.sekolah_asal || '-'}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Rombel Saat Ini</label>
                    <p className="text-gray-900">{selectedSiswa.rombel || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Data Orang Tua */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Data Ayah */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h6 className="font-semibold text-gray-800 mb-3">Data Ayah</h6>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600">Nama</label>
                      <p className="text-gray-900">{selectedSiswa.nama_ayah || '-'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600">Tahun Lahir</label>
                        <p className="text-gray-900">{selectedSiswa.tahun_lahir_ayah || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600">Jenjang</label>
                        <p className="text-gray-900">{selectedSiswa.jenjang_ayah || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Pekerjaan</label>
                      <p className="text-gray-900">{selectedSiswa.pekerjaan_ayah || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Penghasilan</label>
                      <p className="text-gray-900">{selectedSiswa.penghasilan_ayah || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">NIK</label>
                      <p className="text-gray-900">{selectedSiswa.nik_ayah || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Data Ibu */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h6 className="font-semibold text-gray-800 mb-3">Data Ibu</h6>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600">Nama</label>
                      <p className="text-gray-900">{selectedSiswa.nama_ibu || '-'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600">Tahun Lahir</label>
                        <p className="text-gray-900">{selectedSiswa.tahun_lahir_ibu || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600">Jenjang</label>
                        <p className="text-gray-900">{selectedSiswa.jenjang_ibu || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Pekerjaan</label>
                      <p className="text-gray-900">{selectedSiswa.pekerjaan_ibu || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Penghasilan</label>
                      <p className="text-gray-900">{selectedSiswa.penghasilan_ibu || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">NIK</label>
                      <p className="text-gray-900">{selectedSiswa.nik_ibu || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Data Wali */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h6 className="font-semibold text-gray-800 mb-3">Data Wali</h6>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600">Nama</label>
                      <p className="text-gray-900">{selectedSiswa.nama_wali || '-'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600">Tahun Lahir</label>
                        <p className="text-gray-900">{selectedSiswa.tahun_lahir_wali || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600">Jenjang</label>
                        <p className="text-gray-900">{selectedSiswa.jenjang_wali || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Pekerjaan</label>
                      <p className="text-gray-900">{selectedSiswa.pekerjaan_wali || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Penghasilan</label>
                      <p className="text-gray-900">{selectedSiswa.penghasilan_wali || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">NIK</label>
                      <p className="text-gray-900">{selectedSiswa.nik_wali || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Bantuan */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <label className="block text-xs font-medium text-gray-600">Penerima KPS</label>
                  <p className="text-gray-900 font-medium">{selectedSiswa.penerima_kps || '-'}</p>
                  <p className="text-xs text-gray-600">No: {selectedSiswa.no_kps || '-'}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <label className="block text-xs font-medium text-gray-600">Penerima KIP</label>
                  <p className="text-gray-900 font-medium">{selectedSiswa.penerima_kip || '-'}</p>
                  <p className="text-xs text-gray-600">No: {selectedSiswa.nomor_kip || '-'}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <label className="block text-xs font-medium text-gray-600">Layak PIP</label>
                  <p className="text-gray-900 font-medium">{selectedSiswa.layak_pip || '-'}</p>
                  <p className="text-xs text-gray-600">{selectedSiswa.alasan_layak_pip || ''}</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <label className="block text-xs font-medium text-gray-600">Kebutuhan Khusus</label>
                  <p className="text-gray-900 font-medium">{selectedSiswa.kebutuhan_khusus || '-'}</p>
                </div>
              </div>

              {/* Data Koordinat dan Bank */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h6 className="font-semibold text-gray-800 mb-3">Koordinat</h6>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600">Lintang</label>
                      <p className="text-gray-900">{selectedSiswa.lintang || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Bujur</label>
                      <p className="text-gray-900">{selectedSiswa.bujur || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h6 className="font-semibold text-gray-800 mb-3">Data Bank</h6>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600">Bank</label>
                      <p className="text-gray-900">{selectedSiswa.bank || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">No Rekening</label>
                      <p className="text-gray-900">{selectedSiswa.no_rekening || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Rekening Atas Nama</label>
                      <p className="text-gray-900">{selectedSiswa.rekening_atas_nama || '-'}</p>
                    </div>
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
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedSiswa && (
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
                  <p className="font-medium text-gray-900 mb-2">Hapus data siswa: {selectedSiswa.nama}</p>
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
                onClick={handleDeleteSiswa}
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

export default AdminSiswa;
