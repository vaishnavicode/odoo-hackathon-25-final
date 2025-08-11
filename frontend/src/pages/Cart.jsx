import React, { useEffect, useState } from 'react';
import { cartAPI } from '../api.js';
import { toast } from 'react-toastify';
import '../styles/Cart.css';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.get();
      console.log("Cart API response:", response);

      if (response.isSuccess) {
        setCartItems(response.data);
      } else {
        toast.error(response.error || "Failed to load cart.");
      }
    } catch (error) {
      console.error("Cart fetch error:", error);
      toast.error("Something went wrong loading your cart.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="cart-container"><p>Loading cart...</p></div>;
  }

  if (!cartItems || cartItems.length === 0) {
    return <div className="cart-container"><p>Your cart is empty. Start shopping to add items!</p></div>;
  }

  return (
    <div className="cart-container">
      <h1>Shopping Cart</h1>
      <table className="cart-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Price (each)</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {cartItems.map((item) => {
            const quantity = item.quantity || 0;
            const totalPrice = item.calculated_price || 0;
            // Calculate unit price safely
            const unitPrice = quantity > 0 ? totalPrice / quantity : 0;

            return (
              <tr key={item.cart_id || item.product_id}>
                <td>{item.product_name || 'Unknown Product'}</td>
                <td>{quantity}</td>
                <td>₹{unitPrice.toFixed(2)}</td>
                <td>₹{totalPrice.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="cart-total">
        <strong>
          Grand Total: ₹
          {cartItems
            .reduce((sum, item) => sum + (item.calculated_price || 0), 0)
            .toFixed(2)}
        </strong>
      </div>
    </div>
  );
};

export default Cart;
