import React, { useEffect, useState } from 'react';
import { vendorAPI } from '../api.js'; 
import '../styles/Reporting.css';

const Reporting = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await vendorAPI.getReport();
      if (response.isSuccess) {
        setReportData(response.data);
      } else {
        setError('Failed to load report data');
      }
    } catch (err) {
      setError('Error fetching report');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading report...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!reportData) return null;

  return (
    <div className="reporting-container">
      <h2>Vendor Reporting Dashboard</h2>

      {/* Total Orders */}
      <div>
        <h3>Total Orders Completed</h3>
        <p>{reportData.total_orders}</p>
      </div>

      {/* Recent Orders Table */}
      <div>
        <h3>Recent Orders</h3>
        {reportData.recent_orders.length === 0 ? (
          <p>No recent orders.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Product</th>
                <th>Order Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData.recent_orders.map(order => (
                <tr key={order.order_id}>
                  <td>{order.order_id}</td>
                  <td>{order.product_name}</td>
                  <td>{new Date(order.order_date).toLocaleString()}</td>
                  <td>{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Product Performance Table */}
      <div>
        <h3>Product Performance</h3>
        {reportData.product_performance.length === 0 ? (
          <p>No product performance data.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Completed Orders</th>
              </tr>
            </thead>
            <tbody>
              {reportData.product_performance.map(product => (
                <tr key={product.product_id}>
                  <td>{product.product_name}</td>
                  <td>{product.orders_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Reporting;
