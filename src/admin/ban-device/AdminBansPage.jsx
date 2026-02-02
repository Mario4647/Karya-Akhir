import React from 'react';
import AdminBansTable from '../../components/bans/AdminBansTable';

const AdminBansPage = () => {
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
                <p className="text-gray-600">Kelua pembatasan device dan pengajuan banding</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2">
                <i className="bx bx-download"></i>
                Export
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                <i className="bx bx-refresh"></i>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Banned</p>
                <p className="text-2xl font-bold text-gray-800">24</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <i className="bx bx-lock text-2xl text-red-600"></i>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                <i className="bx bx-up-arrow-alt text-green-500"></i>
                <span className="text-green-600 font-medium"> 12% </span>
                dari bulan lalu
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Appeals</p>
                <p className="text-2xl font-bold text-gray-800">8</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <i className="bx bx-time text-2xl text-yellow-600"></i>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                <i className="bx bx-bell text-blue-500"></i>
                <span className="text-blue-600 font-medium"> 3 baru </span>
                hari ini
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Permanent Bans</p>
                <p className="text-2xl font-bold text-gray-800">5</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <i className="bx bx-infinite text-2xl text-purple-600"></i>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                <i className="bx bx-shield text-gray-500"></i>
                <span className="font-medium"> 0.5% </span>
                dari total user
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Ban Duration</p>
                <p className="text-2xl font-bold text-gray-800">7 hari</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <i className="bx bx-calendar text-2xl text-green-600"></i>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                <i className="bx bx-trending-down text-red-500"></i>
                <span className="text-red-600 font-medium"> 2 hari </span>
                lebih singkat
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <i className="bx bx-search absolute left-3 top-3 text-gray-500"></i>
                <input
                  type="text"
                  placeholder="Cari berdasarkan email, nama, atau IP..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select className="px-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none">
                <option>Semua Status</option>
                <option>Aktif</option>
                <option>Banned</option>
                <option>Appeal Pending</option>
              </select>
              <select className="px-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none">
                <option>Semua Durasi</option>
                <option>24 Jam</option>
                <option>7 Hari</option>
                <option>30 Hari</option>
                <option>Permanen</option>
              </select>
              <button className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                <i className="bx bx-filter-alt"></i>
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Main Table */}
        <AdminBansTable />

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <i className="bx bx-info-circle text-blue-500 text-xl mt-1"></i>
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">Petunjuk Penggunaan</h3>
              <ul className="text-blue-700 space-y-2">
                <li className="flex items-start gap-2">
                  <i className="bx bx-check text-green-500 mt-0.5"></i>
                  <span>Klik "Lihat Detail" untuk melihat informasi lengkap device</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="bx bx-check text-green-500 mt-0.5"></i>
                  <span>Gunakan "Ban Device" untuk membatasi device tertentu dengan durasi yang bisa disesuaikan</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="bx bx-check text-green-500 mt-0.5"></i>
                  <span>Tombol "Banding" muncul ketika user mengajukan permohonan banding</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="bx bx-check text-green-500 mt-0.5"></i>
                  <span>"Lepas Ban" untuk menghentikan pembatasan sebelum waktunya</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <i className="bx bx-shield-alt"></i>
              <span>© {new Date().getFullYear()} Security Management System v1.0</span>
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
