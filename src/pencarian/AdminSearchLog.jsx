import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AdminNavbar from '../components/AdminNavbar';

const AdminSearchLogs = () => {
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchLogs, setSearchLogs] = useState([]);
  const [totalSearchesToday, setTotalSearchesToday] = useState(0);
  const [totalSearchesAllTime, setTotalSearchesAllTime] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLimit, setEditLimit] = useState('');
  const [editUserId, setEditUserId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterSearchTerm, setFilterSearchTerm] = useState('');
  const [filterSearchResults, setFilterSearchResults] = useState([]);
  const [selectedFilterSiswa, setSelectedFilterSiswa] = useState([]);
  const [filteredSiswaList, setFilteredSiswaList] = useState([]);
  const [loadingFilter, setLoadingFilter] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
    fetchSearchLogs();
    fetchFilteredSiswa();
  }, [currentPage, searchTerm]);

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

  const fetchSearchLogs = async () => {
    try {
      setLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      
      // Total pencarian hari ini
      const { count: todayCount } = await supabase
        .from('search_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today + 'T00:00:00')
        .lte('created_at', today + 'T23:59:59');

      setTotalSearchesToday(todayCount || 0);

      // Total pencarian keseluruhan
      const { count: allTimeCount } = await supabase
        .from('search_logs')
        .select('*', { count: 'exact', head: true });

      setTotalSearchesAllTime(allTimeCount || 0);

      // Ambil data logs dengan pagination dan search
      let query = supabase
        .from('search_logs')
        .select(`
          *,
          profiles:user_id (id, email, name, daily_search_limit, today_search_count, search_access_revoked),
          siswa:siswa_id (nama)
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`profiles.email.ilike.%${searchTerm}%,profiles.name.ilike.%${searchTerm}%,siswa.nama.ilike.%${searchTerm}%`);
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error } = await query.range(from, to);

      if (error) throw error;
      setSearchLogs(data || []);

    } catch (error) {
      console.error('Error fetching search logs:', error);
      setErrorMessage('Gagal memuat data aktivitas pencarian');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredSiswa = async () => {
    try {
      const { data, error } = await supabase
        .from('filtered_siswa')
        .select(`
          *,
          siswa:siswa_id (id, nama, nisn)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFilteredSiswaList(data || []);
    } catch (error) {
      console.error('Error fetching filtered siswa:', error);
    }
  };

  const searchSiswaForFilter = async (query) => {
    if (!query.trim()) {
      setFilterSearchResults([]);
      return;
    }

    try {
      // Cari siswa yang belum difilter
      const { data: siswaData, error } = await supabase
        .from('siswa')
        .select('id, nama, nisn')
        .ilike('nama', `%${query}%`);

      if (error) throw error;
      
      // Filter out already filtered siswa
      const filteredIds = filteredSiswaList.map(f => f.siswa_id);
      const filteredResults = siswaData.filter(siswa => !filteredIds.includes(siswa.id));
      
      setFilterSearchResults(filteredResults.slice(0, 10));
    } catch (error) {
      console.error('Error searching siswa for filter:', error);
      setFilterSearchResults([]);
    }
  };

  const handleAddFilter = async () => {
    if (selectedFilterSiswa.length === 0) {
      setErrorMessage('Pilih minimal satu siswa untuk difilter');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setLoadingFilter(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Simpan siswa yang difilter
      const insertData = selectedFilterSiswa.map(siswa => ({
        siswa_id: siswa.id,
        created_by: session.user.id
      }));

      const { error } = await supabase
        .from('filtered_siswa')
        .insert(insertData);

      if (error) throw error;

      setSuccessMessage(`${selectedFilterSiswa.length} siswa berhasil ditambahkan ke filter`);
      setSelectedFilterSiswa([]);
      setFilterSearchTerm('');
      setFilterSearchResults([]);
      fetchFilteredSiswa();
      
      setTimeout(() => {
        setShowFilterModal(false);
        setSuccessMessage('');
      }, 2000);

    } catch (error) {
      console.error('Error adding filter:', error);
      setErrorMessage('Gagal menambahkan filter');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoadingFilter(false);
    }
  };

  const handleRemoveFilter = async (filterId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus siswa dari filter?')) return;

    try {
      const { error } = await supabase
        .from('filtered_siswa')
        .delete()
        .eq('id', filterId);

      if (error) throw error;

      setSuccessMessage('Siswa berhasil dihapus dari filter');
      fetchFilteredSiswa();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error removing filter:', error);
      setErrorMessage('Gagal menghapus filter');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const openDetailModal = (log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const openEditModal = (user) => {
    setEditUserId(user.id);
    setEditLimit(user.daily_search_limit || 3);
    setShowEditModal(true);
  };

  const handleEditLimit = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ daily_search_limit: parseInt(editLimit) })
        .eq('id', editUserId);

      if (error) throw error;

      setSuccessMessage('Limit pencarian berhasil diperbarui');
      setShowEditModal(false);
      fetchSearchLogs();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating limit:', error);
      setErrorMessage('Gagal memperbarui limit pencarian');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleToggleAccess = async (user) => {
    try {
      const newStatus = !user.search_access_revoked;
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          search_access_revoked: newStatus,
          search_access_revoked_at: newStatus ? new Date().toISOString() : null,
          search_access_revoked_by: newStatus ? session?.user.id : null
        })
        .eq('id', user.id);

      if (error) throw error;

      setSuccessMessage(`Akses ${newStatus ? 'dicabut' : 'diberikan'} untuk ${user.email}`);
      fetchSearchLogs();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error toggling access:', error);
      setErrorMessage('Gagal mengubah status akses');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus log ini?')) return;

    try {
      const { error } = await supabase
        .from('search_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;

      setSuccessMessage('Log berhasil dihapus');
      fetchSearchLogs();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting log:', error);
      setErrorMessage('Gagal menghapus log');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('id-ID');
    } catch {
      return dateString;
    }
  };

  const formatResult = (result, type) => {
    if (!result) return '-';
    
    switch (type) {
      case 'nama_ayah':
        return result.nama_ayah || '-';
      case 'nama_ibu':
        return result.nama_ibu || '-';
      case 'koordinat':
        return `${result.lintang || '-'}, ${result.bujur || '-'}`;
      default:
        return '-';
    }
  };

  const totalPages = Math.ceil(totalSearchesAllTime / itemsPerPage);

  if (loading && currentPage === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-blue-700 font-medium">Memuat data aktivitas...</span>
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

          {/* Header Stats */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Aktivitas Pencarian User
                </h1>
                <p className="text-gray-600">
                  Monitor dan kelola aktivitas pencarian data siswa
                </p>
              </div>
              
              <button
                onClick={() => setShowFilterModal(true)}
                className="mt-4 md:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:from-orange-600 hover:to-amber-700 transition-all shadow-md hover:shadow-lg"
              >
                <span className="text-lg">🚫</span>
                <span>Filter Nama</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                <div className="text-sm text-blue-600 mb-1">Total Pencarian Hari Ini</div>
                <div className="text-3xl font-bold text-blue-700">{totalSearchesToday}</div>
                <div className="text-xs text-blue-500 mt-1">Data diupdate real-time</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                <div className="text-sm text-green-600 mb-1">Total Pencarian Keseluruhan</div>
                <div className="text-3xl font-bold text-green-700">{totalSearchesAllTime}</div>
                <div className="text-xs text-green-500 mt-1">Seluruh periode</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                <div className="text-sm text-purple-600 mb-1">Siswa Terfilter</div>
                <div className="text-3xl font-bold text-purple-700">{filteredSiswaList.length}</div>
                <div className="text-xs text-purple-500 mt-1">Tidak muncul di pencarian user</div>
              </div>
            </div>
          </div>

          {/* Daftar Siswa Terfilter */}
          {filteredSiswaList.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Siswa yang Difilter</h2>
              <div className="flex flex-wrap gap-2">
                {filteredSiswaList.map((filter) => (
                  <div key={filter.id} className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                    <span className="text-red-700 font-medium">{filter.siswa?.nama || 'Tidak diketahui'}</span>
                    <button
                      onClick={() => handleRemoveFilter(filter.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Hapus dari filter"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Cari berdasarkan email, nama user, atau nama siswa..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Riwayat Pencarian</h2>
                <p className="text-sm text-gray-600">
                  Menampilkan {searchLogs.length} dari {totalSearchesAllTime} pencarian
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-max">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Waktu Pencarian
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Browser
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Tipe Pencarian
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Hasil
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Sisa Limit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {searchLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">{log.profiles?.name || log.profiles?.email}</div>
                          <div className="text-sm text-gray-500">{log.profiles?.email}</div>
                          {log.profiles?.search_access_revoked && (
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded mt-1">
                              Akses Dicabut
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                        {log.ip_address || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {log.browser_info || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          log.search_type === 'nama_ayah' ? 'bg-green-100 text-green-800' :
                          log.search_type === 'nama_ibu' ? 'bg-pink-100 text-pink-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {log.search_type === 'nama_ayah' ? 'Nama Ayah' :
                           log.search_type === 'nama_ibu' ? 'Nama Ibu' : 'Koordinat'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatResult(log.search_result, log.search_type)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            (log.profiles?.daily_search_limit || 3) - (log.profiles?.today_search_count || 0) <= 0
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {(log.profiles?.daily_search_limit || 3) - (log.profiles?.today_search_count || 0)} / {log.profiles?.daily_search_limit || 3}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => openDetailModal(log)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 transition-all text-xs"
                          >
                            <span>👁️</span>
                            <span>Detail</span>
                          </button>
                          <button
                            onClick={() => openEditModal(log.profiles)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-md hover:from-green-600 hover:to-green-700 transition-all text-xs"
                          >
                            <span>✏️</span>
                            <span>Edit Limit</span>
                          </button>
                          <button
                            onClick={() => handleToggleAccess(log.profiles)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md transition-all text-xs ${
                              log.profiles?.search_access_revoked
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                                : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                            }`}
                          >
                            <span>{log.profiles?.search_access_revoked ? '🔓' : '🚫'}</span>
                            <span>{log.profiles?.search_access_revoked ? 'Berikan Akses' : 'Cabut Akses'}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-md hover:from-gray-600 hover:to-gray-700 transition-all text-xs"
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
              
              {searchLogs.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-5xl text-gray-300 mb-4">📊</div>
                  <p className="text-gray-600 text-lg mb-2">Tidak ada data pencarian</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {searchLogs.length > 0 && (
              <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Halaman {currentPage} dari {totalPages}
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      currentPage === 1 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 shadow-sm'
                    }`}
                  >
                    ← Sebelumnya
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
                        onClick={() => setCurrentPage(pageNum)}
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
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 shadow-sm'
                    }`}
                  >
                    Selanjutnya →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Filter Nama Siswa</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Siswa yang difilter tidak akan muncul di halaman pencarian user
                </p>
              </div>
              <button
                onClick={() => {
                  setShowFilterModal(false);
                  setFilterSearchTerm('');
                  setFilterSearchResults([]);
                  setSelectedFilterSiswa([]);
                }}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 rounded-full transition-colors"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cari Nama Siswa untuk Difilter
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filterSearchTerm}
                    onChange={(e) => {
                      setFilterSearchTerm(e.target.value);
                      searchSiswaForFilter(e.target.value);
                    }}
                    placeholder="Ketik nama siswa..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-3 text-gray-400">🔍</span>
                </div>

                {/* Search Results */}
                {filterSearchResults.length > 0 && (
                  <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filterSearchResults.map((siswa) => (
                      <div
                        key={siswa.id}
                        onClick={() => {
                          if (!selectedFilterSiswa.find(s => s.id === siswa.id)) {
                            setSelectedFilterSiswa(prev => [...prev, siswa]);
                          }
                          setFilterSearchTerm('');
                          setFilterSearchResults([]);
                        }}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{siswa.nama}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          NISN: {siswa.nisn || '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Students */}
              {selectedFilterSiswa.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">
                    Siswa yang akan difilter ({selectedFilterSiswa.length})
                  </h4>
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {selectedFilterSiswa.map((siswa) => (
                      <div key={siswa.id} className="flex items-center gap-2 px-3 py-2 bg-orange-100 border border-orange-200 rounded-lg">
                        <span className="text-orange-800">{siswa.nama}</span>
                        <button
                          onClick={() => setSelectedFilterSiswa(prev => prev.filter(s => s.id !== siswa.id))}
                          className="text-orange-600 hover:text-orange-800"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Filtered Students */}
              {filteredSiswaList.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">
                    Siswa yang sudah difilter ({filteredSiswaList.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {filteredSiswaList.map((filter) => (
                        <div key={filter.id} className="flex items-center justify-between px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                          <span className="text-red-700">{filter.siswa?.nama || 'Tidak diketahui'}</span>
                          <button
                            onClick={() => handleRemoveFilter(filter.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Hapus dari filter"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowFilterModal(false);
                  setFilterSearchTerm('');
                  setFilterSearchResults([]);
                  setSelectedFilterSiswa([]);
                }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleAddFilter}
                disabled={selectedFilterSiswa.length === 0 || loadingFilter}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all font-medium ${
                  selectedFilterSiswa.length === 0 || loadingFilter
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700 shadow-md hover:shadow-lg'
                }`}
              >
                {loadingFilter ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">🚫</span>
                    <span>Filter {selectedFilterSiswa.length} Siswa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Detail Pencarian</h3>
                <p className="text-sm text-gray-600 mt-1">Informasi lengkap aktivitas pencarian</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 rounded-full transition-colors"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">User</label>
                  <p className="text-gray-900 font-medium">{selectedLog.profiles?.name || selectedLog.profiles?.email}</p>
                  <p className="text-sm text-gray-600">{selectedLog.profiles?.email}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Siswa yang Dicari</label>
                  <p className="text-gray-900">{selectedLog.search_query || '-'}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Waktu Pencarian</label>
                  <p className="text-gray-900">{formatDate(selectedLog.created_at)}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">IP Address</label>
                  <p className="text-gray-900 font-mono">{selectedLog.ip_address || '-'}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Browser</label>
                  <p className="text-gray-900">{selectedLog.browser_info || '-'}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">User Agent</label>
                  <p className="text-gray-900 text-xs">{selectedLog.user_agent || '-'}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tipe Pencarian</label>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    selectedLog.search_type === 'nama_ayah' ? 'bg-green-100 text-green-800' :
                    selectedLog.search_type === 'nama_ibu' ? 'bg-pink-100 text-pink-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {selectedLog.search_type === 'nama_ayah' ? 'Nama Ayah' :
                     selectedLog.search_type === 'nama_ibu' ? 'Nama Ibu' : 'Koordinat'}
                  </span>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Hasil Pencarian</label>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-900 font-medium">
                      {formatResult(selectedLog.search_result, selectedLog.search_type)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Edit Limit Pencarian</h3>
                <p className="text-sm text-gray-600 mt-1">Atur jumlah pencarian harian yang diizinkan</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 rounded-full transition-colors"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Limit Pencarian Harian
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editLimit}
                  onChange={(e) => setEditLimit(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Masukkan jumlah limit"
                />
                <p className="text-xs text-gray-500 mt-1">
                  0 = tidak ada limit, 3 = default untuk user-raport
                </p>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleEditLimit}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-medium shadow-md hover:shadow-lg"
              >
                <span className="text-lg">💾</span>
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSearchLogs;
