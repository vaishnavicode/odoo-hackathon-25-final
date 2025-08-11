import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI } from '../api.js';
import { ROUTES, PRODUCT_CATEGORIES } from '../constants.js';
import '../styles/RentalShop.css';
import ProductDetailModal from '../components/ProductDetailModal.jsx';
import { useAuth } from '../App.jsx';
import { useNavigate } from 'react-router-dom';


const RentalShop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({
    priceRange: ''
  });
  const [productPrices, setProductPrices] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);


  const { user } = useAuth();
  const navigate = useNavigate();

  // extract role
  const userRoleName = user?.user_data?.user_role?.user_role_name?.toLowerCase();


  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage, pageSize]);

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
          // Handle the new paginated response structure
          const pricesData = res.data.results || res.data;
          pricesMap[product.product_id] = pricesData;
        } else {
          pricesMap[product.product_id] = [];
        }
      } catch {
        pricesMap[product.product_id] = [];
      }
    }));
    setProductPrices(pricesMap);
  };

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll(page, pageSize);
      if (response.isSuccess) {
        setProducts(response.data.results);
        setTotalPages(response.data.total_pages);
        setTotalItems(response.data.total_items);
      } else {
        setError('Failed to fetch products');
      }
    } catch (error) {
      setError('An error occurred while fetching products');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top when page changes
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
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

    let matchesPriceRange = true;
    if (filters.priceRange === 'under-100') {
      const prices = productPrices[product.product_id] || [];
      const minPrice = prices.length > 0 ? Math.min(...prices.map(p => p.price)) : 0;
      matchesPriceRange = minPrice < 100;
    } else if (filters.priceRange === '100-500') {
      const prices = productPrices[product.product_id] || [];
      const minPrice = prices.length > 0 ? Math.min(...prices.map(p => p.price)) : 0;
      matchesPriceRange = minPrice >= 100 && minPrice < 500;
    } else if (filters.priceRange === '500-1000') {
      const prices = productPrices[product.product_id] || [];
      const minPrice = prices.length > 0 ? Math.min(...prices.map(p => p.price)) : 0;
      matchesPriceRange = minPrice >= 500 && minPrice < 1000;
    } else if (filters.priceRange === 'above-1000') {
      const prices = productPrices[product.product_id] || [];
      const minPrice = prices.length > 0 ? Math.min(...prices.map(p => p.price)) : 0;
      matchesPriceRange = minPrice >= 1000;
    }

    return matchesSearch && matchesCategory && matchesPriceRange;
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

  // Generate pagination numbers with ellipsis
  const generatePaginationNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is 5 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);
      
      if (currentPage <= 3) {
        // Show 1, 2, 3, ..., last
        pages.push(2, 3);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Show 1, ..., second last, last
        pages.push('...');
        pages.push(totalPages - 2, totalPages - 1, totalPages);
      } else {
        // Show 1, ..., current-1, current, current+1, ..., last
        pages.push('...');
        pages.push(currentPage - 1, currentPage, currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

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
      {/* Show Create Product button only if vendor */}
      {userRoleName === 'vendor' && (
        <div className="create-product-container">
          <button
            className="create-product-btn"
            onClick={() => navigate('/create-product')} // or wherever your create product page is
          >
            + Create Product
          </button>
        </div>
      )}


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
            <h4>Price range</h4>
            <div className="filter-options">
              <label>
                <input 
                  type="radio" 
                  name="priceRange" 
                  value="under-100"
                  checked={filters.priceRange === 'under-100'}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                /> 
                Under ₹100
              </label>
              <label>
                <input 
                  type="radio" 
                  name="priceRange" 
                  value="100-500"
                  checked={filters.priceRange === '100-500'}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                /> 
                ₹100 - ₹500
              </label>
              <label>
                <input 
                  type="radio" 
                  name="priceRange" 
                  value="500-1000"
                  checked={filters.priceRange === '500-1000'}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                /> 
                ₹500 - ₹1000
              </label>
              <label>
                <input 
                  type="radio" 
                  name="priceRange" 
                  value="above-1000"
                  checked={filters.priceRange === 'above-1000'}
                  onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                /> 
                Above ₹1000
              </label>
            </div>
            {filters.priceRange && (
              <button 
                className="clear-filters-btn"
                onClick={() => setFilters(prev => ({ ...prev, priceRange: '' }))}
              >
                Clear Filters
              </button>
            )}
          </div>

          {(filters.priceRange || selectedCategory || searchTerm) && (
            <button 
              className="clear-all-filters-sidebar-btn"
              onClick={() => {
                setFilters({ priceRange: '' });
                setSelectedCategory('');
                setSearchTerm('');
              }}
            >
              Clear All Filters
            </button>
          )}
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

              <select 
                className="page-size-select"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
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
          {sortedProducts.length > 0 && (
            <div className="filter-count">
              <span>Showing {sortedProducts.length} of {totalItems} products</span>
              {(filters.priceRange || selectedCategory || searchTerm) && (
                <span className="active-filters">
                  {filters.priceRange && <span className="filter-tag">Price: {filters.priceRange}</span>}
                  {selectedCategory && <span className="filter-tag">Category: {selectedCategory}</span>}
                  {searchTerm && <span className="filter-tag">Search: "{searchTerm}"</span>}
                </span>
              )}
            </div>
          )}
          <div className={`products-container ${viewMode}`}>
            {sortedProducts.length > 0 ? (
              sortedProducts.map((product) => {
              const prices = productPrices[product.product_id] || [];
                const minPrice = prices.length > 0 ? Math.min(...prices.map(p => p.price)) : null;
              return (
                  <div key={product.product_id} className="product-card" onClick={() => { 
                    setSelectedProductId(product.product_id); 
                    setModalOpen(true); 
                  }} style={{ cursor: 'pointer' }}>
                  <div className="product-image">
                    <i className="fas fa-box"></i>
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.product_name}</h3>
                      <p className="product-price">
                        {minPrice !== null ? `₹${minPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'Price not available'}
                      </p>
                    
                    {viewMode === 'list' && (
                      <div className="product-actions-list">
                        <div className="quantity-control">
                            <button onClick={(e) => { e.stopPropagation(); handleQuantityChange(product.product_id, -1); }}>-</button>
                          <span>1</span>
                            <button onClick={(e) => { e.stopPropagation(); handleQuantityChange(product.product_id, 1); }}>+</button>
                        </div>
                        <button 
                          className="wishlist-btn"
                            onClick={(e) => { e.stopPropagation(); handleAddToWishlist(product); }}
                        >
                          <i className="fas fa-heart"></i>
                        </button>
                        <button 
                          className="delete-btn"
                            onClick={(e) => { e.stopPropagation(); console.log('Delete product:', product.product_id); }}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    )}
                    
                    {viewMode === 'grid' && (
                      <div className="product-actions-grid">
                        <button 
                          className="add-to-cart-btn"
                            onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                        >
                          Add to Cart
                        </button>
                        <button 
                          className="wishlist-btn"
                            onClick={(e) => { e.stopPropagation(); handleAddToWishlist(product); }}
                        >
                          <i className="fas fa-heart"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
              })
            ) : (
              <div className="no-products-found">
                <i className="fas fa-search" style={{ fontSize: '3rem', color: '#9ca3af', marginBottom: '20px' }}></i>
                <h3>No products found</h3>
                <p>Try adjusting your filters or search terms</p>
                <button 
                  className="clear-all-filters-btn"
                  onClick={() => {
                    setFilters({ priceRange: '' });
                    setSelectedCategory('');
                    setSearchTerm('');
                  }}
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                &lt;
              </button>
              
              {generatePaginationNumbers().map((pageNum, index) => (
                pageNum === '...' ? (
                  <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                ) : (
                  <button
                    key={pageNum}
                    className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                )
              ))}
              
              <button 
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                &gt;
              </button>
            </div>
          )}

          {/* Pagination Info */}
          {totalPages > 1 && (
            <div className="pagination-info">
              <span>Page {currentPage} of {totalPages}</span>
              <span>Showing {products.length} of {totalItems} products</span>
              <span>{pageSize} per page</span>
            </div>
          )}
        </main>
      </div>
      <ProductDetailModal productId={selectedProductId} open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};

export default RentalShop;
