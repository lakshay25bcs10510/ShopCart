import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../axiosCalls/axios';
import Navbar from '../components/Navbar';
import { useCart } from '../context/cartContext'; // Adjust path if needed

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State for Product Details
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Per-item loading and error states for removal operations
  const [removingMap, setRemovingMap] = useState({});
  const [actionError, setActionError] = useState('');

  // Cart Context & Cart Loading State
  const { cart, setCart } = useCart();
  const [cartLoadingMap, setCartLoadingMap] = useState({});

  // 1. Fetch Wishlist on Mount
  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/wishlist');
      // Filters out potential null entries if a product was deleted from DB
      const items = (response.data.wishlist || []).filter(Boolean);
      setWishlist(items);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      setError('Failed to load your wishlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Detailed Product Info for Modal
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

  // 3. Remove Item from Wishlist
  const handleRemoveFromWishlist = async (e, productId) => {
    if (e) e.stopPropagation(); // Stop opening the detail modal when clicking remove

    if (removingMap[productId]) return;

    setRemovingMap((prev) => ({ ...prev, [productId]: true }));
    setActionError('');

    try {
      await axiosInstance.delete(`/wishlist/${productId}`);

      // Optimistically update the UI list
      setWishlist((prevWishlist) =>
        prevWishlist.filter((item) => item._id !== productId)
      );

      // Close modal if the currently open product was removed
      if (selectedProductId === productId) {
        closeModal();
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      setActionError(
        err.response?.data?.message || 'Unable to remove item. Please try again.'
      );
    } finally {
      setRemovingMap((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // 4. Add to Cart Handler
  const handleAddToCart = async (productId) => {
    if (cartLoadingMap[productId]) return;

    setCartLoadingMap((prev) => ({ ...prev, [productId]: true }));
    try {
      await axiosInstance.post(`/cart/${productId}`);
      
      // Refresh the cart state from the backend
      const cartRes = await axiosInstance.get('/cart');
      setCart(cartRes.data.cart);
    } catch (err) {
      console.error('Error adding to cart:', err);
      setActionError(err.response?.data?.message || 'Failed to add product to cart.');
    } finally {
      setCartLoadingMap((prev) => ({ ...prev, [productId]: false }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      <Navbar />
      <h1 className="text-3xl font-bold text-slate-900 mb-6 mt-5 flex justify-center">
        My Wishlist
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

      {/* Main Loading State */}
      {loading && (
        <div className="text-center py-16 text-slate-500 text-lg">
          Loading your saved items...
        </div>
      )}

      {/* Main Error State */}
      {error && (
        <div className="text-center p-4 bg-red-50 text-red-600 rounded-lg mb-6 border border-red-200">
          {error}
        </div>
      )}

      {/* Wishlist Grid */}
      {!loading && !error && (
        <>
          {wishlist.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-500 text-lg mb-4">Your wishlist is currently empty.</p>
              <p className="text-slate-400 text-sm">
                Explore products and click the heart icon to save items for later!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {wishlist.map((product) => {
                const isRemoving = !!removingMap[product._id];

                return (
                  <div
                    key={product._id}
                    onClick={() => setSelectedProductId(product._id)}
                    className="relative bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition duration-200 flex flex-col cursor-pointer group"
                  >
                    {/* Top-Right Remove Action Button */}
                    <button
                      onClick={(e) => handleRemoveFromWishlist(e, product._id)}
                      disabled={isRemoving}
                      title="Remove from Wishlist"
                      className="absolute top-3 right-3 z-10 p-2.5 bg-white/90 backdrop-blur-sm text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full shadow-md transition-all duration-200 flex items-center justify-center hover:scale-110"
                    >
                      {isRemoving ? (
                        <span className="text-xs font-semibold px-1">⏳</span>
                      ) : (
                        <svg
                          className="w-5 h-5 stroke-current"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      )}
                    </button>

                    {/* Image Section */}
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-48 bg-slate-100 flex items-center justify-center text-slate-400 text-sm">
                        No image available
                      </div>
                    )}

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {product.category && (
                          <span className="inline-block text-xs font-semibold tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md uppercase mb-2">
                            {product.category}
                          </span>
                        )}
                        <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition">
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="text-slate-500 text-sm line-clamp-2 mb-4">
                            {product.description}
                          </p>
                        )}
                      </div>
                      <div className="text-xl font-extrabold text-emerald-600 pt-2 border-t border-slate-100">
                        ${product.price}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Product Details Modal */}
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

            {/* Modal Loading */}
            {modalLoading && (
              <div className="py-24 text-center text-slate-500 text-lg font-medium">
                Fetching product details...
              </div>
            )}

            {/* Modal Error */}
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

            {/* Modal Content */}
            {!modalLoading && !modalError && selectedProduct && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Product Image Section */}
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

                {/* Product Information Section */}
                <div className="flex flex-col h-full justify-between space-y-6">
                  <div>
                    {/* Category & Stock Badges */}
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

                    {/* Description */}
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

                  {/* Actions Bar (Dynamic Add to Cart + Remove from Wishlist) */}
                  <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                    {(() => {
                      const cartItem = cart?.find(
                        (item) => (item.product?._id || item.product) === selectedProduct._id
                      );
                      const isInCart = !!cartItem;
                      const isCartLoading = !!cartLoadingMap[selectedProduct._id];

                      return (
                        <button
                          onClick={() => handleAddToCart(selectedProduct._id)}
                          disabled={selectedProduct.stock === 0 || isCartLoading}
                          className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-white shadow-md transition ${
                            selectedProduct.stock === 0
                              ? 'bg-slate-300 cursor-not-allowed shadow-none'
                              : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
                          }`}
                        >
                          {selectedProduct.stock === 0
                            ? 'Out of Stock'
                            : isCartLoading
                            ? '⏳ Adding...'
                            : isInCart
                            ? `Add another (${cartItem.quantity} in cart)`
                            : 'Add to Cart'}
                        </button>
                      );
                    })()}

                    {/* Modal Remove Wishlist Button */}
                    <button
                      onClick={(e) => handleRemoveFromWishlist(e, selectedProduct._id)}
                      disabled={removingMap[selectedProduct._id]}
                      className="px-6 py-3.5 border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-semibold transition flex items-center justify-center gap-2"
                    >
                      {removingMap[selectedProduct._id] ? (
                        '⏳ Removing...'
                      ) : (
                        <>
                          <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remove Item
                        </>
                      )}
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