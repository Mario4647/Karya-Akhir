import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseAdmin } from '../supabaseClient';
import AdminNavbar from '../components/AdminNavbar';
import Footer from '../components/Footer';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('profiles');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [editData, setEditData] = useState({ 
    id: '', 
    email: '', 
    roles: '',
    name: '',
    class: ''
  });
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    class: '',
    roles: 'user-raport'
  });
  const [userCount, setUserCount] = useState(0);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [addUserLoading, setAddUserLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
    fetchData();
    fetchUserCount();
  }, [activeTab]);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    setUserEmail(session.user.email);

    const { data: userData, error } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', session.user.id)
      .single();

    if (error || !userData || userData.roles !== 'admin') {
      navigate('/');
      return;
    }

    setUserRole(userData.roles);
  };

  const fetchUserCount = async () => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      setUserCount(count || 0);
    } catch (error) {
      console.error('Error fetching user count:', error.message);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'profiles') {
        // Fetch all profiles
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('*');
        
        if (profileError) throw profileError;

        // Try to get auth data if available
        let authUsers = [];
        try {
          const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
          if (!authError && users) {
            authUsers = users;
          }
        } catch (authErr) {
          console.log('Auth data not available:', authErr.message);
        }

        const combinedData = profiles.map(profile => {
          const authUser = authUsers.find(auth => auth.id === profile.id);
          return {
            ...profile,
            last_sign_in_at: authUser?.last_sign_in_at || null,
            auth_email: authUser?.email || profile.email
          };
        });

        setData(combinedData);
      } 
      else if (activeTab === 'transactions') {
        const { data: transactions, error: txError } = await supabase
          .from('transactions')
          .select('*');
        
        if (txError) throw txError;

        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, email');
        
        if (profileError) throw profileError;

        const transformedData = transactions.map(tx => ({
          ...tx,
          user_email: profiles.find(p => p.id === tx.user_id)?.email || tx.user_id
        }));

        setData(transformedData);
      } 
      else if (activeTab === 'budgets') {
        const { data: budgets, error: budgetError } = await supabase
          .from('budgets')
          .select('*');
        
        if (budgetError) throw budgetError;

        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, email');
        
        if (profileError) throw profileError;

        const transformedData = budgets.map(budget => ({
          ...budget,
          user_email: profiles.find(p => p.id === budget.user_id)?.email || budget.user_id
        }));

        setData(transformedData);
      }
      else if (activeTab === 'user-report') {
        // Hanya fetch user dengan role 'user-raport'
        const { data: userReports, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('roles', 'user-raport')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setData(userReports || []);
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab} data:`, error.message);
      alert(`Gagal mengambil data ${activeTab}: ${error.message}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      // Hapus dari tabel profiles
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedItem.id);
      
      if (error) throw error;
      
      await Promise.all([fetchData(), fetchUserCount()]);
      setShowDeleteModal(false);
      setSuccessMessage('Data user berhasil dihapus!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting data:', error.message);
      alert('Gagal menghapus data: ' + error.message);
    }
  };

  const openEditModal = (item) => {
    if (activeTab === 'profiles') {
      setEditData({
        id: item.id,
        email: item.email,
        roles: item.roles || 'user'
      });
    } else if (activeTab === 'user-report') {
      setEditData({
        id: item.id,
        email: item.email,
        roles: item.roles || 'user-raport',
        name: item.name || '',
        class: item.class || ''
      });
    }
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    try {
      let updateData = {};
      
      if (activeTab === 'profiles') {
        updateData = {
          email: editData.email,
          roles: editData.roles,
          updated_at: new Date().toISOString()
        };
      } else if (activeTab === 'user-report') {
        updateData = {
          email: editData.email,
          roles: editData.roles,
          name: editData.name,
          class: editData.class,
          updated_at: new Date().toISOString()
        };
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', editData.id);
      
      if (error) throw error;
      
      await fetchData();
      setShowEditModal(false);
      setSuccessMessage('Data berhasil diperbarui!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating data:', error.message);
      alert('Gagal memperbarui data: ' + error.message);
    }
  };

  const validateNewUser = () => {
    const newErrors = {};
    
    if (!newUser.email) {
      newErrors.email = "Email tidak boleh kosong";
    } else if (!/\S+@\S+\.\S+/.test(newUser.email)) {
      newErrors.email = "Format email tidak valid";
    }
    
    if (!newUser.password) {
      newErrors.password = "Password tidak boleh kosong";
    } else if (newUser.password.length < 6) {
      newErrors.password = "Password minimal 6 karakter";
    }
    
    if (newUser.password !== newUser.confirmPassword) {
      newErrors.confirmPassword = "Password tidak cocok";
    }
    
    if (!newUser.name) {
      newErrors.name = "Nama tidak boleh kosong";
    }
    
    if (!newUser.class) {
      newErrors.class = "Kelas tidak boleh kosong";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!validateNewUser()) return;
    
    setAddUserLoading(true);
    
    try {
      // 1. Create auth user menggunakan service role key
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true,
        user_metadata: {
          name: newUser.name,
          class: newUser.class
        }
      });

      if (authError) {
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
          throw new Error('Email sudah terdaftar di sistem');
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Gagal membuat user di sistem autentikasi');
      }

      // 2. Tunggu sebentar untuk memastikan user terbuat
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Cek apakah profil sudah ada
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single();

      let profileError = null;

      if (checkError && checkError.message.includes('No rows found')) {
        // Profil tidak ada, buat baru
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: newUser.email,
            roles: newUser.roles,
            name: newUser.name,
            class: newUser.class,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        profileError = insertError;
      } else if (existingProfile) {
        // Profil sudah ada, update saja
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            email: newUser.email,
            roles: newUser.roles,
            name: newUser.name,
            class: newUser.class,
            updated_at: new Date().toISOString()
          })
          .eq('id', authData.user.id);
        profileError = updateError;
      } else {
        throw checkError;
      }

      if (profileError) {
        // Jika duplicate key, mungkin sudah dibuat oleh trigger
        if (!profileError.message.includes('duplicate')) {
          throw profileError;
        }
      }

      // 4. Reset form dan tampilkan pesan sukses
      setNewUser({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        class: '',
        roles: 'user-raport'
      });
      setErrors({});
      setShowAddUserModal(false);
      setSuccessMessage('User berhasil ditambahkan!');

      // 5. Refresh data
      await Promise.all([fetchData(), fetchUserCount()]);

      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (error) {
      console.error('Error adding user:', error.message);
      
      let errorMessage = 'Gagal menambahkan user: ';
      if (error.message.includes('already registered') || error.message.includes('User already registered')) {
        errorMessage = 'Email sudah terdaftar di sistem';
      } else if (error.message.includes('duplicate')) {
        errorMessage = 'User sudah ada dalam sistem';
      } else if (error.message.includes('user not allowed') || error.message.includes('Forbidden')) {
        errorMessage = 'Akses ditolak. Pastikan Service Role Key valid';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setAddUserLoading(false);
    }
  };

  const openDetailModal = (item) => {
    setDetailData(item);
    setShowDetailModal(true);
  };

  const renderTableHeaders = () => {
    switch (activeTab) {
      case 'profiles':
        return (
          <>
            <th className="px-6 py-3">Email</th>
            <th className="px-6 py-3">Auth Email</th>
            <th className="px-6 py-3">Role</th>
            <th className="px-6 py-3">Last Sign In</th>
            <th className="px-6 py-3">Created At</th>
            <th className="px-6 py-3">Updated At</th>
            <th className="px-6 py-3">Actions</th>
          </>
        );
      case 'user-report':
        return (
          <>
            <th className="px-6 py-3">Email</th>
            <th className="px-6 py-3">Nama</th>
            <th className="px-6 py-3">Kelas</th>
            <th className="px-6 py-3">Role</th>
            <th className="px-6 py-3">Created At</th>
            <th className="px-6 py-3">Updated At</th>
            <th className="px-6 py-3">Actions</th>
          </>
        );
      case 'transactions':
        return (
          <>
            <th className="px-6 py-3">User Email</th>
            <th className="px-6 py-3">Type</th>
            <th className="px-6 py-3">Amount</th>
            <th className="px-6 py-3">Category</th>
            <th className="px-6 py-3">Description</th>
            <th className="px-6 py-3">Date</th>
            <th className="px-6 py-3">Actions</th>
          </>
        );
      case 'budgets':
        return (
          <>
            <th className="px-6 py-3">User Email</th>
            <th className="px-6 py-3">Category</th>
            <th className="px-6 py-3">Amount</th>
            <th className="px-6 py-3">Period</th>
            <th className="px-6 py-3">Actions</th>
          </>
        );
      default:
        return null;
    }
  };

  const renderTableRows = () => {
    if (data.length === 0) {
      const colSpan = activeTab === 'profiles' ? 7 : 
                     activeTab === 'user-report' ? 7 :
                     activeTab === 'transactions' ? 7 : 
                     activeTab === 'budgets' ? 5 : 1;
      return (
        <tr>
          <td colSpan={colSpan} className="px-6 py-4 text-center">
            {loading ? 'Loading...' : 'Tidak ada data ditemukan'}
          </td>
        </tr>
      );
    }

    return data.map((item) => (
      <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
        {activeTab === 'profiles' && (
          <>
            <td className="px-6 py-4">{item.email || 'N/A'}</td>
            <td className="px-6 py-4">{item.auth_email || 'N/A'}</td>
            <td className="px-6 py-4">{item.roles || 'user'}</td>
            <td className="px-6 py-4">
              {item.last_sign_in_at 
                ? new Date(item.last_sign_in_at).toLocaleString() 
                : 'Belum pernah login'}
            </td>
            <td className="px-6 py-4">
              {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
            </td>
            <td className="px-6 py-4">
              {item.updated_at ? new Date(item.updated_at).toLocaleString() : 'N/A'}
            </td>
          </>
        )}
        {activeTab === 'user-report' && (
          <>
            <td className="px-6 py-4">{item.email || 'N/A'}</td>
            <td className="px-6 py-4">{item.name || 'N/A'}</td>
            <td className="px-6 py-4">{item.class || 'N/A'}</td>
            <td className="px-6 py-4">{item.roles || 'user-raport'}</td>
            <td className="px-6 py-4">
              {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
            </td>
            <td className="px-6 py-4">
              {item.updated_at ? new Date(item.updated_at).toLocaleString() : 'N/A'}
            </td>
          </>
        )}
        {activeTab === 'transactions' && (
          <>
            <td className="px-6 py-4">{item.user_email || item.user_id || 'Unknown'}</td>
            <td className="px-6 py-4">{item.type || 'N/A'}</td>
            <td className="px-6 py-4">{item.amount || '0'}</td>
            <td className="px-6 py-4">{item.category || 'N/A'}</td>
            <td className="px-6 py-4">
              {item.description ? `${item.description.substring(0, 20)}${item.description.length > 20 ? '...' : ''}` : 'N/A'}
            </td>
            <td className="px-6 py-4">
              {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
            </td>
          </>
        )}
        {activeTab === 'budgets' && (
          <>
            <td className="px-6 py-4">{item.user_email || item.user_id || 'Unknown'}</td>
            <td className="px-6 py-4">{item.category || 'N/A'}</td>
            <td className="px-6 py-4">{item.amount || '0'}</td>
            <td className="px-6 py-4">{item.period || 'N/A'}</td>
          </>
        )}
        <td className="px-6 py-4 flex space-x-2">
          {(activeTab === 'profiles' || activeTab === 'user-report') && (
            <button
              onClick={() => openEditModal(item)}
              className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-md hover:from-yellow-600 hover:to-amber-600 transition-all duration-200 shadow-md"
            >
              Edit
            </button>
          )}
          <button
            onClick={() => {
              setSelectedItem(item);
              setShowDeleteModal(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-md hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-md"
          >
            Hapus
          </button>
          <button
            onClick={() => openDetailModal(item)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-md"
          >
            Detail
          </button>
        </td>
      </tr>
    ));
  };

  const renderDetailContent = () => {
    if (!detailData) return null;
    
    return (
      <div className="space-y-4">
        {Object.entries(detailData).map(([key, value]) => {
          if (key === 'profiles') return null;
          
          let displayValue = value;
          if (key.includes('_at') || key === 'date') {
            displayValue = value ? new Date(value).toLocaleString() : 'N/A';
          } else if (typeof value === 'string' && value.length > 50) {
            displayValue = `${value.substring(0, 50)}...`;
          } else if (value === null || value === undefined) {
            displayValue = 'N/A';
          }

          return (
            <div key={key} className="flex">
              <span className="font-semibold w-1/3 capitalize">{key.replace('_', ' ')}:</span>
              <span className="w-2/3 break-all">{displayValue}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Akses Ditolak</h1>
          <p className="text-gray-700 mb-6">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Kembali ke Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AdminNavbar />
      
      <div className="flex-grow container mx-auto px-4 py-8 mt-16">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Selamat Datang di Dashboard Admin ({userEmail})
        </h1>
        
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200/50 rounded-xl text-green-800 flex items-center gap-3">
            <i className="bx bx-check-circle text-xl text-green-500"></i>
            <span>{successMessage}</span>
          </div>
        )}
        
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 mb-8 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold mb-1">Jumlah User</h2>
              <p className="text-sm opacity-80">Total pengguna yang terdaftar: {userCount}</p>
            </div>
            <div className="text-4xl font-bold">{userCount}</div>
          </div>
        </div>

        <div className="flex border-b mb-6">
          <button
            className={`py-2 px-4 ${activeTab === 'profiles' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
            onClick={() => setActiveTab('profiles')}
          >
            Profiles
          </button>
          <button
            className={`py-2 px-4 ${activeTab === 'user-report' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
            onClick={() => setActiveTab('user-report')}
          >
            User Report
          </button>
          <button
            className={`py-2 px-4 ${activeTab === 'transactions' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </button>
          <button
            className={`py-2 px-4 ${activeTab === 'budgets' ? 'border-b-2 border-blue-500 font-medium' : ''}`}
            onClick={() => setActiveTab('budgets')}
          >
            Budgets
          </button>
        </div>

        {activeTab === 'user-report' && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-md hover:from-green-600 hover:to-teal-600 transition-all duration-200 shadow-md flex items-center gap-2"
            >
              <i className="bx bx-user-plus"></i>
              Tambah User
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  {renderTableHeaders()}
                </tr>
              </thead>
              <tbody>
                {renderTableRows()}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Konfirmasi Hapus</h3>
            <p>Apakah Anda yakin ingin menghapus data ini?</p>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-md hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-md"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">
              Edit {activeTab === 'profiles' ? 'User' : 'User Report'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({...editData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              {activeTab === 'user-report' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({...editData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                    <input
                      type="text"
                      value={editData.class}
                      onChange={(e) => setEditData({...editData, class: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={editData.roles}
                  onChange={(e) => setEditData({...editData, roles: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {activeTab === 'profiles' ? (
                    <>
                      <option value="admin">Admin</option>
                      <option value="user">User</option>
                    </>
                  ) : (
                    <>
                      <option value="user-raport">User Raport</option>
                      <option value="user">User</option>
                    </>
                  )}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                Batal
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-md hover:from-green-600 hover:to-teal-600 transition-all duration-200 shadow-md"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Tambah User Raport Baru</h3>
            <form onSubmit={handleAddUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className={`w-full px-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-md`}
                    placeholder="Masukkan email"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className={`w-full px-3 py-2 border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-md`}
                    placeholder="Masukkan password (minimal 6 karakter)"
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Konfirmasi Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                    className={`w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'} rounded-md`}
                    placeholder="Konfirmasi password"
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className={`w-full px-3 py-2 border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded-md`}
                    placeholder="Masukkan nama lengkap"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kelas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUser.class}
                    onChange={(e) => setNewUser({...newUser, class: e.target.value})}
                    className={`w-full px-3 py-2 border ${errors.class ? 'border-red-300' : 'border-gray-300'} rounded-md`}
                    placeholder="Masukkan kelas (contoh: XII IPA 1)"
                  />
                  {errors.class && <p className="text-red-500 text-sm mt-1">{errors.class}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={newUser.roles}
                    onChange={(e) => setNewUser({...newUser, roles: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="user-raport">User Raport</option>
                    <option value="user">User Biasa</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addUserLoading}
                  className={`px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-md hover:from-green-600 hover:to-teal-600 transition-all duration-200 shadow-md ${addUserLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {addUserLoading ? (
                    <span className="flex items-center gap-2">
                      <i className="bx bx-loader-alt animate-spin"></i>
                      Menambahkan...
                    </span>
                  ) : 'Tambah User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Detail Data</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {renderDetailContent()}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminDashboard;
