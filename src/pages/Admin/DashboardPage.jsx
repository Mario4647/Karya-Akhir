import React, { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import NavbarEvent from '../../components/NavbarEvent'
import {
  BiCheckCircle,
  BiXCircle,
  BiPurchaseTag, // Ganti BiTicket
  BiMoney,
  BiCalendar,
  BiTrendingUp,
  BiPackage,
  BiUser,
  BiDoughnutChart
} from 'react-icons/bi'

const DashboardPage = () => {
  const [stats, setStats] = useState({
    successOrders: 0,
    cancelledOrders: 0,
    ticketsSold: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState([])
  const [recentOrders, setRecentOrders] = useState([])

  useEffect(() => {
    fetchStats()
    fetchChartData()
    fetchRecentOrders()
  }, [])

  const fetchStats = async () => {
    try {
      // Get success orders count and revenue
      const { data: successOrders, error: successError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'paid')

      const { data: cancelledOrders, error: cancelledError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'cancelled')

      const { data: revenue, error: revenueError } = await supabase
        .from('orders')
        .select('total_amount, quantity')
        .eq('status', 'paid')

      if (!revenueError && revenue) {
        const totalRevenue = revenue.reduce((sum, order) => sum + order.total_amount, 0)
        const ticketsSold = revenue.reduce((sum, order) => sum + order.quantity, 0)

        setStats({
          successOrders: successOrders?.length || 0,
          cancelledOrders: cancelledOrders?.length || 0,
          ticketsSold: ticketsSold,
          totalRevenue: totalRevenue
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchChartData = async () => {
    // Get last 7 days data
    const labels = []
    const successData = []
    const revenueData = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)
      const nextDateStr = nextDate.toISOString()

      labels.push(dateStr)

      // Get orders for this date
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, quantity')
        .eq('status', 'paid')
        .gte('created_at', dateStr)
        .lt('created_at', nextDateStr)

      if (orders) {
        const dayRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0)
        const dayTickets = orders.reduce((sum, order) => sum + order.quantity, 0)
        successData.push(dayTickets)
        revenueData.push(dayRevenue)
      } else {
        successData.push(0)
        revenueData.push(0)
      }
    }

    setChartData({
      labels,
      successData,
      revenueData
    })
  }

  const fetchRecentOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        products:product_id (name)
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    if (!error && data) {
      setRecentOrders(data)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color, bgColor }) => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">
            {title.includes('Uang') ? `Rp ${value.toLocaleString()}` : value.toLocaleString()}
          </p>
        </div>
        <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
          <Icon className={`text-2xl ${color}`} />
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <NavbarEvent userRole="admin" />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <NavbarEvent userRole="admin" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Admin</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Pesanan Sukses"
            value={stats.successOrders}
            icon={BiCheckCircle}
            color="text-green-500"
            bgColor="bg-green-100"
          />
          <StatCard
            title="Pesanan Batal"
            value={stats.cancelledOrders}
            icon={BiXCircle}
            color="text-red-500"
            bgColor="bg-red-100"
          />
          <StatCard
            title="Jumlah Tiket Terjual"
            value={stats.ticketsSold}
            icon={BiPurchaseTag} // Ganti BiTicket
            color="text-blue-500"
            bgColor="bg-blue-100"
          />
          <StatCard
            title="Total Uang Terkumpul"
            value={stats.totalRevenue}
            icon={BiMoney}
            color="text-purple-500"
            bgColor="bg-purple-100"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <BiTrendingUp className="text-blue-500" />
              <span>Tiket Terjual (7 Hari Terakhir)</span>
            </h2>
            <div className="h-64 flex items-end justify-around">
              {chartData.labels?.map((label, index) => (
                <div key={index} className="flex flex-col items-center w-1/7">
                  <div className="w-full px-1">
                    <div 
                      className="bg-blue-500 rounded-t-lg transition-all duration-300 hover:bg-blue-600"
                      style={{ 
                        height: `${Math.max(4, (chartData.successData[index] / Math.max(...chartData.successData)) * 150)}px`,
                        minHeight: '4px'
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 mt-2">
                    {new Date(label).toLocaleDateString('id-ID', { weekday: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <BiMoney className="text-green-500" />
              <span>Pendapatan (7 Hari Terakhir)</span>
            </h2>
            <div className="h-64 flex items-end justify-around">
              {chartData.labels?.map((label, index) => (
                <div key={index} className="flex flex-col items-center w-1/7">
                  <div className="w-full px-1">
                    <div 
                      className="bg-green-500 rounded-t-lg transition-all duration-300 hover:bg-green-600"
                      style={{ 
                        height: `${Math.max(4, (chartData.revenueData[index] / Math.max(...chartData.revenueData)) * 150)}px`,
                        minHeight: '4px'
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 mt-2">
                    {new Date(label).toLocaleDateString('id-ID', { weekday: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <BiPackage className="text-purple-500" />
            <span>Pesanan Terbaru</span>
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">No. Pesanan</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Produk</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Nama</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-800">{order.order_number}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">{order.products?.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">{order.customer_name}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">Rp {order.total_amount.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'paid' ? 'bg-green-100 text-green-700' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status === 'paid' ? 'Sukses' :
                         order.status === 'pending' ? 'Menunggu' :
                         order.status === 'cancelled' ? 'Batal' : 'Kadaluarsa'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-800">
                      {new Date(order.created_at).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
