import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Footer from '../components/Footer';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('profiles');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: fetchedData, error } = await supabase
        .from(activeTab)
        .select('*');
      
      if (error) throw error;
      setData(fetchedData);
    } catch (error) {
      console.error('Error fetching data:', error.message);
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
      fetchData();
      setShowDeleteModal(false);
      alert('Data deleted successfully!');
    } catch (error) {
      console.error('Error deleting data:', error.message);
      alert('Failed to delete data');
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
            <th className="px-6 py-3">ID</th>
            <th className="px-6 py-3">Email</th>
            <th className="px-6 py-3">Created At</th>
            <th className="px-6 py-3">Updated At</th>
            <th className="px-6 py-3">Actions</th>
          </>
        );
      case 'transactions':
        return (
          <>
            <th className="px-6 py-3">ID</th>
            <th className="px-6 py-3">User ID</th>
            <th className="px-6 py-3">Type</th>
            <th className="px-6 py-3">Amount</th>
            <th className="px-6 py-3">Category</th>
            <th className="px-6 py-3">Description</th>
            <th className="px-6 py-3">Date</th>
            <th className="px-6 py-3">Created At</th>
            <th className="px-6 py-3">Updated At</th>
            <th className="px-6 py-3">Actions</th>
          </>
        );
      case 'budgets':
        return (
          <>
            <th className="px-6 py-3">ID</th>
            <th className="px-6 py-3">User ID</th>
            <th className="px-6 py-3">Category</th>
            <th className="px-6 py-3">Amount</th>
            <th className="px-6 py-3">Period</th>
            <th className="px-6 py-3">Created At</th>
            <th className="px-6 py-3">Updated At</th>
            <th className="px-6 py-3">Actions</th>
          </>
        );
      default:
        return null;
    }
  };

  const renderTableRows = () => {
    return data.map((item) => (
      <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
        {Object.entries(item).map(([key, value]) => (
          <td key={key} className="px-6 py-4">
            {typeof value === 'string' && value.length > 20 
              ? `${value.substring(0, 20)}...` 
              : value}
          </td>
        ))}
        <td className="px-6 py-4 flex space-x-2">
          <button
            onClick={() => {
              setSelectedItem(item);
              setShowDeleteModal(true);
            }}
            className="text-red-600 hover:text-red-900"
          >
            Delete
          </button>
          <button
            onClick={() => openDetailModal(item)}
            className="text-blue-600 hover:text-blue-900"
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
        {Object.entries(detailData).map(([key, value]) => (
          <div key={key} className="flex">
            <span className="font-semibold w-1/3 capitalize">{key.replace('_', ' ')}:</span>
            <span className="w-2/3">{value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      
      <div className="flex-grow container mx-auto px-4 py-8">
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
                {data.length > 0 ? (
                  renderTableRows()
                ) : (
                  <tr>
                    <td colSpan="10" className="px-6 py-4 text-center">
                      No data found
                    </td>
                  </tr>
                )}
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
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
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
