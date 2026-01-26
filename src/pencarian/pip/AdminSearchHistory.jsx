import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AdminNavbar from '../../components/AdminNavbar';

const AdminSearchHistory = () => {
  const [searchHistory, setSearchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
    fetchSearchHistory();
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

  const fetchSearchHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setSearchHistory(data);
    } catch (error) {
      console.error('Error fetching search history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID');
    } catch {
      return dateString;
    }
  };

  const handleDeleteHistory = async (id) => {
    try {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Refresh data
      fetchSearchHistory();
      alert('History berhasil dihapus');
    } catch (error) {
      console.error('Error deleting history:', error);
      alert('Gagal menghapus history');
    }
  };

  const openDetailModal = (history) => {
    setSelectedHistory(history);
    setShowDetailModal(true);
  };

  // Filter data berdasarkan pencarian
  const filteredHistory = searchHistory.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.user_email?.toLowerCase().includes(searchLower) ||
      item.user_name?.toLowerCase().includes(searchLower) ||
      item.nisn_searched?.includes(searchTerm) ||
      item.ip_address?.includes(searchTerm)
    );
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-blue-700 font-medium">Memuat history pencarian...</span>
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
          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  History Pencarian PIP
                </h1>
                <p className="text-gray-600">
                  Riwayat pencarian data PIP oleh pengguna
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="text-sm text-blue-600 mb-1">Total Pencarian</div>
                <div className="text-2xl font-bold text-blue-700">{searchHistory.length}</div>
                <div className="text-xs text-blue-500 mt-1">Seluruh waktu</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="text-sm text-green-600 mb-1">Pencarian Hari Ini</div>
                <div className="text-2xl font-bold text-green-700">
                  {searchHistory.filter(item => {
                    const today = new Date().toDateString();
                    const itemDate = new Date(item.created_at).toDateString();
                    return today === itemDate;
                  }).length}
                </div>
                <div className="text-xs text-green-500 mt-1">24 jam terakhir</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="text-sm text-purple-600 mb-1">Pengguna Unik</div>
                <div className="text-2xl font-bold text-purple-700">
                  {[...new Set(searchHistory.map(item => item.user_email))].length}
                </div>
                <div className="text-xs text-purple-500 mt-1">Email berbeda</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                <div className="text-sm text-orange-600 mb-1">IP Unik</div>
                <div className="text-2xl font-bold text-orange-700">
                  {[...new Set(searchHistory.map(item => item.ip_address))].length}
                </div>
                <div className="text-xs text-orange-500 mt-1">Alamat berbeda</div>
              </div>
            </div>

            {/* Search */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Cari berdasarkan email, nama, NISN, atau IP..."
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
                <h2 className="text-lg font-semibold text-gray-800">Daftar History Pencarian</h2>
                <p className="text-sm text-gray-600">
                  Menampilkan {filteredHistory.length} dari {searchHistory.length} data
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-max">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nama User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">IP Address</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Waktu Pencarian</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">NISN Dicari</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50 border-l border-gray-200">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentItems.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {indexOfFirstItem + index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        <div className="font-medium">{item.user_email || 'Anonim'}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {item.user_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 font-mono">
                        {item.ip_address || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        <div className="flex flex-col">
                          <span>{formatDateShort(item.created_at)}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(item.created_at).toLocaleTimeString('id-ID')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {item.nisn_searched || '-'}
                      </td>
                      <td className="px-4 py-3 bg-white group-hover:bg-gray-50 border-l border-gray-100">
                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={() => openDetailModal(item)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 transition-all text-xs shadow-sm hover:shadow"
                          >
                            <span className="text-sm">👁️</span>
                            <span>Detail</span>
                          </button>
                          <button
                            onClick={() => handleDeleteHistory(item.id)}
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
              
              {filteredHistory.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-5xl text-gray-300 mb-4">📊</div>
                  <p className="text-gray-600 text-lg mb-2">Tidak ada history pencarian</p>
                  <p className="text-sm text-gray-500">
                    {searchTerm ? `Tidak ditemukan data dengan pencarian "${searchTerm}"` : 'Belum ada riwayat pencarian'}
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {filteredHistory.length > 0 && (
              <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Menampilkan <span className="font-semibold">{indexOfFirstItem + 1}</span> - <span className="font-semibold">{Math.min(indexOfLastItem, filteredHistory.length)}</span> dari <span className="font-semibold">{filteredHistory.length}</span> data
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

      {/* Detail History Modal */}
      {showDetailModal && selectedHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Detail Pencarian</h3>
                <p className="text-sm text-gray-600 mt-1">History Pencarian PIP</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600 text-sm">Email User</span>
                    <p className="font-medium">{selectedHistory.user_email || 'Anonim'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">Nama User</span>
                    <p className="font-medium">{selectedHistory.user_name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">IP Address</span>
                    <p className="font-medium font-mono">{selectedHistory.ip_address || '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">Waktu Pencarian</span>
                    <p className="font-medium">{formatDateTime(selectedHistory.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Data Pencarian */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h5 className="font-semibold text-gray-800 mb-3 pb-2 border-b">Data yang Dicari</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600 text-sm">NISN</span>
                    <p className="font-medium">{selectedHistory.nisn_searched || '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">Tanggal Lahir</span>
                    <p className="font-medium">
                      {selectedHistory.tanggal_lahir_searched ? formatDateShort(selectedHistory.tanggal_lahir_searched) : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Hasil Pencarian */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h5 className="font-semibold text-gray-800 mb-3 pb-2 border-b">Hasil Pencarian</h5>
                {selectedHistory.search_result ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <span className="text-gray-600 text-sm">Nama</span>
                        <p className="font-bold text-gray-900">{selectedHistory.search_result.nama_pd}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <span className="text-gray-600 text-sm">NISN</span>
                        <p className="font-bold text-gray-900">{selectedHistory.search_result.nisn}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <span className="text-gray-600 text-sm">Kelas</span>
                        <p className="font-bold text-gray-900">{selectedHistory.search_result.kelas} {selectedHistory.search_result.rombel}</p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <span className="text-gray-600 text-sm">Status</span>
                        <p className="font-bold text-gray-900">{selectedHistory.search_result.status_cair}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h6 className="font-medium text-gray-800 mb-2">Detail PIP</h6>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Nominal:</span>
                          <p className="font-medium">{new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR'
                          }).format(selectedHistory.search_result.nominal || 0)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">No Rekening:</span>
                          <p className="font-medium">{selectedHistory.search_result.no_rekening || '-'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Nomor SK:</span>
                          <p className="font-medium text-sm">{selectedHistory.search_result.nomor_sk || '-'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Tanggal SK:</span>
                          <p className="font-medium">{formatDateShort(selectedHistory.search_result.tanggal_sk)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Sekolah:</span>
                          <p className="font-medium text-sm">{selectedHistory.search_result.nomenklatur}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Layak PIP:</span>
                          <p className="font-medium">{selectedHistory.search_result.layak_pip}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Tidak ada data hasil pencarian</p>
                )}
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
    </div>
  );
};

export default AdminSearchHistory;
