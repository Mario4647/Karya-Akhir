import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('trips');
  const [trips, setTrips] = useState([]);
  const [bannedRegions, setBannedRegions] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [showAddBan, setShowAddBan] = useState(false);
  const [showEditTrip, setShowEditTrip] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [showDetailTrip, setShowDetailTrip] = useState(false);
  const [detailTrip, setDetailTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTrips: 0,
    activeTrips: 0,
    bannedRegionsCount: 0,
    usersWithAccess: 0
  });

  // Form states
  const [tripForm, setTripForm] = useState({
    trip_name: '',
    train_name: '',
    departure_date: '',
    departure_time: '',
    arrival_date: '',
    arrival_time: '',
    departure_station: '',
    arrival_station: '',
    total_ticket_price: '',
    total_days: '',
    notes: ''
  });

  const [banForm, setBanForm] = useState({
    region_type: 'kecamatan',
    region_name: '',
    banned_date: '',
    banned_until: '',
    reason: ''
  });

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      
      const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      return date.toLocaleDateString('id-ID', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      
      return date.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '-';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      
      return date.toLocaleString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting datetime:', error);
      return '-';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'Rp 0';
    try {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(amount);
    } catch (error) {
      console.error('Error formatting currency:', error);
      return 'Rp 0';
    }
  };

  // Add months function
  const addMonths = (date, months) => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + months);
    return newDate;
  };

  // Fetch data
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch trips
      const { data: tripsData, error: tripsError } = await supabase
        .from('train_trips')
        .select(`
          *,
          profiles (
            name,
            email
          )
        `)
        .order('departure_date', { ascending: true });

      if (tripsError) {
        console.error('Error fetching trips:', tripsError);
        throw tripsError;
      }

      // Fetch banned regions
      const { data: banData, error: banError } = await supabase
        .from('banned_regions')
        .select('*')
        .order('banned_date', { ascending: false });

      if (banError) {
        console.error('Error fetching banned regions:', banError);
        throw banError;
      }

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, name, trip_access_granted, trip_access_granted_at')
        .order('name');

      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw usersError;
      }

      setTrips(tripsData || []);
      setBannedRegions(banData || []);
      setUsers(usersData || []);

      // Calculate stats
      const today = new Date();
      const activeTrips = (tripsData || []).filter(trip => {
        try {
          const departureDate = new Date(trip.departure_date);
          return !isNaN(departureDate.getTime()) && departureDate >= today;
        } catch {
          return false;
        }
      }).length;

      setStats({
        totalTrips: (tripsData || []).length,
        activeTrips,
        bannedRegionsCount: (banData || []).length,
        usersWithAccess: (usersData || []).filter(u => u.trip_access_granted).length || 0
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Gagal memuat data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrip = async (e) => {
    e.preventDefault();
    try {
      // Validasi form
      if (!tripForm.departure_date || !tripForm.departure_time || 
          !tripForm.arrival_date || !tripForm.arrival_time) {
        alert('Harap isi semua tanggal dan waktu');
        return;
      }

      const departureDateTime = new Date(`${tripForm.departure_date}T${tripForm.departure_time}`);
      const arrivalDateTime = new Date(`${tripForm.arrival_date}T${tripForm.arrival_time}`);

      // Validasi tanggal
      if (isNaN(departureDateTime.getTime()) || isNaN(arrivalDateTime.getTime())) {
        alert('Format tanggal tidak valid');
        return;
      }

      // Validasi maksimal 6 bulan ke depan
      const maxDate = addMonths(new Date(), 6);
      if (departureDateTime > maxDate) {
        alert('Tanggal keberangkatan tidak boleh lebih dari 6 bulan ke depan');
        return;
      }

      // Validasi arrival > departure
      if (arrivalDateTime <= departureDateTime) {
        alert('Tanggal kedatangan harus setelah tanggal keberangkatan');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('User tidak ditemukan. Silakan login ulang.');
        return;
      }
      
      const { error } = await supabase.from('train_trips').insert({
        user_id: user.id,
        trip_name: tripForm.trip_name,
        train_name: tripForm.train_name,
        departure_date: departureDateTime.toISOString(),
        arrival_date: arrivalDateTime.toISOString(),
        departure_station: tripForm.departure_station,
        arrival_station: tripForm.arrival_station,
        total_ticket_price: parseFloat(tripForm.total_ticket_price) || 0,
        total_days: parseInt(tripForm.total_days) || 1,
        notes: tripForm.notes
      });

      if (error) throw error;

      alert('Trip berhasil ditambahkan!');
      setShowAddTrip(false);
      resetTripForm();
      fetchData();
    } catch (error) {
      console.error('Error adding trip:', error);
      alert('Gagal menambahkan trip: ' + error.message);
    }
  };

  const handleEditTrip = async (e) => {
    e.preventDefault();
    try {
      if (!editingTrip) {
        alert('Trip tidak ditemukan');
        return;
      }

      const departureDateTime = new Date(`${tripForm.departure_date}T${tripForm.departure_time}`);
      const arrivalDateTime = new Date(`${tripForm.arrival_date}T${tripForm.arrival_time}`);

      // Validasi tanggal
      if (isNaN(departureDateTime.getTime()) || isNaN(arrivalDateTime.getTime())) {
        alert('Format tanggal tidak valid');
        return;
      }

      const { error } = await supabase
        .from('train_trips')
        .update({
          trip_name: tripForm.trip_name,
          train_name: tripForm.train_name,
          departure_date: departureDateTime.toISOString(),
          arrival_date: arrivalDateTime.toISOString(),
          departure_station: tripForm.departure_station,
          arrival_station: tripForm.arrival_station,
          total_ticket_price: parseFloat(tripForm.total_ticket_price) || 0,
          total_days: parseInt(tripForm.total_days) || 1,
          notes: tripForm.notes
        })
        .eq('id', editingTrip.id);

      if (error) throw error;

      alert('Trip berhasil diperbarui!');
      setShowEditTrip(false);
      resetTripForm();
      fetchData();
    } catch (error) {
      console.error('Error editing trip:', error);
      alert('Gagal mengedit trip: ' + error.message);
    }
  };

  const handleDeleteTrip = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus trip ini?')) return;

    try {
      const { error } = await supabase
        .from('train_trips')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Trip berhasil dihapus!');
      fetchData();
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert('Gagal menghapus trip: ' + error.message);
    }
  };

  const handleAddBan = async (e) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('User tidak ditemukan. Silakan login ulang.');
        return;
      }

      const { error } = await supabase.from('banned_regions').insert({
        region_type: banForm.region_type,
        region_name: banForm.region_name,
        banned_date: banForm.banned_date,
        banned_until: banForm.banned_until || null,
        reason: banForm.reason,
        banned_by: user.id
      });

      if (error) throw error;

      alert('Ban wilayah berhasil ditambahkan!');
      setShowAddBan(false);
      resetBanForm();
      fetchData();
    } catch (error) {
      console.error('Error adding ban:', error);
      alert('Gagal menambahkan ban wilayah: ' + error.message);
    }
  };

  const handleRemoveBan = async (id) => {
    if (!confirm('Apakah Anda yakin ingin mencabut ban wilayah ini?')) return;

    try {
      const { error } = await supabase
        .from('banned_regions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Ban wilayah berhasil dicabut!');
      fetchData();
    } catch (error) {
      console.error('Error removing ban:', error);
      alert('Gagal mencabut ban wilayah: ' + error.message);
    }
  };

  const handleGrantAccess = async (userId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('User tidak ditemukan. Silakan login ulang.');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          trip_access_granted: true,
          trip_access_granted_at: new Date().toISOString(),
          trip_access_granted_by: user.id
        })
        .eq('id', userId);

      if (error) throw error;

      alert('Akses berhasil diberikan!');
      fetchData();
    } catch (error) {
      console.error('Error granting access:', error);
      alert('Gagal memberikan akses: ' + error.message);
    }
  };

  const handleRevokeAccess = async (userId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('User tidak ditemukan. Silakan login ulang.');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          trip_access_granted: false,
          trip_access_revoked_at: new Date().toISOString(),
          trip_access_revoked_by: user.id
        })
        .eq('id', userId);

      if (error) throw error;

      alert('Akses berhasil dicabut!');
      fetchData();
    } catch (error) {
      console.error('Error revoking access:', error);
      alert('Gagal mencabut akses: ' + error.message);
    }
  };

  const resetTripForm = () => {
    setTripForm({
      trip_name: '',
      train_name: '',
      departure_date: '',
      departure_time: '',
      arrival_date: '',
      arrival_time: '',
      departure_station: '',
      arrival_station: '',
      total_ticket_price: '',
      total_days: '',
      notes: ''
    });
  };

  const resetBanForm = () => {
    setBanForm({
      region_type: 'kecamatan',
      region_name: '',
      banned_date: '',
      banned_until: '',
      reason: ''
    });
  };

  const filteredUsers = users.filter(user => {
    const name = user.name || '';
    const email = user.email || '';
    const search = searchTerm.toLowerCase();
    return name.toLowerCase().includes(search) || email.toLowerCase().includes(search);
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <span className="text-2xl">🚂</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Perjalanan</p>
              <p className="text-2xl font-bold">{stats.totalTrips}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Perjalanan Aktif</p>
              <p className="text-2xl font-bold">{stats.activeTrips}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
              <span className="text-2xl">🚫</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Wilayah Terban</p>
              <p className="text-2xl font-bold">{stats.bannedRegionsCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">User dengan Akses</p>
              <p className="text-2xl font-bold">{stats.usersWithAccess}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('trips')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'trips' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <span className="mr-2">🚂</span>
              Data Perjalanan
            </button>
            <button
              onClick={() => setActiveTab('banlist')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'banlist' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <span className="mr-2">🚫</span>
              Ban List Wilayah
            </button>
            <button
              onClick={() => setActiveTab('access')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'access' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <span className="mr-2">👥</span>
              Akses Pasangan
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {activeTab === 'trips' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Data Perjalanan Kereta Api</h2>
              <button
                onClick={() => setShowAddTrip(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <span className="mr-2">➕</span>
                Tambah Data
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Kereta</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Pengeluaran</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hari</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keberangkatan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tujuan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Berangkat</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Tiba</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{trip.trip_name || '-'}</div>
                          <div className="text-sm text-gray-500">
                            {trip.profiles && typeof trip.profiles === 'object' ? trip.profiles.name || '-' : '-'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trip.train_name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(trip.departure_date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(trip.total_ticket_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trip.total_days || 0} hari</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trip.departure_station || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trip.arrival_station || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(trip.departure_date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(trip.arrival_date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setDetailTrip(trip);
                              setShowDetailTrip(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Detail"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => {
                              setEditingTrip(trip);
                              const departureDate = trip.departure_date ? new Date(trip.departure_date) : new Date();
                              const arrivalDate = trip.arrival_date ? new Date(trip.arrival_date) : new Date();
                              
                              setTripForm({
                                trip_name: trip.trip_name || '',
                                train_name: trip.train_name || '',
                                departure_date: departureDate.toISOString().split('T')[0],
                                departure_time: departureDate.toISOString().split('T')[1]?.substring(0, 5) || '08:00',
                                arrival_date: arrivalDate.toISOString().split('T')[0],
                                arrival_time: arrivalDate.toISOString().split('T')[1]?.substring(0, 5) || '17:00',
                                departure_station: trip.departure_station || '',
                                arrival_station: trip.arrival_station || '',
                                total_ticket_price: trip.total_ticket_price || '',
                                total_days: trip.total_days || '',
                                notes: trip.notes || ''
                              });
                              setShowEditTrip(true);
                            }}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteTrip(trip.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Hapus"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'banlist' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Ban List Wilayah</h2>
              <button
                onClick={() => setShowAddBan(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <span className="mr-2">➕</span>
                Tambah Ban List
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Wilayah</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Wilayah</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Ban</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Berlaku Sampai</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alasan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bannedRegions.map((region) => (
                    <tr key={region.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          region.region_type === 'provinsi' ? 'bg-purple-100 text-purple-800' :
                          region.region_type === 'kabupaten' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {region.region_type || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {region.region_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(region.banned_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {region.banned_until ? formatDate(region.banned_until) : 'Selamanya'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{region.reason || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleRemoveBan(region.id)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                        >
                          <span className="mr-1">🗑️</span>
                          Cabut Ban
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'access' && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Kelola Akses Pasangan</h2>
            
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Cari user berdasarkan nama atau email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Users List */}
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-900">{user.name || 'Tidak ada nama'}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    {user.trip_access_granted && user.trip_access_granted_at && (
                      <p className="text-xs text-green-600 mt-1">
                        <span className="mr-1">✅</span>
                        Akses diberikan pada {formatDate(user.trip_access_granted_at)}
                      </p>
                    )}
                  </div>
                  <div>
                    {user.trip_access_granted ? (
                      <button
                        onClick={() => handleRevokeAccess(user.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center"
                      >
                        <span className="mr-2">❌</span>
                        Cabut Akses
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGrantAccess(user.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
                      >
                        <span className="mr-2">➕</span>
                        Berikan Akses
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Add Trip */}
      {showAddTrip && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Tambah Data Perjalanan</h3>
              <button onClick={() => setShowAddTrip(false)} className="text-gray-400 hover:text-gray-500">
                <span className="text-2xl">✖️</span>
              </button>
            </div>
            <form onSubmit={handleAddTrip}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama Perjalanan *</label>
                  <input
                    type="text"
                    required
                    value={tripForm.trip_name}
                    onChange={(e) => setTripForm({...tripForm, trip_name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Misal: Liburan ke Bali"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama Kereta *</label>
                  <input
                    type="text"
                    required
                    value={tripForm.train_name}
                    onChange={(e) => setTripForm({...tripForm, train_name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Misal: Argo Bromo Anggrek"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tanggal Keberangkatan *</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      max={addMonths(new Date(), 6).toISOString().split('T')[0]}
                      value={tripForm.departure_date}
                      onChange={(e) => setTripForm({...tripForm, departure_date: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Jam Keberangkatan *</label>
                    <input
                      type="time"
                      required
                      value={tripForm.departure_time}
                      onChange={(e) => setTripForm({...tripForm, departure_time: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tanggal Kedatangan *</label>
                    <input
                      type="date"
                      required
                      min={tripForm.departure_date || new Date().toISOString().split('T')[0]}
                      value={tripForm.arrival_date}
                      onChange={(e) => setTripForm({...tripForm, arrival_date: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Jam Kedatangan *</label>
                    <input
                      type="time"
                      required
                      value={tripForm.arrival_time}
                      onChange={(e) => setTripForm({...tripForm, arrival_time: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stasiun Keberangkatan *</label>
                    <input
                      type="text"
                      required
                      value={tripForm.departure_station}
                      onChange={(e) => setTripForm({...tripForm, departure_station: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Misal: Gambir"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stasiun Tujuan *</label>
                    <input
                      type="text"
                      required
                      value={tripForm.arrival_station}
                      onChange={(e) => setTripForm({...tripForm, arrival_station: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Misal: Surabaya Gubeng"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Biaya Tiket (Rp) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={tripForm.total_ticket_price}
                      onChange={(e) => setTripForm({...tripForm, total_ticket_price: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Misal: 500000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Hari *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={tripForm.total_days}
                      onChange={(e) => setTripForm({...tripForm, total_days: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Misal: 3"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Catatan (Opsional)</label>
                  <textarea
                    value={tripForm.notes}
                    onChange={(e) => setTripForm({...tripForm, notes: e.target.value})}
                    rows="3"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Catatan tambahan..."
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddTrip(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Trip (similar to Add Trip) */}
      {showEditTrip && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Data Perjalanan</h3>
              <button onClick={() => setShowEditTrip(false)} className="text-gray-400 hover:text-gray-500">
                <span className="text-2xl">✖️</span>
              </button>
            </div>
            <form onSubmit={handleEditTrip}>
              {/* Same form fields as Add Trip */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama Perjalanan *</label>
                  <input
                    type="text"
                    required
                    value={tripForm.trip_name}
                    onChange={(e) => setTripForm({...tripForm, trip_name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {/* ... other fields same as Add Trip ... */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Catatan (Opsional)</label>
                  <textarea
                    value={tripForm.notes}
                    onChange={(e) => setTripForm({...tripForm, notes: e.target.value})}
                    rows="3"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditTrip(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Trip */}
      {showDetailTrip && detailTrip && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Detail Perjalanan</h3>
              <button onClick={() => setShowDetailTrip(false)} className="text-gray-400 hover:text-gray-500">
                <span className="text-2xl">✖️</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Nama Perjalanan</h4>
                <p className="mt-1 text-gray-900">{detailTrip.trip_name || '-'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Nama Kereta</h4>
                <p className="mt-1 text-gray-900">{detailTrip.train_name || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Keberangkatan</h4>
                  <p className="mt-1 text-gray-900">{formatDateTime(detailTrip.departure_date)}</p>
                  <p className="text-sm text-gray-600">{detailTrip.departure_station || '-'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Kedatangan</h4>
                  <p className="mt-1 text-gray-900">{formatDateTime(detailTrip.arrival_date)}</p>
                  <p className="text-sm text-gray-600">{detailTrip.arrival_station || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Total Biaya</h4>
                  <p className="mt-1 text-gray-900 font-medium">{formatCurrency(detailTrip.total_ticket_price)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Total Hari</h4>
                  <p className="mt-1 text-gray-900 font-medium">{detailTrip.total_days || 0} hari</p>
                </div>
              </div>
              {detailTrip.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Catatan</h4>
                  <p className="mt-1 text-gray-900">{detailTrip.notes}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailTrip(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Ban */}
      {showAddBan && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Tambah Ban Wilayah</h3>
              <button onClick={() => setShowAddBan(false)} className="text-gray-400 hover:text-gray-500">
                <span className="text-2xl">✖️</span>
              </button>
            </div>
            <form onSubmit={handleAddBan}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Jenis Wilayah</label>
                  <select
                    value={banForm.region_type}
                    onChange={(e) => setBanForm({...banForm, region_type: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="kecamatan">Kecamatan</option>
                    <option value="kabupaten">Kabupaten</option>
                    <option value="provinsi">Provinsi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama Wilayah *</label>
                  <input
                    type="text"
                    required
                    value={banForm.region_name}
                    onChange={(e) => setBanForm({...banForm, region_name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Misal: Jakarta Pusat"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tanggal Ban *</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={banForm.banned_date}
                      onChange={(e) => setBanForm({...banForm, banned_date: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Berlaku Sampai (Opsional)</label>
                    <input
                      type="date"
                      value={banForm.banned_until}
                      onChange={(e) => setBanForm({...banForm, banned_until: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Alasan (Opsional)</label>
                  <textarea
                    value={banForm.reason}
                    onChange={(e) => setBanForm({...banForm, reason: e.target.value})}
                    rows="3"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Alasan pemblokiran..."
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddBan(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Tambah Ban
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
