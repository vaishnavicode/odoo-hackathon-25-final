import React, { useEffect, useState } from "react";
import { vendorAPI } from "../api.js";
import "../styles/VendorOrders.css";

const statusColors = {
  started: "#f0ad4e", // orange
  completed: "#5cb85c", // green
  cancelled: "#d9534f", // red
  // Add more status-color mappings if needed
};

const invoiceTypeColors = {
  "Proforma Invoice": "#0275d8", // blue
  "Final Invoice": "#5bc0de", // lighter blue example
  // Add more invoice types and colors here
};

const VendorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await vendorAPI.getVendorOrders();
        setOrders(response?.data?.results || []);
      } catch (err) {
        setError("Failed to load vendor orders.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <p className="loading">Loading vendor orders...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="vendor-orders-container">
      <h1>Vendor Orders</h1>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Product</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Invoice Type</th>
              <th>From</th>
              <th>To</th>
              <th>Ordered Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const statusName = order.status?.status_name?.toLowerCase() || "";
              const invoiceType = order.payment?.invoice_type?.invoice_type || "";

              return (
                <tr key={order.order_id}>
                  <td>{order.order_id}</td>
                  <td>{order.product?.product_name}</td>
                  <td>{order.user_data?.user_name}</td>
                  <td
                    style={{
                      backgroundColor: statusColors[statusName] || "#ccc",
                      color: "#fff",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    {order.status?.status_name}
                  </td>
                  <td
                    style={{
                      backgroundColor: invoiceTypeColors[invoiceType] || "#999",
                      color: "#fff",
                      fontWeight: "bold",
                      textAlign: "center",
                    }}
                  >
                    {invoiceType}
                  </td>
                  <td>{new Date(order.timestamp_from).toLocaleDateString()}</td>
                  <td>{new Date(order.timestamp_to).toLocaleDateString()}</td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default VendorOrders;
