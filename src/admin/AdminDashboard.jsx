import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
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
  const [detailData, setDetailData] = useState(null);
  const [editData, setEditData] = useState({ id: '', email: '', roles: '' });
  const [userCount, setUserCount] = useState(0);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
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
      // First try to get exact count
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      
      console.log('User count from count method:', count);
      setUserCount(count || 0);

      // Verify by fetching all data
      const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('id');
      
      if (fetchError) throw fetchError;
      
      console.log('Actual number of profiles:', profiles.length);
      if (count !== profiles.length) {
        console.warn('Count mismatch, using actual length');
        setUserCount(profiles.length);
      }
    } catch (error) {
      console.error('Error counting users:', error.message);
      // Fallback to simple count
      try {
        const { data: profiles, error: altError } = await supabase
          .from('profiles')
          .select('id');
        
        if (altError) throw altError;
        
        setUserCount(profiles.length);
      } catch (altError) {
        console.error('Fallback count failed:', altError.message);
      }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'profiles') {
        // Fetch ALL profiles without any filters
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        console.log('Fetched profiles:', profiles);
        setData(profiles || []);
      } 
      else if (activeTab === 'transactions') {
        // Fetch all transactions
        const { data: transactions, error: txError } = await supabase
          .from('transactions')
          .select('*');
        
        if (txError) throw txError;

        // Fetch all profiles
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, email');
        
        if (profileError) throw profileError;

        // Combine data
        const transformedData = transactions.map(tx => {
          const user = profiles.find(p => p.id === tx.user_id);
          return {
            ...tx,
            user_email: user?.email || 'Unknown'
          };
        });
        
        setData(transformedData || []);
      } 
      else if (activeTab === 'budgets') {
        // Fetch all budgets
        const { data: budgets, error: budgetError } = await supabase
          .from('budgets')
          .select('*');
        
        if (budgetError) throw budgetError;

        // Fetch all profiles
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, email');
        
        if (profileError) throw profileError;

        // Combine data
        const transformedData = budgets.map(budget => {
          const user = profiles.find(p => p.id === budget.user_id);
          return {
            ...budget,
            user_email: user?.email || 'Unknown'
          };
        });
        
        setData(transformedData || []);
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab} data:`, error.message);
      alert(`Failed to fetch ${activeTab} data: ${error.message}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from(activeTab)
        .delete()
        .eq('id', selectedItem.id);
      
      if (error) throw error;
      
      await fetchData();
      await fetchUserCount();
      
      setShowDeleteModal(false);
      alert('Data deleted successfully!');
    } catch (error) {
      console.error('Error deleting data:', error.message);
      alert('Failed to delete data');
    }
  };

  const openEditModal = (item) => {
    setEditData({
      id: item.id,
      email: item.email,
      roles: item.roles
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          email: editData.email,
          roles: editData.roles,
          updated_at: new Date().toISOString()
        })
        .eq('id', editData.id);
      
      if (error) throw error;
      
      await fetchData();
      await fetchUserCount();
      setShowEditModal(false);
      alert('Data updated successfully!');
    } catch (error) {
      console.error('Error updating data:', error.message);
      alert('Failed to update data');
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
      return (
        <tr>
          <td colSpan="10" className="px-6 py-4 text-center">
            {loading ? 'Loading...' : 'No data found'}
          </td>
        </tr>
      );
    }

    return data.map((item) => (
      <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
        {activeTab === 'profiles' && (
          <>
            <td className="px-6 py-4">{item.email}</td>
            <td className="px-6 py-4">{item.roles}</td>
            <td className="px-6 py-4">{new Date(item.created_at).toLocaleString()}</td>
            <td className="px-6 py-4">{new Date(item.updated_at).toLocaleString()}</td>
          </>
        )}
        {activeTab === 'transactions' && (
          <>
            <td className="px-6 py-4">{item.user_email || item.user_id}</td>
            <td className="px-6 py-4">{item.type}</td>
            <td className="px-6 py-4">{item.amount}</td>
            <td className="px-6 py-4">{item.category}</td>
            <td className="px-6 py-4">{item.description?.substring(0, 20)}{item.description?.length > 20 ? '...' : ''}</td>
            <td className="px-6 py-4">{new Date(item.date).toLocaleDateString()}</td>
          </>
        )}
        {activeTab === 'budgets' && (
          <>
            <td className="px-6 py-4">{item.user_email || item.user_id}</td>
            <td className="px-6 py-4">{item.category}</td>
            <td className="px-6 py-4">{item.amount}</td>
            <td className="px-6 py-4">{item.period}</td>
          </>
        )}
        <td className="px-6 py-4 flex space-x-2">
          {activeTab === 'profiles' && (
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
            Delete
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
          return (
            <div key={key} className="flex">
              <span className="font-semibold w-1/3 capitalize">{key.replace('_', ' ')}:</span>
              <span className="w-2/3 break-all">
                {key.includes('_at') || key === 'date' 
                  ? new Date(value).toLocaleString() 
                  : value}
              </span>
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
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-700 mb-6">You don't have permission to access this page.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Go to Home
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
            <h3 className="text-lg font-medium mb-4">Confirm Deletion</h3>
            <p>Are you sure you want to delete this data?</p>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-md hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Edit User</h3>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={editData.roles}
                  onChange={(e) => setEditData({...editData, roles: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
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

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Details</h3>
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
