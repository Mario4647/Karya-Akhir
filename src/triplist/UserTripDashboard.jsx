import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { format, parseISO, isValid } from 'date-fns';
import { id } from 'date-fns/locale';

const UserTripDashboard = () => {
  const [trips, setTrips] = useState([]);
  const [bannedRegions, setBannedRegions] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    upcomingTrips: 0,
    totalTrips: 0,
    activeBans: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Fetch user's trips and trips shared with user
      const { data: userTrips } = await supabase
        .from('train_trips')
        .select('*')
        .eq('user_id', user.id)
        .order('departure_date', { ascending: true });

      // Fetch trips shared with user
      const { data: sharedAccess } = await supabase
        .from('trip_access')
        .select('owner_id')
        .eq('partner_id', user.id)
        .eq('status', 'active');

      let sharedTrips = [];
      if (sharedAccess && sharedAccess.length > 0) {
        const ownerIds = sharedAccess.map(access => access.owner_id);
        const { data: sharedTripsData } = await supabase
          .from('train_trips')
          .select('*')
          .in('user_id', ownerIds)
          .order('departure_date', { ascending: true });
        
        sharedTrips = sharedTripsData || [];
      }

      // Combine trips
      const allTrips = [...(userTrips || []), ...sharedTrips];

      // Fetch banned regions
      const { data: banData } = await supabase
        .from('banned_regions')
        .select('*')
        .order('banned_date', { ascending: false });

      setTrips(allTrips);
      setBannedRegions(banData || []);

      // Calculate stats
      const upcomingTrips = allTrips.filter(trip => 
        new Date(trip.departure_date) >= new Date()
      ).length;

      setStats({
        upcomingTrips,
        totalTrips: allTrips.length,
        activeBans: banData?.length || 0
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
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

  const formatTime = (dateString) => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return '-';
      return format(date, 'HH:mm');
    } catch {
      return '-';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <i className="bx bx-calendar text-2xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Perjalanan Mendatang</p>
              <p className="text-2xl font-bold text-gray-800">{stats.upcomingTrips}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <i className="bx bx-train text-2xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Perjalanan</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalTrips}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
              <i className="bx bx-map text-2xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Wilayah Terban</p>
              <p className="text-2xl font-bold text-gray-800">{stats.activeBans}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trip Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <i className="bx bx-train mr-2"></i>
              Perjalanan Kereta Anda
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kereta</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Berangkat</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Tiba</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-blue-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{trip.trip_name}</div>
                      <div className="text-xs text-gray-500">
                        {trip.departure_station} → {trip.arrival_station}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(trip.departure_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">{trip.train_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {formatTime(trip.departure_date)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          {formatTime(trip.arrival_date)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedTrip(trip);
                          setShowDetail(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        <i className="bx bx-show"></i>
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Banned Regions Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <i className="bx bx-map-alt mr-2"></i>
              Daftar Wilayah Terban
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Wilayah</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Ban</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bannedRegions.map((region) => {
                  const isActive = !region.banned_until || new Date(region.banned_until) >= new Date();
                  return (
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{region.region_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(region.banned_date)}</div>
                        {region.banned_until && (
                          <div className="text-xs text-gray-500">s/d {formatDate(region.banned_until)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          isActive ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isActive ? 'Aktif' : 'Kadaluarsa'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Detail Perjalanan</h3>
                <button
                  onClick={() => setShowDetail(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className="bx bx-x text-3xl"></i>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <i className="bx bx-map text-blue-600 text-xl"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nama Perjalanan</p>
                    <p className="text-lg font-semibold text-gray-800">{selectedTrip.trip_name}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <i className="bx bx-train text-green-600 text-xl"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Kereta</p>
                    <p className="text-lg font-semibold text-gray-800">{selectedTrip.train_name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-500">Keberangkatan</p>
                    <p className="font-semibold text-gray-800">{formatTime(selectedTrip.departure_date)}</p>
                    <p className="text-sm text-gray-600 mt-1">{selectedTrip.departure_station}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-500">Kedatangan</p>
                    <p className="font-semibold text-gray-800">{formatTime(selectedTrip.arrival_date)}</p>
                    <p className="text-sm text-gray-600 mt-1">{selectedTrip.arrival_station}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500">Jadwal</p>
                  <p className="font-semibold text-gray-800">{formatDate(selectedTrip.departure_date)}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedTrip.total_days} hari perjalanan
                  </p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500">Biaya Tiket</p>
                  <p className="text-2xl font-bold text-yellow-700">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR'
                    }).format(selectedTrip.total_ticket_price)}
                  </p>
                </div>

                {selectedTrip.notes && (
                  <div className="bg-purple-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-500">Catatan</p>
                    <p className="text-gray-800">{selectedTrip.notes}</p>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setShowDetail(false)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTripDashboard;
