import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [visibleStartIndex, setVisibleStartIndex] = useState(0);
  const navigate = useNavigate();
  const tableContainerRef = useRef(null);

  // Konfigurasi untuk virtual scroll
  const BATCH_SIZE = 3000; // PERUBAHAN: Load 3000 data per batch
  const ITEM_HEIGHT = 60; // Tinggi setiap row
  const VISIBLE_ROWS = 50; // Jumlah row yang visible sekaligus

  // Daftar kolom dari Excel dengan width yang disesuaikan
  const columns = useMemo(() => [
    { key: 'no', header: 'No', width: 70 },
    { key: 'nama', header: 'Nama', width: 220 },
    { key: 'nipd', header: 'NIPD', width: 110 },
    { key: 'jk', header: 'JK', width: 60 },
    { key: 'nisn', header: 'NISN', width: 130 },
    { key: 'tempat_lahir', header: 'Tempat Lahir', width: 140 },
    { key: 'tanggal_lahir', header: 'Tgl Lahir', width: 110 },
    { key: 'nik', header: 'NIK', width: 150 },
    { key: 'agama', header: 'Agama', width: 90 },
    { key: 'alamat', header: 'Alamat', width: 190 },
    { key: 'rt', header: 'RT', width: 60 },
    { key: 'rw', header: 'RW', width: 60 },
    { key: 'dusun', header: 'Dusun', width: 130 },
    { key: 'kelurahan', header: 'Kelurahan', width: 140 },
    { key: 'kecamatan', header: 'Kecamatan', width: 140 },
    { key: 'kode_pos', header: 'Kode Pos', width: 100 },
    { key: 'jenis_tinggal', header: 'Jenis Tinggal', width: 120 },
    { key: 'alat_transportasi', header: 'Alat Transport', width: 130 },
    { key: 'telepon', header: 'Telepon', width: 120 },
    { key: 'hp', header: 'HP', width: 120 },
    { key: 'email', header: 'Email', width: 190 },
    { key: 'skhun', header: 'SKHUN', width: 100 },
    { key: 'penerima_kps', header: 'Penerima KPS', width: 110 },
    { key: 'no_kps', header: 'No KPS', width: 120 },
    { key: 'nama_ayah', header: 'Nama Ayah', width: 170 },
    { key: 'tahun_lahir_ayah', header: 'TL Ayah', width: 90 },
    { key: 'jenjang_ayah', header: 'Jenjang Ayah', width: 120 },
    { key: 'pekerjaan_ayah', header: 'Pekerjaan Ayah', width: 140 },
    { key: 'penghasilan_ayah', header: 'Penghasilan Ayah', width: 150 },
    { key: 'nik_ayah', header: 'NIK Ayah', width: 150 },
    { key: 'nama_ibu', header: 'Nama Ibu', width: 170 },
    { key: 'tahun_lahir_ibu', header: 'TL Ibu', width: 90 },
    { key: 'jenjang_ibu', header: 'Jenjang Ibu', width: 120 },
    { key: 'pekerjaan_ibu', header: 'Pekerjaan Ibu', width: 140 },
    { key: 'penghasilan_ibu', header: 'Penghasilan Ibu', width: 150 },
    { key: 'nik_ibu', header: 'NIK Ibu', width: 150 },
    { key: 'nama_wali', header: 'Nama Wali', width: 170 },
    { key: 'tahun_lahir_wali', header: 'TL Wali', width: 90 },
    { key: 'jenjang_wali', header: 'Jenjang Wali', width: 120 },
    { key: 'pekerjaan_wali', header: 'Pekerjaan Wali', width: 140 },
    { key: 'penghasilan_wali', header: 'Penghasilan Wali', width: 150 },
    { key: 'nik_wali', header: 'NIK Wali', width: 150 },
    { key: 'rombel', header: 'Rombel', width: 90 },
    { key: 'no_peserta_ujian', header: 'No Ujian', width: 130 },
    { key: 'no_seri_ijazah', header: 'No Ijazah', width: 130 },
    { key: 'penerima_kip', header: 'Penerima KIP', width: 110 },
    { key: 'nomor_kip', header: 'Nomor KIP', width: 130 },
    { key: 'nama_di_kip', header: 'Nama di KIP', width: 140 },
    { key: 'nomor_kks', header: 'No KKS', width: 120 },
    { key: 'no_reg_akta', header: 'No Akta', width: 130 },
    { key: 'bank', header: 'Bank', width: 100 },
    { key: 'no_rekening', header: 'No Rekening', width: 140 },
    { key: 'rekening_atas_nama', header: 'Rek Atas Nama', width: 170 },
    { key: 'layak_pip', header: 'Layak PIP', width: 100 },
    { key: 'alasan_layak_pip', header: 'Alasan PIP', width: 170 },
    { key: 'kebutuhan_khusus', header: 'Kebutuhan Khusus', width: 140 },
    { key: 'sekolah_asal', header: 'Sekolah Asal', width: 170 },
    { key: 'anak_ke', header: 'Anak Ke', width: 80 },
    { key: 'lintang', header: 'Lintang', width: 120 },
    { key: 'bujur', header: 'Bujur', width: 120 },
    { key: 'no_kk', header: 'No KK', width: 140 },
    { key: 'berat_badan', header: 'Berat Badan', width: 100 },
    { key: 'tinggi_badan', header: 'Tinggi Badan', width: 100 },
    { key: 'lingkar_kepala', header: 'Lingkar Kepala', width: 110 },
    { key: 'jml_saudara', header: 'Jml Saudara', width: 100 },
    { key: 'jarak_sekolah', header: 'Jarak Sekolah', width: 120 },
    { key: 'actions', header: 'Aksi', width: 140 }
  ], []);

  useEffect(() => {
    checkAdminAccess();
    fetchInitialData();
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

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Get total count
      const { count, error: countError } = await supabase
        .from('siswa')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;
      setTotalCount(count || 0);

      // Load first batch - PERUBAHAN: 3000 data pertama
      const { data, error } = await supabase
        .from('siswa')
        .select('*')
        .order('no', { ascending: true })
        .range(0, BATCH_SIZE - 1);

      if (error) throw error;

      setSiswaData(data || []);
      setCurrentBatch(1);
      setHasMore(data?.length === BATCH_SIZE && (count || 0) > BATCH_SIZE);
    } catch (error) {
      console.error('Error fetching siswa data:', error);
      setErrorMessage('Gagal memuat data siswa: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreData = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const start = currentBatch * BATCH_SIZE;
      const end = start + BATCH_SIZE - 1;

      const { data, error } = await supabase
        .from('siswa')
        .select('*')
        .order('no', { ascending: true })
        .range(start, end);

      if (error) throw error;

      if (data && data.length > 0) {
        setSiswaData(prev => [...prev, ...data]);
        setCurrentBatch(prev => prev + 1);
        setHasMore(data.length === BATCH_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more data:', error);
      setErrorMessage('Gagal memuat data tambahan: ' + error.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setErrorMessage('Hanya file Excel (.xlsx atau .xls) yang diperbolehkan');
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setErrorMessage('File terlalu besar. Maksimal 50MB');
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
          const maxRows = jsonData.length - startRow;
          
          console.log(`Processing ${maxRows} rows of data...`);

          // Process data in chunks to prevent memory issues
          const processChunk = async (chunkData, chunkNumber) => {
            const chunkList = [];
            
            for (let i = 0; i < chunkData.length; i++) {
              const row = chunkData[i];
              const rowNumber = chunkNumber * 1000 + i;
              
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

              chunkList.push(siswa);
              
              // Update progress every 100 rows
              if (chunkList.length % 100 === 0) {
                console.log(`Processed ${chunkList.length} rows in chunk ${chunkNumber}`);
              }
            }
            
            return chunkList;
          };

          // Split data into chunks of 1000 rows
          const chunks = [];
          for (let i = 0; i < maxRows; i += 1000) {
            chunks.push(jsonData.slice(startRow + i, startRow + i + 1000));
          }

          console.log(`Split into ${chunks.length} chunks`);

          // Process chunks sequentially
          for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
            const chunk = chunks[chunkIndex];
            const chunkResults = await processChunk(chunk, chunkIndex);
            siswaList.push(...chunkResults);
            
            console.log(`Completed chunk ${chunkIndex + 1}/${chunks.length}`);
          }

          console.log(`Total rows to import: ${siswaList.length}`);

          // Clear existing data
          console.log('Clearing existing data...');
          const { error: deleteError } = await supabase
            .from('siswa')
            .delete()
            .gte('id', 0);

          if (deleteError) {
            console.warn('Warning clearing data:', deleteError.message);
          }

          // Insert data in batches of 500
          console.log('Inserting data in batches...');
          const insertBatchSize = 500;
          let insertedCount = 0;
          
          for (let i = 0; i < siswaList.length; i += insertBatchSize) {
            const batch = siswaList.slice(i, i + insertBatchSize);
            const { error: insertError } = await supabase
              .from('siswa')
              .upsert(batch, { onConflict: 'nisn' });

            if (insertError) {
              console.error('Error inserting batch:', insertError);
              throw insertError;
            }
            
            insertedCount += batch.length;
            console.log(`Inserted ${insertedCount}/${siswaList.length} rows`);
            
            // Update progress in UI
            if (i % (insertBatchSize * 5) === 0) {
              setSuccessMessage(`Mengimport data... ${insertedCount}/${siswaList.length} (${Math.round((insertedCount / siswaList.length) * 100)}%)`);
            }
          }

          setShowImportModal(false);
          setExcelFile(null);
          setSuccessMessage(`✅ Berhasil mengimport ${siswaList.length} data siswa`);
          fetchInitialData(); // Reload data
          
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
      
      // Update local data
      setSiswaData(prev => prev.filter(s => s.id !== selectedSiswa.id));
      setTotalCount(prev => prev - 1);
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting siswa:', error);
      setErrorMessage('❌ Gagal menghapus data: ' + error.message);
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

  // Filter data berdasarkan pencarian
  const filteredSiswa = useMemo(() => {
    if (!searchTerm.trim()) return siswaData;
    const searchLower = searchTerm.toLowerCase();
    return siswaData.filter(siswa => {
      // Cek semua field yang relevan
      return (
        (siswa.nama && siswa.nama.toLowerCase().includes(searchLower)) ||
        (siswa.nisn && siswa.nisn.includes(searchTerm)) ||
        (siswa.nipd && siswa.nipd.includes(searchTerm)) ||
        (siswa.rombel && siswa.rombel.toLowerCase().includes(searchLower)) ||
        (siswa.nik && siswa.nik.includes(searchTerm)) ||
        (siswa.nama_ayah && siswa.nama_ayah.toLowerCase().includes(searchLower)) ||
        (siswa.nama_ibu && siswa.nama_ibu.toLowerCase().includes(searchLower))
      );
    });
  }, [siswaData, searchTerm]);

  // Handle scroll untuk virtual rendering
  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    setScrollPosition(scrollTop);
    
    // Calculate visible start index
    const startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
    setVisibleStartIndex(startIndex);
    
    // Check if we need to load more data
    const scrollHeight = e.target.scrollHeight;
    const clientHeight = e.target.clientHeight;
    
    if (scrollHeight - scrollTop - clientHeight < 500 && hasMore && !loadingMore) {
      loadMoreData();
    }
  };

  // Calculate visible rows
  const getVisibleRows = () => {
    const startIndex = Math.max(0, visibleStartIndex - 10); // Buffer above
    const endIndex = Math.min(filteredSiswa.length, visibleStartIndex + VISIBLE_ROWS + 10); // Buffer below
    
    return filteredSiswa.slice(startIndex, endIndex);
  };

  // Render Table dengan Virtual Scroll Manual yang support 3000+ data
  const renderVirtualTable = () => {
    const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);
    const totalHeight = filteredSiswa.length * ITEM_HEIGHT;
    const visibleRows = getVisibleRows();
    
    return (
      <div className="relative">
        {/* Header - Sticky */}
        <div className="sticky top-0 z-20 bg-gray-50 border-b border-gray-300 overflow-hidden shadow-sm">
          <div style={{ width: `${totalWidth}px` }}>
            <div className="flex">
              {columns.map((column, index) => (
                <div
                  key={index}
                  style={{ 
                    width: column.width, 
                    minWidth: column.width,
                    maxWidth: column.width
                  }}
                  className="border-r border-gray-300 font-semibold text-gray-700 uppercase text-xs p-2 truncate bg-gray-50"
                >
                  {column.header}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Body dengan virtual scroll */}
        <div 
          ref={tableContainerRef}
          className="overflow-auto relative"
          style={{ 
            height: 'calc(70vh - 60px)',
          }}
          onScroll={handleScroll}
        >
          {/* Invisible spacer untuk total height */}
          <div style={{ height: `${totalHeight}px` }}></div>
          
          {/* Visible rows dengan absolute positioning */}
          <div className="absolute top-0 left-0 w-full">
            {visibleRows.map((siswa, relativeIndex) => {
              const absoluteIndex = Math.max(0, visibleStartIndex - 10) + relativeIndex;
              const topPosition = absoluteIndex * ITEM_HEIGHT;
              
              return (
                <div
                  key={siswa.id || absoluteIndex}
                  className="flex absolute border-b border-gray-200 hover:bg-blue-50 transition-colors bg-white"
                  style={{
                    top: topPosition,
                    height: ITEM_HEIGHT,
                    width: `${totalWidth}px`
                  }}
                >
                  {columns.map((column, colIndex) => {
                    if (column.key === 'actions') {
                      return (
                        <div
                          key={colIndex}
                          style={{ 
                            width: column.width, 
                            minWidth: column.width,
                            maxWidth: column.width
                          }}
                          className="border-r border-gray-200 p-2"
                        >
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => openDetailModal(siswa)}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors"
                            >
                              👁️ Detail
                            </button>
                            <button
                              onClick={() => openDeleteModal(siswa)}
                              className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 transition-colors"
                            >
                              🗑️ Hapus
                            </button>
                          </div>
                        </div>
                      );
                    }

                    const value = siswa[column.key];
                    let displayValue = '-';
                    
                    if (value !== null && value !== undefined && value !== '') {
                      if (column.key === 'tanggal_lahir') {
                        displayValue = formatDate(value);
                      } else if (column.key === 'jk') {
                        displayValue = value === 'L' ? 'L' : value === 'P' ? 'P' : value;
                      } else if (column.key === 'nama') {
                        displayValue = <span className="font-medium">{String(value)}</span>;
                      } else {
                        displayValue = String(value);
                      }
                    }

                    return (
                      <div
                        key={colIndex}
                        style={{ 
                          width: column.width, 
                          minWidth: column.width,
                          maxWidth: column.width
                        }}
                        className="border-r border-gray-200 p-2 truncate"
                        title={typeof displayValue === 'string' ? displayValue : undefined}
                      >
                        {displayValue}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (loading && siswaData.length === 0) {
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="text-sm text-blue-600 mb-1">Total Siswa</div>
                <div className="text-2xl font-bold text-blue-700">{totalCount.toLocaleString()}</div>
                <div className="text-xs text-blue-500 mt-1">Data tersimpan</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="text-sm text-green-600 mb-1">Laki-laki</div>
                <div className="text-2xl font-bold text-green-700">
                  {siswaData.filter(s => s.jk === 'L').length.toLocaleString()}
                </div>
                <div className="text-xs text-green-500 mt-1">
                  {siswaData.length > 0 ? ((siswaData.filter(s => s.jk === 'L').length / siswaData.length) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="text-sm text-purple-600 mb-1">Perempuan</div>
                <div className="text-2xl font-bold text-purple-700">
                  {siswaData.filter(s => s.jk === 'P').length.toLocaleString()}
                </div>
                <div className="text-xs text-purple-500 mt-1">
                  {siswaData.length > 0 ? ((siswaData.filter(s => s.jk === 'P').length / siswaData.length) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                <div className="text-sm text-orange-600 mb-1">Layak PIP</div>
                <div className="text-2xl font-bold text-orange-700">
                  {siswaData.filter(s => s.layak_pip === 'Ya').length.toLocaleString()}
                </div>
                <div className="text-xs text-orange-500 mt-1">
                  {siswaData.length > 0 ? ((siswaData.filter(s => s.layak_pip === 'Ya').length / siswaData.length) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-4 border border-cyan-200">
                <div className="text-sm text-cyan-600 mb-1">Tampil</div>
                <div className="text-2xl font-bold text-cyan-700">
                  {filteredSiswa.length.toLocaleString()}
                </div>
                <div className="text-xs text-cyan-500 mt-1">
                  {searchTerm ? 'Hasil pencarian' : 'Semua data'}
                </div>
              </div>
            </div>

            {/* Search and Controls */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Cari siswa (nama, NISN, NIPD, rombel, NIK, orang tua)..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  {filteredSiswa.length} data ditemukan
                </div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                  }}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                >
                  Reset
                </button>
                <button
                  onClick={fetchInitialData}
                  className="px-3 py-2.5 border border-indigo-300 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Virtual Table Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Daftar Siswa</h2>
                <p className="text-sm text-gray-600">
                  Virtual scrolling untuk {columns.length} kolom • {totalCount.toLocaleString()} total data
                  {searchTerm && ` • ${filteredSiswa.length} hasil pencarian`}
                </p>
              </div>
              <div className="text-sm text-gray-600">
                {hasMore && `+${Math.max(0, totalCount - siswaData.length)} data tersedia`}
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height: '70vh' }}>
              {renderVirtualTable()}

              {filteredSiswa.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center py-16">
                    <div className="text-5xl text-gray-300 mb-4">👨‍🎓</div>
                    <p className="text-gray-600 text-lg mb-2">Tidak ada data siswa</p>
                    <p className="text-sm text-gray-500">
                      {searchTerm ? `Tidak ditemukan siswa dengan kata kunci "${searchTerm}"` : 'Klik tombol "Import Excel" untuk menambahkan data'}
                    </p>
                  </div>
                </div>
              )}

              {loadingMore && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2 border border-gray-200">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-600">Memuat data...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Info Footer */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-center gap-2">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Tips:</span> 
                  <span className="ml-2">• Load {BATCH_SIZE} data per batch</span>
                  <span className="ml-2">• Pencarian real-time di {siswaData.length.toLocaleString()} data</span>
                  <span className="ml-2">• Virtual scroll untuk performa optimal</span>
                </div>
                <div className="text-xs text-gray-500">
                  Menampilkan {Math.min(filteredSiswa.length, VISIBLE_ROWS)} dari {filteredSiswa.length} data • {columns.length} kolom
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full transform transition-all duration-300 scale-100">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Import Data Siswa</h3>
                <p className="text-sm text-gray-600 mt-1">Support data hingga 10.000+ rows • Optimized for large files</p>
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
              <div className="mb-6">
                <p className="text-gray-700 mb-3">
                  Upload file Excel yang berisi data siswa. Sistem ini mendukung data hingga <span className="font-semibold">tak terbatas</span>.
                </p>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-100 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl text-blue-600 mt-1">💡</div>
                    <div>
                      <p className="text-sm text-blue-800 font-medium mb-1">Optimized for Large Datasets</p>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li>• Load {BATCH_SIZE} data per batch untuk performa optimal</li>
                        <li>• Chunk processing untuk file besar (10k+ rows)</li>
                        <li>• Virtual scrolling untuk 3000+ data real-time</li>
                        <li>• Memory efficient dengan lazy loading</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-400 transition-colors cursor-pointer bg-gradient-to-br from-gray-50 to-white">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
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
                    Format: .xlsx, .xls, .csv • Maks 50MB
                  </p>
                </label>
              </div>
              
              {excelFile && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
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
                      className="text-green-600 hover:text-green-800 text-sm px-3 py-1 hover:bg-green-100 rounded transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              )}

              {/* Advanced Options */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2 text-sm">Pengaturan Import</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Auto-detect format file Excel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Chunk processing untuk file besar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span>Duplicate detection berdasarkan NISN</span>
                  </div>
                </div>
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
                    <span className="text-lg">🚀</span>
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
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center text-2xl">
                    {selectedSiswa.jk === 'L' ? '👨' : '👩'}
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-gray-800">{selectedSiswa.nama}</h4>
                    <div className="flex items-center gap-4 text-gray-600 mt-1">
                      <span>NISN: {selectedSiswa.nisn || '-'}</span>
                      <span>•</span>
                      <span>NIPD: {selectedSiswa.nipd || '-'}</span>
                      <span>•</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {selectedSiswa.rombel || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Data Pribadi */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                    <div className="text-xs text-blue-600 mb-1">Jenis Kelamin</div>
                    <div className="font-medium text-gray-800">{selectedSiswa.jk === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                    <div className="text-xs text-green-600 mb-1">Tempat/Tgl Lahir</div>
                    <div className="font-medium text-gray-800">
                      {selectedSiswa.tempat_lahir || '-'}, {formatDate(selectedSiswa.tanggal_lahir)}
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                    <div className="text-xs text-purple-600 mb-1">Agama</div>
                    <div className="font-medium text-gray-800">{selectedSiswa.agama || '-'}</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                    <div className="text-xs text-orange-600 mb-1">Anak Ke</div>
                    <div className="font-medium text-gray-800">{selectedSiswa.anak_ke || '-'}</div>
                  </div>
                </div>

                {/* Data Alamat */}
                <div className="mb-8">
                  <h5 className="text-lg font-semibold text-gray-800 mb-4">Alamat dan Kontak</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Alamat</div>
                      <div className="font-medium text-gray-800">{selectedSiswa.alamat || '-'}</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">RT/RW</div>
                      <div className="font-medium text-gray-800">
                        {selectedSiswa.rt || '-'}/{selectedSiswa.rw || '-'}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Telepon/HP</div>
                      <div className="font-medium text-gray-800">
                        {selectedSiswa.telepon || '-'} / {selectedSiswa.hp || '-'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Orang Tua */}
                <div className="mb-8">
                  <h5 className="text-lg font-semibold text-gray-800 mb-4">Data Orang Tua</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                      <div className="text-xs text-blue-600 mb-2">AYAH</div>
                      <div className="font-medium text-gray-800 mb-1">{selectedSiswa.nama_ayah || '-'}</div>
                      <div className="text-sm text-gray-600">Pekerjaan: {selectedSiswa.pekerjaan_ayah || '-'}</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl">
                      <div className="text-xs text-pink-600 mb-2">IBU</div>
                      <div className="font-medium text-gray-800 mb-1">{selectedSiswa.nama_ibu || '-'}</div>
                      <div className="text-sm text-gray-600">Pekerjaan: {selectedSiswa.pekerjaan_ibu || '-'}</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl">
                      <div className="text-xs text-amber-600 mb-2">WALI</div>
                      <div className="font-medium text-gray-800 mb-1">{selectedSiswa.nama_wali || '-'}</div>
                      <div className="text-sm text-gray-600">Pekerjaan: {selectedSiswa.pekerjaan_wali || '-'}</div>
                    </div>
                  </div>
                </div>

                {/* Data Lainnya */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">No. KK</div>
                    <div className="font-medium text-gray-800">{selectedSiswa.no_kk || '-'}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Sekolah Asal</div>
                    <div className="font-medium text-gray-800">{selectedSiswa.sekolah_asal || '-'}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Kebutuhan Khusus</div>
                    <div className="font-medium text-gray-800">{selectedSiswa.kebutuhan_khusus || 'Tidak ada'}</div>
                  </div>
                </div>
              </div>
            </div>
            
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
