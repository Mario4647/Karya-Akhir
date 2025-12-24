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
  const [horizontalScroll, setHorizontalScroll] = useState(0);
  const navigate = useNavigate();
  const tableContainerRef = useRef(null);
  const headerContainerRef = useRef(null);

  // Konfigurasi untuk virtual scroll
  const BATCH_SIZE = 3000; // Load 3000 data per batch
  const ITEM_HEIGHT = 60; // Tinggi setiap row
  const VISIBLE_ROWS = 50; // Jumlah row yang visible sekaligus

  // Daftar kolom dari Excel dengan width yang disesuaikan - SEMUA KOLOM
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
    // TAMBAHAN KOLOM LAINNYA jika ada di database
    { key: 'no_seri_skhun', header: 'No Seri SKHUN', width: 130 },
    { key: 'kewarganegaraan', header: 'Kewarganegaraan', width: 120 },
    { key: 'no_telepon_rumah', header: 'Telp Rumah', width: 120 },
    { key: 'no_hp_ortu', header: 'HP Ortu', width: 120 },
    { key: 'status_siswa', header: 'Status Siswa', width: 100 },
    { key: 'semester', header: 'Semester', width: 90 },
    { key: 'tingkat_pendidikan', header: 'Tingkat Pendidikan', width: 130 },
    { key: 'kurikulum', header: 'Kurikulum', width: 120 },
    { key: 'kode_wilayah', header: 'Kode Wilayah', width: 120 },
    { key: 'transportasi_sekolah', header: 'Transportasi Sekolah', width: 150 },
    { key: 'jenis_pendaftaran', header: 'Jenis Pendaftaran', width: 140 },
    { key: 'tanggal_masuk', header: 'Tanggal Masuk', width: 120 },
    { key: 'asal_sekolah', header: 'Asal Sekolah', width: 170 },
    { key: 'diterima_di_kelas', header: 'Diterima di Kelas', width: 130 },
    { key: 'alasan_pindah', header: 'Alasan Pindah', width: 150 },
    { key: 'keluar_karena', header: 'Keluar Karena', width: 140 },
    { key: 'tanggal_keluar', header: 'Tanggal Keluar', width: 120 },
    { key: 'alasan_keluar', header: 'Alasan Keluar', width: 150 },
    { key: 'sk_keluar', header: 'SK Keluar', width: 120 },
    { key: 'tanggal_sk_keluar', header: 'Tanggal SK Keluar', width: 120 },
    { key: 'status_keluarga', header: 'Status Keluarga', width: 120 },
    { key: 'anak_keberapa', header: 'Anak Keberapa', width: 110 },
    { key: 'penerima_bsm', header: 'Penerima BSM', width: 110 },
    { key: 'no_bsm', header: 'No BSM', width: 120 },
    { key: 'layak_bsm', header: 'Layak BSM', width: 100 },
    { key: 'alasan_layak_bsm', header: 'Alasan Layak BSM', width: 150 },
    { key: 'beasiswa', header: 'Beasiswa', width: 100 },
    { key: 'sumber_beasiswa', header: 'Sumber Beasiswa', width: 140 },
    { key: 'jangka_waktu_beasiswa', header: 'Jangka Waktu Beasiswa', width: 150 },
    { key: 'besar_beasiswa', header: 'Besar Beasiswa', width: 120 },
    { key: 'aktivitas_luar_sekolah', header: 'Aktivitas Luar Sekolah', width: 160 },
    { key: 'prestasi', header: 'Prestasi', width: 120 },
    { key: 'tingkat_prestasi', header: 'Tingkat Prestasi', width: 130 },
    { key: 'tahun_prestasi', header: 'Tahun Prestasi', width: 120 },
    { key: 'penyakit_berat', header: 'Penyakit Berat', width: 140 },
    { key: 'kelainan_jasmani', header: 'Kelainan Jasmani', width: 140 },
    { key: 'tingkat_kecerdasan', header: 'Tingkat Kecerdasan', width: 140 },
    { key: 'bakat_khusus', header: 'Bakat Khusus', width: 120 },
    { key: 'hobi', header: 'Hobi', width: 120 },
    { key: 'cita_cita', header: 'Cita-cita', width: 120 },
    { key: 'jumlah_saudara_kandung', header: 'Jml Saudara Kandung', width: 140 },
    { key: 'jumlah_saudara_tiri', header: 'Jml Saudara Tiri', width: 130 },
    { key: 'jumlah_saudara_angkat', header: 'Jml Saudara Angkat', width: 140 },
    { key: 'bahasa_sehari_hari', header: 'Bahasa Sehari-hari', width: 150 },
    { key: 'actions', header: 'Aksi', width: 140 }
  ], []);

  useEffect(() => {
    checkAdminAccess();
    fetchAllData();
  }, []);

  // Sync horizontal scroll antara header dan body
  useEffect(() => {
    const bodyContainer = tableContainerRef.current;
    const headerContainer = headerContainerRef.current;
    
    if (bodyContainer && headerContainer) {
      const handleHorizontalScroll = (e) => {
        setHorizontalScroll(e.target.scrollLeft);
        if (e.target === bodyContainer) {
          headerContainer.scrollLeft = e.target.scrollLeft;
        } else if (e.target === headerContainer) {
          bodyContainer.scrollLeft = e.target.scrollLeft;
        }
      };

      bodyContainer.addEventListener('scroll', handleHorizontalScroll);
      headerContainer.addEventListener('scroll', handleHorizontalScroll);

      return () => {
        bodyContainer.removeEventListener('scroll', handleHorizontalScroll);
        headerContainer.removeEventListener('scroll', handleHorizontalScroll);
      };
    }
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

  // Fetch semua data sekaligus
  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Get total count
      const { count, error: countError } = await supabase
        .from('siswa')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;
      setTotalCount(count || 0);

      // Load ALL data sekaligus dengan SEMUA KOLOM
      const { data, error } = await supabase
        .from('siswa')
        .select('*')
        .order('no', { ascending: true });

      if (error) throw error;

      // Log untuk debugging
      console.log('Total data fetched:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('Sample data pertama:', data[0]);
        console.log('Kolom yang ada di data pertama:', Object.keys(data[0]));
      }

      setSiswaData(data || []);
      setHasMore(false);
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

    if (file.size > 50 * 1024 * 1024) {
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

          const processChunk = async (chunkData, chunkNumber) => {
            const chunkList = [];
            
            for (let i = 0; i < chunkData.length; i++) {
              const row = chunkData[i];
              
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
                // Tambahkan kolom tambahan jika ada di Excel
                no_seri_skhun: row[66] || '',
                kewarganegaraan: row[67] || '',
                no_telepon_rumah: row[68]?.toString() || '',
                no_hp_ortu: row[69]?.toString() || '',
                status_siswa: row[70] || '',
                semester: row[71]?.toString() || '',
                tingkat_pendidikan: row[72] || '',
                kurikulum: row[73] || '',
                kode_wilayah: row[74]?.toString() || '',
                transportasi_sekolah: row[75] || '',
                jenis_pendaftaran: row[76] || '',
                tanggal_masuk: row[77] ? new Date(row[77]).toISOString().split('T')[0] : null,
                asal_sekolah: row[78] || '',
                diterima_di_kelas: row[79] || '',
                alasan_pindah: row[80] || '',
                keluar_karena: row[81] || '',
                tanggal_keluar: row[82] ? new Date(row[82]).toISOString().split('T')[0] : null,
                alasan_keluar: row[83] || '',
                sk_keluar: row[84] || '',
                tanggal_sk_keluar: row[85] ? new Date(row[85]).toISOString().split('T')[0] : null,
                status_keluarga: row[86] || '',
                anak_keberapa: row[87]?.toString() || '',
                penerima_bsm: row[88] || '',
                no_bsm: row[89]?.toString() || '',
                layak_bsm: row[90] || '',
                alasan_layak_bsm: row[91] || '',
                beasiswa: row[92] || '',
                sumber_beasiswa: row[93] || '',
                jangka_waktu_beasiswa: row[94] || '',
                besar_beasiswa: row[95] ? parseFloat(row[95]) : null,
                aktivitas_luar_sekolah: row[96] || '',
                prestasi: row[97] || '',
                tingkat_prestasi: row[98] || '',
                tahun_prestasi: row[99]?.toString() || '',
                penyakit_berat: row[100] || '',
                kelainan_jasmani: row[101] || '',
                tingkat_kecerdasan: row[102] || '',
                bakat_khusus: row[103] || '',
                hobi: row[104] || '',
                cita_cita: row[105] || '',
                jumlah_saudara_kandung: row[106]?.toString() || '',
                jumlah_saudara_tiri: row[107]?.toString() || '',
                jumlah_saudara_angkat: row[108]?.toString() || '',
                bahasa_sehari_hari: row[109] || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              chunkList.push(siswa);
              
              if (chunkList.length % 100 === 0) {
                console.log(`Processed ${chunkList.length} rows in chunk ${chunkNumber}`);
              }
            }
            
            return chunkList;
          };

          const chunks = [];
          for (let i = 0; i < maxRows; i += 1000) {
            chunks.push(jsonData.slice(startRow + i, startRow + i + 1000));
          }

          console.log(`Split into ${chunks.length} chunks`);

          for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
            const chunk = chunks[chunkIndex];
            const chunkResults = await processChunk(chunk, chunkIndex);
            siswaList.push(...chunkResults);
            
            console.log(`Completed chunk ${chunkIndex + 1}/${chunks.length}`);
          }

          console.log(`Total rows to import: ${siswaList.length}`);

          console.log('Clearing existing data...');
          const { error: deleteError } = await supabase
            .from('siswa')
            .delete()
            .gte('id', 0);

          if (deleteError) {
            console.warn('Warning clearing data:', deleteError.message);
          }

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
            
            if (i % (insertBatchSize * 5) === 0) {
              setSuccessMessage(`Mengimport data... ${insertedCount}/${siswaList.length} (${Math.round((insertedCount / siswaList.length) * 100)}%)`);
            }
          }

          setShowImportModal(false);
          setExcelFile(null);
          setSuccessMessage(`✅ Berhasil mengimport ${siswaList.length} data siswa`);
          fetchAllData();
          
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
      // Cari di SEMUA field yang mungkin ada
      const searchableFields = [
        'nama', 'nisn', 'nipd', 'rombel', 'nik', 'nama_ayah', 'nama_ibu',
        'nama_wali', 'alamat', 'kelurahan', 'kecamatan', 'tempat_lahir',
        'email', 'sekolah_asal', 'agama', 'jenis_tinggal', 'alat_transportasi',
        'pekerjaan_ayah', 'pekerjaan_ibu', 'pekerjaan_wali'
      ];
      
      return searchableFields.some(field => {
        const value = siswa[field];
        return value && value.toString().toLowerCase().includes(searchLower);
      });
    });
  }, [siswaData, searchTerm]);

  // Handle scroll untuk virtual rendering
  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    setScrollPosition(scrollTop);
    
    const startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
    setVisibleStartIndex(startIndex);
  };

  // Calculate visible rows
  const getVisibleRows = () => {
    const startIndex = Math.max(0, visibleStartIndex - 10);
    const endIndex = Math.min(filteredSiswa.length, visibleStartIndex + VISIBLE_ROWS + 10);
    
    return filteredSiswa.slice(startIndex, endIndex);
  };

  // Render Table dengan Virtual Scroll Manual - SEMUA KOLOM
  const renderVirtualTable = () => {
    const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);
    const totalHeight = filteredSiswa.length * ITEM_HEIGHT;
    const visibleRows = getVisibleRows();
    
    // Fungsi untuk mendapatkan nilai kolom dengan fallback
    const getColumnValue = (siswa, columnKey) => {
      if (!siswa) return '-';
      const value = siswa[columnKey];
      
      if (value === null || value === undefined || value === '') {
        return '-';
      }
      
      // Format khusus untuk tanggal
      if (columnKey.includes('tanggal') || columnKey.includes('tahun')) {
        if (columnKey === 'tahun_lahir_ayah' || columnKey === 'tahun_lahir_ibu' || columnKey === 'tahun_lahir_wali') {
          return value || '-';
        }
        return formatDate(value);
      }
      
      if (columnKey === 'jk') {
        return value === 'L' ? 'L' : value === 'P' ? 'P' : value;
      }
      
      if (columnKey === 'nama') {
        return <span className="font-medium">{String(value)}</span>;
      }
      
      return String(value);
    };

    return (
      <div className="relative">
        {/* Header - Sticky dengan container scrollable terpisah */}
        <div 
          ref={headerContainerRef}
          className="sticky top-0 z-20 bg-gray-50 border-b border-gray-300 overflow-auto"
          style={{ 
            height: ITEM_HEIGHT,
            scrollBehavior: 'smooth',
            overflowX: 'auto',
            overflowY: 'hidden'
          }}
        >
          <div style={{ width: `${totalWidth}px`, minWidth: `${totalWidth}px` }}>
            <div className="flex">
              {columns.map((column, index) => (
                <div
                  key={index}
                  style={{ 
                    width: column.width, 
                    minWidth: column.width,
                    maxWidth: column.width,
                    flexShrink: 0
                  }}
                  className="border-r border-gray-300 font-semibold text-gray-700 uppercase text-xs p-2 truncate bg-gray-50 hover:bg-gray-100 transition-colors"
                  title={column.header}
                >
                  {column.header}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Body dengan virtual scroll yang sinkron dengan header */}
        <div 
          ref={tableContainerRef}
          className="overflow-auto relative"
          style={{ 
            height: 'calc(70vh - 60px)',
            scrollBehavior: 'smooth'
          }}
          onScroll={handleScroll}
        >
          {/* Invisible spacer untuk total height */}
          <div style={{ 
            height: `${totalHeight}px`, 
            width: `${totalWidth}px`,
            position: 'relative'
          }}></div>
          
          {/* Visible rows dengan absolute positioning */}
          <div className="absolute top-0 left-0" style={{ width: `${totalWidth}px` }}>
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
                            maxWidth: column.width,
                            flexShrink: 0
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

                    const displayValue = getColumnValue(siswa, column.key);

                    return (
                      <div
                        key={colIndex}
                        style={{ 
                          width: column.width, 
                          minWidth: column.width,
                          maxWidth: column.width,
                          flexShrink: 0
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

        {/* Horizontal scroll indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ 
              width: `${(horizontalScroll / (totalWidth - tableContainerRef.current?.clientWidth || 1)) * 100}%`,
              transform: `translateX(${horizontalScroll}px)`
            }}
          ></div>
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
                  placeholder="Cari siswa (nama, NISN, NIPD, rombel, alamat, orang tua, dll)..."
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
                  onClick={fetchAllData}
                  className="px-3 py-2.5 border border-indigo-300 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Virtual Table Section - SEMUA KOLOM */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Daftar Siswa - Semua Kolom</h2>
                <p className="text-sm text-gray-600">
                  {columns.length} kolom • {totalCount.toLocaleString()} total data
                  {searchTerm && ` • ${filteredSiswa.length} hasil pencarian`}
                </p>
              </div>
              <div className="text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓ {siswaData.length} data loaded</span>
                  <span className="text-gray-400">|</span>
                  <span>Scroll → untuk semua kolom</span>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden relative" style={{ height: '70vh' }}>
              {renderVirtualTable()}

              {filteredSiswa.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/90">
                  <div className="text-center py-16">
                    <div className="text-5xl text-gray-300 mb-4">👨‍🎓</div>
                    <p className="text-gray-600 text-lg mb-2">Tidak ada data siswa</p>
                    <p className="text-sm text-gray-500">
                      {searchTerm ? `Tidak ditemukan siswa dengan kata kunci "${searchTerm}"` : 'Klik tombol "Import Excel" untuk menambahkan data'}
                    </p>
                  </div>
                </div>
              )}

              {/* Loading indicator */}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <span className="text-blue-700 font-medium">Memuat data...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Info Footer */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Navigasi Tabel:</span> 
                  <span className="ml-2">• Gunakan scroll horizontal (→) untuk melihat semua {columns.length} kolom</span>
                  <span className="ml-2">• Scroll vertical (↓) untuk melihat semua {filteredSiswa.length} data</span>
                  <span className="ml-2">• Header dan data tersinkronisasi secara otomatis</span>
                </div>
                <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Kolom:</span>
                    <span className="text-blue-600">{columns.length}</span>
                    <span className="text-gray-400">|</span>
                    <span className="font-medium">Data:</span>
                    <span className="text-green-600">{filteredSiswa.length}</span>
                    <span>/</span>
                    <span>{totalCount}</span>
                  </div>
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
                <h3 className="text-xl font-bold text-gray-800">Import Data Siswa - Semua Kolom</h3>
                <p className="text-sm text-gray-600 mt-1">Import semua kolom data siswa dari Excel</p>
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
                  Upload file Excel yang berisi data siswa dengan <span className="font-semibold">{columns.length} kolom</span>.
                  Sistem akan mengimport semua data termasuk kolom tambahan.
                </p>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-100 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl text-blue-600 mt-1">💡</div>
                    <div>
                      <p className="text-sm text-blue-800 font-medium mb-1">Semua Kolom Didukung</p>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li>• {columns.length} kolom siap ditampilkan</li>
                        <li>• Data pribadi, alamat, orang tua, dan lainnya</li>
                        <li>• Virtual scroll untuk performa optimal</li>
                        <li>• Scroll horizontal untuk semua kolom</li>
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

              {/* Kolom yang akan diimport */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2 text-sm">Kolom yang Didukung ({columns.length})</h4>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {columns.slice(0, 20).map((col, idx) => (
                    <div key={idx} className="text-xs text-gray-600 flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="truncate">{col.header}</span>
                    </div>
                  ))}
                  {columns.length > 20 && (
                    <div className="col-span-2 text-xs text-gray-500 text-center pt-2">
                      + {columns.length - 20} kolom lainnya...
                    </div>
                  )}
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
                    <span>Import Semua Data</span>
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
                <h3 className="text-xl font-bold text-gray-800">Detail Data Siswa - Semua Kolom</h3>
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

                {/* Data lengkap dalam grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {columns.map((column, idx) => {
                    if (column.key === 'actions' || column.key === 'no') return null;
                    
                    const value = getColumnValue(selectedSiswa, column.key);
                    if (value === '-' || !value) return null;
                    
                    return (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-xs text-gray-600 mb-1 font-medium">{column.header}</div>
                        <div className="text-sm text-gray-800 truncate" title={String(value)}>
                          {value}
                        </div>
                      </div>
                    );
                  }).filter(Boolean)}
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
