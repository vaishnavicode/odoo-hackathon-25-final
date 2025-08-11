import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productsAPI } from '../api.js';
import { ROUTES, PRICE_DURATIONS } from '../constants.js';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [rentalDates, setRentalDates] = useState({
    from: '',
    to: ''
  });
  const [couponCode, setCouponCode] = useState('');

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const [productResponse, pricesResponse] = await Promise.all([
        productsAPI.getById(id),
        productsAPI.getPrices(id)
      ]);

      if (productResponse.isSuccess && pricesResponse.isSuccess) {
        setProduct(productResponse.data);
        setPrices(pricesResponse.data);
        if (pricesResponse.data.length > 0) {
          setSelectedPrice(pricesResponse.data[0]);
        }
      } else {
        setError('Failed to fetch product details');
      }
    } catch (error) {
      setError('An error occurred while fetching product details');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (change) => {
    const newQuantity = Math.max(1, quantity + change);
    setQuantity(newQuantity);
  };

  const handleAddToCart = () => {
    // TODO: Implement cart functionality
    console.log('Adding to cart:', {
      product,
      selectedPrice,
      quantity,
      rentalDates,
      couponCode
    });
  };

  const handleAddToWishlist = () => {
    // TODO: Implement wishlist functionality
    console.log('Adding to wishlist:', product);
  };

  const applyCoupon = () => {
    // TODO: Implement coupon functionality
    console.log('Applying coupon:', couponCode);
  };

  if (loading) {
    return (
      <div className="product-detail-container">
        <div className="loading">Loading product details...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-container">
        <div className="error">{error || 'Product not found'}</div>
      </div>
    );
  }

  return (
    <div className="product-detail-container">
      {/* Breadcrumbs */}
      <div className="breadcrumbs">
        <Link to={ROUTES.RENTAL_SHOP}>All Products</Link>
        <span> / </span>
        <span>{product.product_name}</span>
      </div>

      <div className="product-detail-content">
        {/* Left Column - Product Image and Description */}
        <div className="product-left">
          <div className="product-image">
            <i className="fas fa-box"></i>
          </div>
          
          <button className="wishlist-btn" onClick={handleAddToWishlist}>
            Add to wish list
          </button>

          <div className="product-description">
            <h3>Product descriptions</h3>
            <p>{product.product_description || 'No description available for this product.'}</p>
            <button className="read-more-btn">Read More &gt;</button>
          </div>
        </div>

        {/* Right Column - Product Details and Actions */}
        <div className="product-right">
          <div className="product-header">
            <h1>{product.product_name}</h1>
            <select className="price-list-select">
              <option value="">Price List</option>
              {prices.map((price) => (
                <option key={price.product_price_id} value={price.product_price_id}>
                  ₹{price.price} / {price.time_duration}
                </option>
              ))}
            </select>
          </div>

          <div className="product-pricing">
            <div className="price-display">
              <span className="main-price">₹{selectedPrice?.price || '0'}</span>
              <span className="price-unit">(₹{selectedPrice?.price || '0'} / per unit)</span>
            </div>
          </div>

          <div className="rental-options">
            <div className="date-inputs">
              <div className="date-input">
                <label>From:</label>
                <input
                  type="date"
                  value={rentalDates.from}
                  onChange={(e) => setRentalDates(prev => ({ ...prev, from: e.target.value }))}
                />
                <i className="fas fa-calendar"></i>
              </div>
              <div className="date-input">
                <label>To:</label>
                <input
                  type="date"
                  value={rentalDates.to}
                  onChange={(e) => setRentalDates(prev => ({ ...prev, to: e.target.value }))}
                />
                <i className="fas fa-calendar"></i>
              </div>
            </div>

            <div className="quantity-selector">
              <button onClick={() => handleQuantityChange(-1)}>-</button>
              <span>{quantity}</span>
              <button onClick={() => handleQuantityChange(1)}>+</button>
            </div>

            <button className="add-to-cart-btn" onClick={handleAddToCart}>
              <i className="fas fa-heart"></i>
              Add to Cart
            </button>
          </div>

          <div className="coupon-section">
            <h4>Apply Coupon</h4>
            <div className="coupon-input">
              <input
                type="text"
                placeholder="Coupon Code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
              />
              <button onClick={applyCoupon}>Apply</button>
            </div>
          </div>

          <div className="terms-section">
            <h4>Terms & Conditions</h4>
            <p>Please read our terms and conditions before proceeding with the rental...</p>
          </div>

          <div className="share-section">
            <h4>Share:</h4>
            <div className="share-buttons">
              <button className="share-btn">
                <i className="fab fa-facebook"></i>
              </button>
              <button className="share-btn">
                <i className="fab fa-twitter"></i>
              </button>
              <button className="share-btn">
                <i className="fab fa-whatsapp"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
