import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { useNavigate } from 'react-router-dom'

const DDOSPage = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [attackRunning, setAttackRunning] = useState(false)
  const [attackResult, setAttackResult] = useState(null)
  const [activities, setActivities] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Form state
  const [target, setTarget] = useState('')
  const [port, setPort] = useState(80)
  const [duration, setDuration] = useState(30)
  const [attackType, setAttackType] = useState('http')
  
  // Admin state
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [userActivities, setUserActivities] = useState([])
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  
  // Ikon SVG - LANGSUNG DEFINISIKAN, BUKAN PAKE KOMENTAR
  const Icons = {
    Shield: () => (
      <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    Target: () => (
      <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.5 7.5h9m-9 3h9m-9 3h9M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    Play: () => (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
      </svg>
    ),
    Activity: () => (
      <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    Trash: () => (
      <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
    ),
    Users: () => (
      <svg className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    Logout: () => (
      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    ),
    Empty: () => (
      <svg className="h-16 w-16 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }

  // Cek user session
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        navigate('/auth')
        return
      }
      
      setUser(session.user)
      
      // Cek role dari tabel profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      const userRole = profile?.role || session.user.user_metadata?.role || 'user'
      setIsAdmin(userRole === 'admin')
      
      // Ambil aktivitas user
      fetchUserActivities(session.user.id)
      
      // Kalo admin, ambil semua users
      if (userRole === 'admin') {
        fetchAllUsers()
      }
      
      setLoading(false)
    }
    
    checkUser()
    
    // Subscribe ke perubahan realtime
    const subscription = supabase
      .channel('activities')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'user_activities',
        filter: `user_id=eq.${user?.id}`
      }, payload => {
        setActivities(prev => [payload.new, ...prev])
      })
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [navigate, user?.id])
  
  // Ambil aktivitas user
  const fetchUserActivities = async (userId) => {
    const { data, error } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (!error && data) {
      setActivities(data)
    }
  }
  
  // Ambil semua users (admin only)
  const fetchAllUsers = async () => {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && profiles) {
      setUsers(profiles)
    }
  }
  
  // Ambil aktivitas user tertentu (admin only)
  const fetchUserActivitiesById = async (userId, userEmail, userName) => {
    setSelectedUser({ id: userId, email: userEmail, name: userName })
    
    const { data, error } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setUserActivities(data)
    }
  }
  
  // Hapus aktivitas (admin only)
  const deleteActivity = async (activityId) => {
    if (!confirm('Yakin mau hapus aktivitas ini?')) return
    
    const { error } = await supabase
      .from('user_activities')
      .delete()
      .eq('id', activityId)
    
    if (!error) {
      // Refresh activities
      if (selectedUser) {
        fetchUserActivitiesById(selectedUser.id, selectedUser.email, selectedUser.name)
      } else {
        fetchUserActivities(user.id)
      }
    }
  }
  
  // Simpan aktivitas ke database
  const saveActivity = async (result) => {
    try {
      const { error } = await supabase
        .from('user_activities')
        .insert([
          {
            user_id: user.id,
            user_email: user.email,
            user_name: user.user_metadata?.full_name || user.email,
            activity_type: 'ddos_attack',
            details: `Serangan ${result.attackType.toUpperCase()} ke ${result.target}:${result.port} selama ${result.duration} detik (${result.attackCount} packets)`,
            target: result.target,
            port: result.port,
            attack_type: result.attackType,
            duration: result.duration,
            attack_count: result.attackCount,
            created_at: new Date().toISOString()
          }
        ])
      
      if (error) {
        console.error('Error saving activity:', error)
      } else {
        fetchUserActivities(user.id)
      }
    } catch (dbError) {
      console.error('Database error:', dbError)
    }
  }
  
  // Mulai serangan
  const startAttack = async (e) => {
    e.preventDefault()
    
    if (!target || !port || !duration) {
      alert('Isi semua field dulu, bos!')
      return
    }
    
    setAttackRunning(true)
    setAttackResult(null)
    
    try {
      const response = await fetch('/api/ddos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target,
          port: parseInt(port),
          duration: parseInt(duration),
          attackType
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API Error: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setAttackResult(data)
        await saveActivity(data)
      } else {
        alert('Gagal: ' + data.error)
      }
    } catch (error) {
      console.error('Attack error:', error)
      alert('Error: ' + error.message)
    } finally {
      setAttackRunning(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Icons.Shield />
              <div>
                <h1 className="text-2xl font-bold">
                  <span className="text-red-500">darkvxx</span>
                  <span className="text-gray-400"> DDoS</span>
                </h1>
                <p className="text-sm text-gray-400">Powered by valzxxVerse</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <button
                  onClick={() => setShowAdminPanel(!showAdminPanel)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
                >
                  {showAdminPanel ? 'Hide Admin' : 'Admin Panel'}
                </button>
              )}
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium">{user?.user_metadata?.full_name || user?.email}</p>
                  <p className="text-xs text-gray-400">{isAdmin ? 'Administrator' : 'User'}</p>
                </div>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Icons.Logout />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showAdminPanel ? (
          /* Admin Panel */
          <div className="space-y-8">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <Icons.Users />
                <span className="ml-2">User Management</span>
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Daftar Users */}
                <div className="lg:col-span-1 bg-gray-900 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Users List</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => fetchUserActivitiesById(u.id, u.email, u.name || u.email)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedUser?.id === u.id ? 'bg-purple-600' : 'bg-gray-800 hover:bg-gray-700'
                        }`}
                      >
                        <p className="font-medium">{u.name || 'No Name'}</p>
                        <p className="text-sm text-gray-400 truncate">{u.email}</p>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Detail User & Aktivitas */}
                <div className="lg:col-span-2">
                  {selectedUser ? (
                    <div className="space-y-4">
                      <div className="bg-gray-900 rounded-lg p-4">
                        <h3 className="font-medium mb-2">Selected User</h3>
                        <p className="text-sm text-gray-300">Name: {selectedUser.name}</p>
                        <p className="text-sm text-gray-300">Email: {selectedUser.email}</p>
                        <p className="text-sm text-gray-300">ID: {selectedUser.id}</p>
                      </div>
                      
                      <h3 className="font-medium mt-4">Activity Log</h3>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {userActivities.length > 0 ? (
                          userActivities.map((activity) => (
                            <div key={activity.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                              <div className="flex justify-between items-start mb-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  activity.activity_type === 'ddos_attack' 
                                    ? 'bg-red-600' 
                                    : 'bg-blue-600'
                                }`}>
                                  {activity.activity_type}
                                </span>
                                <button
                                  onClick={() => deleteActivity(activity.id)}
                                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                                >
                                  <Icons.Trash />
                                </button>
                              </div>
                              <p className="text-sm text-gray-300 mb-2">{activity.details}</p>
                              {activity.target && (
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                                  <p>Target: {activity.target}:{activity.port}</p>
                                  <p>Type: {activity.attack_type}</p>
                                  <p>Duration: {activity.duration}s</p>
                                  <p>Packets: {activity.attack_count || 'N/A'}</p>
                                </div>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(activity.created_at).toLocaleString('id-ID')}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-center py-8">No activities found</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-900 rounded-lg p-8 text-center text-gray-500">
                      Pilih user dari daftar untuk melihat aktivitas
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* User Panel */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Serangan */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 sticky top-24">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <Icons.Target />
                  <span className="ml-2">Launch Attack</span>
                </h2>
                
                <form onSubmit={startAttack} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Target IP / Domain
                    </label>
                    <input
                      type="text"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      placeholder="contoh: 192.168.1.1 atau example.com"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Port
                    </label>
                    <input
                      type="number"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      min="1"
                      max="65535"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Duration (detik)
                    </label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      min="5"
                      max="300"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 transition-colors"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Attack Type
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setAttackType('http')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          attackType === 'http'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-900 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        HTTP
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttackType('udp')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          attackType === 'udp'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-900 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        UDP
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttackType('slowloris')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          attackType === 'slowloris'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-900 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        SLOW
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttackType('both')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          attackType === 'both'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-900 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        ALL
                      </button>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={attackRunning}
                    className={`w-full py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors ${
                      attackRunning
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {attackRunning ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        <span>Attacking... ({duration}s)</span>
                      </>
                    ) : (
                      <>
                        <Icons.Play />
                        <span>Start Attack</span>
                      </>
                    )}
                  </button>
                </form>
                
                {attackResult && (
                  <div className="mt-4 p-4 bg-green-600 bg-opacity-20 border border-green-600 rounded-lg">
                    <p className="text-green-400 font-medium">✓ Attack Completed!</p>
                    <p className="text-sm text-gray-300 mt-1">
                      Sent {attackResult.attackCount} packets to {attackResult.target}:{attackResult.port}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Time: {attackResult.executionTime}s | Type: {attackResult.attackType}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Activity Log */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <Icons.Activity />
                  <span className="ml-2">Your Activity Log</span>
                </h2>
                
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {activities.length > 0 ? (
                    activities.map((activity) => (
                      <div key={activity.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            activity.activity_type === 'ddos_attack' 
                              ? 'bg-red-600' 
                              : 'bg-blue-600'
                          }`}>
                            {activity.activity_type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(activity.created_at).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-300 mb-3">{activity.details}</p>
                        
                        {activity.target && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs">
                            <div className="bg-gray-800 p-2 rounded">
                              <span className="text-gray-500 block">Target:</span>
                              <span className="font-mono text-green-400">{activity.target}:{activity.port}</span>
                            </div>
                            <div className="bg-gray-800 p-2 rounded">
                              <span className="text-gray-500 block">Type:</span>
                              <span className="uppercase text-yellow-400">{activity.attack_type}</span>
                            </div>
                            <div className="bg-gray-800 p-2 rounded">
                              <span className="text-gray-500 block">Duration:</span>
                              <span className="text-blue-400">{activity.duration}s</span>
                            </div>
                            <div className="bg-gray-800 p-2 rounded">
                              <span className="text-gray-500 block">Packets:</span>
                              <span className="text-purple-400">{activity.attack_count || 'N/A'}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 text-gray-500">
                      <Icons.Empty />
                      <p className="text-lg mt-4">Belum ada aktivitas serangan</p>
                      <p className="text-sm mt-2">Mulai serangan pertama Anda!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            darkvxx DDoS Tool • Created by valzxxVerse • {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  )
}

export default DDOSPage
