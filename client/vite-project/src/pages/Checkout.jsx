import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../axiosCalls/axios';
import { useCart } from '../context/cartContext';

// Helper utility to dynamically load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Checkout() {
  const { cart, setCart } = useCart();
  const navigate = useNavigate();

  // Form Fields State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Validation Errors & Loading States
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Validate Form Inputs
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    }

    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone.trim())) {
      newErrors.phone = 'Enter a valid phone number (10-15 digits)';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    const pincodeRegex = /^\d{6}$/;
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!pincodeRegex.test(formData.pincode.trim())) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Order Submission & Razorpay Integration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!validateForm()) return;

    if (!cart || cart.length === 0) {
      setFormError('Your cart is empty.');
      return;
    }

    setLoading(true);

    try {
      // 1. Load Razorpay Script
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        setFormError('Razorpay SDK failed to load. Check your internet connection.');
        setLoading(false);
        return;
      }

      // 2. Request backend to create shopkart order & razorpay order
      const { data } = await axiosInstance.post('/orders/create-payment-order', {
        shippingAddress: {
          fullName: formData.fullName,
          phone: formData.phone,
          addressLine1: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
      });

      const { shopCartOrderId, razorpayOrderId, amount, currency, key } = data;

      // 3. Configure Razorpay Checkout Options
      const options = {
        key: key,
        amount: amount,
        currency: currency,
        name: 'ShopCart',
        description: 'Complete your purchase',
        order_id: razorpayOrderId,
        handler: async function (response) {
          try {
            // 4. Verify payment signature on backend after successful test payment
            const verifyRes = await axiosInstance.post('/orders/verify-payment', {
              shopCartOrderId: shopCartOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              // Clear global cart state after backend confirmation
              setCart([]);
              navigate(`/orders/${verifyRes.data.orderId}`);
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            setFormError(err.response?.data?.message || 'Payment verification failed.');
          }
        },
        prefill: {
          name: formData.fullName,
          contact: formData.phone,
        },
        theme: {
          color: '#2563eb',
        },
      };

      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on('payment.failed', function (response) {
        setFormError(`Payment failed: ${response.error.description || 'Please try again.'}`);
      });

      paymentObject.open();
    } catch (err) {
      console.error('Checkout error:', err);
      setFormError(
        err.response?.data?.message || 'Failed to initialize payment. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const cartItems = cart || [];
  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.product?.price || 0;
    return acc + price * item.quantity;
  }, 0);

  return (
    <div className="h-screen flex flex-col overflow-hidden font-sans bg-slate-50">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 flex flex-col min-h-0">
        <h1 className="text-2xl font-bold text-slate-900 mb-4 text-center">
          Checkout
        </h1>

        {formError && (
          <div className="mb-3 p-3 bg-rose-50 text-rose-600 rounded-lg border border-rose-200 text-sm">
            {formError}
          </div>
        )}

        {/* Two-Column Fixed Viewport Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 pb-4">
          
          {/* Left Column: Shipping Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col min-h-0">
            <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-100 mb-4">
              Shipping Details
            </h2>

            <form onSubmit={handleSubmit} noValidate className="flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-3 overflow-y-auto pr-1">
                {/* Full Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Full name"
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 transition text-slate-800 bg-white ${
                        errors.fullName ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                      }`}
                    />
                    {errors.fullName && <p className="mt-0.5 text-[10px] text-rose-600 font-medium">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Phone number"
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 transition text-slate-800 bg-white ${
                        errors.phone ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                      }`}
                    />
                    {errors.phone && <p className="mt-0.5 text-[10px] text-rose-600 font-medium">{errors.phone}</p>}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Street address, apartment, etc."
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 transition text-slate-800 bg-white ${
                      errors.address ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                    }`}
                  />
                  {errors.address && <p className="mt-0.5 text-[10px] text-rose-600 font-medium">{errors.address}</p>}
                </div>

                {/* City, State, Pincode */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="City"
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 transition text-slate-800 bg-white ${
                        errors.city ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                      }`}
                    />
                    {errors.city && <p className="mt-0.5 text-[10px] text-rose-600 font-medium">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="State"
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 transition text-slate-800 bg-white ${
                        errors.state ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                      }`}
                    />
                    {errors.state && <p className="mt-0.5 text-[10px] text-rose-600 font-medium">{errors.state}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      maxLength={6}
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="6 digits"
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 transition text-slate-800 bg-white ${
                        errors.pincode ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                      }`}
                    />
                    {errors.pincode && <p className="mt-0.5 text-[10px] text-rose-600 font-medium">{errors.pincode}</p>}
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary & Action */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between min-h-0">
            <div>
              <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-100 mb-3">
                Order Summary
              </h2>

              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {cartItems.length === 0 ? (
                  <p className="text-slate-500 text-xs py-2">Your cart is empty.</p>
                ) : (
                  cartItems.map((item) => {
                    const product = item.product;
                    if (!product) return null;
                    const itemTotal = product.price * item.quantity;

                    return (
                      <div key={product._id} className="flex justify-between items-center text-xs text-slate-600">
                        <span className="truncate pr-2">
                          {product.name} × {item.quantity}
                        </span>
                        <span className="font-semibold text-slate-800 shrink-0">₹{itemTotal.toFixed(2)}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 mt-2 space-y-3">
              <div className="flex justify-between text-sm font-extrabold text-slate-900">
                <span>Total</span>
                <span className="text-emerald-600">₹{subtotal.toFixed(2)}</span>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || cartItems.length === 0}
                className="w-full py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-md transition text-sm disabled:bg-slate-300 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {loading ? 'Initializing Payment...' : 'Proceed to Pay'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}