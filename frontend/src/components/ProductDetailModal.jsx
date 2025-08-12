import React, { useState, useEffect, useRef } from 'react';
import { productsAPI } from '../api.js';
import { toast } from 'react-toastify';
import { wishlistAPI } from '../api.js';
import { useAuth } from '../App.jsx';

import '../styles/ProductDetailModal.css';

import { cartAPI } from '../api.js'; // add this at the top

const ProductDetailModal = ({ productId, open, onClose }) => {
  const [product, setProduct] = useState(null);
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [rentalDates, setRentalDates] = useState({ from: '', to: '' });
  const [couponCode, setCouponCode] = useState('');
  const { isAuthenticated } = useAuth();



  // Refs for date inputs
  const fromDateRef = useRef(null);
  const toDateRef = useRef(null);

  useEffect(() => {
    if (open && productId) {
      fetchProductDetails();
      setRentalDates({ from: '', to: '' }); 
      setQuantity(1); 
      setCouponCode(''); 
    }
    // eslint-disable-next-line
  }, [productId, open]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const [productResponse, pricesResponse] = await Promise.all([
        productsAPI.getById(productId),
        productsAPI.getPrices(productId)
      ]);
      if (productResponse.isSuccess && pricesResponse.isSuccess) {
        setProduct(productResponse.data);
        // Handle the new paginated response structure for prices
        const pricesData = pricesResponse.data.results || pricesResponse.data;
        setPrices(pricesData);
        if (pricesData.length > 0) {
          setSelectedPrice(pricesData[0]);
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

  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to manage your wishlist.");
      return;
    }
  
    try {
      const result = await wishlistAPI.toggle(product.product_id);
      if (result.isSuccess) {
        toast.success(`Product ${result.data.action} to wishlist`);
      } else {
        toast.error(result.error || "Failed to update wishlist");
      }
    } catch (error) {
      console.error("Wishlist error:", error);
      toast.error("Something went wrong");
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
  toast.error("Please login to add items to your cart.");
  return;
}


if (!selectedPrice || !rentalDates.from || !rentalDates.to) {
  toast.warning("Please select a price and rental dates.");
  return;
}

    const payload = {
      product_id: product.product_id,
      quantity,
      timestamp_from: new Date(rentalDates.from + "T10:00:00Z").toISOString(),
      timestamp_to: new Date(rentalDates.to + "T10:00:00Z").toISOString(),
    };

    console.log("Payload being sent to API:", payload);

    try {
      const response = await cartAPI.add(payload);
      console.log("Raw cartAPI.add response:", response);

      if (response.isSuccess) {
        toast.success("Item added to cart!");
      } else {
        toast.error(response.error || "Failed to add to cart.");
      }

    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error("Something went wrong while adding to cart.");
    }
  };


  const applyCoupon = () => {
    console.log('Applying coupon:', couponCode);
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        {loading ? (
          <div className="loading">Loading product details...</div>
        ) : error || !product ? (
          <div className="error">{error || 'Product not found'}</div>
        ) : (
          <div className="product-detail-container modal-mode">
            <div className="breadcrumbs">
              <span>All Products</span>
              <span> / </span>
              <span>{product.product_name}</span>
            </div>
            <div className="product-detail-content">
              <div className="product-left">
                <div className="product-image">
                  <i className="fas fa-box"></i>
                </div>
                <button className="wishlist-btn" onClick={handleAddToWishlist}>
                  Wishlist
                </button>
                <div className="product-description">
                  <h3>Product description</h3>
                  <p>({product.product_qty} Available)</p>
                  <p>{product.product_description || 'No description available for this product.'}</p>
                </div>
              </div>
              <div className="product-right">
                <div className="product-header">
                  <h1>{product.product_name}</h1>
                  <select className="price-list-select" onChange={e => {
                    const price = prices.find(p => p.product_price_id === Number(e.target.value));
                    setSelectedPrice(price);
                  }} value={selectedPrice?.product_price_id || ''}>
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
                        onChange={e => setRentalDates(prev => ({ ...prev, from: e.target.value }))}
                        ref={fromDateRef}
                      />
                      <i
                        className="fas fa-calendar"
                        onClick={() => fromDateRef.current.showPicker()}
                      ></i>
                    </div>
                    <div className="date-input">
                      <label>To:</label>
                      <input
                        type="date"
                        value={rentalDates.to}
                        onChange={e => setRentalDates(prev => ({ ...prev, to: e.target.value }))}
                        ref={toDateRef}
                      />
                      <i
                        className="fas fa-calendar"
                        onClick={() => toDateRef.current.showPicker()}
                      ></i>
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
                      onChange={e => setCouponCode(e.target.value)}
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
                    <button className="share-btn"><i className="fab fa-facebook"></i></button>
                    <button className="share-btn"><i className="fab fa-twitter"></i></button>
                    <button className="share-btn"><i className="fab fa-whatsapp"></i></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailModal;
