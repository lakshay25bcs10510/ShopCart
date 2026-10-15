import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/authContext'


function PublicRoute({ children }) {

    const { customer } = useAuth()

    if (customer) {
        return <Navigate to='/' />
    }

    return children


}

export default PublicRoute