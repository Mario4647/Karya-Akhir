import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { format, addMonths, parseISO, isValid } from 'date-fns';
import { id } from 'date-fns/locale';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('trips');
  const [trips, setTrips] = useState([]);
  const [bannedRegions, setBannedRegions] = useState([]);
  const [users, setUsers] = useState([]);
  const [partnerAccessList, setPartnerAccessList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [showAddBan, setShowAddBan] = useState(false);
  const [showEditTrip, setShowEditTrip] = useState(false);
  const [showPartnerTrips, setShowPartnerTrips] = useState(false);
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
    train_class: 'Ekonomi',
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

  // Train class options
  const trainClassOptions = [
    'Ekonomi', 'Ekonomi Premium', 'Ekonomi New Gen',
    'Eksekutif', 'Eksekutif New Gen', 'Luxury',
    'Luxury New Gen', 'Priority', 'Imperial',
    'Panoramic', 'Panoramic New Gen', 'Compartement'
  ];

  // Fetch data
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch trips dengan join ke profiles
      const { data: tripsData, error: tripsError } = await supabase
        .from('train_trips')
        .select(`
          *,
          profiles:user_id (
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
        .select('id, email, name, trip_access_granted, trip_access_granted_at, roles')
        .order('name');

      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw usersError;
      }

      // Fetch partner access data
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: partnerData, error: partnerError } = await supabase
          .from('trip_access')
          .select(`
            *,
            partner:partner_id (
              id,
              name,
              email
            ),
            owner:owner_id (
              id,
              name,
              email
            )
          `)
          .or(`owner_id.eq.${user.id},partner_id.eq.${user.id}`)
          .eq('status', 'active');

        if (partnerError) {
          console.error('Error fetching partner access:', partnerError);
        } else {
          setPartnerAccessList(partnerData || []);
        }
      }

      console.log('Trips data loaded:', tripsData?.length || 0, 'trips');
      setTrips(tripsData || []);
      setBannedRegions(banData || []);
      setUsers(usersData || []);

      // Calculate stats
      const activeTrips = tripsData?.filter(trip => 
        new Date(trip.departure_date) >= new Date()
      ).length || 0;

      const usersWithAccess = usersData?.filter(u => u.trip_access_granted).length || 0;

      setStats({
        totalTrips: tripsData?.length || 0,
        activeTrips,
        bannedRegionsCount: banData?.length || 0,
        usersWithAccess
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
      const departureDateTime = new Date(`${tripForm.departure_date}T${tripForm.departure_time}`);
      const arrivalDateTime = new Date(`${tripForm.arrival_date}T${tripForm.arrival_time}`);

      // Validasi maksimal 6 bulan ke depan
      const maxDate = addMonths(new Date(), 6);
      if (departureDateTime > maxDate) {
        alert('Tanggal keberangkatan tidak boleh lebih dari 6 bulan ke depan');
        return;
      }

      // Validasi tanggal kedatangan harus setelah keberangkatan
      if (arrivalDateTime <= departureDateTime) {
        alert('Tanggal kedatangan harus setelah tanggal keberangkatan');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('User tidak ditemukan. Silakan login kembali.');
        return;
      }

      const { data, error } = await supabase
        .from('train_trips')
        .insert([{
          user_id: user.id,
          trip_name: tripForm.trip_name,
          train_name: tripForm.train_name,
          train_class: tripForm.train_class,
          departure_date: departureDateTime.toISOString(),
          arrival_date: arrivalDateTime.toISOString(),
          departure_station: tripForm.departure_station,
          arrival_station: tripForm.arrival_station,
          total_ticket_price: parseFloat(tripForm.total_ticket_price),
          total_days: parseInt(tripForm.total_days),
          notes: tripForm.notes,
          status: 'active'
        }])
        .select();

      if (error) {
        console.error('Error inserting trip:', error);
        throw error;
      }

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

      const { data, error } = await supabase
        .from('train_trips')
        .update({
          trip_name: tripForm.trip_name,
          train_name: tripForm.train_name,
          train_class: tripForm.train_class,
          departure_date: departureDateTime.toISOString(),
          arrival_date: arrivalDateTime.toISOString(),
          departure_station: tripForm.departure_station,
          arrival_station: tripForm.arrival_station,
          total_ticket_price: parseFloat(tripForm.total_ticket_price),
          total_days: parseInt(tripForm.total_days),
          notes: tripForm.notes
        })
        .eq('id', editingTrip.id)
        .select();

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

      const { data, error } = await supabase
        .from('banned_regions')
        .insert([{
          region_type: banForm.region_type,
          region_name: banForm.region_name,
          banned_date: banForm.banned_date,
          banned_until: banForm.banned_until || null,
          reason: banForm.reason,
          banned_by: user.id
        }])
        .select();

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
    if (!confirm('Berikan akses pasangan kepada user ini?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          trip_access_granted: true,
          trip_access_granted_at: new Date().toISOString(),
          trip_access_granted_by: user.id
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Tambahkan ke trip_access table
      const { data, error: accessError } = await supabase
        .from('trip_access')
        .upsert({
          owner_id: user.id,
          partner_id: userId,
          status: 'active',
          access_type: 'all'
        }, {
          onConflict: 'owner_id,partner_id'
        })
        .select();

      if (accessError) throw accessError;

      // Tambahkan ke access_history
      await supabase
        .from('access_history')
        .insert({
          user_id: user.id,
          action: 'grant_access',
          target_user_id: userId,
          details: { access_type: 'all' }
        });

      alert('Akses berhasil diberikan!');
      fetchData();
    } catch (error) {
      console.error('Error granting access:', error);
      alert('Gagal memberikan akses: ' + error.message);
    }
  };

  const handleRevokeAccess = async (userId) => {
    if (!confirm('Cabut akses pasangan dari user ini?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          trip_access_granted: false,
          trip_access_revoked_at: new Date().toISOString(),
          trip_access_revoked_by: user.id
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Update trip_access table
      const { error: accessError } = await supabase
        .from('trip_access')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString(),
          revoked_by: user.id
        })
        .eq('partner_id', userId)
        .eq('owner_id', user.id);

      if (accessError) throw accessError;

      // Tambahkan ke access_history
      await supabase
        .from('access_history')
        .insert({
          user_id: user.id,
          action: 'revoke_access',
          target_user_id: userId,
          details: {}
        });

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
      train_class: 'Ekonomi',
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

  const getClassColor = (trainClass) => {
    const classColors = {
      'Ekonomi': 'bg-gray-100 text-gray-800',
      'Ekonomi Premium': 'bg-blue-100 text-blue-800',
      'Ekonomi New Gen': 'bg-green-100 text-green-800',
      'Eksekutif': 'bg-yellow-100 text-yellow-800',
      'Eksekutif New Gen': 'bg-orange-100 text-orange-800',
      'Luxury': 'bg-purple-100 text-purple-800',
      'Luxury New Gen': 'bg-pink-100 text-pink-800',
      'Priority': 'bg-red-100 text-red-800',
      'Imperial': 'bg-indigo-100 text-indigo-800',
      'Panoramic': 'bg-teal-100 text-teal-800',
      'Panoramic New Gen': 'bg-cyan-100 text-cyan-800',
      'Compartement': 'bg-amber-100 text-amber-800'
    };
    return classColors[trainClass] || 'bg-gray-100 text-gray-800';
  };

  const filteredUsers = users.filter(user =>
    (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    user.roles !== 'admin' // Jangan tampilkan admin di list
  );

  const getPartnerTrips = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get partner's user IDs
      const partnerIds = partnerAccessList
        .filter(access => 
          (access.owner_id === user.id && access.partner_id !== user.id) ||
          (access.partner_id === user.id && access.owner_id !== user.id)
        )
        .map(access => 
          access.owner_id === user.id ? access.partner_id : access.owner_id
        );

      if (partnerIds.length > 0) {
        const { data: partnerTrips, error } = await supabase
          .from('train_trips')
          .select(`
            *,
            profiles:user_id (
              name,
              email
            )
          `)
          .in('user_id', partnerIds)
          .order('departure_date', { ascending: true });

        if (error) throw error;

        setShowPartnerTrips(true);
        // Tampilkan modal dengan data partner trips
        alert(`Total trip pasangan: ${partnerTrips?.length || 0}`);
      } else {
        alert('Belum ada pasangan dengan akses trip.');
      }
    } catch (error) {
      console.error('Error fetching partner trips:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <i className="bx bx-train text-2xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Perjalanan</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalTrips}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <i className="bx bx-calendar-check text-2xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Perjalanan Aktif</p>
              <p className="text-2xl font-bold text-gray-800">{stats.activeTrips}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
              <i className="bx bx-ban text-2xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Wilayah Terban</p>
              <p className="text-2xl font-bold text-gray-800">{stats.bannedRegionsCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <i className="bx bx-user-check text-2xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">User dengan Akses</p>
              <p className="text-2xl font-bold text-gray-800">{stats.usersWithAccess}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tombol List Trip Pasangan */}
      {partnerAccessList.length > 0 && (
        <div className="mb-6">
          <button
            onClick={getPartnerTrips}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg flex items-center shadow-lg"
          >
            <i className="bx bx-list-check mr-2"></i>
            List Trip Pasangan ({partnerAccessList.length})
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('trips')}
              className={`flex items-center px-6 py-4 text-center border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'trips' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <i className="bx bx-train mr-2"></i>
              Data Perjalanan
            </button>
            <button
              onClick={() => setActiveTab('banlist')}
              className={`flex items-center px-6 py-4 text-center border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'banlist' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <i className="bx bx-ban mr-2"></i>
              Ban List Wilayah
            </button>
            <button
              onClick={() => setActiveTab('access')}
              className={`flex items-center px-6 py-4 text-center border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'access' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <i className="bx bx-user-plus mr-2"></i>
              Akses Pasangan
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {activeTab === 'trips' && (
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h2 className="text-xl font-bold text-gray-800">Data Perjalanan Kereta Api</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowAddTrip(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg flex items-center shadow-lg transition-all duration-200"
                >
                  <i className="bx bx-plus mr-2"></i>
                  Tambah Data
                </button>
              </div>
            </div>

            {trips.length === 0 ? (
              <div className="text-center py-12">
                <i className="bx bx-train text-5xl text-gray-300 mb-4"></i>
                <p className="text-gray-500">Belum ada data perjalanan</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kereta</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Biaya</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hari</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keberangkatan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tujuan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {trips.map((trip) => (
                      <tr key={trip.id} className="hover:bg-blue-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{trip.trip_name}</div>
                            <div className="text-xs text-gray-500">{trip.profiles?.name || '-'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trip.train_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getClassColor(trip.train_class)}`}>
                            {trip.train_class}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(trip.departure_date)}</div>
                          <div className="text-xs text-gray-500">s/d {formatDate(trip.arrival_date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(trip.total_ticket_price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trip.total_days} hari</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trip.departure_station}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trip.arrival_station}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatTime(trip.departure_date)}</div>
                          <div className="text-xs text-gray-500">{formatTime(trip.arrival_date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => {
                                setDetailTrip(trip);
                                setShowDetailTrip(true);
                              }}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
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
                                  train_class: trip.train_class,
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
                              className="p-1.5 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded transition-colors"
                              title="Edit"
                            >
                              <i className="bx bx-edit text-lg"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteTrip(trip.id)}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
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
            )}
          </div>
        )}

        {activeTab === 'banlist' && (
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h2 className="text-xl font-bold text-gray-800">Ban List Wilayah</h2>
              <button
                onClick={() => setShowAddBan(true)}
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg flex items-center shadow-lg transition-all duration-200"
              >
                <i className="bx bx-plus mr-2"></i>
                Tambah Ban List
              </button>
            </div>

            {bannedRegions.length === 0 ? (
              <div className="text-center py-12">
                <i className="bx bx-map text-5xl text-gray-300 mb-4"></i>
                <p className="text-gray-500">Belum ada wilayah yang dilarang</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
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
                      <tr key={region.id} className="hover:bg-red-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{region.reason || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleRemoveBan(region.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-100 px-3 py-1 rounded-lg flex items-center transition-colors"
                          >
                            <i className="bx bx-trash mr-1"></i>
                            Cabut Ban
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'access' && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Kelola Akses Pasangan</h2>
            
            {/* Search Bar */}
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
              <div className="relative max-w-md">
                <i className="bx bx-search absolute left-3 top-3 text-gray-400 text-lg"></i>
                <input
                  type="text"
                  placeholder="Cari user berdasarkan nama atau email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Temukan dan berikan akses kepada user untuk melihat perjalanan Anda
              </p>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{user.name || 'Tanpa Nama'}</h3>
                        <p className="text-sm text-gray-600 truncate max-w-xs">{user.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  {user.trip_access_granted ? (
                    <div className="space-y-3">
                      <div className="flex items-center text-green-600 text-sm">
                        <i className="bx bx-check-circle mr-1"></i>
                        <span>Akses diberikan</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Pada {format(new Date(user.trip_access_granted_at), 'dd MMM yyyy HH:mm')}
                      </div>
                      <button
                        onClick={() => handleRevokeAccess(user.id)}
                        className="w-full bg-gradient-to-r from-red-50 to-pink-50 text-red-600 hover:from-red-100 hover:to-pink-100 border border-red-200 px-3 py-2 rounded-lg flex items-center justify-center font-medium transition-all duration-200"
                      >
                        <i className="bx bx-user-x mr-2"></i>
                        Cabut Akses
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleGrantAccess(user.id)}
                      className="w-full bg-gradient-to-r from-green-50 to-emerald-50 text-green-600 hover:from-green-100 hover:to-emerald-100 border border-green-200 px-3 py-2 rounded-lg flex items-center justify-center font-medium transition-all duration-200"
                    >
                      <i className="bx bx-user-plus mr-2"></i>
                      Berikan Akses Pasangan
                    </button>
                  )}
                </div>
              ))}
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <i className="bx bx-user-x text-5xl text-gray-300 mb-4"></i>
                <p className="text-gray-500">Tidak ada user yang ditemukan</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Add Trip */}
      {showAddTrip && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Tambah Data Perjalanan</h3>
              <button onClick={() => setShowAddTrip(false)} className="text-gray-400 hover:text-gray-600">
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>
            <form onSubmit={handleAddTrip} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Perjalanan *</label>
                  <input
                    type="text"
                    required
                    value={tripForm.trip_name}
                    onChange={(e) => setTripForm({...tripForm, trip_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Misal: Liburan ke Bandung"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kereta *</label>
                  <input
                    type="text"
                    required
                    value={tripForm.train_name}
                    onChange={(e) => setTripForm({...tripForm, train_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Misal: Argo Bromo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kelas Kereta *</label>
                  <select
                    required
                    value={tripForm.train_class}
                    onChange={(e) => setTripForm({...tripForm, train_class: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {trainClassOptions.map((className) => (
                      <option key={className} value={className}>{className}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Pengeluaran Tiket (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={tripForm.total_ticket_price}
                    onChange={(e) => setTripForm({...tripForm, total_ticket_price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Misal: 500000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Keberangkatan *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    max={addMonths(new Date(), 6).toISOString().split('T')[0]}
                    value={tripForm.departure_date}
                    onChange={(e) => setTripForm({...tripForm, departure_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jam Keberangkatan *</label>
                  <input
                    type="time"
                    required
                    value={tripForm.departure_time}
                    onChange={(e) => setTripForm({...tripForm, departure_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Kedatangan *</label>
                  <input
                    type="date"
                    required
                    min={tripForm.departure_date || new Date().toISOString().split('T')[0]}
                    value={tripForm.arrival_date}
                    onChange={(e) => setTripForm({...tripForm, arrival_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jam Kedatangan *</label>
                  <input
                    type="time"
                    required
                    value={tripForm.arrival_time}
                    onChange={(e) => setTripForm({...tripForm, arrival_time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stasiun Keberangkatan *</label>
                  <input
                    type="text"
                    required
                    value={tripForm.departure_station}
                    onChange={(e) => setTripForm({...tripForm, departure_station: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Misal: Stasiun Gambir"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stasiun Tujuan *</label>
                  <input
                    type="text"
                    required
                    value={tripForm.arrival_station}
                    onChange={(e) => setTripForm({...tripForm, arrival_station: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Misal: Stasiun Bandung"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Hari *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={tripForm.total_days}
                    onChange={(e) => setTripForm({...tripForm, total_days: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Misal: 3"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
                  <textarea
                    value={tripForm.notes}
                    onChange={(e) => setTripForm({...tripForm, notes: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Catatan tambahan tentang perjalanan..."
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddTrip(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                >
                  Simpan Perjalanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Trip */}
      {showEditTrip && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit Data Perjalanan</h3>
              <button onClick={() => setShowEditTrip(false)} className="text-gray-400 hover:text-gray-600">
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>
            <form onSubmit={handleEditTrip} className="space-y-4">
              {/* Same form fields as Add Trip */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Perjalanan *</label>
                  <input
                    type="text"
                    required
                    value={tripForm.trip_name}
                    onChange={(e) => setTripForm({...tripForm, trip_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {/* ... other form fields ... */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
                  <textarea
                    value={tripForm.notes}
                    onChange={(e) => setTripForm({...tripForm, notes: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditTrip(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700"
                >
                  Update Perjalanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Trip */}
      {showDetailTrip && detailTrip && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Detail Perjalanan</h3>
              <button onClick={() => setShowDetailTrip(false)} className="text-gray-400 hover:text-gray-600">
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <i className="bx bx-map text-blue-600 text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nama Perjalanan</p>
                  <p className="text-lg font-semibold text-gray-900">{detailTrip.trip_name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <i className="bx bx-train text-green-600 text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Kereta & Kelas</p>
                  <p className="text-lg font-semibold text-gray-900">{detailTrip.train_name}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium mt-1 ${getClassColor(detailTrip.train_class)}`}>
                    {detailTrip.train_class}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Keberangkatan</p>
                  <p className="font-semibold text-gray-800">{formatTime(detailTrip.departure_date)}</p>
                  <p className="text-sm text-gray-600 mt-1">{detailTrip.departure_station}</p>
                  <p className="text-xs text-gray-500">{formatDate(detailTrip.departure_date)}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Kedatangan</p>
                  <p className="font-semibold text-gray-800">{formatTime(detailTrip.arrival_date)}</p>
                  <p className="text-sm text-gray-600 mt-1">{detailTrip.arrival_station}</p>
                  <p className="text-xs text-gray-500">{formatDate(detailTrip.arrival_date)}</p>
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Total Biaya</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {formatCurrency(detailTrip.total_ticket_price)}
                </p>
                <p className="text-sm text-gray-600 mt-1">{detailTrip.total_days} hari perjalanan</p>
              </div>
              {detailTrip.notes && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Catatan</p>
                  <p className="text-gray-800">{detailTrip.notes}</p>
                </div>
              )}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Pemilik</p>
                <p className="font-medium text-gray-900">{detailTrip.profiles?.name || '-'}</p>
                <p className="text-sm text-gray-600">{detailTrip.profiles?.email || '-'}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setShowDetailTrip(false)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
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
