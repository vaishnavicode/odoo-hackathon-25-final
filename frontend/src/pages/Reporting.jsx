import React, { useEffect, useState } from 'react';
import { vendorAPI } from '../api.js'; 
import '../styles/Reporting.css';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


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

  // --- Helper to download a file ---
  const downloadFile = (filename, content, type = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Download JSON ---
  const handleDownloadJSON = () => {
    if (!reportData) return;
    const jsonStr = JSON.stringify(reportData, null, 2);
    downloadFile('vendor-report.json', jsonStr, 'application/json');
  };

  // --- Escape CSV values ---
  const escapeCSV = (value) => {
    if (value == null) return '';
    const str = value.toString();
    // If value contains comma, quote or newline, wrap in quotes
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

// --- Convert array of objects to CSV rows ---
const convertToCSVRows = (arr, headers) => {
  if (!arr || arr.length === 0) return [];

  const keys = headers || Object.keys(arr[0]);
  const rows = [];

  // Header row
  rows.push(keys.join(','));

  // Data rows
  arr.forEach(obj => {
    const row = keys.map(key => {
      let val = obj[key];
      if (key === 'order_date' && val) {
        val = new Date(val).toLocaleString();
      }
      return escapeCSV(val);
    });
    rows.push(row.join(','));
  });

  return rows;
};

// --- Main CSV download handler ---
const handleDownloadCSV = () => {
  if (!reportData) return;

  let csvLines = [];

  // Add section comment (CSV ignores lines starting with #)
  csvLines.push('# Vendor Report');
  csvLines.push('');

  // Total Orders Completed section
  csvLines.push('# Total Orders Completed');
  csvLines.push('Metric,Value');
  csvLines.push(`Total Orders Completed,${reportData.total_orders}`);
  csvLines.push('');

  // Recent Orders section
  csvLines.push('# Recent Orders');
  if (!reportData.recent_orders || reportData.recent_orders.length === 0) {
    csvLines.push('No recent orders.');
  } else {
    const recentOrderHeaders = ['order_id', 'product_name', 'order_date', 'status'];
    csvLines = csvLines.concat(convertToCSVRows(reportData.recent_orders, recentOrderHeaders));
  }
  csvLines.push('');

  // Product Performance section
  csvLines.push('# Product Performance');
  if (!reportData.product_performance || reportData.product_performance.length === 0) {
    csvLines.push('No product performance data.');
  } else {
    const productPerfHeaders = ['product_id', 'product_name', 'orders_count'];
    csvLines = csvLines.concat(convertToCSVRows(reportData.product_performance, productPerfHeaders));
  }
  csvLines.push('');

  // Join all lines with \r\n for better cross-platform compatibility
  const csvContent = csvLines.join('\r\n');

  downloadFile('vendor-report.csv', csvContent, 'text/csv');
};

const handleDownloadExcel = () => {
  if (!reportData) return;

  const wb = XLSX.utils.book_new();

  // 1) Total Orders sheet (simple 2-col table)
  const totalOrdersData = [
    ['Metric', 'Value'],
    ['Total Orders Completed', reportData.total_orders],
  ];
  const wsTotalOrders = XLSX.utils.aoa_to_sheet(totalOrdersData);
  XLSX.utils.book_append_sheet(wb, wsTotalOrders, 'Total Orders');

  // 2) Recent Orders sheet
  if (reportData.recent_orders.length > 0) {
    // Map data, format date
    const recentOrdersData = [
      ['Order ID', 'Product', 'Order Date', 'Status'],
      ...reportData.recent_orders.map(o => [
        o.order_id,
        o.product_name,
        new Date(o.order_date).toLocaleString(),
        o.status,
      ]),
    ];
    const wsRecentOrders = XLSX.utils.aoa_to_sheet(recentOrdersData);
    XLSX.utils.book_append_sheet(wb, wsRecentOrders, 'Recent Orders');
  } else {
    const wsRecentOrders = XLSX.utils.aoa_to_sheet([['No recent orders.']]);
    XLSX.utils.book_append_sheet(wb, wsRecentOrders, 'Recent Orders');
  }

  // 3) Product Performance sheet
  if (reportData.product_performance.length > 0) {
    const productPerformanceData = [
      ['Product ID', 'Product Name', 'Completed Orders'],
      ...reportData.product_performance.map(p => [
        p.product_id,
        p.product_name,
        p.orders_count,
      ]),
    ];
    const wsProductPerformance = XLSX.utils.aoa_to_sheet(productPerformanceData);
    XLSX.utils.book_append_sheet(wb, wsProductPerformance, 'Product Performance');
  } else {
    const wsProductPerformance = XLSX.utils.aoa_to_sheet([['No product performance data.']]);
    XLSX.utils.book_append_sheet(wb, wsProductPerformance, 'Product Performance');
  }

  // Generate Excel file and trigger download
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(blob, 'vendor-report.xlsx');
};

  if (loading) {
    return (
      <div className="rental-shop-container">
        <div className="loading">Loading Reports...</div>
      </div>
    );
  }
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!reportData) return null;

  return (
  <div className="reporting-container">
    <h2>Vendor Reporting Dashboard</h2>

    {/* Download Buttons */}
    <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
      <button onClick={handleDownloadJSON}>Download JSON</button>
      <button onClick={handleDownloadCSV}>Download CSV</button>
      <button onClick={handleDownloadExcel}>Download Excel</button>
    </div>

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
