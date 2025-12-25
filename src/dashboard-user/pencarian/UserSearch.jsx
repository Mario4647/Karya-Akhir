import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import Navbar from '../../components/Navbar';

const UserSearch = () => {
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSiswa, setSelectedSiswa] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [searchType, setSearchType] = useState('');
  const [resultData, setResultData] = useState(null);
  const [dailyLimit, setDailyLimit] = useState(3);
  const [remainingSearches, setRemainingSearches] = useState(0);
  const [isAccessRevoked, setIsAccessRevoked] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const searchTimeoutRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkUserAccess();
  }, []);

  const checkUserAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error || !profile) {
        navigate('/');
        return;
      }

      if (!['admin', 'user-raport'].includes(profile.roles)) {
        navigate('/');
        return;
      }

      setUserRole(profile.roles);
      setUserProfile(profile);
      setIsAccessRevoked(profile.search_access_revoked || false);
      
      await resetDailySearchCount(profile);
      updateSearchLimitInfo(profile);
      
    } catch (error) {
      console.error('Error checking access:', error);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const resetDailySearchCount = async (profile) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const lastSearchDate = profile.last_search_date 
        ? new Date(profile.last_search_date).toISOString().split('T')[0]
        : null;

      if (lastSearchDate !== today) {
        await supabase
          .from('profiles')
          .update({
            today_search_count: 0,
            last_search_date: today,
            total_searches_today: 0
          })
          .eq('id', profile.id);
      }
    } catch (error) {
      console.error('Error resetting daily count:', error);
    }
  };

  const updateSearchLimitInfo = async (profile) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const lastSearchDate = profile.last_search_date 
        ? new Date(profile.last_search_date).toISOString().split('T')[0]
        : null;

      let limit = profile.daily_search_limit || 3;
      let used = 0;

      if (lastSearchDate === today) {
        used = profile.today_search_count || 0;
      }

      setDailyLimit(limit);
      setRemainingSearches(Math.max(0, limit - used));
    } catch (error) {
      console.error('Error updating search limit:', error);
    }
  };

  const searchSiswa = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // Ambil daftar siswa yang difilter
      const { data: filteredData, error: filteredError } = await supabase
        .from('filtered_siswa')
        .select('siswa_id');

      if (filteredError) throw filteredError;

      const filteredIds = filteredData?.map(f => f.siswa_id) || [];

      // Cari siswa yang tidak termasuk dalam filtered
      let queryBuilder = supabase
        .from('siswa')
        .select('id, nama, nisn')
        .ilike('nama', `%${query}%`);

      // Exclude siswa yang difilter
      if (filteredIds.length > 0) {
        queryBuilder = queryBuilder.not('id', 'in', `(${filteredIds.join(',')})`);
      }

      const { data, error } = await queryBuilder.limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching siswa:', error);
      setSearchResults([]);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchSiswa(searchTerm);
      }, 300);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const handleSearchClick = async (type) => {
    if (!selectedSiswa) {
      setErrorMessage('Silakan pilih siswa terlebih dahulu');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (isAccessRevoked) {
      setErrorMessage('Akses pencarian Anda telah dicabut');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (userRole === 'user-raport' && remainingSearches <= 0) {
      setErrorMessage('Limit pencarian harian Anda telah habis. Silakan coba lagi besok.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    try {
      // Dapatkan IP dan browser info
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const ipAddress = ipData.ip;
      const userAgent = navigator.userAgent;
      const browserInfo = getBrowserInfo();

      // Update hitungan pencarian
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          today_search_count: (userProfile.today_search_count || 0) + 1,
          total_searches_today: (userProfile.total_searches_today || 0) + 1,
          total_searches_all_time: (userProfile.total_searches_all_time || 0) + 1,
          last_search_at: new Date().toISOString()
        })
        .eq('id', userProfile.id);

      if (updateError) throw updateError;

      // Ambil data sesuai tipe pencarian
      const { data: siswaData, error: siswaError } = await supabase
        .from('siswa')
        .select('nama_ayah, nama_ibu, lintang, bujur')
        .eq('id', selectedSiswa.id)
        .single();

      if (siswaError) throw siswaError;

      let result = {};
      switch (type) {
        case 'nama_ayah':
          result = { nama_ayah: siswaData.nama_ayah || 'Tidak ada data' };
          break;
        case 'nama_ibu':
          result = { nama_ibu: siswaData.nama_ibu || 'Tidak ada data' };
          break;
        case 'koordinat':
          result = {
            lintang: siswaData.lintang || 'Tidak ada data',
            bujur: siswaData.bujur || 'Tidak ada data'
          };
          break;
      }

      // Simpan log pencarian
      await supabase
        .from('search_logs')
        .insert({
          user_id: userProfile.id,
          siswa_id: selectedSiswa.id,
          search_type: type,
          search_query: selectedSiswa.nama,
          ip_address: ipAddress,
          user_agent: userAgent,
          browser_info: browserInfo,
          search_result: result
        });

      setSearchType(type);
      setResultData(result);
      setShowResultModal(true);
      setRemainingSearches(prev => Math.max(0, prev - 1));

    } catch (error) {
      console.error('Error in search:', error);
      setErrorMessage('Terjadi kesalahan saat melakukan pencarian');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    let browser = "Unknown";
    
    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("Edge")) browser = "Edge";
    else if (ua.includes("Opera")) browser = "Opera";
    
    return browser;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-blue-700 font-medium">Memuat halaman...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Navbar />
      
      <div className="pt-16">
        <div className="container mx-auto px-4 py-8">
          {errorMessage && (
            <div className="mb-6 max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm animate-fadeIn">
              <div className="flex items-center justify-center gap-2 text-red-800">
                <span className="text-lg">❌</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Main Search Section */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-3">
                  Pencarian Data Siswa
                </h1>
                <p className="text-gray-600">
                  Cari berdasarkan nama siswa untuk melihat informasi terbatas
                </p>
                
                {isAccessRevoked && (
                  <div className="mt-4 p-3 bg-red-100 rounded-lg border border-red-300">
                    <p className="text-red-700 font-medium">
                      ⚠️ Akses pencarian Anda telah dicabut
                    </p>
                  </div>
                )}

                {userRole === 'user-raport' && !isAccessRevoked && (
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                    <span className="font-medium">Sisa Pencarian Hari Ini:</span>
                    <span className="font-bold text-xl">{remainingSearches}</span>
                    <span className="text-sm">/ {dailyLimit}</span>
                  </div>
                )}
              </div>

              {/* Search Input */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cari Nama Siswa
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Ketik nama siswa..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={isAccessRevoked}
                  />
                  <span className="absolute right-3 top-3 text-gray-400">🔍</span>
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
  <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
    {searchResults.map((siswa) => (
      <div
        key={siswa.id}
        onClick={() => {
          setSelectedSiswa(siswa);
          setSearchResults([]);
          setSearchTerm(siswa.nama);
        }}
        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
          selectedSiswa?.id === siswa.id ? 'bg-blue-50' : ''
        }`}
      >
        <div className="font-medium text-gray-900">{siswa.nama}</div>
        <div className="text-sm text-gray-600 mt-1 flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="text-xs font-medium">Kelas:</span>
            <span className="font-medium">{siswa.rombel || '-'}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-xs font-medium">JK:</span>
            <span className={`font-medium ${siswa.jk === 'L' ? 'text-blue-600' : 'text-pink-600'}`}>
              {siswa.jk === 'L' ? 'Laki-laki' : siswa.jk === 'P' ? 'Perempuan' : '-'}
            </span>
          </span>
        </div>
      </div>
    ))}
  </div>
)}

              {/* Selected Student Info */}
              {selectedSiswa && (
                <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg mb-1">
                        Siswa Terpilih
                      </h3>
                      <p className="text-gray-700">
                        {selectedSiswa.nama}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedSiswa(null);
                        setSearchTerm('');
                      }}
                      className="text-gray-500 hover:text-gray-700 p-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Search Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <button
                  onClick={() => handleSearchClick('nama_ayah')}
                  disabled={!selectedSiswa || isAccessRevoked || (userRole === 'user-raport' && remainingSearches <= 0)}
                  className={`flex flex-col items-center justify-center p-5 rounded-xl transition-all ${
                    !selectedSiswa || isAccessRevoked || (userRole === 'user-raport' && remainingSearches <= 0)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-50 to-emerald-100 hover:from-green-100 hover:to-emerald-200 border border-green-200 hover:shadow-md'
                  }`}
                >
                  <div className="text-3xl mb-2">👨</div>
                  <h3 className="font-bold text-gray-800 mb-1">Cek Nama Ayah</h3>
                  <p className="text-xs text-gray-600 text-center">
                    Lihat nama ayah siswa
                  </p>
                </button>

                <button
                  onClick={() => handleSearchClick('nama_ibu')}
                  disabled={!selectedSiswa || isAccessRevoked || (userRole === 'user-raport' && remainingSearches <= 0)}
                  className={`flex flex-col items-center justify-center p-5 rounded-xl transition-all ${
                    !selectedSiswa || isAccessRevoked || (userRole === 'user-raport' && remainingSearches <= 0)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-50 to-rose-100 hover:from-pink-100 hover:to-rose-200 border border-pink-200 hover:shadow-md'
                  }`}
                >
                  <div className="text-3xl mb-2">👩</div>
                  <h3 className="font-bold text-gray-800 mb-1">Cek Nama Ibu</h3>
                  <p className="text-xs text-gray-600 text-center">
                    Lihat nama ibu siswa
                  </p>
                </button>

                <button
                  onClick={() => handleSearchClick('koordinat')}
                  disabled={!selectedSiswa || isAccessRevoked || (userRole === 'user-raport' && remainingSearches <= 0)}
                  className={`flex flex-col items-center justify-center p-5 rounded-xl transition-all ${
                    !selectedSiswa || isAccessRevoked || (userRole === 'user-raport' && remainingSearches <= 0)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-50 to-violet-100 hover:from-purple-100 hover:to-violet-200 border border-purple-200 hover:shadow-md'
                  }`}
                >
                  <div className="text-3xl mb-2">📍</div>
                  <h3 className="font-bold text-gray-800 mb-1">Lacak Lokasi</h3>
                  <p className="text-xs text-gray-600 text-center">
                    Lihat koordinat lintang & bujur
                  </p>
                </button>
              </div>

              {/* Information Box */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600 mt-1">ℹ️</div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-1">Informasi</h4>
                    <p className="text-sm text-gray-600">
                      • Fitur ini hanya menampilkan data nama ayah, nama ibu, dan koordinat (lintang & bujur) siswa.
                      <br />
                      • Untuk user-raport, limit pencarian adalah 3 kali per hari.
                      <br />
                      • Admin dapat mengakses tanpa batas.
                      <br />
                      • Pilih siswa terlebih dahulu sebelum melakukan pencarian.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {showResultModal && resultData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className={`px-6 py-4 border-b flex items-center justify-between rounded-t-2xl ${
              searchType === 'nama_ayah' ? 'bg-gradient-to-r from-green-50 to-emerald-50' :
              searchType === 'nama_ibu' ? 'bg-gradient-to-r from-pink-50 to-rose-50' :
              'bg-gradient-to-r from-purple-50 to-violet-50'
            }`}>
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {searchType === 'nama_ayah' && 'Hasil Cek Nama Ayah'}
                  {searchType === 'nama_ibu' && 'Hasil Cek Nama Ibu'}
                  {searchType === 'koordinat' && 'Hasil Lacak Lokasi'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedSiswa?.nama}
                </p>
              </div>
              <button
                onClick={() => setShowResultModal(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>
            
            <div className="p-6">
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                  searchType === 'nama_ayah' ? 'bg-green-100 text-green-600' :
                  searchType === 'nama_ibu' ? 'bg-pink-100 text-pink-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  <span className="text-3xl">
                    {searchType === 'nama_ayah' && '👨'}
                    {searchType === 'nama_ibu' && '👩'}
                    {searchType === 'koordinat' && '📍'}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {searchType === 'nama_ayah' && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Nama Ayah</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {resultData.nama_ayah}
                      </p>
                    </div>
                  )}
                  
                  {searchType === 'nama_ibu' && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Nama Ibu</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {resultData.nama_ibu}
                      </p>
                    </div>
                  )}
                  
                  {searchType === 'koordinat' && (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Lintang</p>
                        <p className="text-xl font-mono font-bold text-gray-800">
                          {resultData.lintang}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Bujur</p>
                        <p className="text-xl font-mono font-bold text-gray-800">
                          {resultData.bujur}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowResultModal(false)}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-md hover:shadow-lg"
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

export default UserSearch;
