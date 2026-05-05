import React, { useState, useEffect } from 'react'
import { Navigate, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import AccountLockPopup from './locks/AccountLockPopup'

const ProtectedRoute = ({ children, allowedRoles = ['user', 'user-raport', 'admin', 'admin-event'] }) => {
  const [session,    setSession]    = useState(null)
  const [userRole,   setUserRole]   = useState(null)
  const [userId,     setUserId]     = useState(null)
  const [lockStatus, setLockStatus] = useState(null) // null | 'needs_lock' | 'locked'
  const [loading,    setLoading]    = useState(true)

  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!isMounted) return
        setSession(session)

        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('roles, account_locked') // ← tambah account_locked
            .eq('id', session.user.id)
            .single()

          if (!isMounted) return

          const role = profile?.roles || 'user'
          setUserRole(role)
          setUserId(session.user.id)

          // Cek lock hanya untuk role user-raport
          if (role === 'user-raport') {
            setLockStatus(profile?.account_locked ? 'locked' : 'needs_lock')
          }
        }
      } catch (error) {
        console.error('Error checking user:', error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    checkUser()
    return () => { isMounted = false }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Memeriksa akses...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/concerts" replace />
  }

  // Akun sudah dikunci → paksa ke halaman terkunci
  if (lockStatus === 'locked') {
    return <Navigate to="/akun-terkunci" replace />
  }

  // Akun user-raport belum dikunci → wajib tampilkan popup dulu
  if (lockStatus === 'needs_lock') {
    return (
      <AccountLockPopup
        userId={userId}
        onLocked={() => navigate('/akun-terkunci', { replace: true })}
      />
    )
  }

  return children
}

export default ProtectedRoute
