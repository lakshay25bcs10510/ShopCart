import { createContext, useContext, useState, useEffect } from 'react';
import { axiosInstance } from '../axiosCalls/axios';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axiosInstance.get('/cart').then((response) => {
            setCart(response.data.cart);
        }).catch((err) => {
            setCart(null);
        }).finally(() => {
            setLoading(false);
        })

    }, []);

    return (
        <CartContext.Provider value={{ cart, setCart, loading }}>
            {children}
        </CartContext.Provider>
    )
}

export const useCart = () => useContext(CartContext)