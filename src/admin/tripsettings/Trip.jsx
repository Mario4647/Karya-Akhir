import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { format, addMonths, parseISO, isValid } from 'date-fns';
import { id } from 'date-fns/locale';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('trips');
  const [trips, setTrips] = useState([]);
  const [bannedRegions, setBannedRegions] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
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

  // Fetch data
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch trips
      const { data: tripsData } = await supabase
        .from('train_trips')
        .select(`
          *,
          profiles:user_id (
            name,
            email
          )
        `)
        .order('departure_date', { ascending: true });

      // Fetch banned regions
      const { data: banData } = await supabase
        .from('banned_regions')
        .select('*')
        .order('banned_date', { ascending: false });

      // Fetch users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, email, name, trip_access_granted, trip_access_granted_at')
        .order('name');

      setTrips(tripsData || []);
      setBannedRegions(banData || []);
      setUsers(usersData || []);

      // Calculate stats
      const activeTrips = tripsData?.filter(trip => 
        new Date(trip.departure_date) >= new Date()
      ).length || 0;

      setStats({
        totalTrips: tripsData?.length || 0,
        activeTrips,
        bannedRegionsCount: banData?.length || 0,
        usersWithAccess: usersData?.filter(u => u.trip_access_granted).length || 0
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrip = async (e) => {
    e.preventDefault();
    try {
      const departureDateTime = new Date(`${tripForm.departure_date}T${tripForm.departure_time}`);
      const arrivalDateTime = new Date(`${tripForm.arrival_date}T${tripForm.arrival_time}`);

      // Validasi maksimal 6 bulan ke depan
      const maxDate = addMonths(new Date(), 6);
      if (departureDateTime > maxDate) {
        alert('Tanggal keberangkatan tidak boleh lebih dari 6 bulan ke depan');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('train_trips').insert({
        user_id: user.id,
        trip_name: tripForm.trip_name,
        train_name: tripForm.train_name,
        departure_date: departureDateTime.toISOString(),
        arrival_date: arrivalDateTime.toISOString(),
        departure_station: tripForm.departure_station,
        arrival_station: tripForm.arrival_station,
        total_ticket_price: parseFloat(tripForm.total_ticket_price),
        total_days: parseInt(tripForm.total_days),
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
      const departureDateTime = new Date(`${tripForm.departure_date}T${tripForm.departure_time}`);
      const arrivalDateTime = new Date(`${tripForm.arrival_date}T${tripForm.arrival_time}`);

      const { error } = await supabase
        .from('train_trips')
        .update({
          trip_name: tripForm.trip_name,
          train_name: tripForm.train_name,
          departure_date: departureDateTime.toISOString(),
          arrival_date: arrivalDateTime.toISOString(),
          departure_station: tripForm.departure_station,
          arrival_station: tripForm.arrival_station,
          total_ticket_price: parseFloat(tripForm.total_ticket_price),
          total_days: parseInt(tripForm.total_days),
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

      const { error } = await supabase
        .from('profiles')
        .update({
          trip_access_granted: true,
          trip_access_granted_at: new Date().toISOString(),
          trip_access_granted_by: user.id
        })
        .eq('id', userId);

      if (error) throw error;

      // Tambahkan ke trip_access table
      const { error: accessError } = await supabase
        .from('trip_access')
        .upsert({
          owner_id: user.id,
          partner_id: userId,
          status: 'active'
        });

      if (accessError) throw accessError;

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

      const { error } = await supabase
        .from('profiles')
        .update({
          trip_access_granted: false,
          trip_access_revoked_at: new Date().toISOString(),
          trip_access_revoked_by: user.id
        })
        .eq('id', userId);

      if (error) throw error;

      // Update trip_access table
      const { error: accessError } = await supabase
        .from('trip_access')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString(),
          revoked_by: user.id
        })
        .eq('partner_id', userId);

      if (accessError) throw accessError;

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

  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return '-';
      return format(date, 'EEEE, dd MMMM yyyy', { locale: id });
    } catch {
      return '-';
    }
  };

  const formatDateTime = (dateString) => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return '-';
      return format(date, 'HH:mm - EEEE, dd MMM yyyy', { locale: id });
    } catch {
      return '-';
    }
  };

  const formatTime = (dateString) => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return '-';
      return format(date, 'HH:mm');
    } catch {
      return '-';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <i className="bx bx-train text-2xl"></i>
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
              <i className="bx bx-calendar-check text-2xl"></i>
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
              <i className="bx bx-ban text-2xl"></i>
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
              <i className="bx bx-user-check text-2xl"></i>
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
              <i className="bx bx-train mr-2"></i>
              Data Perjalanan
            </button>
            <button
              onClick={() => setActiveTab('banlist')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'banlist' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <i className="bx bx-ban mr-2"></i>
              Ban List Wilayah
            </button>
            <button
              onClick={() => setActiveTab('access')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'access' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <i className="bx bx-user-plus mr-2"></i>
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
                <i className="bx bx-plus mr-2"></i>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Keberangkatan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Kedatangan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{trip.trip_name}</div>
                          <div className="text-sm text-gray-500">{trip.profiles?.name || '-'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trip.train_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(trip.departure_date)}</div>
                        <div className="text-xs text-gray-500">s/d {formatDate(trip.arrival_date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(trip.total_ticket_price)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trip.total_days} hari</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trip.departure_station}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trip.arrival_station}</td>
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
                            <i className="bx bx-show text-lg"></i>
                          </button>
                          <button
                            onClick={() => {
                              setEditingTrip(trip);
                              const departureDate = new Date(trip.departure_date);
                              const arrivalDate = new Date(trip.arrival_date);
                              
                              setTripForm({
                                trip_name: trip.trip_name,
                                train_name: trip.train_name,
                                departure_date: departureDate.toISOString().split('T')[0],
                                departure_time: format(departureDate, 'HH:mm'),
                                arrival_date: arrivalDate.toISOString().split('T')[0],
                                arrival_time: format(arrivalDate, 'HH:mm'),
                                departure_station: trip.departure_station,
                                arrival_station: trip.arrival_station,
                                total_ticket_price: trip.total_ticket_price,
                                total_days: trip.total_days,
                                notes: trip.notes || ''
                              });
                              setShowEditTrip(true);
                            }}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Edit"
                          >
                            <i className="bx bx-edit text-lg"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteTrip(trip.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Hapus"
                          >
                            <i className="bx bx-trash text-lg"></i>
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
                <i className="bx bx-plus mr-2"></i>
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
                          {region.region_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{region.region_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(region.banned_date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {region.banned_until ? formatDate(region.banned_until) : 'Selamanya'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{region.reason || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleRemoveBan(region.id)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                        >
                          <i className="bx bx-trash mr-1"></i>
                          Cabut Ban List
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
                <i className="bx bx-search absolute left-3 top-3 text-gray-400"></i>
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
                    {user.trip_access_granted && (
                      <p className="text-xs text-green-600 mt-1">
                        <i className="bx bx-check-circle mr-1"></i>
                        Akses diberikan pada {format(new Date(user.trip_access_granted_at), 'dd MMM yyyy HH:mm')}
                      </p>
                    )}
                  </div>
                  <div>
                    {user.trip_access_granted ? (
                      <button
                        onClick={() => handleRevokeAccess(user.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center"
                      >
                        <i className="bx bx-user-x mr-2"></i>
                        Cabut Akses
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGrantAccess(user.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
                      >
                        <i className="bx bx-user-plus mr-2"></i>
                        Berikan Akses Pasangan
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
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Tambah Data Perjalanan</h3>
              <button onClick={() => setShowAddTrip(false)} className="text-gray-400 hover:text-gray-500">
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>
            <form onSubmit={handleAddTrip}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama Perjalanan</label>
                  <input
                    type="text"
                    required
                    value={tripForm.trip_name}
                    onChange={(e) => setTripForm({...tripForm, trip_name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama Kereta</label>
                  <input
                    type="text"
                    required
                    value={tripForm.train_name}
                    onChange={(e) => setTripForm({...tripForm, train_name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tanggal Keberangkatan</label>
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
                    <label className="block text-sm font-medium text-gray-700">Jam Keberangkatan</label>
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
                    <label className="block text-sm font-medium text-gray-700">Tanggal Kedatangan</label>
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
                    <label className="block text-sm font-medium text-gray-700">Jam Kedatangan</label>
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
                    <label className="block text-sm font-medium text-gray-700">Stasiun Keberangkatan</label>
                    <input
                      type="text"
                      required
                      value={tripForm.departure_station}
                      onChange={(e) => setTripForm({...tripForm, departure_station: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stasiun Tujuan</label>
                    <input
                      type="text"
                      required
                      value={tripForm.arrival_station}
                      onChange={(e) => setTripForm({...tripForm, arrival_station: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Pengeluaran Tiket (Rp)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={tripForm.total_ticket_price}
                      onChange={(e) => setTripForm({...tripForm, total_ticket_price: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Hari</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={tripForm.total_days}
                      onChange={(e) => setTripForm({...tripForm, total_days: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
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

      {/* Modal Edit Trip */}
      {showEditTrip && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Data Perjalanan</h3>
              <button onClick={() => setShowEditTrip(false)} className="text-gray-400 hover:text-gray-500">
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>
            <form onSubmit={handleEditTrip}>
              <div className="space-y-4">
                {/* Same form fields as Add Trip */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nama Perjalanan</label>
                  <input
                    type="text"
                    required
                    value={tripForm.trip_name}
                    onChange={(e) => setTripForm({...tripForm, trip_name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {/* ... other form fields ... */}
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

      {/* Modal Add Ban */}
      {showAddBan && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Tambah Ban Wilayah</h3>
              <button onClick={() => setShowAddBan(false)} className="text-gray-400 hover:text-gray-500">
                <i className="bx bx-x text-2xl"></i>
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
                  <label className="block text-sm font-medium text-gray-700">Nama Wilayah</label>
                  <input
                    type="text"
                    required
                    value={banForm.region_name}
                    onChange={(e) => setBanForm({...banForm, region_name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tanggal Ban</label>
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

      {/* Modal Detail Trip */}
      {showDetailTrip && detailTrip && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Detail Perjalanan</h3>
              <button onClick={() => setShowDetailTrip(false)} className="text-gray-400 hover:text-gray-500">
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Nama Perjalanan</h4>
                <p className="mt-1 text-gray-900">{detailTrip.trip_name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Nama Kereta</h4>
                <p className="mt-1 text-gray-900">{detailTrip.train_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Keberangkatan</h4>
                  <p className="mt-1 text-gray-900">{formatDateTime(detailTrip.departure_date)}</p>
                  <p className="text-sm text-gray-600">{detailTrip.departure_station}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Kedatangan</h4>
                  <p className="mt-1 text-gray-900">{formatDateTime(detailTrip.arrival_date)}</p>
                  <p className="text-sm text-gray-600">{detailTrip.arrival_station}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Total Pengeluaran</h4>
                  <p className="mt-1 text-gray-900 font-medium">{formatCurrency(detailTrip.total_ticket_price)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Total Hari</h4>
                  <p className="mt-1 text-gray-900 font-medium">{detailTrip.total_days} hari</p>
                </div>
              </div>
              {detailTrip.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Catatan</h4>
                  <p className="mt-1 text-gray-900">{detailTrip.notes}</p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium text-gray-500">Pemilik</h4>
                <p className="mt-1 text-gray-900">{detailTrip.profiles?.name || '-'}</p>
                <p className="text-sm text-gray-600">{detailTrip.profiles?.email || '-'}</p>
              </div>
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
    </div>
  );
};

export default AdminDashboard;
