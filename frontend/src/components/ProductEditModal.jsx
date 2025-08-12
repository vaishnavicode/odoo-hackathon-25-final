import React, { useEffect, useState } from 'react';
import { productsAPI } from '../api.js';
import { toast } from 'react-toastify';
import '../styles/ProductEditModal.css';

const ProductEditModal = ({ product, open, onClose, onSaveSuccess }) => {
  const [formData, setFormData] = useState({
    product_name: '',
    product_description: '',
    product_qty: 0,
    active: false,
  });
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && product) {
      // Initialize form data with product info
      setFormData({
        product_name: product.product_name || '',
        product_description: product.product_description || '',
        product_qty: product.product_qty || 0,
        active: product.active || false,
      });
      fetchPrices();
    }
  }, [open, product]);

  const fetchPrices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productsAPI.getPrices(product.product_id);
      if (response.isSuccess) {
        const pricesData = response.data.results || response.data;
        setPrices(pricesData);
      } else {
        setError('Failed to load prices');
      }
    } catch {
      setError('Error fetching prices');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Simple handler for price changes inside prices array
  const handlePriceChange = (index, field, value) => {
    setPrices(prev => {
      const newPrices = [...prev];
      newPrices[index] = { ...newPrices[index], [field]: value };
      return newPrices;
    });
  };

  const handleAddPrice = () => {
    setPrices(prev => [...prev, { product_price_id: null, price: '', time_duration: '' }]);
  };

  const handleRemovePrice = (index) => {
    setPrices(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Update product main data
      const updateProductPayload = {
        product_name: formData.product_name,
        product_description: formData.product_description,
        product_qty: Number(formData.product_qty),
        active: formData.active,
      };
      const updateProductResp = await productsAPI.update(product.product_id, updateProductPayload);
      if (!updateProductResp.isSuccess) {
        setError('Failed to update product details');
        setSaving(false);
        return;
      }

      // Update prices one by one
      for (const price of prices) {
        if (price.product_price_id) {
          // existing price update
          const updatePriceResp = await productsAPI.updatePrice(product.product_id, price.product_price_id, {
            price: Number(price.price),
            time_duration: price.time_duration,
          });
          if (!updatePriceResp.isSuccess) {
            setError('Failed to update some prices');
            setSaving(false);
            return;
          }
        } else {
          // new price creation
          if (price.price !== '' && price.time_duration !== '') {
            const createPriceResp = await productsAPI.createPrice(product.product_id, {
              price: Number(price.price),
              time_duration: price.time_duration,
            });
            if (!createPriceResp.isSuccess) {
              setError('Failed to create some prices');
              setSaving(false);
              return;
            }
          }
        }
      }

      toast.success('Product updated successfully!');
      onSaveSuccess?.();
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>Edit Product</h2>
        
        {loading ? (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSave();
            }}
          >
            {/* Product Information Section */}
            <div className="form-section">
              <h3>Product Information</h3>
              
              <div className="form-group">
                <label htmlFor="product_name">Product Name</label>
                <input
                  id="product_name"
                  name="product_name"
                  type="text"
                  value={formData.product_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter product name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="product_description">Description</label>
                <textarea
                  id="product_description"
                  name="product_description"
                  value={formData.product_description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Enter product description"
                />
              </div>

              <div className="form-group">
                <label htmlFor="product_qty">Quantity</label>
                <input
                  id="product_qty"
                  name="product_qty"
                  type="number"
                  min="0"
                  value={formData.product_qty}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter quantity"
                />
              </div>

              <div className="checkbox-group">
                <input
                  id="active"
                  name="active"
                  type="checkbox"
                  checked={formData.active}
                  onChange={handleInputChange}
                />
                <label htmlFor="active">Active Product</label>
              </div>
            </div>

            <hr />

            {/* Prices Section */}
            <div className="form-section">
              <h3>Pricing Information</h3>
              
              <div className="prices-section">
                {prices.map((price, idx) => (
                  <div key={price.product_price_id || idx} className="price-item">
                    <div className="price-item-header">
                      <span className="price-item-title">Price Option {idx + 1}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemovePrice(idx)} 
                        className="remove-price-btn"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="price-fields">
                      <div className="form-group">
                        <label htmlFor={`price-${idx}`}>Price (₹)</label>
                        <input
                          id={`price-${idx}`}
                          type="number"
                          placeholder="0.00"
                          value={price.price}
                          min="0"
                          step="0.01"
                          onChange={e => handlePriceChange(idx, 'price', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor={`duration-${idx}`}>Time Duration</label>
                        <input
                          id={`duration-${idx}`}
                          type="text"
                          placeholder="e.g., 1 hour, 1 day"
                          value={price.time_duration}
                          onChange={e => handlePriceChange(idx, 'time_duration', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button type="button" onClick={handleAddPrice} className="add-price-btn">
                  + Add New Price Option
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button type="submit" className="save-btn" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className="cancel-btn" onClick={onClose} disabled={saving}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProductEditModal;
