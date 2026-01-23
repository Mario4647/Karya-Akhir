import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AdminNavbar from '../../components/AdminNavbar';

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [messageSearchTerm, setMessageSearchTerm] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
    fetchData();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: userData, error } = await supabase
        .from('profiles')
        .select('roles')
        .eq('id', session.user.id)
        .single();

      if (error || !userData || userData.roles !== 'admin') {
        navigate('/');
        return;
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/auth');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch pesan dari user
      const { data: messagesData, error: messagesError } = await supabase
        .from('admin_messages')
        .select(`
          *,
          user:profiles!admin_messages_user_id_fkey(name, email, class),
          admin:profiles!admin_messages_admin_id_fkey(name, email)
        `)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Fetch semua user (user-raport)
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, email, class, can_send_admin_message, has_sent_admin_message, last_message_sent_at')
        .eq('roles', 'user-raport')
        .order('name', { ascending: true });

      if (usersError) throw usersError;

      setMessages(messagesData || []);
      setUsers(usersData || []);
      
      // Set selected users dari yang sudah punya akses
      const selected = usersData
        .filter(user => user.can_send_admin_message)
        .map(user => user.id);
      setSelectedUsers(selected);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setErrorMessage('Gagal memuat data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAll = () => {
    const allUserIds = filteredUsers.map(user => user.id);
    setSelectedUsers(allUserIds);
  };

  const handleDeselectAll = () => {
    setSelectedUsers([]);
  };

  const handleSaveAccess = async () => {
    try {
      // Reset semua user terlebih dahulu
      const { error: resetError } = await supabase
        .from('profiles')
        .update({ 
          can_send_admin_message: false,
          updated_at: new Date().toISOString()
        })
        .eq('roles', 'user-raport');

      if (resetError) throw resetError;

      // Update user yang dipilih
      if (selectedUsers.length > 0) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            can_send_admin_message: true,
            updated_at: new Date().toISOString()
          })
          .in('id', selectedUsers);

        if (updateError) throw updateError;
      }

      setSuccessMessage('Akses pesan berhasil diperbarui');
      fetchData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving access:', error);
      setErrorMessage('Gagal menyimpan akses: ' + error.message);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus pesan ini?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      setSuccessMessage('Pesan berhasil dihapus');
      fetchData();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting message:', error);
      setErrorMessage('Gagal menghapus pesan: ' + error.message);
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      const { error } = await supabase
        .from('admin_messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;

      fetchData();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const openDetailModal = (message) => {
    setSelectedMessage(message);
    
    // Tandai sebagai dibaca jika belum
    if (!message.is_read) {
      handleMarkAsRead(message.id);
    }
    
    setShowDetailModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredUsers = users.filter(user => {
    return user.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
           user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
           user.class?.toLowerCase().includes(userSearchTerm.toLowerCase());
  });

  const filteredMessages = messages.filter(message => {
    const user = message.user;
    return user?.name?.toLowerCase().includes(messageSearchTerm.toLowerCase()) ||
           user?.email?.toLowerCase().includes(messageSearchTerm.toLowerCase()) ||
           message.message?.toLowerCase().includes(messageSearchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-blue-700 font-medium">Memuat data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <AdminNavbar />
      
      <div className="pt-16">
        <div className="container mx-auto px-4 py-8">
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-800">
                <span className="text-lg">✅</span>
                <span>{successMessage}</span>
              </div>
              <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800">
                ✕
              </button>
            </div>
          )}
          
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 text-red-800">
                <span className="text-lg">❌</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Tabel Pesan dari User */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-indigo-600">💬</span>
                Pesan dari User
              </h2>
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    placeholder="Cari pesan..."
                    value={messageSearchTerm}
                    onChange={(e) => setMessageSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {filteredMessages.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl text-gray-300 mb-3 block">💬</span>
                <p className="text-gray-600">Belum ada pesan dari user</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full min-w-max">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nama User</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tanggal & Jam</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Isi Pesan</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredMessages.map((message) => (
                      <tr 
                        key={message.id} 
                        className={`hover:bg-gray-50 transition-colors ${!message.is_read ? 'bg-blue-50' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{message.user?.name || '-'}</p>
                            <p className="text-sm text-gray-600">Kelas: {message.user?.class || '-'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-800">{message.user?.email || '-'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span>{formatDate(message.created_at)}</span>
                            <span className="text-xs text-gray-500">
                              {formatDateTime(message.created_at)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-800 line-clamp-2 max-w-xs">
                            {message.message || '-'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            message.is_read 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {message.is_read ? '✅ Dibaca' : '📫 Belum dibaca'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => openDetailModal(message)}
                              className="inline-flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                            >
                              👁️ Detail
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="inline-flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                            >
                              🗑️ Hapus
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

          {/* Tabel Berikan Akses Pesan */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="text-green-600">🔐</span>
                Berikan Akses Pesan Untuk Admin
              </h2>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedUsers.length} user terpilih dari {users.length} total user
                </span>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                  <input
                    type="text"
                    placeholder="Cari user..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full"
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                  >
                    Pilih Semua
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Batalkan Semua
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-700">
                    User yang dipilih akan mendapatkan popup untuk mengirim pesan ketika membuka dashboard.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Popup hanya muncul sekali dan tidak akan muncul lagi setelah user mengirim pesan.
                  </p>
                </div>
                <button
                  onClick={handleSaveAccess}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Simpan Akses
                </button>
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl text-gray-300 mb-3 block">👤</span>
                <p className="text-gray-600">Tidak ada data user yang ditemukan</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full min-w-max">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 w-12">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange={() => {
                            if (selectedUsers.length === filteredUsers.length) {
                              handleDeselectAll();
                            } else {
                              handleSelectAll();
                            }
                          }}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nama User</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Kelas</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status Pesan</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Akses Saat Ini</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleUserSelection(user.id)}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{user.name || '-'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-800">{user.email || '-'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {user.class || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {user.has_sent_admin_message ? (
                            <div className="flex flex-col">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 mb-1">
                                ✅ Sudah mengirim
                              </span>
                              {user.last_message_sent_at && (
                                <span className="text-xs text-gray-500">
                                  {formatDate(user.last_message_sent_at)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                              📤 Belum mengirim
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            user.can_send_admin_message 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.can_send_admin_message ? '✅ Diizinkan' : '❌ Tidak diizinkan'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Detail Pesan */}
      {showDetailModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Detail Pesan</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                {/* Informasi Pengirim */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-3">Informasi Pengirim</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Nama User</p>
                      <p className="font-medium text-gray-900">{selectedMessage.user?.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Email</p>
                      <p className="font-medium text-gray-900">{selectedMessage.user?.email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Kelas</p>
                      <p className="font-medium text-gray-900">{selectedMessage.user?.class || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Tanggal Pengiriman</p>
                      <p className="font-medium text-gray-900">{formatDateTime(selectedMessage.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Isi Pesan */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Isi Pesan</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-800 whitespace-pre-line">{selectedMessage.message || '-'}</p>
                  </div>
                </div>

                {/* Status Pesan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedMessage.is_read 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedMessage.is_read ? '✅ Telah dibaca' : '📫 Belum dibaca'}
                    </span>
                    {selectedMessage.read_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        Dibaca: {formatDateTime(selectedMessage.read_at)}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Aksi</p>
                    <button
                      onClick={() => {
                        handleDeleteMessage(selectedMessage.id);
                        setShowDetailModal(false);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      🗑️ Hapus Pesan
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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

export default AdminMessages;
