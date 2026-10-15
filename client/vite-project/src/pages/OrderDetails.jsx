import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { axiosInstance } from '../axiosCalls/axios';
import Navbar from '../components/Navbar';

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const { data } = await axiosInstance.get(`/orders/${id}`);
        if (data.success) {
          setOrder(data.order);
        }
      } catch (err) {
        console.error('Failed to fetch order details:', err);
        setError(err.response?.data?.message || 'Failed to load order details.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="text-slate-600 font-medium text-sm animate-pulse">Loading order details...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 font-sans px-4">
        <div className="bg-rose-50 text-rose-600 border border-rose-200 p-4 rounded-xl text-sm mb-4 max-w-md text-center">
          {error || 'Order not found.'}
        </div>
        <button
          onClick={() => navigate('/orders')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
        >
          View All Orders
        </button>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
      case 'PLACED':
        return <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-600 rounded-full border border-emerald-200">Success / Placed</span>;
      case 'PENDING':
      case 'PENDING_PAYMENT':
        return <span className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-600 rounded-full border border-amber-200">Pending Payment</span>;
      case 'FAILED':
        return <span className="px-2.5 py-1 text-xs font-bold bg-rose-50 text-rose-600 rounded-full border border-rose-200">Failed</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold bg-slate-100 text-slate-600 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans py-8 px-4 sm:px-6 lg:px-8">
      <Navbar />
      <div className="max-w-4xl mx-auto mt-10">
        {/* Navigation Header */}
        <div className="flex justify-between items-center mb-6">
          <Link
            to="/orders"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition flex items-center gap-1"
          >
            ← Back to Orders
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Order Status:</span>
            {getStatusBadge(order.status || order.paymentStatus)}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          {/* Order Meta Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-2">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Order Details</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Order ID: <span className="font-mono text-slate-700">{order._id}</span>
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-slate-500">Placed on</p>
              <p className="text-xs font-semibold text-slate-800">
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* Shipping & Payment Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Shipping Address</h3>
              <p className="text-sm font-semibold text-slate-800">{order.shippingAddress?.fullName}</p>
              <p className="text-xs text-slate-600 mt-0.5">{order.shippingAddress?.addressLine1}</p>
              <p className="text-xs text-slate-600">
                {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
              </p>
              <p className="text-xs text-slate-600 mt-1">Phone: {order.shippingAddress?.phone}</p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Payment Info</h3>
              <p className="text-xs text-slate-600">
                Payment Status:{' '}
                <span className="font-semibold text-slate-800">{order.paymentStatus}</span>
              </p>
              {order.razorpayPaymentId && (
                <p className="text-xs text-slate-600 mt-0.5 truncate">
                  Razorpay Payment ID: <span className="font-mono text-slate-800">{order.razorpayPaymentId}</span>
                </p>
              )}
              {order.razorpayOrderId && (
                <p className="text-xs text-slate-600 mt-0.5 truncate">
                  Razorpay Order ID: <span className="font-mono text-slate-800">{order.razorpayOrderId}</span>
                </p>
              )}
            </div>
          </div>

          {/* Ordered Items List */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">Items Ordered</h3>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
              {order.items?.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 sm:p-4 bg-white text-xs sm:text-sm">
                  <div className="flex items-center gap-3">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">Qty: {item.quantity} × ₹{item.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total Summary */}
          <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-900">Total Amount Paid</span>
            <span className="text-lg font-extrabold text-emerald-600">₹{order.totalAmount?.toFixed(2)}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Link
              to="/products"
              className="flex-1 py-2.5 text-center bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}