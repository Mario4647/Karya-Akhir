import React, { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const ProtectedRoute = ({ children, allowedRoles = ['user', 'user-raport', 'admin', 'admin-event'] }) => {
  const [session, setSession] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()

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
            .select('roles')
            .eq('id', session.user.id)
            .single()

          if (!isMounted) return
          setUserRole(profile?.roles || 'user')
        }
      } catch (error) {
        console.error('Error checking user:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    checkUser()

    return () => {
      isMounted = false
    }
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

  // Jika tidak ada session, redirect ke login
  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  // Jika role tidak diizinkan
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/concerts" replace />
  }

  return children
}

export default ProtectedRoute
