import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI } from '../api.js';
import { ROUTES, PRODUCT_CATEGORIES } from '../constants.js';
import './RentalShop.css';
import ProductDetailModal from '../components/ProductDetailModal.jsx';

const RentalShop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    colors: [],
    priceRange: ''
  });
  const [productPrices, setProductPrices] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      fetchAllPrices();
    }
    // eslint-disable-next-line
  }, [products]);

  const fetchAllPrices = async () => {
    const pricesMap = {};
    await Promise.all(products.map(async (product) => {
      try {
        const res = await productsAPI.getPrices(product.product_id);
        if (res.isSuccess) {
          pricesMap[product.product_id] = res.data;
        } else {
          pricesMap[product.product_id] = [];
        }
      } catch {
        pricesMap[product.product_id] = [];
      }
    }));
    setProductPrices(pricesMap);
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      if (response.isSuccess) {
        setProducts(response.data);
      } else {
        setError('Failed to fetch products');
      }
    } catch (error) {
      setError('An error occurred while fetching products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    // TODO: Implement cart functionality
    console.log('Adding to cart:', product);
  };

  const handleAddToWishlist = (product) => {
    // TODO: Implement wishlist functionality
    console.log('Adding to wishlist:', product);
  };

  const handleQuantityChange = (productId, change) => {
    // TODO: Implement quantity change functionality
    console.log('Quantity change:', productId, change);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') {
      const aPrices = productPrices[a.product_id] || [];
      const bPrices = productPrices[b.product_id] || [];
      const aMinPrice = aPrices.length > 0 ? Math.min(...aPrices.map(p => p.price)) : 0;
      const bMinPrice = bPrices.length > 0 ? Math.min(...bPrices.map(p => p.price)) : 0;
      return aMinPrice - bMinPrice;
    }
    if (sortBy === 'price-high') {
      const aPrices = productPrices[a.product_id] || [];
      const bPrices = productPrices[b.product_id] || [];
      const aMinPrice = aPrices.length > 0 ? Math.min(...aPrices.map(p => p.price)) : 0;
      const bMinPrice = bPrices.length > 0 ? Math.min(...bPrices.map(p => p.price)) : 0;
      return bMinPrice - aMinPrice;
    }
    if (sortBy === 'name') {
      return a.product_name.localeCompare(b.product_name);
    }
    return 0;
  });

  const productsPerPage = 8;
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + productsPerPage);

  if (loading) {
    return (
      <div className="rental-shop-container">
        <div className="loading">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rental-shop-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="rental-shop-container">
      {/* Category Navigation */}
      <div className="category-nav">
        {PRODUCT_CATEGORIES.map((category, index) => (
          <button
            key={index}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(selectedCategory === category ? '' : category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="shop-content">
        {/* Filters Sidebar */}
        <aside className="filters-sidebar">
          <h3>Product attributes</h3>
          
          <div className="filter-section">
            <h4>Colors</h4>
            <div className="filter-options">
              <label><input type="checkbox" /> Red</label>
              <label><input type="checkbox" /> Blue</label>
              <label><input type="checkbox" /> Green</label>
              <label><input type="checkbox" /> Black</label>
              <label><input type="checkbox" /> White</label>
            </div>
          </div>

          <div className="filter-section">
            <h4>Price range</h4>
            <div className="filter-options">
              <label><input type="radio" name="priceRange" /> Under ₹500</label>
              <label><input type="radio" name="priceRange" /> ₹500 - ₹1000</label>
              <label><input type="radio" name="priceRange" /> ₹1000 - ₹2000</label>
              <label><input type="radio" name="priceRange" /> Above ₹2000</label>
            </div>
          </div>
        </aside>

        {/* Main Product Area */}
        <main className="products-main">
          {/* Controls Bar */}
          <div className="controls-bar">
            <div className="search-bar">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="controls-right">
              <select 
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="">Sort by</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name</option>
              </select>

              <div className="view-toggle">
                <button
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <i className="fas fa-th"></i>
                </button>
                <button
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <i className="fas fa-list"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Products Grid/List */}
          <div className={`products-container ${viewMode}`}>
            {paginatedProducts.map((product) => {
              const prices = productPrices[product.product_id] || [];
              const minPrice = prices.length > 0 ? Math.min(...prices.map(p => p.price)) : 0;
              return (
                <div key={product.product_id} className="product-card" onClick={() => { setSelectedProductId(product.product_id); setModalOpen(true); }} style={{ cursor: 'pointer' }}>
                  <div className="product-image">
                    <i className="fas fa-box"></i>
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.product_name}</h3>
                    <p className="product-price">₹{minPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                    
                    {viewMode === 'list' && (
                      <div className="product-actions-list">
                        <div className="quantity-control">
                          <button onClick={() => handleQuantityChange(product.product_id, -1)}>-</button>
                          <span>1</span>
                          <button onClick={() => handleQuantityChange(product.product_id, 1)}>+</button>
                        </div>
                        <button 
                          className="wishlist-btn"
                          onClick={() => handleAddToWishlist(product)}
                        >
                          <i className="fas fa-heart"></i>
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => console.log('Delete product:', product.product_id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    )}
                    
                    {viewMode === 'grid' && (
                      <div className="product-actions-grid">
                        <button 
                          className="add-to-cart-btn"
                          onClick={() => handleAddToCart(product)}
                        >
                          Add to Cart
                        </button>
                        <button 
                          className="wishlist-btn"
                          onClick={() => handleAddToWishlist(product)}
                        >
                          <i className="fas fa-heart"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                &lt;
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              {totalPages > 5 && (
                <>
                  <span>...</span>
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </button>
                </>
              )}
              
              <button 
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                &gt;
              </button>
            </div>
          )}
        </main>
      </div>
      <ProductDetailModal productId={selectedProductId} open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};

export default RentalShop;
