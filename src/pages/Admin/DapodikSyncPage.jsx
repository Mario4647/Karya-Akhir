// src/pages/DapodikSyncPage.jsx
import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

const DapodikSyncPage = () => {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [dataDapodik, setDataDapodik] = useState(null);
  const [log, setLog] = useState([]);

  // Konfigurasi Dapodik (langsung di dalam code)
  const DAPODIK_CONFIG = {
    baseUrl: 'http://smanrejotangan.ddns.net:5774',
    key: 'womyhGUXWiudMdG',
    npsn: '20515427'
  };

  const addLog = (message, type = 'info') => {
    setLog(prev => [...prev, { message, type, time: new Date().toLocaleTimeString() }]);
  };

  // Fungsi mengambil data dari Dapodik API
  const fetchFromDapodik = async (endpoint) => {
    const url = `${DAPODIK_CONFIG.baseUrl}/WebService/${endpoint}?npsn=${DAPODIK_CONFIG.npsn}`;
    
    console.log(`Mengambil data dari: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${DAPODIK_CONFIG.key}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  };

  // Ambil semua data dari Dapodik
  const fetchAllDataDapodik = async () => {
    setLoading(true);
    addLog('🔄 Mengambil data dari server Dapodik...');
    addLog(`📡 URL: ${DAPODIK_CONFIG.baseUrl}`);
    
    try {
      // Ambil data secara paralel
      const [sekolah, siswa, gtk, rombel, mapel] = await Promise.all([
        fetchFromDapodik('getSekolah'),
        fetchFromDapodik('getPesertaDidik'),
        fetchFromDapodik('getGtk'),
        fetchFromDapodik('getRombonganBelajar'),
        fetchFromDapodik('getMataPelajaran')
      ]);
      
      const result = { 
        sekolah, 
        siswa: siswa || [], 
        gtk: gtk || [], 
        rombel: rombel || [], 
        mapel: mapel || [] 
      };
      
      setDataDapodik(result);
      
      addLog(`✓ Berhasil mengambil data dari Dapodik`, 'success');
      addLog(`  - Sekolah: ${sekolah?.nama || 'Tidak ada'}`, 'info');
      addLog(`  - Siswa: ${siswa?.length || 0} orang`, 'info');
      addLog(`  - Guru/Tendik: ${gtk?.length || 0} orang`, 'info');
      addLog(`  - Rombel: ${rombel?.length || 0} kelas`, 'info');
      addLog(`  - Mapel: ${mapel?.length || 0} mata pelajaran`, 'info');
      
    } catch (error) {
      addLog(`❌ Gagal mengambil data: ${error.message}`, 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Simpan data ke Supabase dengan tabel _dapodik
  const syncToSupabase = async () => {
    if (!dataDapodik) {
      addLog('⚠️ Ambil data dari Dapodik terlebih dahulu', 'error');
      return;
    }
    
    setSyncing(true);
    addLog('💾 Menyimpan data ke Supabase (tabel *_dapodik)...');
    
    try {
      // 1. Simpan data Sekolah ke tabel sekolah_dapodik
      if (dataDapodik.sekolah) {
        const { error } = await supabase
          .from('sekolah_dapodik')
          .upsert({ 
            npsn: DAPODIK_CONFIG.npsn,
            nama_sekolah: dataDapodik.sekolah.nama,
            nss: dataDapodik.sekolah.nss || null,
            alamat: dataDapodik.sekolah.alamat || null,
            desa: dataDapodik.sekolah.desa || null,
            kecamatan: dataDapodik.sekolah.kecamatan || null,
            kabupaten: dataDapodik.sekolah.kabupaten || null,
            provinsi: dataDapodik.sekolah.provinsi || null,
            kode_pos: dataDapodik.sekolah.kode_pos || null,
            telepon: dataDapodik.sekolah.telepon || null,
            email: dataDapodik.sekolah.email || null,
            website: dataDapodik.sekolah.website || null,
            data_lengkap: dataDapodik.sekolah,
            updated_at: new Date()
          });
        
        if (error) throw error;
        addLog('✓ Data Sekolah tersimpan di tabel sekolah_dapodik', 'success');
      }
      
      // 2. Simpan data Siswa ke tabel siswa_dapodik
      if (dataDapodik.siswa?.length > 0) {
        const siswaData = dataDapodik.siswa.map(siswa => ({
          npsn: DAPODIK_CONFIG.npsn,
          siswa_id: siswa.id,
          nama: siswa.nama,
          nisn: siswa.nisn,
          nis: siswa.nis || null,
          jenis_kelamin: siswa.jenis_kelamin || null,
          tempat_lahir: siswa.tempat_lahir || null,
          tanggal_lahir: siswa.tanggal_lahir || null,
          agama: siswa.agama || null,
          alamat: siswa.alamat || null,
          nama_ayah: siswa.nama_ayah || null,
          nama_ibu: siswa.nama_ibu || null,
          no_hp: siswa.no_hp || null,
          status_dalam_keluarga: siswa.status_dalam_keluarga || null,
          data_lengkap: siswa,
          updated_at: new Date()
        }));
        
        const { error } = await supabase
          .from('siswa_dapodik')
          .upsert(siswaData, { onConflict: 'siswa_id' });
        
        if (error) throw error;
        addLog(`✓ ${dataDapodik.siswa.length} data Siswa tersimpan di tabel siswa_dapodik`, 'success');
      }
      
      // 3. Simpan data Guru/Tendik ke tabel guru_dapodik
      if (dataDapodik.gtk?.length > 0) {
        const guruData = dataDapodik.gtk.map(guru => ({
          npsn: DAPODIK_CONFIG.npsn,
          guru_id: guru.id,
          nama: guru.nama,
          nuptk: guru.nuptk || null,
          nip: guru.nip || null,
          jenis_kelamin: guru.jenis_kelamin || null,
          tempat_lahir: guru.tempat_lahir || null,
          tanggal_lahir: guru.tanggal_lahir || null,
          agama: guru.agama || null,
          pendidikan: guru.pendidikan || null,
          status_kepegawaian: guru.status_kepegawaian || null,
          tugas_tambahan: guru.tugas_tambahan || null,
          no_hp: guru.no_hp || null,
          email: guru.email || null,
          data_lengkap: guru,
          updated_at: new Date()
        }));
        
        const { error } = await supabase
          .from('guru_dapodik')
          .upsert(guruData, { onConflict: 'guru_id' });
        
        if (error) throw error;
        addLog(`✓ ${dataDapodik.gtk.length} data Guru tersimpan di tabel guru_dapodik`, 'success');
      }
      
      // 4. Simpan data Rombel ke tabel rombel_dapodik
      if (dataDapodik.rombel?.length > 0) {
        const rombelData = dataDapodik.rombel.map(rombel => ({
          npsn: DAPODIK_CONFIG.npsn,
          rombel_id: rombel.id,
          nama: rombel.nama,
          tingkat_pendidikan: rombel.tingkat_pendidikan_id || null,
          tahun_ajaran: rombel.tahun_ajaran_id || null,
          kurikulum: rombel.kurikulum || null,
          jurusan: rombel.jurusan || null,
          data_lengkap: rombel,
          updated_at: new Date()
        }));
        
        const { error } = await supabase
          .from('rombel_dapodik')
          .upsert(rombelData, { onConflict: 'rombel_id' });
        
        if (error) throw error;
        addLog(`✓ ${dataDapodik.rombel.length} data Rombel tersimpan di tabel rombel_dapodik`, 'success');
      }
      
      // 5. Simpan data Mata Pelajaran ke tabel mata_pelajaran_dapodik
      if (dataDapodik.mapel?.length > 0) {
        const mapelData = dataDapodik.mapel.map(mapel => ({
          npsn: DAPODIK_CONFIG.npsn,
          mapel_id: mapel.id,
          nama: mapel.nama,
          kkm: mapel.kkm || null,
          kelompok: mapel.kelompok || null,
          kurikulum: mapel.kurikulum || null,
          data_lengkap: mapel,
          updated_at: new Date()
        }));
        
        const { error } = await supabase
          .from('mata_pelajaran_dapodik')
          .upsert(mapelData, { onConflict: 'mapel_id' });
        
        if (error) throw error;
        addLog(`✓ ${dataDapodik.mapel.length} data Mata Pelajaran tersimpan di tabel mata_pelajaran_dapodik`, 'success');
      }
      
      addLog('🎉 Sinkronisasi selesai!', 'success');
      
    } catch (error) {
      addLog(`❌ Gagal menyimpan ke Supabase: ${error.message}`, 'error');
      console.error(error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>📚 Sinkronisasi Data Dapodik</h1>
      
      {/* Informasi Konfigurasi */}
      <div style={{ 
        background: '#f0f4ff', 
        padding: '16px', 
        borderRadius: '8px', 
        marginBottom: '24px',
        borderLeft: '4px solid #3b82f6'
      }}>
        <h3 style={{ margin: '0 0 8px 0' }}>⚙️ Konfigurasi Dapodik</h3>
        <p style={{ margin: '4px 0' }}><strong>URL:</strong> {DAPODIK_CONFIG.baseUrl}</p>
        <p style={{ margin: '4px 0' }}><strong>NPSN:</strong> {DAPODIK_CONFIG.npsn}</p>
        <p style={{ margin: '4px 0' }}><strong>Key:</strong> {DAPODIK_CONFIG.key}</p>
      </div>
      
      {/* Tombol Aksi */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button 
          onClick={fetchAllDataDapodik} 
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {loading ? '⏳ Mengambil Data...' : '📥 Ambil Data dari Dapodik'}
        </button>
        
        <button 
          onClick={syncToSupabase} 
          disabled={syncing || !dataDapodik}
          style={{
            padding: '12px 24px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: (syncing || !dataDapodik) ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {syncing ? '💾 Menyimpan...' : '💾 Simpan ke Supabase'}
        </button>
        
        <button 
          onClick={() => setLog([])} 
          style={{
            padding: '12px 24px',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          🗑️ Bersihkan Log
        </button>
      </div>
      
      {/* Ringkasan Data */}
      {dataDapodik && (
        <div style={{
          background: '#f9fafb',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 12px 0' }}>📊 Ringkasan Data dari Dapodik</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            <div><strong>Sekolah:</strong> {dataDapodik.sekolah?.nama || '-'}</div>
            <div><strong>Siswa:</strong> {dataDapodik.siswa?.length || 0}</div>
            <div><strong>Guru:</strong> {dataDapodik.gtk?.length || 0}</div>
            <div><strong>Rombel:</strong> {dataDapodik.rombel?.length || 0}</div>
            <div><strong>Mata Pelajaran:</strong> {dataDapodik.mapel?.length || 0}</div>
          </div>
        </div>
      )}
      
      {/* Log Output */}
      <div style={{
        background: '#1e293b',
        color: '#e2e8f0',
        padding: '16px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '14px'
      }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#94a3b8' }}>📋 Log Aktivitas</h3>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {log.length === 0 ? (
            <p style={{ color: '#64748b' }}>Belum ada aktivitas. Klik tombol di atas untuk mulai.</p>
          ) : (
            log.map((item, index) => (
              <div key={index} style={{ 
                marginBottom: '8px',
                color: item.type === 'error' ? '#ef4444' : item.type === 'success' ? '#10b981' : '#94a3b8'
              }}>
                <span style={{ color: '#64748b' }}>[{item.time}]</span> {item.message}
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Catatan Penting */}
      <div style={{
        marginTop: '24px',
        padding: '12px',
        background: '#fef3c7',
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <strong>⚠️ Catatan:</strong>
        <ul style={{ margin: '8px 0 0 20px' }}>
          <li>Pastikan server Dapodik di <strong>smanrejotangan.ddns.net:5774</strong> sedang online</li>
          <li>Pastikan tabel di Supabase sudah dibuat: <strong>sekolah_dapodik, siswa_dapodik, guru_dapodik, rombel_dapodik, mata_pelajaran_dapodik</strong></li>
          <li>Key yang digunakan: <strong>{DAPODIK_CONFIG.key}</strong></li>
        </ul>
      </div>
    </div>
  );
};

export default DapodikSyncPage;
