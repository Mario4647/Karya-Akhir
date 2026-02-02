// src/components/bans/UserDevicesTable.jsx
import React, { useState, useEffect } from 'react';
import { banService } from '../../services/banService';
import DeviceInfoModal from './DeviceInfoModal';
import BanDurationModal from './BanDurationModal';

const UserDevicesTable = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [banModalData, setBanModalData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, [pagination.page]);

  const fetchDevices = async () => {
    setLoading(true);
    const filters = {
      search: searchTerm || null
    };
    
    const result = await banService.getAllUserDevices(pagination.page, pagination.limit, filters);
    
    if (result.success) {
      console.log('✅ Devices data loaded:', result.data);
      setDevices(result.data);
      setPagination(prev => ({
        ...prev,
        total: result.total,
        totalPages: result.totalPages,
      }));
    } else {
      console.error('❌ Failed to fetch devices:', result.error);
      alert('Gagal memuat data: ' + result.error);
      setDevices([]);
    }
    setLoading(false);
  };

  const handleBanDevice = (device) => {
    console.log('Ban device clicked:', device);
    setBanModalData({
      userId: device.user_id,
      email: device.email,
      deviceInfo: {
        fingerprint: device.device_fingerprint,
        ipAddress: device.ip_address,
        userAgent: device.user_agent,
        platform: device.platform,
        browser: device.browser,
        os: device.os,
        screenResolution: device.screen_resolution,
        languages: device.languages,
        timezone: device.timezone,
      },
    });
  };

  const handleConfirmBan = async (banData) => {
    console.log('Confirming ban:', banData);
    setActionLoading(true);
    
    const result = await banService.banDevice({
      ...banData.deviceInfo,
      bannedUntil: banData.bannedUntil,
      isPermanent: banData.isPermanent,
      reason: banData.reason,
      email: banData.email,
    });

    if (result.success) {
      alert('✅ Device berhasil dibatasi');
      setBanModalData(null);
      fetchDevices();
    } else {
      alert('❌ Gagal membatasi device: ' + result.error);
    }
    setActionLoading(false);
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

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'N/A';
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} menit lalu`;
    } else if (diffHours < 24) {
      return `${diffHours} jam lalu`;
    } else if (diffDays < 30) {
      return `${diffDays} hari lalu`;
    } else {
      return formatDate(dateString);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchDevices();
  };

  const handleRefresh = () => {
    fetchDevices();
  };

  if (loading && devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Memuat data devices...</p>
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
                    placeholder="Cari email, device, atau IP..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <i className="bx bx-filter-alt"></i>
                  Cari
                </button>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={actionLoading}
                  className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <i className="bx bx-refresh"></i>
                  Refresh
                </button>
              </div>
            </form>
          </div>
          
          <div className="text-sm text-gray-600">
            <span>
              Menampilkan {devices.length} dari {pagination.total}
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
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 border-b">Device Name</th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 border-b">Device Info</th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 border-b">IP Address</th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 border-b">Aktivitas</th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {devices.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <i className="bx bx-devices text-4xl mb-3"></i>
                    <p className="text-lg font-medium">Tidak ada data devices</p>
                    <p className="text-sm mt-1">Belum ada user yang login/register</p>
                  </div>
                </td>
              </tr>
            ) : (
              devices.map((device) => (
                <tr 
                  key={device.id} 
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  {/* Email Column */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <i className="bx bx-envelope text-blue-600"></i>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate max-w-xs">
                          {device.email}
                        </p>
                        <p className="text-xs text-gray-500">
                          {device.user?.full_name || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </td>
                  
                  {/* Device Name Column */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <i className="bx bx-devices text-green-600"></i>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {device.device_name || 'Unnamed Device'}
                        </p>
                        <p className="text-xs text-gray-500 font-mono truncate max-w-xs" title={device.device_fingerprint}>
                          {device.device_fingerprint?.substring(0, 20)}...
                        </p>
                      </div>
                    </div>
                  </td>
                  
                  {/* Device Info Column */}
                  <td className="py-4 px-6">
                    <button
                      onClick={() => setSelectedDevice({
                        ...device,
                        userAgent: device.user_agent,
                        browser: device.browser,
                        os: device.os,
                        platform: device.platform,
                        screenResolution: device.screen_resolution,
                        languages: device.languages,
                        timezone: device.timezone,
                      })}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <i className="bx bx-info-circle"></i>
                      Detail
                    </button>
                    <div className="text-xs text-gray-500 mt-1">
                      <p>{device.browser} • {device.os}</p>
                      <p>{device.platform}</p>
                    </div>
                  </td>
                  
                  {/* IP Address Column */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <i className="bx bx-globe text-gray-500"></i>
                      <code className="text-sm font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded">
                        {device.ip_address || 'N/A'}
                      </code>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      <p>{device.timezone}</p>
                    </div>
                  </td>
                  
                  {/* Activity Column */}
                  <td className="py-4 px-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <i className="bx bx-calendar text-gray-500"></i>
                        <span className="text-sm text-gray-700">
                          {formatTimeAgo(device.last_seen_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="bx bx-log-in text-gray-500"></i>
                        <span className="text-sm text-gray-700">
                          {device.login_count || 1} kali login
                        </span>
                      </div>
                      {device.is_current && (
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          <i className="bx bx-check mr-1"></i>
                          Active
                        </span>
                      )}
                    </div>
                  </td>
                  
                  {/* Actions Column */}
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-2 min-w-[150px]">
                      <button
                        onClick={() => handleBanDevice(device)}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2 border border-red-200 disabled:opacity-50"
                      >
                        <i className="bx bx-lock"></i>
                        Ban Device
                      </button>
                      
                      <button
                        onClick={() => {
                          // Copy device info
                          const deviceInfo = `Email: ${device.email}\nDevice: ${device.device_name}\nFingerprint: ${device.device_fingerprint}\nIP: ${device.ip_address}\nBrowser: ${device.browser}\nOS: ${device.os}`;
                          navigator.clipboard.writeText(deviceInfo);
                          alert('Device info copied to clipboard!');
                        }}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                      >
                        <i className="bx bx-copy"></i>
                        Copy Info
                      </button>
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
              disabled={pagination.page === 1 || actionLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <i className="bx bx-chevron-left"></i> Sebelumnya
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Halaman {pagination.page} dari {pagination.totalPages}
              </span>
            </div>

            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages || actionLoading}
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
          loading={actionLoading}
        />
      )}
    </div>
  );
};

export default UserDevicesTable;
