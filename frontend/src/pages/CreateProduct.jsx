import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../api.js';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/CreateProduct.css';

const CreateProduct = () => {
  const navigate = useNavigate();

  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [productQty, setProductQty] = useState(1);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
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
        toast.success('Product created successfully!');
        // Delay navigation a bit so user can see toast
        setTimeout(() => {
          navigate('/rental-shop');
        }, 1500);
      } else {
        setError(response.error || 'Failed to create product');
      }
    } catch {
      setError('An error occurred while creating product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-product-container">
      <h2>Create Product</h2>
      <form onSubmit={handleSubmit} noValidate>
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
          {loading ? 'Creating...' : 'Create'}
        </button>
      </form>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </div>
  );
};

export default CreateProduct;
