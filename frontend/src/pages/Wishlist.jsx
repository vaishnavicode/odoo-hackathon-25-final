import React, { useEffect, useState } from 'react';
import { authAPI } from '../api.js';  // uses fetchProfile internally
import ProductDetailModal from "../components/ProductDetailModal";
import '../styles/Wishlist.css';

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setLoading(true);
        const response = await authAPI.fetchProfile(); // calls /api/user/profile/
        if (response.isSuccess && response.data.wishlist) {
          setWishlistItems(response.data.wishlist.results || []);
        } else {
          setWishlistItems([]);
        }
      } catch (error) {
        console.error('Failed to fetch wishlist:', error);
        setWishlistItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  const openProductModal = (productId) => {
    setSelectedProductId(productId);
    setModalOpen(true);
  };

  const closeProductModal = () => {
    setModalOpen(false);
    setSelectedProductId(null);
  };

  if (loading) {
    return <div className="wishlist-container"><p>Loading wishlist...</p></div>;
  }

  if (!wishlistItems.length) {
    return (
      <div className="wishlist-container">
        <h1>My Wishlist</h1>
        <p>Your wishlist is empty. Start adding products you love!</p>
      </div>
    );
  }

  return (
    <div className="wishlist-container">
      <h1>My Wishlist</h1>
      <ul className="wishlist-list">
        {wishlistItems.map((item) => (
          <li
            key={item.product_id}
            className="wishlist-item"
            onClick={() => openProductModal(item.product_id)}
            style={{ cursor: 'pointer' }}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                openProductModal(item.product_id);
              }
            }}
            aria-label={`View details of ${item.product_name}`}
          >
            <h3>{item.product_name}</h3>
            {item.product_description && <p>{item.product_description}</p>}
          </li>
        ))}
      </ul>

      {modalOpen && selectedProductId && (
        <ProductDetailModal
          productId={selectedProductId}
          open={modalOpen}
          onClose={closeProductModal}
        />
      )}
    </div>
  );
};

export default Wishlist;
