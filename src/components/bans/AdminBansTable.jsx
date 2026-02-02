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

  // Modals state
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [banModalData, setBanModalData] = useState(null);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [showAppealModal, setShowAppealModal] = useState(false);

  useEffect(() => {
    fetchBans();
  }, [pagination.page]);

  const fetchBans = async () => {
    setLoading(true);
    const result = await banService.getAllBans(pagination.page, pagination.limit);
    
    if (result.success) {
      setBans(result.data);
      setPagination(prev => ({
        ...prev,
        total: result.total,
        totalPages: result.totalPages,
      }));
    }
    setLoading(false);
  };

  const handleBanDevice = (user) => {
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
      }
    }
  };

  const handleConfirmBan = async (banData) => {
    const result = await banService.banDevice({
      ...banData.deviceInfo,
      bannedUntil: banData.bannedUntil,
      isPermanent: banData.isPermanent,
      reason: banData.reason,
      bannedBy: 'admin-user-id', // Replace with actual admin ID
    });

    if (result.success) {
      alert('Device berhasil dibatasi');
      setBanModalData(null);
      fetchBans();
    }
  };

  const handleAppealResponse = async (appealId, status) => {
    const response = prompt(`Berikan alasan untuk ${status === 'approved' ? 'menyetujui' : 'menolak'} banding:`);
    if (response) {
      const result = await banService.updateAppealStatus(
        appealId,
        status,
        response,
        'admin-user-id' // Replace with actual admin ID
      );
      
      if (result.success) {
        alert(`Banding berhasil di${status === 'approved' ? 'setujui' : 'tolak'}`);
        setShowAppealModal(false);
        setSelectedAppeal(null);
        fetchBans();
      }
    }
  };

  const isCurrentlyBanned = (ban) => {
    if (ban.is_permanent) return true;
    return new Date(ban.banned_until) > new Date();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Manajemen Device Ban</h2>
            <p className="text-gray-600">Kelola device yang dibatasi dan pengajuan banding</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <i className="bx bx-info-circle"></i>
            <span>Total: {pagination.total} device • Halaman {pagination.page} dari {pagination.totalPages}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Nama</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Device</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">IP Address</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bans.map((ban) => (
              <tr key={ban.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <i className="bx bx-envelope text-gray-500"></i>
                    <span className="font-medium text-gray-800 truncate max-w-xs">
                      {ban.user?.email || 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <i className="bx bx-user text-gray-500"></i>
                    <span className="text-gray-800">
                      {ban.user?.profiles?.full_name || 'Tidak tersedia'}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
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
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center gap-2"
                  >
                    <i className="bx bx-devices"></i>
                    Lihat Detail
                  </button>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <i className="bx bx-globe text-gray-500"></i>
                    <code className="text-sm font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded">
                      {ban.ip_address || 'N/A'}
                    </code>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${isCurrentlyBanned(ban) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      <i className={`bx ${isCurrentlyBanned(ban) ? 'bx-lock' : 'bx-lock-open'}`}></i>
                      {isCurrentlyBanned(ban) ? 'Banned' : 'Active'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {ban.is_permanent ? 'Permanen' : formatDate(ban.banned_until)}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    {/* Ban/Unban Button */}
                    <button
                      onClick={() => isCurrentlyBanned(ban) 
                        ? handleUnbanDevice(ban.id) 
                        : handleBanDevice(ban)
                      }
                      className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${isCurrentlyBanned(ban) 
                        ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                        : 'bg-red-50 text-red-600 hover:bg-red-100'
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
                        className="px-3 py-1.5 bg-yellow-50 text-yellow-600 rounded-lg font-medium hover:bg-yellow-100 transition-colors flex items-center gap-2"
                      >
                        <i className="bx bx-message-square-detail"></i>
                        Banding ({ban.ban_appeals.length})
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="bx bx-chevron-left"></i> Sebelumnya
          </button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                  className={`w-10 h-10 rounded-lg ${pagination.page === pageNum ? 'bg-blue-500 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Selanjutnya <i className="bx bx-chevron-right"></i>
          </button>
        </div>
      </div>

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
