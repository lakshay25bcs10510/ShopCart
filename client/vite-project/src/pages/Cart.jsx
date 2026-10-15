import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { axiosInstance } from '../axiosCalls/axios';
import Navbar from '../components/Navbar';
import { useCart } from '../context/cartContext';

export default function Cart() {
  const { cart, setCart, loading: cartContextLoading } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState('');
  
  // Per-item loading map for quantity updates or removals
  const [itemLoadingMap, setItemLoadingMap] = useState({});

  // Modal State for Product Details (matching products/wishlist)
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Fetch product details for modal
  useEffect(() => {
    if (!selectedProductId) return;

    const fetchProductById = async () => {
      setModalLoading(true);
      setModalError(null);
      try {
        const response = await axiosInstance.get(`/products/${selectedProductId}`);
        setSelectedProduct(response.data.product);
      } catch (err) {
        console.error('Error fetching product details:', err);
        setModalError(
          err.response?.data?.message || 'Failed to load product details.'
        );
      } finally {
        setModalLoading(false);
      }
    };

    fetchProductById();
  }, [selectedProductId]);

  const closeModal = () => {
    setSelectedProductId(null);
    setSelectedProduct(null);
    setModalError(null);
  };

  // Update item quantity handler
  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (itemLoadingMap[productId]) return;

    setActionError('');
    setItemLoadingMap((prev) => ({ ...prev, [productId]: true }));

    try {
      if (newQuantity <= 0) {
        // If quantity drops below 1, remove the item completely
        await axiosInstance.delete(`/cart/${productId}`);
      } else {
        await axiosInstance.patch(`/cart/${productId}`, { quantity: newQuantity });
      }

      // Refresh cart context
      const cartRes = await axiosInstance.get('/cart');
      setCart(cartRes.data.cart);
    } catch (err) {
      console.error('Error updating cart quantity:', err);
      setActionError(
        err.response?.data?.message || 'Unable to update cart quantity.'
      );
    } finally {
      setItemLoadingMap((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // Explicit remove item handler
  const handleRemoveItem = async (productId) => {
    if (itemLoadingMap[productId]) return;

    setActionError('');
    setItemLoadingMap((prev) => ({ ...prev, [productId]: true }));

    try {
      await axiosInstance.delete(`/cart/${productId}`);
      const cartRes = await axiosInstance.get('/cart');
      setCart(cartRes.data.cart);
    } catch (err) {
      console.error('Error removing item from cart:', err);
      setActionError(
        err.response?.data?.message || 'Unable to remove item from cart.'
      );
    } finally {
      setItemLoadingMap((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // Calculate totals for Order Summary
  const cartItems = cart || [];
  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.product?.price || 0;
    return acc + price * item.quantity;
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      <Navbar />
      <h1 className="text-3xl font-bold text-slate-900 mb-6 mt-5 flex justify-center">
        Shopping Cart
      </h1>

      {/* Global Action Error Alert */}
      {actionError && (
        <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-lg border border-rose-200 flex justify-between items-center">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError('')}
            className="text-xs font-bold uppercase tracking-wider text-rose-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading State */}
      {cartContextLoading && (
        <div className="text-center py-16 text-slate-500 text-lg">
          Loading your cart...
        </div>
      )}

      {/* Main Cart Content */}
      {!cartContextLoading && (
        <>
          {cartItems.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-500 text-lg mb-4">Your cart is currently empty.</p>
              <p className="text-slate-400 text-sm">
                Explore products and add items to your cart to begin shopping!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Cart Items List */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => {
                  const product = item.product;
                  if (!product) return null; // Fallback if product was deleted

                  const productId = product._id;
                  const isUpdating = !!itemLoadingMap[productId];
                  const currentStock = product.stock ?? 99; // Fallback if stock is undefined

                  return (
                    <div
                      key={productId}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-center justify-between transition hover:shadow-md"
                    >
                      {/* Product Image & Info */}
                      <div 
                        className="flex items-center gap-4 cursor-pointer flex-1 w-full sm:w-auto"
                        onClick={() => setSelectedProductId(productId)}
                      >
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-20 h-20 object-cover rounded-lg border border-slate-100 shrink-0"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs shrink-0">
                            No image
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          {product.category && (
                            <span className="inline-block text-[10px] font-semibold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase mb-1">
                              {product.category}
                            </span>
                          )}
                          <h3 className="text-base font-bold text-slate-900 truncate hover:text-blue-600 transition">
                            {product.name}
                          </h3>
                          <p className="text-emerald-600 font-extrabold mt-1">
                            ${product.price}
                          </p>
                        </div>
                      </div>

                      {/* Quantity Controller & Remove Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                        {/* - Quantity + Controller */}
                        <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50 shadow-sm">
                          <button
                            onClick={() => handleUpdateQuantity(productId, item.quantity - 1)}
                            disabled={isUpdating}
                            title={item.quantity === 1 ? "Remove item" : "Decrease quantity"}
                            className="px-3 py-2 text-slate-600 hover:bg-slate-200 font-bold transition disabled:opacity-50"
                          >
                            -
                          </button>
                          <span className="px-4 py-2 text-sm font-semibold text-slate-800 bg-white min-w-10 text-center">
                            {isUpdating ? '...' : item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(productId, item.quantity + 1)}
                            disabled={isUpdating || item.quantity >= currentStock}
                            title={item.quantity >= currentStock ? "Reached maximum available stock" : "Increase quantity"}
                            className="px-3 py-2 text-slate-600 hover:bg-slate-200 font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>

                        {/* Remove Item Button */}
                        <button
                          onClick={() => handleRemoveItem(productId)}
                          disabled={isUpdating}
                          className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition"
                          title="Remove from cart"
                        >
                          <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Summary Box */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-8 space-y-6">
                <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4">
                  Order Summary
                </h2>

                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Total Items</span>
                    <span className="font-semibold text-slate-900">{totalItemsCount} units</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-slate-900 pt-3 border-t border-slate-100">
                    <span>Subtotal</span>
                    <span className="text-emerald-600">${subtotal.toFixed(2)}</span>
                  </div>
                </div>

                <Link to="/checkout"
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-md transition"
                >
                  Proceed to Checkout
                </Link>
              </div>
            </div>
          )}
        </>
      )}

      {/* Product Details Modal (Consistent with Products & Wishlist) */}
      {selectedProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-6">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 relative p-6 sm:p-10">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-5 right-5 z-10 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full p-2.5 transition"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {modalLoading && (
              <div className="py-24 text-center text-slate-500 text-lg font-medium">
                Fetching product details...
              </div>
            )}

            {modalError && (
              <div className="py-12 text-center">
                <div className="text-red-500 text-lg font-semibold mb-4">{modalError}</div>
                <button
                  onClick={closeModal}
                  className="px-6 py-2.5 bg-slate-800 text-white rounded-lg font-medium"
                >
                  Close
                </button>
              </div>
            )}

            {!modalLoading && !modalError && selectedProduct && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="w-full relative">
                  {selectedProduct.image ? (
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-full h-80 sm:h-96 object-cover rounded-2xl shadow-md border border-slate-100"
                    />
                  ) : (
                    <div className="w-full h-80 sm:h-96 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-medium">
                      No Image Available
                    </div>
                  )}
                </div>

                <div className="flex flex-col h-full justify-between space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      {selectedProduct.category && (
                        <span className="text-xs font-bold tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-md uppercase">
                          {selectedProduct.category}
                        </span>
                      )}

                      {selectedProduct.stock !== undefined && (
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-md ${
                            selectedProduct.stock > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {selectedProduct.stock > 0
                            ? `In Stock (${selectedProduct.stock} units)`
                            : 'Out of Stock'}
                        </span>
                      )}
                    </div>

                    <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
                      {selectedProduct.name}
                    </h2>

                    <p className="text-3xl font-black text-emerald-600 mb-6">
                      ${selectedProduct.price}
                    </p>

                    {selectedProduct.description && (
                      <div className="mb-6">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Description
                        </h4>
                        <p className="text-slate-600 text-base leading-relaxed">
                          {selectedProduct.description}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={closeModal}
                      className="px-6 py-3.5 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-900 transition"
                    >
                      Close Details
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}