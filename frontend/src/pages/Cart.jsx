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

  const handleRemoveFromCart = async (productId, cartItem) => {
    try {
      // Validate that we have a valid product ID
      if (!productId || productId === undefined || productId === null) {
        toast.error("Invalid product ID. Cannot remove item.");
        return;
      }
      
      setRemovingItem(productId);
      console.log("Removing cart item:", cartItem);
      console.log("Product ID for removal:", productId);
      console.log("ID type:", typeof productId);
      console.log("ID value:", productId);
      
      // Log the current cart state before removal
      console.log("Cart items before removal:", cartItems);
      
      const response = await cartAPI.remove(productId);
      console.log("Remove response:", response);
      
      if (response && response.isSuccess) {
        console.log("Remove successful, response:", response);
        toast.success("Item removed from cart successfully!");
        
        // Remove all instances of the product locally since backend removes by product_id
        // This will remove all cart items with the same product_id
        setCartItems(prevItems => {
          const updatedItems = prevItems.filter(item => {
            // Since we're removing by product_id, remove all items with that product
            const shouldKeep = item.product_id !== productId;
            
            console.log(`Cart item comparison:`);
            console.log(`  Current product ID: ${item.product_id}`);
            console.log(`  Removal target product ID: ${productId}`);
            console.log(`  Product name: ${item.product_name}`);
            console.log(`  Quantity: ${item.quantity}`);
            console.log(`  Action: ${shouldKeep ? 'keeping' : 'removing'}`);
            
            return shouldKeep; // Remove all items with matching product_id
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

    if (!cartItems || cartItems.length === 0) {
      toast.error("Cannot checkout with empty cart.");
      return;
    }

    
    
    const cartItemsToSend = cartItems.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity ?? 1,         
      timestamp_from: item.timestamp_from, 
      timestamp_to: item.timestamp_to,
    }));

    console.log("Prepared cart items for checkout:", cartItemsToSend);
    console.log("Payload to backend:", JSON.stringify(cartItemsToSend, null, 2));
    
    const response = await ordersAPI.create(cartItemsToSend);
    console.log("Checkout response:", response);

    const handleCartClear = async () => {
      try {
        const clearResponse = await cartAPI.clear();
        console.log("Cart clear response:", clearResponse);
        if (clearResponse && clearResponse.isSuccess) {
          setCartItems([]);
          toast.success("Order placed successfully! Your cart has been cleared.");
        } else {
          setCartItems([]);
          toast.success("Order placed successfully! Please refresh to see updated cart.");
        }
      } catch (clearError) {
        console.error("Failed to clear cart after checkout:", clearError);
        setCartItems([]);
        toast.success("Order placed successfully! Please refresh to see updated cart.");
      }
      setTimeout(() => {
        fetchCart();
      }, 1000);
    };

    if (response && response.isSuccess) {
      toast.success("Order placed successfully! Clearing your cart...");
      await handleCartClear();
    } else if (response && response.data) {
      toast.success("Order placed successfully! Clearing your cart...");
      await handleCartClear();
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
      if (typeof error.response.data.error === "string") {
        errorMessage = error.response.data.error;
      } else if (typeof error.response.data.error === "object") {
        errorMessage = Object.values(error.response.data.error).flat().join(" ");
      }
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
                             <tr key={item.product_id || item.id || index}>
                <td>{item.product_name || 'Unknown Product'}</td>
                <td>{quantity}</td>
                <td>₹{unitPrice.toFixed(2)}</td>
                <td>₹{totalPrice.toFixed(2)}</td>
                <td>
                  <button
                    className="cart-action-btn remove-btn"
                                         onClick={() => {
                                               // For cart removal, the backend expects product_id
                        // This is because the backend removes all instances of a specific product from cart
                        const possibleIds = {
                          product_id: item.product_id,
                          id: item.id,
                          cart_item_id: item.cart_item_id,
                          cart_id: item.cart_id
                        };
                        
                        console.log("Item to remove:", item);
                        console.log("Available fields:", Object.keys(item));
                        console.log("Possible IDs:", possibleIds);
                        
                        // Use product_id first as that's what the backend expects for removal
                        // This will remove all instances of the same product from cart
                        const itemId = item.product_id || item.id;
                        console.log("Selected product ID for removal:", itemId);
                        console.log("ID type:", typeof itemId);
                        
                        if (!itemId) {
                          toast.error("Cannot identify product to remove. Please try again.");
                          return;
                        }
                        
                        // Pass additional context to help with debugging
                        handleRemoveFromCart(itemId, item);
                     }}
                                         disabled={removingItem === (item.product_id || item.id)}
                   >
                     {removingItem === (item.product_id || item.id) ? 'Removing...' : 'Remove'}
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
