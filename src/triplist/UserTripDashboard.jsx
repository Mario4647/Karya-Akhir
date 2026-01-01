import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { format, parseISO, isValid } from 'date-fns';
import { id } from 'date-fns/locale';

const UserTripDashboard = () => {
    const [trips, setTrips] = useState([]);
    const [bannedRegions, setBannedRegions] = useState([]);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [selectedBan, setSelectedBan] = useState(null);
    const [showTripDetail, setShowTripDetail] = useState(false);
    const [showBanDetail, setShowBanDetail] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        upcomingTrips: 0,
        totalTrips: 0,
        activeBans: 0
    });

    // Train class options
    const trainClassOptions = [
        'Ekonomi', 'Ekonomi Premium', 'Ekonomi New Gen',
        'Eksekutif', 'Eksekutif New Gen', 'Luxury',
        'Luxury New Gen', 'Priority', 'Imperial',
        'Panoramic', 'Panoramic New Gen', 'Compartement'
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) return;

            // Fetch user's trips
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

            const activeBans = banData?.filter(region => 
                !region.banned_until || new Date(region.banned_until) >= new Date()
            ).length || 0;

            setStats({
                upcomingTrips,
                totalTrips: allTrips.length,
                activeBans
            });
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Gagal memuat data: ' + error.message);
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

    const getRegionTypeColor = (regionType) => {
        const typeColors = {
            'kecamatan': 'bg-green-100 text-green-800',
            'kabupaten': 'bg-blue-100 text-blue-800',
            'provinsi': 'bg-purple-100 text-purple-800'
        };
        return typeColors[regionType] || 'bg-gray-100 text-gray-800';
    };

    const getBanStatus = (bannedUntil) => {
        if (!bannedUntil) return { label: 'Selamanya', color: 'bg-red-100 text-red-800' };
        
        const untilDate = new Date(bannedUntil);
        const today = new Date();
        
        if (untilDate < today) return { label: 'Kadaluarsa', color: 'bg-gray-100 text-gray-800' };
        return { label: 'Aktif', color: 'bg-red-100 text-red-800' };
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
                            <i className="bx bx-ban text-2xl"></i>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Ban List Wilayah Aktif</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.activeBans}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trip Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            <i className="bx bx-train mr-2 text-blue-600"></i>
                            Perjalanan Kereta Anda
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Data perjalanan kereta api Anda dan pasangan
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kereta</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Berangkat</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jam Tiba</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {trips.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center">
                                            <i className="bx bx-train text-4xl text-gray-300 mb-3"></i>
                                            <p className="text-gray-500">Belum ada data perjalanan</p>
                                        </td>
                                    </tr>
                                ) : (
                                    trips.map((trip) => (
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
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getClassColor(trip.train_class)}`}>
                                                    {trip.train_class}
                                                </span>
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
                                                        setShowTripDetail(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                                                >
                                                    <i className="bx bx-show"></i>
                                                    <span className="text-sm">Detail</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Banned Regions Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            <i className="bx bx-ban mr-2 text-red-600"></i>
                            Ban List Wilayah
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Daftar wilayah yang dilarang untuk perjalanan
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Wilayah</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Ban</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {bannedRegions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center">
                                            <i className="bx bx-map text-4xl text-gray-300 mb-3"></i>
                                            <p className="text-gray-500">Tidak ada wilayah yang dilarang</p>
                                        </td>
                                    </tr>
                                ) : (
                                    bannedRegions.map((region) => {
                                        const status = getBanStatus(region.banned_until);
                                        return (
                                            <tr key={region.id} className="hover:bg-red-50 transition-colors duration-150">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRegionTypeColor(region.region_type)}`}>
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
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBan(region);
                                                            setShowBanDetail(true);
                                                        }}
                                                        className="text-red-600 hover:text-red-800 flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                                                    >
                                                        <i className="bx bx-info-circle"></i>
                                                        <span className="text-sm">Detail</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Trip Detail Modal */}
            {showTripDetail && selectedTrip && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-800">Detail Perjalanan</h3>
                                <button
                                    onClick={() => setShowTripDetail(false)}
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
                                        <p className="text-sm text-gray-500">Kereta & Kelas</p>
                                        <p className="text-lg font-semibold text-gray-800">{selectedTrip.train_name}</p>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium mt-1 ${getClassColor(selectedTrip.train_class)}`}>
                                            {selectedTrip.train_class}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-xl">
                                        <p className="text-sm text-gray-500">Keberangkatan</p>
                                        <p className="font-semibold text-gray-800">{formatTime(selectedTrip.departure_date)}</p>
                                        <p className="text-sm text-gray-600 mt-1">{selectedTrip.departure_station}</p>
                                        <p className="text-xs text-gray-500 mt-1">{formatDate(selectedTrip.departure_date)}</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-xl">
                                        <p className="text-sm text-gray-500">Kedatangan</p>
                                        <p className="font-semibold text-gray-800">{formatTime(selectedTrip.arrival_date)}</p>
                                        <p className="text-sm text-gray-600 mt-1">{selectedTrip.arrival_station}</p>
                                        <p className="text-xs text-gray-500 mt-1">{formatDate(selectedTrip.arrival_date)}</p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-sm text-gray-500">Jadwal</p>
                                    <p className="font-semibold text-gray-800">{selectedTrip.total_days} hari perjalanan</p>
                                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                                        <span>Keberangkatan: {formatDate(selectedTrip.departure_date)}</span>
                                        <span>Kedatangan: {formatDate(selectedTrip.arrival_date)}</span>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 p-4 rounded-xl">
                                    <p className="text-sm text-gray-500">Biaya Tiket</p>
                                    <p className="text-2xl font-bold text-yellow-700">
                                        {formatCurrency(selectedTrip.total_ticket_price)}
                                    </p>
                                </div>

                                {selectedTrip.notes && (
                                    <div className="bg-purple-50 p-4 rounded-xl">
                                        <p className="text-sm text-gray-500">Catatan</p>
                                        <p className="text-gray-800">{selectedTrip.notes}</p>
                                    </div>
                                )}

                                <div className="bg-blue-50 p-4 rounded-xl">
                                    <p className="text-sm text-gray-500">Informasi</p>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                            ID: {selectedTrip.id.substring(0, 8)}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded ${getClassColor(selectedTrip.train_class)}`}>
                                            {selectedTrip.train_class}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-center">
                                <button
                                    onClick={() => setShowTripDetail(false)}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Ban List Detail Modal */}
            {showBanDetail && selectedBan && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-800">Detail Ban List Wilayah</h3>
                                <button
                                    onClick={() => setShowBanDetail(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <i className="bx bx-x text-3xl"></i>
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <i className="bx bx-ban text-red-600 text-xl"></i>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Jenis Wilayah</p>
                                        <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getRegionTypeColor(selectedBan.region_type)}`}>
                                            {selectedBan.region_type.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <i className="bx bx-map text-blue-600 text-xl"></i>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Nama Wilayah</p>
                                        <p className="text-lg font-semibold text-gray-800">{selectedBan.region_name}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-yellow-50 p-4 rounded-xl">
                                        <p className="text-sm text-gray-500">Tanggal Ban</p>
                                        <p className="font-semibold text-gray-800">{formatDate(selectedBan.banned_date)}</p>
                                    </div>
                                    <div className="bg-red-50 p-4 rounded-xl">
                                        <p className="text-sm text-gray-500">Berlaku Sampai</p>
                                        <p className="font-semibold text-gray-800">
                                            {selectedBan.banned_until ? formatDate(selectedBan.banned_until) : 'Selamanya'}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-sm text-gray-500">Status</p>
                                    {(() => {
                                        const status = getBanStatus(selectedBan.banned_until);
                                        return (
                                            <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${status.color}`}>
                                                {status.label}
                                            </span>
                                        );
                                    })()}
                                    {selectedBan.banned_until && (
                                        <p className="text-xs text-gray-600 mt-2">
                                            {new Date(selectedBan.banned_until) > new Date() 
                                                ? `Akan berakhir dalam ${Math.ceil((new Date(selectedBan.banned_until) - new Date()) / (1000 * 60 * 60 * 24))} hari`
                                                : 'Sudah kadaluarsa'}
                                        </p>
                                    )}
                                </div>

                                {selectedBan.reason && (
                                    <div className="bg-purple-50 p-4 rounded-xl">
                                        <p className="text-sm text-gray-500">Alasan</p>
                                        <p className="text-gray-800">{selectedBan.reason}</p>
                                    </div>
                                )}

                                <div className="bg-blue-50 p-4 rounded-xl">
                                    <p className="text-sm text-gray-500">Informasi</p>
                                    <div className="mt-1">
                                        <p className="text-xs text-gray-600">
                                            ID: {selectedBan.id.substring(0, 8)}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            Dibuat: {format(new Date(selectedBan.created_at), 'dd MMM yyyy HH:mm')}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-red-50 p-4 rounded-xl">
                                    <p className="text-sm font-medium text-red-800 flex items-center">
                                        <i className="bx bx-info-circle mr-2"></i>
                                        Peringatan
                                    </p>
                                    <p className="text-sm text-red-600 mt-1">
                                        Wilayah ini dilarang untuk perjalanan. Mohon perhatikan jadwal perjalanan Anda.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-center">
                                <button
                                    onClick={() => setShowBanDetail(false)}
                                    className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200"
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
