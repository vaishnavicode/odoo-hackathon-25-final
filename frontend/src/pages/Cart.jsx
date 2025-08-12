import React, { useEffect, useState } from 'react';
import { cartAPI, ordersAPI } from '../api.js';
import { toast } from 'react-toastify';
import '../styles/Cart.css';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [removingItem, setRemovingItem] = useState(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.get();
      console.log("Cart API response:", response);

      if (response.isSuccess) {
        console.log("Cart items:", response.data);
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

  const handleRemoveFromCart = async (itemId) => {
    try {
      // Validate that we have a valid ID
      if (!itemId || itemId === undefined || itemId === null) {
        toast.error("Invalid item ID. Cannot remove item.");
        return;
      }
      
      setRemovingItem(itemId);
      console.log("Removing item with ID:", itemId);
      console.log("ID type:", typeof itemId);
      console.log("ID value:", itemId);
      
      // Log the current cart state before removal
      console.log("Cart items before removal:", cartItems);
      
      const response = await cartAPI.remove(itemId);
      console.log("Remove response:", response);
      
      if (response && response.isSuccess) {
        console.log("Remove successful, response:", response);
        toast.success("Item removed from cart successfully!");
        
        // Instead of fetching the entire cart again, let's remove the item locally
        // This prevents the cart from being cleared if there's a backend issue
        setCartItems(prevItems => {
          const updatedItems = prevItems.filter(item => {
            const currentItemId = item.cart_item_id || item.product_id || item.id;
            const shouldKeep = currentItemId !== itemId;
            console.log(`Item ${currentItemId} vs ${itemId}: ${shouldKeep ? 'keeping' : 'removing'}`);
            return shouldKeep; // Remove the item with matching ID
          });
          console.log("Updated cart items:", updatedItems);
          return updatedItems;
        });
        
        // Also fetch the cart to ensure consistency
        fetchCart();
      } else {
        const errorMsg = response?.error || response?.message || "Failed to remove item from cart.";
        console.error("Remove failed:", errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("Remove from cart error:", error);
      console.error("Error response:", error.response);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      
      let errorMessage = "Something went wrong removing item from cart.";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setRemovingItem(null);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm("Are you sure you want to clear your entire cart?")) {
      return;
    }

    try {
      setProcessing(true);
      const response = await cartAPI.clear();
      console.log("Clear cart response:", response);
      
      if (response && response.isSuccess) {
        toast.success("Cart cleared successfully!");
        setCartItems([]);
      } else {
        const errorMsg = response?.error || response?.message || "Failed to clear cart.";
        console.error("Clear cart failed:", errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("Clear cart error:", error);
      console.error("Error response:", error.response);
      
      let errorMessage = "Something went wrong clearing cart.";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckout = async () => {
    try {
      setProcessing(true);
      console.log("Starting checkout process...");
      console.log("Cart items to checkout:", cartItems);
      
      // Validate that we have cart items
      if (!cartItems || cartItems.length === 0) {
        toast.error("Cannot checkout with empty cart.");
        return;
      }
      
             // Extract product IDs for debugging
       const productIds = cartItems.map(item => ({
         product_id: item.product_id,
         id: item.id,
         cart_item_id: item.cart_item_id,
         product_name: item.product_name
       }));
       console.log("Product IDs for checkout:", productIds);
       
       // Also log the raw cart items to see the exact structure
       console.log("Raw cart items structure:", JSON.stringify(cartItems, null, 2));
       
       // Check if we have any numeric ID fields
       const numericFields = cartItems.map(item => {
         const numeric = {};
         for (const [key, value] of Object.entries(item)) {
           if (typeof value === 'number' && value > 0) {
             numeric[key] = value;
           }
         }
         return numeric;
       });
       console.log("Numeric fields in cart items:", numericFields);
      
      const response = await ordersAPI.create(cartItems);
      console.log("Checkout response:", response);
      
      if (response && response.isSuccess) {
        console.log("Checkout successful, response:", response);
        toast.success("Order placed successfully! Your cart has been cleared.");
        setCartItems([]);
        // Optionally redirect to order confirmation page
        // window.location.href = '/orders';
      } else if (response && response.data) {
        // Some APIs return success data directly without isSuccess flag
        console.log("Checkout successful (alternative response format), response:", response);
        toast.success("Order placed successfully! Your cart has been cleared.");
        setCartItems([]);
      } else {
        const errorMsg = response?.error || response?.message || "Failed to place order.";
        console.error("Checkout failed:", errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      console.error("Error response:", error.response);
      console.error("Error status:", error.response?.status);
      console.error("Error message:", error.message);
      
      let errorMessage = "Something went wrong during checkout.";
      if (error.response?.status === 405) {
        errorMessage = "Checkout method not allowed. Please contact support.";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="cart-container"><div className="loading">Loading cart...</div></div>;
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
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {cartItems.map((item, index) => {
            const quantity = item.quantity || 0;
            const totalPrice = item.calculated_price || 0;
            // Calculate unit price safely
            const unitPrice = quantity > 0 ? totalPrice / quantity : 0;

            // Debug: Log the first item to see its structure
            if (index === 0) {
              console.log("First cart item structure:", item);
              console.log("All available fields:", Object.keys(item));
              console.log("Product ID:", item.product_id);
              console.log("Cart ID:", item.cart_id);
              console.log("ID:", item.id);
              console.log("Cart Item ID:", item.cart_item_id);
            }

            return (
                             <tr key={item.cart_item_id || item.product_id || item.id || index}>
                <td>{item.product_name || 'Unknown Product'}</td>
                <td>{quantity}</td>
                <td>₹{unitPrice.toFixed(2)}</td>
                <td>₹{totalPrice.toFixed(2)}</td>
                <td>
                  <button
                    className="cart-action-btn remove-btn"
                    onClick={() => {
                      // Try to find the correct ID field
                      // The backend might expect cart_item_id, product_id, or just id
                      const possibleIds = {
                        cart_item_id: item.cart_item_id,
                        product_id: item.product_id,
                        id: item.id,
                        cart_id: item.cart_id
                      };
                      
                      console.log("Item to remove:", item);
                      console.log("Available fields:", Object.keys(item));
                      console.log("Possible IDs:", possibleIds);
                      
                      // Try cart_item_id first, then product_id, then id
                      const itemId = item.cart_item_id || item.product_id || item.id;
                      console.log("Selected ID:", itemId);
                      console.log("ID type:", typeof itemId);
                      
                      if (!itemId) {
                        toast.error("Cannot identify item to remove. Please try again.");
                        return;
                      }
                      
                      handleRemoveFromCart(itemId);
                    }}
                                         disabled={removingItem === (item.cart_item_id || item.product_id || item.id)}
                   >
                     {removingItem === (item.cart_item_id || item.product_id || item.id) ? 'Removing...' : 'Remove'}
                   </button>
                </td>
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
      
      <div className="cart-actions">
        <button
          className="cart-action-btn clear-btn"
          onClick={handleClearCart}
          disabled={processing || cartItems.length === 0}
        >
          Clear Cart
        </button>
        <button
          className="cart-action-btn checkout-btn"
          onClick={handleCheckout}
          disabled={processing || cartItems.length === 0}
        >
          {processing ? 'Processing...' : 'Checkout'}
        </button>
      </div>
    </div>
  );
};

export default Cart;
