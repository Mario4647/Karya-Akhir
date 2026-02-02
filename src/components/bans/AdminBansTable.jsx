// src/components/bans/AdminBansTable.jsx
import React, { useState, useEffect } from 'react';
import { banService } from '../../services/banService';
import DeviceInfoModal from './DeviceInfoModal';
import BanDurationModal from './BanDurationModal';
import AppealMessageModal from './AppealMessageModal';

const AdminBansTable = () => {
  const [bans, setBans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [statistics, setStatistics] = useState({
    totalBanned: 0,
    percentageChange: 0,
    pendingAppeals: 0,
    todayAppeals: 0,
    permanentBans: 0,
    permanentPercentage: '0.0',
    avgDurationDays: 7,
    lastMonthChange: 0,
  });

  // Modals state
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [banModalData, setBanModalData] = useState(null);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch bans dan statistics
  useEffect(() => {
    fetchBans();
    fetchStatistics();
  }, [pagination.page, statusFilter, searchTerm]);

  const fetchBans = async () => {
    setLoading(true);
    const filters = {
      status: statusFilter === 'all' ? null : statusFilter,
      search: searchTerm || null
    };
    
    const result = await banService.getAllBans(pagination.page, pagination.limit, filters);
    
    if (result.success) {
      console.log('✅ Bans data loaded:', result.data);
      setBans(result.data);
      setPagination(prev => ({
        ...prev,
        total: result.total,
        totalPages: result.totalPages,
      }));
    } else {
      console.error('❌ Failed to fetch bans:', result.error);
      setBans([]);
    }
    setLoading(false);
  };

  const fetchStatistics = async () => {
    const result = await banService.getBanStatistics();
    if (result.success) {
      setStatistics(result.statistics);
    }
  };

  const handleBanDevice = (user) => {
    console.log('Ban device clicked:', user);
    setBanModalData({
      userId: user.user_id,
      email: user.user?.email || 'Unknown',
      deviceInfo: user,
    });
  };

  const handleUnbanDevice = async (banId) => {
    if (window.confirm('Yakin ingin melepas pembatasan device ini?')) {
      const result = await banService.unbanDevice(banId);
      if (result.success) {
        alert('Device berhasil dilepas dari pembatasan');
        fetchBans();
        fetchStatistics();
      } else {
        alert('Gagal melepas ban: ' + result.error);
      }
    }
  };

  const handleConfirmBan = async (banData) => {
    console.log('Confirming ban:', banData);
    const result = await banService.banDevice({
      ...banData.deviceInfo,
      bannedUntil: banData.bannedUntil,
      isPermanent: banData.isPermanent,
      reason: banData.reason,
      bannedBy: 'admin-user-id', // Ganti dengan ID admin yang sebenarnya
      email: banData.email,
    });

    if (result.success) {
      alert('Device berhasil dibatasi');
      setBanModalData(null);
      fetchBans();
      fetchStatistics();
    } else {
      alert('Gagal membatasi device: ' + result.error);
    }
  };

  const handleAppealResponse = async (appealId, status) => {
    const response = prompt(`Berikan alasan untuk ${status === 'approved' ? 'menyetujui' : 'menolak'} banding:`);
    if (response) {
      const result = await banService.updateAppealStatus(
        appealId,
        status,
        response,
        'admin-user-id' // Ganti dengan ID admin yang sebenarnya
      );
      
      if (result.success) {
        alert(`Banding berhasil di${status === 'approved' ? 'setujui' : 'tolak'}`);
        setShowAppealModal(false);
        setSelectedAppeal(null);
        fetchBans();
        fetchStatistics();
      } else {
        alert(`Gagal merespon banding: ${result.error}`);
      }
    }
  };

  const isCurrentlyBanned = (ban) => {
    if (ban.is_permanent) return true;
    if (!ban.banned_until) return false;
    return new Date(ban.banned_until) > new Date();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (ban) => {
    const isActive = isCurrentlyBanned(ban);
    const isPerm = ban.is_permanent;
    
    if (isPerm) {
      return (
        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
          <i className="bx bx-infinite mr-1"></i>
          Permanent
        </span>
      );
    } else if (isActive) {
      return (
        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
          <i className="bx bx-lock mr-1"></i>
          Active
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
          <i className="bx bx-lock-open mr-1"></i>
          Expired
        </span>
      );
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchBans();
  };

  if (loading && bans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Memuat data bans...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Filters Section */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <form onSubmit={handleSearch} className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <i className="bx bx-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari email, nama, atau IP..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Active Bans</option>
                  <option value="expired">Expired Bans</option>
                  <option value="permanent">Permanent</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <i className="bx bx-filter-alt"></i>
                  Filter
                </button>
              </div>
            </form>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <i className="bx bx-info-circle"></i>
            <span>
              Menampilkan {bans.length} dari {pagination.total} • 
              Halaman {pagination.page} dari {pagination.totalPages}
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 border-b">Email</th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 border-b">Nama</th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 border-b">Detail Device</th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 border-b">IP Address</th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 border-b">Status</th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bans.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <i className="bx bx-shield-x text-4xl mb-3"></i>
                    <p className="text-lg font-medium">Tidak ada data bans</p>
                    <p className="text-sm mt-1">Belum ada device yang dibatasi</p>
                  </div>
                </td>
              </tr>
            ) : (
              bans.map((ban) => (
                <tr 
                  key={ban.id} 
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  {/* Email Column */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <i className="bx bx-envelope text-blue-600"></i>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {ban.user?.email || 'Tidak tersedia'}
                        </p>
                        {ban.banned_by_user && (
                          <p className="text-xs text-gray-500">
                            By: {ban.banned_by_user.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  {/* Name Column */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <i className="bx bx-user text-green-600"></i>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {ban.user?.profiles?.full_name || 'Tidak tersedia'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {ban.user_id ? ban.user_id.substring(0, 8) + '...' : 'No user'}
                        </p>
                      </div>
                    </div>
                  </td>
                  
                  {/* Device Detail Column */}
                  <td className="py-4 px-6">
                    <button
                      onClick={() => setSelectedDevice({
                        ...ban,
                        userAgent: ban.user_agent,
                        browser: ban.browser,
                        os: ban.os,
                        platform: ban.platform,
                        screenResolution: ban.screen_resolution,
                        languages: ban.languages,
                        timezone: ban.timezone,
                      })}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center gap-2"
                    >
                      <i className="bx bx-devices"></i>
                      Lihat Detail
                    </button>
                    <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                      {ban.device_fingerprint?.substring(0, 30)}...
                    </p>
                  </td>
                  
                  {/* IP Address Column */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <i className="bx bx-globe text-gray-500"></i>
                      <code className="text-sm font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded">
                        {ban.ip_address || 'N/A'}
                      </code>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {ban.banned_at ? formatDate(ban.banned_at) : 'No date'}
                    </p>
                  </td>
                  
                  {/* Status Column */}
                  <td className="py-4 px-6">
                    <div className="space-y-2">
                      {getStatusBadge(ban)}
                      <div className="text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <i className="bx bx-calendar"></i>
                          {ban.is_permanent ? (
                            <span>Permanent ban</span>
                          ) : ban.banned_until ? (
                            <span>Until: {formatDate(ban.banned_until)}</span>
                          ) : (
                            <span>No end date</span>
                          )}
                        </div>
                        {ban.reason && (
                          <p className="mt-1 truncate max-w-xs" title={ban.reason}>
                            {ban.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  {/* Actions Column */}
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-2 min-w-[200px]">
                      {/* Ban/Unban Button */}
                      <button
                        onClick={() => isCurrentlyBanned(ban) 
                          ? handleUnbanDevice(ban.id) 
                          : handleBanDevice(ban)
                        }
                        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${isCurrentlyBanned(ban) 
                          ? 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200' 
                          : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                        }`}
                      >
                        <i className={`bx ${isCurrentlyBanned(ban) ? 'bx-lock-open' : 'bx-lock'}`}></i>
                        {isCurrentlyBanned(ban) ? 'Lepas Ban' : 'Ban Device'}
                      </button>

                      {/* Appeal Button */}
                      {ban.ban_appeals && ban.ban_appeals.length > 0 && isCurrentlyBanned(ban) && (
                        <button
                          onClick={() => {
                            setSelectedAppeal(ban.ban_appeals[0]);
                            setShowAppealModal(true);
                          }}
                          className="px-4 py-2 bg-yellow-50 text-yellow-600 rounded-lg font-medium hover:bg-yellow-100 transition-colors flex items-center justify-center gap-2 border border-yellow-200"
                        >
                          <i className="bx bx-message-square-detail"></i>
                          Banding ({ban.ban_appeals.length})
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <i className="bx bx-chevron-left"></i> Sebelumnya
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                
                if (pageNum < 1 || pageNum > pagination.totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      pagination.page === pageNum 
                        ? 'bg-blue-500 text-white shadow-sm' 
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              {pagination.totalPages > 5 && (
                <span className="px-2 text-gray-500">...</span>
              )}
            </div>

            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Selanjutnya <i className="bx bx-chevron-right"></i>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedDevice && (
        <DeviceInfoModal
          deviceInfo={selectedDevice}
          onClose={() => setSelectedDevice(null)}
        />
      )}

      {banModalData && (
        <BanDurationModal
          {...banModalData}
          onConfirm={handleConfirmBan}
          onClose={() => setBanModalData(null)}
        />
      )}

      {showAppealModal && selectedAppeal && (
        <AppealMessageModal
          appeal={selectedAppeal}
          onRespond={handleAppealResponse}
          onClose={() => {
            setShowAppealModal(false);
            setSelectedAppeal(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminBansTable;
