import { createContext, useContext, useState, useEffect } from 'react';
import { axiosInstance } from '../axiosCalls/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axiosInstance.get('/customers/me').then((response) => {
            setCustomer(response.data.customerData);
        }).catch((err) => {
            setCustomer(null);
        }).finally(() => {
            setLoading(false);
        })

    }, []);

    return (
        <AuthContext.Provider value={{ customer, setCustomer, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)