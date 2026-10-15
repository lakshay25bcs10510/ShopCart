import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { axiosInstance } from '../axiosCalls/axios';
import { useAuth } from '../context/authContext';


function Login() {
    const navigate = useNavigate();
    const [message, setMessage] = useState('')
    const [showPopup, setShowPopup] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [loader, setLoader] = useState(false);
    const {setCustomer} = useAuth();
    const [user, setUser] = useState(null);

    const [form, setForm] = useState({
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }



    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoader(true)
        try {
            const response = await axiosInstance.post('/customers/login', form)

            setMessage(response.data.message)
            setUser(response.data.customerData);
            setShowPopup(true);
            setIsSuccess(true);

        } catch (error) {
            setMessage(
                error.response?.data?.message || 'Login failed'
            )
            setShowPopup(true);
            setIsSuccess(false);
        } finally {
            setLoader(false)
        }
    }

    const closePopup = () => {
        setShowPopup(false)

        if (isSuccess) {
            setCustomer(user);
            navigate('/')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

                {/* Heading */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Log In
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Join us and start shopping today
                    </p>
                </div>

                {/* Registration Form */}
                <form className="space-y-5">

                    {/* Email */}
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Email Address
                        </label>

                        <input
                            type="email"
                            id="email"
                            name="email"
                            onChange={handleChange}
                            placeholder="Enter your email"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg
                         outline-none focus:ring-2 focus:ring-blue-500
                         focus:border-blue-500 transition"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Password
                        </label>

                        <input
                            type="password"
                            id="password"
                            name="password"
                            onChange={handleChange}
                            placeholder="Create a password"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg
                         outline-none focus:ring-2 focus:ring-blue-500
                         focus:border-blue-500 transition"
                        />
                    </div>

                    {/* Register Button */}
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg
                       font-semibold hover:bg-blue-700
                       transition duration-200"
                    >
                        Log In
                    </button>

                </form>

                {/* Login Link */}
                <p className="text-center text-sm text-gray-600 mt-6">
                    Don't have an account?{' '}
                    <Link
                        to="/register"
                        className="text-blue-600 font-semibold hover:underline"
                    >
                        Create Account
                    </Link>
                </p>

                {showPopup && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                        <div className="bg-white rounded-xl shadow-lg p-6 w-80 text-center">

                            <h2 className="text-xl font-semibold mb-3">
                                Log In
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

            </div>
        </div>
    )
}

export default Login