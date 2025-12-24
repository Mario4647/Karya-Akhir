import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AdminNavbar from '../components/AdminNavbar';
import * as XLSX from 'xlsx';

const AdminSiswa = () => {
  const [siswaData, setSiswaData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [totalRows, setTotalRows] = useState(0);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [columnVisibility, setColumnVisibility] = useState({});
  const tableContainerRef = useRef(null);
  const navigate = useNavigate();

  // Daftar kolom dari Excel - diprioritaskan kolom penting dulu
  const columns = [
    { key: 'no', header: 'No', width: '60px', priority: 1 },
    { key: 'nama', header: 'Nama', width: '220px', priority: 1 },
    { key: 'nipd', header: 'NIPD', width: '100px', priority: 2 },
    { key: 'jk', header: 'JK', width: '50px', priority: 1 },
    { key: 'nisn', header: 'NISN', width: '120px', priority: 1 },
    { key: 'tempat_lahir', header: 'Tempat Lahir', width: '130px', priority: 2 },
    { key: 'tanggal_lahir', header: 'Tgl Lahir', width: '100px', priority: 2 },
    { key: 'nik', header: 'NIK', width: '140px', priority: 3 },
    { key: 'agama', header: 'Agama', width: '80px', priority: 2 },
    { key: 'alamat', header: 'Alamat', width: '200px', priority: 3 },
    { key: 'rt', header: 'RT', width: '50px', priority: 4 },
    { key: 'rw', header: 'RW', width: '50px', priority: 4 },
    { key: 'dusun', header: 'Dusun', width: '120px', priority: 4 },
    { key: 'kelurahan', header: 'Kelurahan', width: '130px', priority: 4 },
    { key: 'kecamatan', header: 'Kecamatan', width: '130px', priority: 3 },
    { key: 'kode_pos', header: 'Kode Pos', width: '90px', priority: 4 },
    { key: 'jenis_tinggal', header: 'Jenis Tinggal', width: '110px', priority: 3 },
    { key: 'alat_transportasi', header: 'Alat Transport', width: '120px', priority: 3 },
    { key: 'telepon', header: 'Telepon', width: '110px', priority: 4 },
    { key: 'hp', header: 'HP', width: '110px', priority: 3 },
    { key: 'email', header: 'Email', width: '180px', priority: 3 },
    { key: 'skhun', header: 'SKHUN', width: '90px', priority: 4 },
    { key: 'penerima_kps', header: 'Penerima KPS', width: '100px', priority: 3 },
    { key: 'no_kps', header: 'No KPS', width: '110px', priority: 4 },
    { key: 'nama_ayah', header: 'Nama Ayah', width: '160px', priority: 3 },
    { key: 'tahun_lahir_ayah', header: 'TL Ayah', width: '80px', priority: 4 },
    { key: 'jenjang_ayah', header: 'Jenjang Ayah', width: '110px', priority: 4 },
    { key: 'pekerjaan_ayah', header: 'Pekerjaan Ayah', width: '130px', priority: 4 },
    { key: 'penghasilan_ayah', header: 'Penghasilan Ayah', width: '140px', priority: 4 },
    { key: 'nik_ayah', header: 'NIK Ayah', width: '140px', priority: 4 },
    { key: 'nama_ibu', header: 'Nama Ibu', width: '160px', priority: 3 },
    { key: 'tahun_lahir_ibu', header: 'TL Ibu', width: '80px', priority: 4 },
    { key: 'jenjang_ibu', header: 'Jenjang Ibu', width: '110px', priority: 4 },
    { key: 'pekerjaan_ibu', header: 'Pekerjaan Ibu', width: '130px', priority: 4 },
    { key: 'penghasilan_ibu', header: 'Penghasilan Ibu', width: '140px', priority: 4 },
    { key: 'nik_ibu', header: 'NIK Ibu', width: '140px', priority: 4 },
    { key: 'nama_wali', header: 'Nama Wali', width: '160px', priority: 4 },
    { key: 'tahun_lahir_wali', header: 'TL Wali', width: '80px', priority: 4 },
    { key: 'jenjang_wali', header: 'Jenjang Wali', width: '110px', priority: 4 },
    { key: 'pekerjaan_wali', header: 'Pekerjaan Wali', width: '130px', priority: 4 },
    { key: 'penghasilan_wali', header: 'Penghasilan Wali', width: '140px', priority: 4 },
    { key: 'nik_wali', header: 'NIK Wali', width: '140px', priority: 4 },
    { key: 'rombel', header: 'Rombel', width: '80px', priority: 2 },
    { key: 'no_peserta_ujian', header: 'No Ujian', width: '120px', priority: 4 },
    { key: 'no_seri_ijazah', header: 'No Ijazah', width: '120px', priority: 4 },
    { key: 'penerima_kip', header: 'Penerima KIP', width: '100px', priority: 3 },
    { key: 'nomor_kip', header: 'Nomor KIP', width: '120px', priority: 4 },
    { key: 'nama_di_kip', header: 'Nama di KIP', width: '130px', priority: 4 },
    { key: 'nomor_kks', header: 'No KKS', width: '110px', priority: 4 },
    { key: 'no_reg_akta', header: 'No Akta', width: '120px', priority: 4 },
    { key: 'bank', header: 'Bank', width: '90px', priority: 4 },
    { key: 'no_rekening', header: 'No Rekening', width: '130px', priority: 4 },
    { key: 'rekening_atas_nama', header: 'Rek Atas Nama', width: '160px', priority: 4 },
    { key: 'layak_pip', header: 'Layak PIP', width: '90px', priority: 2 },
    { key: 'alasan_layak_pip', header: 'Alasan PIP', width: '160px', priority: 4 },
    { key: 'kebutuhan_khusus', header: 'Kebutuhan Khusus', width: '130px', priority: 3 },
    { key: 'sekolah_asal', header: 'Sekolah Asal', width: '160px', priority: 3 },
    { key: 'anak_ke', header: 'Anak Ke', width: '70px', priority: 4 },
    { key: 'lintang', header: 'Lintang', width: '110px', priority: 4 },
    { key: 'bujur', header: 'Bujur', width: '110px', priority: 4 },
    { key: 'no_kk', header: 'No KK', width: '130px', priority: 3 },
    { key: 'berat_badan', header: 'Berat Badan', width: '90px', priority: 4 },
    { key: 'tinggi_badan', header: 'Tinggi Badan', width: '90px', priority: 4 },
    { key: 'lingkar_kepala', header: 'Lingkar Kepala', width: '100px', priority: 4 },
    { key: 'jml_saudara', header: 'Jml Saudara', width: '90px', priority: 4 },
    { key: 'jarak_sekolah', header: 'Jarak Sekolah', width: '110px', priority: 4 }
  ];

  // Inisialisasi visibility semua kolom (semua terlihat)
  useEffect(() => {
    const initialVisibility = {};
    columns.forEach(col => {
      initialVisibility[col.key] = true;
    });
    setColumnVisibility(initialVisibility);
  }, []);

  useEffect(() => {
    checkAdminAccess();
    fetchTotalCount();
    fetchSiswaData();
  }, []);

  // Fetch data dengan pagination
  const fetchSiswaData = async (page = 1) => {
    try {
      setLoading(true);
      
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data, error, count } = await supabase
        .from('siswa')
        .select('*', { count: 'exact' })
        .order('no', { ascending: true })
        .range(from, to);

      if (error) throw error;

      setSiswaData(data || []);
      setFilteredData(data || []);
      setTotalRows(count || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching siswa data:', error);
      setErrorMessage('Gagal memuat data siswa: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch total count
  const fetchTotalCount = async () => {
    try {
      const { count, error } = await supabase
        .from('siswa')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      
      setTotalRows(count || 0);
    } catch (error) {
      console.error('Error fetching count:', error);
    }
  };

  // Optimized search with debounce
  const handleSearch = useCallback((searchValue) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (!searchValue.trim()) {
      setFilteredData(siswaData);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    const timeout = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('siswa')
          .select('*')
          .ilike('nama', `%${searchValue}%`)
          .order('no', { ascending: true })
          .limit(3000); // Batas hasil pencarian

        if (error) throw error;

        setFilteredData(data || []);
        setCurrentPage(1);
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    setSearchTimeout(timeout);
  }, [siswaData, searchTimeout]);

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

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setErrorMessage('Hanya file Excel (.xlsx atau .xls) yang diperbolehkan');
      return;
    }

    // Check file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('File terlalu besar. Maksimal 20MB');
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
          
          // Proses semua baris data
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
            
            // Update progress setiap 100 row
            if (siswaList.length % 100 === 0) {
              console.log(`Processed ${siswaList.length} rows...`);
            }
          }

          console.log(`Total rows to import: ${siswaList.length}`);

          // Import dalam batch untuk menghindari timeout
          const batchSize = 500;
          let importedCount = 0;
          
          for (let i = 0; i < siswaList.length; i += batchSize) {
            const batch = siswaList.slice(i, i + batchSize);
            
            const { error: insertError } = await supabase
              .from('siswa')
              .upsert(batch, { 
                onConflict: 'nisn',
                ignoreDuplicates: false 
              });

            if (insertError) {
              console.error('Error inserting batch:', insertError);
              throw insertError;
            }
            
            importedCount += batch.length;
            console.log(`Imported ${importedCount}/${siswaList.length} rows`);
            
            // Small delay antara batch untuk menghindari rate limit
            if (i + batchSize < siswaList.length) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }

          setShowImportModal(false);
          setExcelFile(null);
          setSuccessMessage(`✅ Berhasil mengimport ${siswaList.length} data siswa`);
          
          // Refresh data
          await fetchTotalCount();
          await fetchSiswaData(1);
          
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
      setSuccessMessage('✅ Data siswa berhasil dihapus');
      
      // Refresh data
      await fetchTotalCount();
      await fetchSiswaData(currentPage);
      
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

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    fetchSiswaData(1);
  };

  const renderCell = (siswa, column) => {
    const value = siswa[column.key];
    
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400">-</span>;
    }

    if (column.key === 'jk') {
      return (
        <span className={`font-bold ${value === 'L' ? 'text-blue-600' : 'text-pink-600'}`}>
          {value === 'L' ? 'L' : 'P'}
        </span>
      );
    }

    if (column.key === 'tanggal_lahir') {
      return formatDate(value);
    }

    if (column.key === 'nama') {
      return (
        <div 
          className="font-medium text-gray-900 truncate cursor-help" 
          title={value}
        >
          {value}
        </div>
      );
    }

    if (column.key === 'layak_pip') {
      return (
        <span className={`px-2 py-0.5 rounded text-xs ${value === 'Ya' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {value}
        </span>
      );
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    // Truncate long text
    const text = String(value);
    if (text.length > 30) {
      return (
        <span className="truncate" title={text}>
          {text.substring(0, 30)}...
        </span>
      );
    }

    return text;
  };

  const toggleColumnVisibility = (columnKey) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  const showAllColumns = () => {
    const allVisible = {};
    columns.forEach(col => {
      allVisible[col.key] = true;
    });
    setColumnVisibility(allVisible);
  };

  const showEssentialColumns = () => {
    const essentialVisible = {};
    columns.forEach(col => {
      essentialVisible[col.key] = col.priority <= 2;
    });
    setColumnVisibility(essentialVisible);
  };

  const exportToExcel = () => {
    try {
      // Prepare data
      const exportData = filteredData.map(siswa => {
        const row = {};
        columns.forEach(col => {
          row[col.header] = siswa[col.key] || '';
        });
        return row;
      });

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Siswa");

      // Export to file
      XLSX.writeFile(workbook, `data-siswa-sman1-rejotangan-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      setSuccessMessage('✅ Data berhasil diexport ke Excel');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setErrorMessage('Gagal mengexport data');
    }
  };

  // Hitung statistik
  const stats = {
    total: totalRows,
    lakiLaki: siswaData.filter(s => s.jk === 'L').length,
    perempuan: siswaData.filter(s => s.jk === 'P').length,
    layakPIP: siswaData.filter(s => s.layak_pip === 'Ya').length,
    penerimaKIP: siswaData.filter(s => s.penerima_kip === 'Ya').length
  };

  if (loading && currentPage === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-blue-700 font-medium">Memuat data siswa...</span>
          <span className="text-sm text-blue-600">Total data: {totalRows.toLocaleString()}</span>
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

  // Tampilkan kolom yang visible
  const visibleColumns = columns.filter(col => columnVisibility[col.key]);

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
                  Total Data: <span className="font-semibold text-blue-600">{totalRows.toLocaleString()}</span> siswa
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
                >
                  <span className="text-lg">📊</span>
                  <span>Import Excel</span>
                </button>
                <button
                  onClick={exportToExcel}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                  <span className="text-lg">📥</span>
                  <span>Export Excel</span>
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="text-sm text-blue-600 mb-1">Total Siswa</div>
                <div className="text-2xl font-bold text-blue-700">{stats.total.toLocaleString()}</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="text-sm text-green-600 mb-1">Laki-laki</div>
                <div className="text-2xl font-bold text-green-700">
                  {stats.lakiLaki.toLocaleString()}
                </div>
                <div className="text-xs text-green-500 mt-1">
                  {totalRows > 0 ? ((stats.lakiLaki / totalRows) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="text-sm text-purple-600 mb-1">Perempuan</div>
                <div className="text-2xl font-bold text-purple-700">
                  {stats.perempuan.toLocaleString()}
                </div>
                <div className="text-xs text-purple-500 mt-1">
                  {totalRows > 0 ? ((stats.perempuan / totalRows) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                <div className="text-sm text-orange-600 mb-1">Layak PIP</div>
                <div className="text-2xl font-bold text-orange-700">
                  {stats.layakPIP.toLocaleString()}
                </div>
                <div className="text-xs text-orange-500 mt-1">
                  {totalRows > 0 ? ((stats.layakPIP / totalRows) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border border-pink-200">
                <div className="text-sm text-pink-600 mb-1">Penerima KIP</div>
                <div className="text-2xl font-bold text-pink-700">
                  {stats.penerimaKIP.toLocaleString()}
                </div>
                <div className="text-xs text-pink-500 mt-1">
                  {totalRows > 0 ? ((stats.penerimaKIP / totalRows) * 100).toFixed(1) : 0}%
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
                    handleSearch(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                >
                  <option value="50">50 per halaman</option>
                  <option value="100">100 per halaman</option>
                  <option value="200">200 per halaman</option>
                  <option value="500">500 per halaman</option>
                  <option value="1000">1000 per halaman</option>
                </select>
              </div>
            </div>

            {/* Column Visibility Controls */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={showEssentialColumns}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                Kolom Penting Saja
              </button>
              <button
                onClick={showAllColumns}
                className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
              >
                Semua Kolom
              </button>
              <div className="text-sm text-gray-600 ml-2 flex items-center">
                <span className="mr-2">Tampilkan:</span>
                <span className="font-semibold text-blue-600">{visibleColumns.length}</span>
                <span className="mx-1">/</span>
                <span>{columns.length} kolom</span>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Daftar Siswa</h2>
                <p className="text-sm text-gray-600">
                  Halaman {currentPage} • {visibleColumns.length} kolom ditampilkan
                </p>
              </div>
              <div className="text-sm text-gray-600">
                {searchTerm ? (
                  <span>
                    <span className="font-semibold text-blue-600">{filteredData.length}</span> hasil pencarian
                  </span>
                ) : (
                  <span>
                    Menampilkan <span className="font-semibold">{siswaData.length}</span> dari <span className="font-semibold">{totalRows.toLocaleString()}</span> data
                  </span>
                )}
              </div>
            </div>

            <div 
              ref={tableContainerRef}
              className="overflow-x-auto rounded-lg border border-gray-200"
              style={{ 
                maxHeight: 'calc(100vh - 400px)',
                minHeight: '400px'
              }}
            >
              <table className="w-full min-w-max">
                <thead className="bg-gray-50">
                  <tr>
                    {visibleColumns.map((column) => (
                      <th 
                        key={column.key}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap border-r border-gray-200 last:border-r-0 sticky top-0 bg-gray-50 z-10"
                        style={{ minWidth: column.width }}
                      >
                        <div className="flex items-center justify-between group">
                          <span>{column.header}</span>
                          <button
                            onClick={() => toggleColumnVisibility(column.key)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 ml-2"
                            title="Sembunyikan kolom"
                          >
                            ✕
                          </button>
                        </div>
                      </th>
                    ))}
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap bg-gray-50 border-l border-gray-200 sticky top-0 z-10"
                      style={{ minWidth: '130px' }}
                    >
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(searchTerm ? filteredData : siswaData).map((siswa) => (
                    <tr key={siswa.id} className="hover:bg-gray-50 transition-colors">
                      {visibleColumns.map((column) => (
                        <td 
                          key={`${siswa.id}-${column.key}`}
                          className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap border-r border-gray-100 last:border-r-0"
                        >
                          <div 
                            className="truncate" 
                            style={{ maxWidth: column.width }}
                            title={siswa[column.key] || ''}
                          >
                            {renderCell(siswa, column)}
                          </div>
                        </td>
                      ))}
                      <td className="px-4 py-3 bg-white border-l border-gray-100">
                        <div className="flex flex-col gap-2 min-w-[130px]">
                          <button
                            onClick={() => openDetailModal(siswa)}
                            className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 transition-all text-xs shadow-sm hover:shadow"
                          >
                            <span>👁️</span>
                            <span>Detail</span>
                          </button>
                          <button
                            onClick={() => openDeleteModal(siswa)}
                            className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-md hover:from-red-600 hover:to-red-700 transition-all text-xs shadow-sm hover:shadow"
                          >
                            <span>🗑️</span>
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {(searchTerm ? filteredData : siswaData).length === 0 && (
                <div className="text-center py-16">
                  <div className="text-5xl text-gray-300 mb-4">👨‍🎓</div>
                  <p className="text-gray-600 text-lg mb-2">
                    {searchTerm ? 'Tidak ditemukan data' : 'Belum ada data siswa'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {searchTerm 
                      ? `Tidak ada siswa dengan nama "${searchTerm}"`
                      : 'Klik tombol "Import Excel" untuk menambahkan data'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Pagination - Only show if not searching */}
            {!searchTerm && totalRows > 0 && (
              <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Menampilkan <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> -{' '}
                  <span className="font-semibold">{Math.min(currentPage * itemsPerPage, totalRows)}</span> dari{' '}
                  <span className="font-semibold">{totalRows.toLocaleString()}</span> data
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchSiswaData(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      currentPage === 1 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 shadow-sm'
                    }`}
                  >
                    ← Sebelumnya
                  </button>
                  
                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {(() => {
                      const totalPages = Math.ceil(totalRows / itemsPerPage);
                      const pages = [];
                      
                      // Always show first page
                      pages.push(
                        <button
                          key={1}
                          onClick={() => fetchSiswaData(1)}
                          className={`px-3 py-1.5 rounded-md transition-all ${
                            currentPage === 1
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 shadow-sm'
                          }`}
                        >
                          1
                        </button>
                      );
                      
                      // Show current page and neighbors
                      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                        if (i > 1 && i < totalPages) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => fetchSiswaData(i)}
                              className={`px-3 py-1.5 rounded-md transition-all ${
                                currentPage === i
                                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 shadow-sm'
                              }`}
                            >
                              {i}
                            </button>
                          );
                        }
                      }
                      
                      // Always show last page if there is more than 1 page
                      if (totalPages > 1) {
                        pages.push(
                          <button
                            key={totalPages}
                            onClick={() => fetchSiswaData(totalPages)}
                            className={`px-3 py-1.5 rounded-md transition-all ${
                              currentPage === totalPages
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 shadow-sm'
                            }`}
                          >
                            {totalPages}
                          </button>
                        );
                      }
                      
                      return pages;
                    })()}
                  </div>
                  
                  <button
                    onClick={() => fetchSiswaData(currentPage + 1)}
                    disabled={currentPage * itemsPerPage >= totalRows}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      currentPage * itemsPerPage >= totalRows
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 shadow-sm'
                    }`}
                  >
                    Selanjutnya →
                  </button>
                </div>
                
                <div className="text-sm text-gray-600">
                  Total halaman: <span className="font-semibold">{Math.ceil(totalRows / itemsPerPage)}</span>
                </div>
              </div>
            )}
            
            {/* Show search results info */}
            {searchTerm && filteredData.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  🔍 Menampilkan <span className="font-semibold">{filteredData.length}</span> hasil pencarian untuk "{searchTerm}"
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setFilteredData(siswaData);
                    }}
                    className="ml-2 text-blue-600 hover:text-blue-800 underline"
                  >
                    Tampilkan semua data
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Import Data Siswa</h3>
                <p className="text-sm text-gray-600 mt-1">Support data tak terbatas</p>
              </div>
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
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">💡 Tips:</span> File Excel bisa berisi ribuan data. Sistem akan memproses secara batch.
                </p>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-400 transition-colors cursor-pointer">
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
                    {excelFile ? excelFile.name : 'Klik untuk memilih file Excel'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Drag & drop atau klik untuk upload
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Format: .xlsx atau .xls • Maks 20MB
                  </p>
                </label>
              </div>
              
              {excelFile && (
                <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-800 font-medium">
                        ✅ File siap diimport
                      </p>
                      <p className="text-xs text-green-600">
                        {excelFile.name} • {(excelFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setExcelFile(null);
                }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={importExcelToDatabase}
                disabled={!excelFile || uploading}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors ${
                  !excelFile || uploading
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                }`}
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  '📊 Import Data'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal - Sama seperti sebelumnya, di sini saya potong untuk hemat space */}
      {showDetailModal && selectedSiswa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          {/* ... (modal detail sama seperti sebelumnya) ... */}
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedSiswa && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-xl font-bold text-gray-800">Hapus Data Siswa</h3>
            </div>
            
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <span className="text-red-600 text-2xl">🗑️</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-2">Hapus data siswa:</p>
                  <p className="text-lg font-bold text-red-700 mb-1">{selectedSiswa.nama}</p>
                  <div className="text-sm text-gray-600">
                    No: {selectedSiswa.no} • NISN: {selectedSiswa.nisn || '-'}
                  </div>
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
