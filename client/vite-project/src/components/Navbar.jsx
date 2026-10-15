import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { axiosInstance } from '../axiosCalls/axios';
import { useAuth } from '../context/authContext';
import { useCart } from '../context/cartContext'; // Import useCart

function Navbar() {

    const navigate = useNavigate();
    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState('');
    const { setCustomer } = useAuth();
    
    // Get cart items from useCart context
    const { cart } = useCart();
    const totalCartItems = cart ? cart.reduce((acc, item) => acc + item.quantity, 0) : 0;

    const handleLogout = async () => {
        try {
            const response = await axiosInstance.get('/customers/logout')
            setMessage(response.data.message)
            setCustomer(null);
            setShowPopup(true);

        } catch (error) {
            setMessage(error.response?.data?.message || 'Logout failed')
        }
    }

    const closePopup = () => {
        setShowPopup(false)
        navigate('/login');
    }

    return (
        <nav name="navbar-component" className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Logo */}
                    <div className="shrink-0">
                        <Link to="/" className="text-2xl font-bold text-gray-900 tracking-tight">
                            Shop<span className="text-blue-600">Cart</span>
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex space-x-8 items-center">
                        <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                            Home
                        </Link>
                        <Link to="/products" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                            Products
                        </Link>
                        <Link to="/wishlist" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                            Wishlist
                        </Link>
                        <Link to="/cart" className="text-gray-600 hover:text-blue-600 font-medium transition-colors flex items-center gap-1.5">
                            <span>Cart</span>
                            {totalCartItems > 0 && (
                                <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {totalCartItems}
                                </span>
                            )}
                        </Link>
                        <Link to="/orders" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                            My Orders
                        </Link>
                    </div>

                    {/* Logout Button */}
                    <div>
                        <button onClick={handleLogout} className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 shadow-sm">
                            Logout
                        </button>
                    </div>

                </div>
            </div>
            {showPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-80 text-center">

                        <h2 className="text-xl font-semibold mb-3">
                            Log Out
                        </h2>

                        <p className="text-gray-600 mb-5">
                            {message}
                        </p>

                        <button
                            onClick={closePopup}
                            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
                        >
                            OK
                        </button>

                    </div>
                </div>
            )}
        </nav>

    );
}

export default Navbar;