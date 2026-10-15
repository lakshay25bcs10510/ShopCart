import React from 'react'
import { useAuth } from '../context/authContext'
import { Navigate } from 'react-router-dom'


function ProtectedRoute({ children }) {


    const { customer, loading } = useAuth()

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500 font-medium">Checking authentication...</p>
            </div>
        );
    }


    if (!customer) {
        return <Navigate to='/login' />
    }



    return children
}

export default ProtectedRoute