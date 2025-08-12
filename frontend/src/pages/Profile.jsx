import React, { useEffect, useState } from 'react';
import { authAPI } from '../api.js';
import ProductEditModal from '../components/ProductEditModal';
import '../styles/Profile.css';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState("");
  
  // For editing modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await authAPI.fetchProfile();
        console.log("Profile API response:", data);
        if (data.isSuccess) {
          setProfile(data.data);
        } else {
          setError("Failed to fetch profile data.");
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError("An error occurred while fetching profile data.");
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    const loadVendorProducts = async () => {
      setLoadingProducts(true);
      try {
        const data = await authAPI.fetchUserProducts();
        console.log("Vendor Products API response:", data);
        if (data.isSuccess) {
          setProducts(data.data.results || []);
        } else {
          setError("Failed to fetch vendor products.");
        }
      } catch (err) {
        console.error("Vendor products fetch error:", err);
        setError("An error occurred while fetching vendor products.");
      } finally {
        setLoadingProducts(false);
      }
    };

    const roleName = profile?.user?.user_role?.user_role_name?.toLowerCase();
    console.log("Detected user role:", roleName);

    if (roleName === 'vendor') {
      loadVendorProducts();
    }
  }, [profile]);

  const handleUpdate = (product) => {
    setEditingProduct(product);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveSuccess = () => {
    setEditModalOpen(false);
    setEditingProduct(null);
    // Refresh vendor products list after update
    if (profile?.user?.user_role?.user_role_name.toLowerCase() === 'vendor') {
      authAPI.fetchUserProducts().then(data => {
        if (data.isSuccess) setProducts(data.data.results || []);
      });
    }
  };

  const handleDelete = (productId) => {
    // Simple confirmation and delete logic placeholder
    if (window.confirm("Are you sure you want to delete this product?")) {
      authAPI.deleteUserProduct(productId)  // Implement this API method in your authAPI
        .then(data => {
          if (data.isSuccess) {
            setProducts(prev => prev.filter(p => p.product_id !== productId));
            alert("Product deleted successfully.");
          } else {
            alert("Failed to delete product.");
          }
        })
        .catch(() => alert("Error deleting product."));
    }
  };

  if (loadingProfile) return <p>Loading profile...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!profile) return null;

  const { user } = profile;
  const roleName = user.user_role?.user_role_name || "N/A";

  return (
    <div className="profile-container">
      <h1>My Profile</h1>
      <div className="profile-info">
        <p><strong>Name:</strong> {user.user_name}</p>
        <p><strong>Email:</strong> {user.user_email}</p>
        <p><strong>Contact:</strong> {user.user_contact}</p>
        <p><strong>Address:</strong> {user.user_address || "N/A"}</p>
        <p><strong>Role:</strong> {roleName}</p>
        <p><strong>Active:</strong> {user.active ? "Yes" : "No"}</p>
        <p><strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
      </div>

      {/* Vendor Products Section */}
      {roleName.toLowerCase() === 'vendor' && (
        <div className="vendor-products">
          <div className="vendor-header">
            <h2>My Products</h2>
            <p className="vendor-subtitle">Manage your product listings and inventory</p>
          </div>
          
          {loadingProducts ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading your products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>No Products Yet</h3>
              <p>Start building your inventory by adding your first product</p>
            </div>
          ) : (
            <div className="product-cards-container">
              {products.map((product) => (
                <div key={product.product_id} className="product-card">
                  <div className="product-header">
                    <h3 className="product-name">{product.product_name}</h3>
                    <div className="product-status">
                      <span className={`status-badge ${product.active ? 'active' : 'inactive'}`}>
                        {product.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="product-content">
                    <p className="product-description">{product.product_description}</p>
                    <div className="product-details">
                      <div className="detail-item">
                        <span className="detail-label">Quantity:</span>
                        <span className="detail-value">{product.product_qty}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">ID:</span>
                        <span className="detail-value">#{product.product_id}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="product-card-actions">
                    <button 
                      className="action-btn update-btn"
                      onClick={() => handleUpdate(product)}
                    >
                      <i className="fas fa-edit"></i>
                      Update
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(product.product_id)}
                    >
                      <i className="fas fa-trash"></i>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product Edit Modal */}
      {editModalOpen && editingProduct && (
        <ProductEditModal
          product={editingProduct}
          open={editModalOpen}
          onClose={handleCloseEditModal}
          onSaveSuccess={handleSaveSuccess}
        />
      )}
    </div>
  );
};

export default Profile;
