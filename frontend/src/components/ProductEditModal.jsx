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
          <p>Loading product data...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSave();
            }}
          >
            <label>
              Product Name:
              <input
                name="product_name"
                type="text"
                value={formData.product_name}
                onChange={handleInputChange}
                required
              />
            </label>

            <label>
              Description:
              <textarea
                name="product_description"
                value={formData.product_description}
                onChange={handleInputChange}
                rows={4}
              />
            </label>

            <label>
              Quantity:
              <input
                name="product_qty"
                type="number"
                min="0"
                value={formData.product_qty}
                onChange={handleInputChange}
                required
              />
            </label>

            <label>
              Active:
              <input
                name="active"
                type="checkbox"
                checked={formData.active}
                onChange={handleInputChange}
              />
            </label>

            <hr />

            <h3>Prices</h3>
            {prices.map((price, idx) => (
              <div key={price.product_price_id || idx} className="price-row">
                <input
                  type="number"
                  placeholder="Price"
                  value={price.price}
                  min="0"
                  onChange={e => handlePriceChange(idx, 'price', e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Time Duration"
                  value={price.time_duration}
                  onChange={e => handlePriceChange(idx, 'time_duration', e.target.value)}
                  required
                />
                <button type="button" onClick={() => handleRemovePrice(idx)} className="remove-price-btn">
                  &times;
                </button>
              </div>
            ))}

            <button type="button" onClick={handleAddPrice} className="add-price-btn">
              + Add Price
            </button>

            <div className="modal-actions">
              <button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={onClose} disabled={saving}>
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
