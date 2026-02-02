// src/pages/AdminBansPage.jsx
import React, { useState, useEffect } from 'react';
import { banService } from '../services/banService';
import AdminBansTable from '../components/bans/AdminBansTable';
import UserDevicesTable from '../components/bans/UserDevicesTable'; // Komponen baru
import { useNavigate } from 'react-router-dom';

const AdminBansPage = () => {
  const [statistics, setStatistics] = useState({
    totalBanned: 0,
    totalDevices: 0,
    percentageChange: 0,
    pendingAppeals: 0,
    todayAppeals: 0,
    permanentBans: 0,
    recentLogins: 0,
    permanentPercentage: '0.0',
    avgDurationDays: 7,
    lastMonthChange: -2,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bans'); // 'bans' atau 'devices'
  const navigate = useNavigate();

  useEffect(() => {
    fetchStatistics();
    testConnection();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    const result = await banService.getBanStatistics();
    if (result.success) {
      setStatistics(result.statistics);
    }
    setLoading(false);
  };

  const testConnection = async () => {
    const result = await banService.testConnection();
    console.log('Database connection test:', result);
  };

  const refreshData = () => {
    fetchStatistics();
  };

  const handleExport = () => {
    alert('Fitur export akan segera tersedia!');
  };

  const handleCreateTestBan = async () => {
    if (window.confirm('Buat ban test untuk debugging?')) {
      const testFingerprint = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const banData = {
        deviceFingerprint: testFingerprint,
        email: 'test@example.com',
        ipAddress: '192.168.1.100',
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        browser: 'Chrome',
        os: 'Windows',
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        languages: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        bannedUntil: new Date(Date.now() + 3600000).toISOString(), // 1 hour
        reason: 'Test ban from admin panel',
        isPermanent: false,
        bannedBy: await banService.getCurrentUserId(),
      };
      
      const result = await banService.banDevice(banData);
      if (result.success) {
        alert('✅ Test ban berhasil dibuat!');
        refreshData();
      } else {
        alert('❌ Gagal membuat test ban: ' + result.error);
      }
    }
  };

  const handleTestDeviceTracking = async () => {
    if (window.confirm('Test device tracking dengan data saat ini?')) {
      const deviceData = {
        email: 'test@example.com',
        deviceFingerprint: `test-track-${Date.now()}`,
        ipAddress: '192.168.1.100',
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        browser: 'Chrome',
        os: 'Windows',
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        languages: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      
      const result = await banService.trackDeviceLogin(deviceData);
      if (result.success) {
        alert('✅ Device tracking berhasil!');
        refreshData();
      } else {
        alert('❌ Gagal tracking device: ' + result.error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <i className="bx bx-shield-x text-2xl text-red-600"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Device Ban Management</h1>
                <p className="text-gray-600">Kelola pembatasan device dan pengajuan banding</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleExport}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <i className="bx bx-download"></i>
                Export
              </button>
              <button 
                onClick={handleTestDeviceTracking}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <i className="bx bx-devices"></i>
                Test Track
              </button>
              <button 
                onClick={handleCreateTestBan}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors flex items-center gap-2"
              >
                <i className="bx bx-plus"></i>
                Test Ban
              </button>
              <button 
                onClick={refreshData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <i className="bx bx-refresh"></i>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('bans')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'bans' 
              ? 'text-blue-600 border-b-2 border-blue-500' 
              : 'text-gray-600 hover:text-gray-800'}`}
          >
            <i className="bx bx-lock mr-2"></i>
            Device Bans
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'devices' 
              ? 'text-blue-600 border-b-2 border-blue-500' 
              : 'text-gray-600 hover:text-gray-800'}`}
          >
            <i className="bx bx-devices mr-2"></i>
            User Devices
          </button>
          <button
            onClick={() => setActiveTab('appeals')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'appeals' 
              ? 'text-blue-600 border-b-2 border-blue-500' 
              : 'text-gray-600 hover:text-gray-800'}`}
          >
            <i className="bx bx-message-square-detail mr-2"></i>
            Appeals
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Devices */}
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Devices</p>
                <p className="text-2xl font-bold text-gray-800">
                  {loading ? '...' : statistics.totalDevices}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <i className="bx bx-devices text-2xl text-blue-600"></i>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                <i className="bx bx-user-plus text-green-500"></i>
                <span className="text-green-600 font-medium">
                  {' '}{statistics.recentLogins || 0}{' '}
                </span>
                login 24 jam terakhir
              </p>
            </div>
          </div>

          {/* Total Banned */}
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Bans</p>
                <p className="text-2xl font-bold text-gray-800">
                  {loading ? '...' : statistics.totalBanned}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <i className="bx bx-lock text-2xl text-red-600"></i>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                <i className={`bx ${statistics.percentageChange >= 0 ? 'bx-up-arrow-alt text-green-500' : 'bx-down-arrow-alt text-red-500'}`}></i>
                <span className={`${statistics.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                  {' '}{statistics.percentageChange}%{' '}
                </span>
                dari bulan lalu
              </p>
            </div>
          </div>

          {/* Pending Appeals */}
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Appeals</p>
                <p className="text-2xl font-bold text-gray-800">
                  {loading ? '...' : statistics.pendingAppeals}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <i className="bx bx-time text-2xl text-yellow-600"></i>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                <i className="bx bx-bell text-blue-500"></i>
                <span className="text-blue-600 font-medium">
                  {' '}{statistics.todayAppeals} baru{' '}
                </span>
                hari ini
              </p>
            </div>
          </div>

          {/* Permanent Bans */}
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Permanent Bans</p>
                <p className="text-2xl font-bold text-gray-800">
                  {loading ? '...' : statistics.permanentBans}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <i className="bx bx-infinite text-2xl text-purple-600"></i>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                <i className="bx bx-shield text-gray-500"></i>
                <span className="font-medium">
                  {' '}{statistics.permanentPercentage}%{' '}
                </span>
                dari total device
              </p>
            </div>
          </div>
        </div>

        {/* Content berdasarkan Tab */}
        {activeTab === 'bans' ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Daftar Device Banned</h2>
                <p className="text-gray-600">Kelola device yang dibatasi dan pengajuan banding</p>
              </div>
              <div className="text-sm text-gray-500">
                <i className="bx bx-server"></i> Sistem aktif • Data real-time
              </div>
            </div>
            
            <AdminBansTable />
          </div>
        ) : activeTab === 'devices' ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Daftar User Devices</h2>
                <p className="text-gray-600">Semua device yang pernah login/register</p>
              </div>
              <div className="text-sm text-gray-500">
                <i className="bx bx-data"></i> Total: {statistics.totalDevices} devices
              </div>
            </div>
            
            <UserDevicesTable />
          </div>
        ) : (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Daftar Banding</h2>
                <p className="text-gray-600">Kelola pengajuan banding dari user</p>
              </div>
              <div className="text-sm text-gray-500">
                <i className="bx bx-message"></i> Pending: {statistics.pendingAppeals} banding
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-8 text-center">
              <i className="bx bx-message-square-detail text-4xl text-gray-300 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Halaman Appeals</h3>
              <p className="text-gray-500">Fitur ini akan segera tersedia</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <i className="bx bx-info-circle text-blue-500 text-xl mt-1"></i>
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">Cara Kerja Sistem:</h3>
              <ul className="text-blue-700 space-y-2">
                <li className="flex items-start gap-2">
                  <i className="bx bx-check text-green-500 mt-0.5"></i>
                  <span><strong>Setiap login/register</strong> - Device otomatis ditrack ke database</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="bx bx-check text-green-500 mt-0.5"></i>
                  <span><strong>Tab "User Devices"</strong> - Menampilkan semua device yang pernah digunakan</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="bx bx-check text-green-500 mt-0.5"></i>
                  <span><strong>Ban Device</strong> - Pilih device dari daftar untuk dibatasi</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="bx bx-check text-green-500 mt-0.5"></i>
                  <span><strong>Device Tracking</strong> - Mencatat IP, browser, OS, dll untuk keamanan</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-800 text-white rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <i className="bx bx-bug"></i>
                System Information
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => console.log('Statistics:', statistics)}
                  className="px-3 py-1 bg-gray-700 rounded text-sm hover:bg-gray-600"
                >
                  Log Stats
                </button>
                <button 
                  onClick={testConnection}
                  className="px-3 py-1 bg-blue-700 rounded text-sm hover:bg-blue-600"
                >
                  Test DB
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Total Devices:</p>
                <p className="font-mono">{statistics.totalDevices}</p>
              </div>
              <div>
                <p className="text-gray-400">Active Bans:</p>
                <p className="font-mono">{statistics.totalBanned}</p>
              </div>
              <div>
                <p className="text-gray-400">Recent Logins:</p>
                <p className="font-mono">{statistics.recentLogins} (24h)</p>
              </div>
              <div>
                <p className="text-gray-400">Last Updated:</p>
                <p className="font-mono">{new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <i className="bx bx-shield-alt"></i>
              <span>© {new Date().getFullYear()} Security Management System v2.0</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <i className="bx bx-server"></i>
                Status: <span className="font-medium text-green-600">Online</span>
              </span>
              <span className="flex items-center gap-1">
                <i className="bx bx-time"></i>
                Update: {new Date().toLocaleTimeString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminBansPage;
