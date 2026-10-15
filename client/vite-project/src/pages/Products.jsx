import React, { useState, useEffect, useCallback } from 'react';
import { axiosInstance } from '../axiosCalls/axios';
import Navbar from '../components/Navbar';
import { useCart } from '../context/cartContext';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [wishlistMap, setWishlistMap] = useState({});
  const [wishlistLoadingMap, setWishlistLoadingMap] = useState({});
  const [wishlistError, setWishlistError] = useState('');

  // Cart Context & Local Cart Loading State
  const { cart, setCart } = useCart();
  const [cartLoadingMap, setCartLoadingMap] = useState({});

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const response = await axiosInstance.get('/wishlist');
        const wishlistArr = response.data.wishlist || [];
        const initialMap = {};
        wishlistArr.forEach((item) => {
          const id = item._id || item;
          initialMap[id] = true;
        });
        setWishlistMap(initialMap);
      } catch (err) {
        // Silently fail or handle if unauthenticated
        console.warn('Could not fetch wishlist items:', err);
      }
    };

    fetchWishlist();
  }, []);

  useEffect(() => {
    const fetchInitialCategories = async () => {
      try {
        const response = await axiosInstance.get('/products');
        const allProducts = response.data.products || [];

        const uniqueCategories = [
          'All',
          ...new Set(allProducts.map((p) => p.category).filter(Boolean)),
        ];

        setCategories(uniqueCategories);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchInitialCategories();
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search.trim()) {
        params.search = search.trim();
      }
      if (selectedCategory && selectedCategory !== 'All') {
        params.category = selectedCategory;
      }

      const response = await axiosInstance.get('/products', { params });
      setProducts(response.data.products || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchProducts]);

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

  const handleAddToWishlist = async (e, productId) => {
    if (e) e.stopPropagation(); // Prevent opening modal when clicking top-right wishlist button

    if (wishlistLoadingMap[productId] || wishlistMap[productId]) return;

    setWishlistLoadingMap((prev) => ({ ...prev, [productId]: true }));
    setWishlistError('');

    try {
      await axiosInstance.post(`/wishlist/${productId}`);
      setWishlistMap((prev) => ({ ...prev, [productId]: true }));
    } catch (err) {
      if (err.response?.status === 409) {
        // Already in wishlist
        setWishlistMap((prev) => ({ ...prev, [productId]: true }));
      } else {
        console.error('Wishlist error:', err);
        setWishlistError(
          err.response?.data?.message || 'Unable to save product. Please try again.'
        );
      }
    } finally {
      setWishlistLoadingMap((prev) => ({ ...prev, [productId]: false }));
    }
  };

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
      alert(err.response?.data?.message || 'Failed to add product to cart.');
    } finally {
      setCartLoadingMap((prev) => ({ ...prev, [productId]: false }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      <Navbar />
      <h1 className="text-3xl font-bold text-slate-900 mb-6 mt-5 flex justify-center">Products Catalog</h1>

      {/* Global Wishlist Error Alert */}
      {wishlistError && (
        <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-lg border border-rose-200 flex justify-between items-center">
          <span>{wishlistError}</span>
          <button
            onClick={() => setWishlistError('')}
            className="text-xs font-bold uppercase tracking-wider text-rose-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search products by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 placeholder-slate-400 bg-white shadow-sm transition"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 bg-white shadow-sm cursor-pointer transition"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Loading State */}
      {loading && (
        <div className="text-center py-16 text-slate-500 text-lg">
          Loading products...
        </div>
      )}

      {/* Main Error State */}
      {error && (
        <div className="text-center p-4 bg-red-50 text-red-600 rounded-lg mb-6 border border-red-200">
          {error}
        </div>
      )}

      {/* Products Grid */}
      {!loading && !error && (
        <>
          {products.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-lg">
              No products found matching your search criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => {
                const isWishlisted = !!wishlistMap[product._id];
                const isWishlistSaving = !!wishlistLoadingMap[product._id];

                return (
                  <div
                    key={product._id}
                    onClick={() => setSelectedProductId(product._id)}
                    className="relative bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition duration-200 flex flex-col cursor-pointer group"
                  >
                    {/* Top-Right Wishlist Action Button */}
                    <button
                      onClick={(e) => handleAddToWishlist(e, product._id)}
                      disabled={isWishlistSaving || isWishlisted}
                      title={isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}
                      className={`absolute top-3 right-3 z-10 p-2.5 rounded-full shadow-md transition-all duration-200 flex items-center justify-center ${
                        isWishlisted
                          ? 'bg-rose-50 text-rose-600 border border-rose-200 cursor-default'
                          : 'bg-white/90 backdrop-blur-sm text-slate-400 hover:text-rose-500 hover:bg-white hover:scale-110'
                      }`}
                    >
                      {isWishlistSaving ? (
                        <span className="text-xs font-semibold px-1">⏳</span>
                      ) : isWishlisted ? (
                        <span className="text-lg leading-none">♥</span>
                      ) : (
                        <span className="text-lg leading-none">♡</span>
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

                      {/* Dynamic Stock Status Badge */}
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

                  {/* Actions Bar (Add to Cart + Add to Wishlist) */}
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

                    {/* Modal Wishlist Button */}
                    <button
                      onClick={(e) => handleAddToWishlist(e, selectedProduct._id)}
                      disabled={
                        wishlistLoadingMap[selectedProduct._id] ||
                        wishlistMap[selectedProduct._id]
                      }
                      className={`px-6 py-3.5 border rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                        wishlistMap[selectedProduct._id]
                          ? 'border-rose-200 bg-rose-50 text-rose-600 cursor-default'
                          : 'border-slate-300 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                      }`}
                    >
                      {wishlistLoadingMap[selectedProduct._id] ? (
                        '⏳ Saving...'
                      ) : wishlistMap[selectedProduct._id] ? (
                        '♥ Added to Wishlist'
                      ) : (
                        '♡ Wishlist'
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