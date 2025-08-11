import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../api.js';
import { PRICE_DURATIONS } from '../constants.js';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/CreateProduct.css';

const CreateProduct = () => {
  const navigate = useNavigate();

  // Product fields
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [productQty, setProductQty] = useState(1);
  const [description, setDescription] = useState('');
  
  // Pricing fields
  const [price, setPrice] = useState('');
  const [timeDuration, setTimeDuration] = useState('');
  const [pricingQty, setPricingQty] = useState(1);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1: Product details, 2: Pricing details
  const [createdProductId, setCreatedProductId] = useState(null);

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!productName.trim()) return setError('Product name is required');
    if (!category.trim()) return setError('Category is required');
    if (productQty <= 0) return setError('Quantity must be at least 1');

    setLoading(true);
    try {
      const response = await productsAPI.create({
        product_name: productName,
        product_description: description,
        product_qty: productQty,
        category_name: category,
        active: true,
      });

      if (response.isSuccess) {
        setCreatedProductId(response.data.product_id);
        toast.success('Product created successfully! Now add pricing details.');
        setStep(2);
      } else {
        setError(response.error || 'Failed to create product');
      }
    } catch {
      setError('An error occurred while creating product');
    } finally {
      setLoading(false);
    }
  };

  const handlePricingSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!price || price <= 0) return setError('Price is required and must be greater than 0');
    if (!timeDuration) return setError('Time duration is required');
    if (pricingQty <= 0) return setError('Quantity must be at least 1');

    setLoading(true);
    try {
      const response = await productsAPI.createPrice(createdProductId, {
        price: parseFloat(price),
        time_duration: timeDuration,
        quantity: pricingQty,
        product_id: createdProductId,
      });

      if (response.isSuccess) {
        toast.success('Product and pricing created successfully!');
        setTimeout(() => {
          navigate('/rental-shop');
        }, 1500);
      } else {
        setError(response.error || 'Failed to create pricing');
      }
    } catch {
      setError('An error occurred while creating pricing');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToProduct = () => {
    setStep(1);
    setError(null);
  };

  const resetForm = () => {
    setProductName('');
    setCategory('');
    setProductQty(1);
    setDescription('');
    setPrice('');
    setTimeDuration('');
    setPricingQty(1);
    setStep(1);
    setCreatedProductId(null);
    setError(null);
  };

  if (step === 1) {
    return (
      <div className="create-product-container">
        <h2>Create Product</h2>
        <form onSubmit={handleProductSubmit} noValidate>
          <label htmlFor="productName" className="form-label">Product Name</label>
          <input
            id="productName"
            type="text"
            className="form-input"
            placeholder="Enter product name"
            value={productName}
            onChange={e => setProductName(e.target.value)}
            required
          />

          <label htmlFor="category" className="form-label">Category</label>
          <input
            id="category"
            type="text"
            className="form-input"
            placeholder="Enter category"
            value={category}
            onChange={e => setCategory(e.target.value)}
            required
          />

          <label htmlFor="productQty" className="form-label">Quantity</label>
          <input
            id="productQty"
            type="number"
            className="form-input"
            placeholder="Quantity"
            value={productQty}
            min={1}
            onChange={e => setProductQty(Number(e.target.value))}
            required
          />

          <label htmlFor="description" className="form-label">Description</label>
          <textarea
            id="description"
            className="form-textarea"
            placeholder="Enter product description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
          />

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="create-product-btn" disabled={loading}>
            {loading ? 'Creating...' : 'Create Product & Continue'}
          </button>
        </form>

        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="create-product-container">
        <h2>Add Pricing Details</h2>
        <p className="step-info">Product "{productName}" created successfully. Now add pricing information.</p>
        
        <form onSubmit={handlePricingSubmit} noValidate>
          <label htmlFor="price" className="form-label">Price (₹)</label>
          <input
            id="price"
            type="number"
            className="form-input"
            placeholder="Enter price"
            value={price}
            min="0.01"
            step="0.01"
            onChange={e => setPrice(e.target.value)}
            required
          />

          <label htmlFor="timeDuration" className="form-label">Time Duration</label>
          <select
            id="timeDuration"
            className="form-select"
            value={timeDuration}
            onChange={e => setTimeDuration(e.target.value)}
            required
          >
            <option value="">Select time duration</option>
            {PRICE_DURATIONS.map((duration) => (
              <option key={duration} value={duration}>
                {duration.charAt(0).toUpperCase() + duration.slice(1)}
              </option>
            ))}
          </select>

          <label htmlFor="pricingQty" className="form-label">Quantity for this pricing</label>
          <input
            id="pricingQty"
            type="number"
            className="form-input"
            placeholder="Quantity"
            value={pricingQty}
            min={1}
            onChange={e => setPricingQty(Number(e.target.value))}
            required
          />

          {error && <p className="error-message">{error}</p>}

          <div className="button-group">
            <button type="button" className="back-btn" onClick={handleBackToProduct}>
              Back to Product Details
            </button>
            <button type="submit" className="create-product-btn" disabled={loading}>
              {loading ? 'Creating...' : 'Complete Setup'}
            </button>
          </div>
        </form>

        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      </div>
    );
  }

  return null;
};

export default CreateProduct;
