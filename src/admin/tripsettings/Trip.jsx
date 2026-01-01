import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { format, addMonths, parseISO, isValid } from 'date-fns';
import { id } from 'date-fns/locale';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('trips');
  const [trips, setTrips] = useState([]);
  const [bannedRegions, setBannedRegions] = useState([]);
  const [users, setUsers] = useState([]);
  const [partnerAccessList, setPartnerAccessList] = useState([]);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // Form states
  const [tripForm, setTripForm] = useState({
    trip_name: '',
    train_name: '',
    train_class: 'Ekonomi',
    departure_date: '',
    departure_time: '08:00',
    arrival_date: '',
    arrival_time: '12:00',
    departure_station: '',
    arrival_station: '',
    total_ticket_price: '',
    total_days: '1',
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

  // Region type options
  const regionTypeOptions = [
    'kecamatan', 'kabupaten', 'provinsi'
  ];

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
        .select('*')
        .order('departure_date', { ascending: true });

      if (tripsError) {
        console.error('Error fetching trips:', tripsError);
        throw tripsError;
      }

      // Fetch profiles untuk semua user_id dalam trips
      let profilesMap = {};
      if (tripsData && tripsData.length > 0) {
        const userIds = [...new Set(tripsData.map(trip => trip.user_id))];
        
        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, email')
            .in('id', userIds);

          if (!profilesError && profilesData) {
            profilesData.forEach(profile => {
              profilesMap[profile.id] = profile;
            });
          }
        }
      }

      // Gabungkan trips dengan profiles
      const tripsWithProfiles = tripsData?.map(trip => ({
        ...trip,
        profiles: profilesMap[trip.user_id] || { name: '-', email: '-' }
      })) || [];

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

      console.log('Trips data loaded:', tripsWithProfiles.length, 'trips');
      setTrips(tripsWithProfiles);
      setBannedRegions(banData || []);
      setUsers(usersData || []);

      // Calculate stats
      const activeTrips = tripsWithProfiles.filter(trip => 
        new Date(trip.departure_date) >= new Date()
      ).length;

      const usersWithAccess = usersData?.filter(u => u.trip_access_granted).length || 0;

      setStats({
        totalTrips: tripsWithProfiles.length,
        activeTrips,
        bannedRegionsCount: banData?.length || 0,
        usersWithAccess
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setSubmitError('Gagal memuat data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrip = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      // Validasi form
      if (!tripForm.trip_name.trim()) {
        throw new Error('Nama perjalanan harus diisi');
      }
      if (!tripForm.train_name.trim()) {
        throw new Error('Nama kereta harus diisi');
      }
      if (!tripForm.departure_date || !tripForm.departure_time) {
        throw new Error('Tanggal dan jam keberangkatan harus diisi');
      }
      if (!tripForm.arrival_date || !tripForm.arrival_time) {
        throw new Error('Tanggal dan jam kedatangan harus diisi');
      }
      if (!tripForm.departure_station.trim()) {
        throw new Error('Stasiun keberangkatan harus diisi');
      }
      if (!tripForm.arrival_station.trim()) {
        throw new Error('Stasiun tujuan harus diisi');
      }
      if (!tripForm.total_ticket_price || parseFloat(tripForm.total_ticket_price) <= 0) {
        throw new Error('Total pengeluaran tiket harus diisi dan lebih dari 0');
      }
      if (!tripForm.total_days || parseInt(tripForm.total_days) <= 0) {
        throw new Error('Total hari harus diisi dan lebih dari 0');
      }

      const departureDateTime = new Date(`${tripForm.departure_date}T${tripForm.departure_time}`);
      const arrivalDateTime = new Date(`${tripForm.arrival_date}T${tripForm.arrival_time}`);

      // Validasi maksimal 6 bulan ke depan
      const maxDate = addMonths(new Date(), 6);
      if (departureDateTime > maxDate) {
        throw new Error('Tanggal keberangkatan tidak boleh lebih dari 6 bulan ke depan');
      }

      // Validasi tanggal kedatangan harus setelah keberangkatan
      if (arrivalDateTime <= departureDateTime) {
        throw new Error('Tanggal kedatangan harus setelah tanggal keberangkatan');
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User tidak ditemukan. Silakan login kembali.');
      }

      const { data, error } = await supabase
        .from('train_trips')
        .insert([{
          user_id: user.id,
          trip_name: tripForm.trip_name.trim(),
          train_name: tripForm.train_name.trim(),
          train_class: tripForm.train_class,
          departure_date: departureDateTime.toISOString(),
          arrival_date: arrivalDateTime.toISOString(),
          departure_station: tripForm.departure_station.trim(),
          arrival_station: tripForm.arrival_station.trim(),
          total_ticket_price: parseFloat(tripForm.total_ticket_price),
          total_days: parseInt(tripForm.total_days),
          notes: tripForm.notes.trim() || null,
          status: 'active'
        }])
        .select();

      if (error) {
        console.error('Error inserting trip:', error);
        throw error;
      }

      setSubmitSuccess('Trip berhasil ditambahkan!');
      setTimeout(() => {
        setShowAddTrip(false);
        resetTripForm();
        fetchData();
        setSubmitSuccess(null);
      }, 1500);
      
    } catch (error) {
      console.error('Error adding trip:', error);
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTrip = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      // Validasi form
      if (!tripForm.trip_name.trim()) {
        throw new Error('Nama perjalanan harus diisi');
      }
      if (!tripForm.train_name.trim()) {
        throw new Error('Nama kereta harus diisi');
      }

      const departureDateTime = new Date(`${tripForm.departure_date}T${tripForm.departure_time}`);
      const arrivalDateTime = new Date(`${tripForm.arrival_date}T${tripForm.arrival_time}`);

      const { data, error } = await supabase
        .from('train_trips')
        .update({
          trip_name: tripForm.trip_name.trim(),
          train_name: tripForm.train_name.trim(),
          train_class: tripForm.train_class,
          departure_date: departureDateTime.toISOString(),
          arrival_date: arrivalDateTime.toISOString(),
          departure_station: tripForm.departure_station.trim(),
          arrival_station: tripForm.arrival_station.trim(),
          total_ticket_price: parseFloat(tripForm.total_ticket_price),
          total_days: parseInt(tripForm.total_days),
          notes: tripForm.notes.trim() || null
        })
        .eq('id', editingTrip.id)
        .select();

      if (error) throw error;

      setSubmitSuccess('Trip berhasil diperbarui!');
      setTimeout(() => {
        setShowEditTrip(false);
        resetTripForm();
        fetchData();
        setSubmitSuccess(null);
      }, 1500);
      
    } catch (error) {
      console.error('Error editing trip:', error);
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
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
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      // Validasi form
      if (!banForm.region_name.trim()) {
        throw new Error('Nama wilayah harus diisi');
      }
      if (!banForm.banned_date) {
        throw new Error('Tanggal ban harus diisi');
      }

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('banned_regions')
        .insert([{
          region_type: banForm.region_type,
          region_name: banForm.region_name.trim(),
          banned_date: banForm.banned_date,
          banned_until: banForm.banned_until || null,
          reason: banForm.reason.trim() || null,
          banned_by: user.id
        }])
        .select();

      if (error) throw error;

      setSubmitSuccess('Ban wilayah berhasil ditambahkan!');
      setTimeout(() => {
        setShowAddBan(false);
        resetBanForm();
        fetchData();
        setSubmitSuccess(null);
      }, 1500);
      
    } catch (error) {
      console.error('Error adding ban:', error);
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
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

  const resetTripForm = () => {
    setTripForm({
      trip_name: '',
      train_name: '',
      train_class: 'Ekonomi',
      departure_date: '',
      departure_time: '08:00',
      arrival_date: '',
      arrival_time: '12:00',
      departure_station: '',
      arrival_station: '',
      total_ticket_price: '',
      total_days: '1',
      notes: ''
    });
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const resetBanForm = () => {
    setBanForm({
      region_type: 'kecamatan',
      region_name: '',
      banned_date: '',
      banned_until: '',
      reason: ''
    });
    setSubmitError(null);
    setSubmitSuccess(null);
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
    user.roles !== 'admin'
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      {/* Success/Error Messages */}
      {submitSuccess && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg animate-fade-in">
          <div className="flex items-center">
            <i className="bx bx-check-circle text-xl mr-2"></i>
            <span>{submitSuccess}</span>
          </div>
        </div>
      )}

      {submitError && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg animate-fade-in">
          <div className="flex items-center">
            <i className="bx bx-error-circle text-xl mr-2"></i>
            <span>{submitError}</span>
          </div>
        </div>
      )}

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
                  onClick={() => {
                    resetTripForm();
                    setShowAddTrip(true);
                  }}
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
                            <div className="text-xs text-gray-500">{trip.profiles.name || '-'}</div>
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
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailTrip(trip);
                                setShowDetailTrip(true);
                              }}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors duration-150"
                              title="Detail"
                            >
                              <i className="bx bx-show text-lg"></i>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
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
                              className="p-1.5 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded transition-colors duration-150"
                              title="Edit"
                            >
                              <i className="bx bx-edit text-lg"></i>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTrip(trip.id);
                              }}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors duration-150"
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
                onClick={() => {
                  resetBanForm();
                  setShowAddBan(true);
                }}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveBan(region.id);
                            }}
                            className="text-red-600 hover:text-red-800 hover:bg-red-100 px-3 py-1 rounded-lg flex items-center transition-colors duration-150"
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
      </div>

      {/* Modal Add Trip */}
      {showAddTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Tambah Data Perjalanan</h3>
              <button 
                onClick={() => setShowAddTrip(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>
            
            <div className="p-6">
              {submitError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  <div className="flex items-center">
                    <i className="bx bx-error-circle text-lg mr-2"></i>
                    <span>{submitError}</span>
                  </div>
                </div>
              )}

              {submitSuccess && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                  <div className="flex items-center">
                    <i className="bx bx-check-circle text-lg mr-2"></i>
                    <span>{submitSuccess}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleAddTrip} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nama Perjalanan */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Perjalanan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={tripForm.trip_name}
                      onChange={(e) => setTripForm({...tripForm, trip_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Misal: Liburan ke Bandung"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Nama Kereta */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Kereta <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={tripForm.train_name}
                      onChange={(e) => setTripForm({...tripForm, train_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Misal: Argo Bromo"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Kelas Kereta */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kelas Kereta <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={tripForm.train_class}
                      onChange={(e) => setTripForm({...tripForm, train_class: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={isSubmitting}
                    >
                      {trainClassOptions.map((className) => (
                        <option key={className} value={className}>{className}</option>
                      ))}
                    </select>
                  </div>

                  {/* Total Pengeluaran */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Pengeluaran Tiket (Rp) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={tripForm.total_ticket_price}
                      onChange={(e) => setTripForm({...tripForm, total_ticket_price: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Misal: 500000"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Tanggal Keberangkatan */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Keberangkatan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      max={addMonths(new Date(), 6).toISOString().split('T')[0]}
                      value={tripForm.departure_date}
                      onChange={(e) => setTripForm({...tripForm, departure_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Jam Keberangkatan */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jam Keberangkatan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={tripForm.departure_time}
                      onChange={(e) => setTripForm({...tripForm, departure_time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Tanggal Kedatangan */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Kedatangan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={tripForm.departure_date || new Date().toISOString().split('T')[0]}
                      value={tripForm.arrival_date}
                      onChange={(e) => setTripForm({...tripForm, arrival_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Jam Kedatangan */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jam Kedatangan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={tripForm.arrival_time}
                      onChange={(e) => setTripForm({...tripForm, arrival_time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Stasiun Keberangkatan */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stasiun Keberangkatan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={tripForm.departure_station}
                      onChange={(e) => setTripForm({...tripForm, departure_station: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Misal: Stasiun Gambir"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Stasiun Tujuan */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stasiun Tujuan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={tripForm.arrival_station}
                      onChange={(e) => setTripForm({...tripForm, arrival_station: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Misal: Stasiun Bandung"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Total Hari */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Hari <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={tripForm.total_days}
                      onChange={(e) => setTripForm({...tripForm, total_days: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Misal: 3"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Catatan */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Catatan (Opsional)
                    </label>
                    <textarea
                      value={tripForm.notes}
                      onChange={(e) => setTripForm({...tripForm, notes: e.target.value})}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Catatan tambahan tentang perjalanan..."
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAddTrip(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                    disabled={isSubmitting}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <i className="bx bx-save mr-2"></i>
                        Simpan Perjalanan
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Trip */}
      {showEditTrip && editingTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Edit Data Perjalanan</h3>
              <button 
                onClick={() => setShowEditTrip(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>
            
            <div className="p-6">
              {submitError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  <div className="flex items-center">
                    <i className="bx bx-error-circle text-lg mr-2"></i>
                    <span>{submitError}</span>
                  </div>
                </div>
              )}

              {submitSuccess && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                  <div className="flex items-center">
                    <i className="bx bx-check-circle text-lg mr-2"></i>
                    <span>{submitSuccess}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleEditTrip} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nama Perjalanan */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Perjalanan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={tripForm.trip_name}
                      onChange={(e) => setTripForm({...tripForm, trip_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Nama Kereta */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Kereta <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={tripForm.train_name}
                      onChange={(e) => setTripForm({...tripForm, train_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Kelas Kereta */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kelas Kereta <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={tripForm.train_class}
                      onChange={(e) => setTripForm({...tripForm, train_class: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={isSubmitting}
                    >
                      {trainClassOptions.map((className) => (
                        <option key={className} value={className}>{className}</option>
                      ))}
                    </select>
                  </div>

                  {/* Total Pengeluaran */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Pengeluaran Tiket (Rp) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={tripForm.total_ticket_price}
                      onChange={(e) => setTripForm({...tripForm, total_ticket_price: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Tanggal Keberangkatan */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Keberangkatan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      max={addMonths(new Date(), 6).toISOString().split('T')[0]}
                      value={tripForm.departure_date}
                      onChange={(e) => setTripForm({...tripForm, departure_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Jam Keberangkatan */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jam Keberangkatan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={tripForm.departure_time}
                      onChange={(e) => setTripForm({...tripForm, departure_time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Tanggal Kedatangan */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Kedatangan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={tripForm.departure_date || new Date().toISOString().split('T')[0]}
                      value={tripForm.arrival_date}
                      onChange={(e) => setTripForm({...tripForm, arrival_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Jam Kedatangan */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jam Kedatangan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={tripForm.arrival_time}
                      onChange={(e) => setTripForm({...tripForm, arrival_time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Stasiun Keberangkatan */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stasiun Keberangkatan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={tripForm.departure_station}
                      onChange={(e) => setTripForm({...tripForm, departure_station: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Stasiun Tujuan */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stasiun Tujuan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={tripForm.arrival_station}
                      onChange={(e) => setTripForm({...tripForm, arrival_station: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Total Hari */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Hari <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={tripForm.total_days}
                      onChange={(e) => setTripForm({...tripForm, total_days: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Catatan */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Catatan (Opsional)
                    </label>
                    <textarea
                      value={tripForm.notes}
                      onChange={(e) => setTripForm({...tripForm, notes: e.target.value})}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowEditTrip(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                    disabled={isSubmitting}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <i className="bx bx-save mr-2"></i>
                        Update Perjalanan
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Ban List */}
      {showAddBan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Tambah Ban List Wilayah</h3>
              <button 
                onClick={() => setShowAddBan(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>
            
            <div className="p-6">
              {submitError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  <div className="flex items-center">
                    <i className="bx bx-error-circle text-lg mr-2"></i>
                    <span>{submitError}</span>
                  </div>
                </div>
              )}

              {submitSuccess && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                  <div className="flex items-center">
                    <i className="bx bx-check-circle text-lg mr-2"></i>
                    <span>{submitSuccess}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleAddBan} className="space-y-4">
                {/* Jenis Wilayah */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jenis Wilayah <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={banForm.region_type}
                    onChange={(e) => setBanForm({...banForm, region_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                    disabled={isSubmitting}
                  >
                    {regionTypeOptions.map((type) => (
                      <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                    ))}
                  </select>
                </div>

                {/* Nama Wilayah */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Wilayah <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={banForm.region_name}
                    onChange={(e) => setBanForm({...banForm, region_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                    placeholder="Misal: Jakarta Selatan"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Tanggal Ban */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Ban <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={banForm.banned_date}
                    onChange={(e) => setBanForm({...banForm, banned_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Berlaku Sampai */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Berlaku Sampai (Opsional)
                  </label>
                  <input
                    type="date"
                    value={banForm.banned_until}
                    onChange={(e) => setBanForm({...banForm, banned_until: e.target.value})}
                    min={banForm.banned_date || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Alasan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alasan (Opsional)
                  </label>
                  <textarea
                    value={banForm.reason}
                    onChange={(e) => setBanForm({...banForm, reason: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                    placeholder="Alasan wilayah dilarang..."
                    disabled={isSubmitting}
                  />
                </div>

                <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAddBan(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                    disabled={isSubmitting}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-red-700 hover:to-pink-700 transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <i className="bx bx-save mr-2"></i>
                        Simpan Ban List
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Trip */}
      {showDetailTrip && detailTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Detail Perjalanan</h3>
              <button 
                onClick={() => setShowDetailTrip(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
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
                <p className="font-medium text-gray-900">{detailTrip.profiles.name || '-'}</p>
                <p className="text-sm text-gray-600">{detailTrip.profiles.email || '-'}</p>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-center">
              <button
                onClick={() => setShowDetailTrip(false)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
