import { useState, useEffect } from 'react';
import axios from 'axios';
import { SERVER } from '../../../hooks/config';
import { MdShoppingCart, MdPerson, MdEmail, MdPhone, MdLocationOn, MdLocalShipping } from 'react-icons/md';
import '../../../styles/pages/Admins/components/OrdersPanel.scss';

const OrdersPanel = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const url = statusFilter === 'all' 
        ? `${SERVER}/orders` 
        : `${SERVER}/orders?status=${statusFilter}`;
      
      const response = await axios.get(url, {
        withCredentials: true,
      });
      setOrders(response.data.orders);
    } catch (err) {
      setError('Failed to fetch orders');
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${SERVER}/orders/${orderId}/status`, 
        { status: newStatus },
        { withCredentials: true }
      );
      fetchOrders(); // Refresh orders
    } catch (err) {
      setError('Failed to update order status');
      console.error('Update order status error:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  if (loading) return <div className="loading">Loading orders...</div>;

  return (
    <div className="orders-panel">
      <div className="panel-header">
        <div className="header-left">
          <h2>Orders Management</h2>
          <span className="orders-count">{orders.length} orders</span>
        </div>
        <div className="filter-controls">
          <label>Filter by status:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="orders-grid">
        {orders.map(order => (
          <div key={order.id} className="order-card">
            {/* Order Header */}
            <div className="order-header">
              <div className="order-main-info">
                <div className="order-number">#{order.order_number}</div>
                <div className="order-date">{formatDate(order.created_at)}</div>
              </div>
              <div className="order-status">
                <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                  {order.status}
                </span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="customer-section">
              <div className="section-title">
                <MdPerson />
                <span>Customer</span>
              </div>
              <div className="customer-details">
                <div className="customer-name">{order.customer_name}</div>
                <div className="customer-contact">
                  <div className="contact-item">
                    <MdEmail />
                    <span>{order.customer_email}</span>
                  </div>
                  {order.customer_phone && (
                    <div className="contact-item">
                      <MdPhone />
                      <span>{order.customer_phone}</span>
                    </div>
                  )}
                </div>
                <div className="customer-address">
                  <MdLocationOn />
                  <span>{order.customer_address}</span>
                  {(order.customer_city || order.customer_zip_code) && (
                    <span className="address-details">
                      {order.customer_city && `${order.customer_city}`}
                      {order.customer_zip_code && ` ${order.customer_zip_code}`}
                      {order.customer_country && `, ${order.customer_country}`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="items-section">
              <div className="section-title">
                <MdShoppingCart />
                <span>Items ({order.items?.length || 0})</span>
              </div>
              <div className="items-list">
                {order.items && order.items.map(item => (
                  <div key={item.id} className="item-row">
                    <div className="item-info">
                      <div className="item-name">{item.product_name}</div>
                      <div className="item-variants">
                        {item.size && <span className="variant">Size: {item.size}</span>}
                        {item.color && <span className="variant">Color: {item.color}</span>}
                      </div>
                    </div>
                    <div className="item-quantity">{item.quantity}x</div>
                    <div className="item-price">{item.product_price} DT</div>
                    <div className="item-total">{item.total_price} DT</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="summary-section">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{order.subtotal} DT</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>{order.shipping_cost} DT</span>
              </div>
              <div className="summary-row total-row">
                <span>Total</span>
                <span>{order.total} DT</span>
              </div>
              <div className="payment-info">
                <span className="payment-method">{order.payment_method}</span>
              </div>
            </div>

            {/* Order Notes */}
            {order.order_notes && (
              <div className="notes-section">
                <div className="section-title">
                  <span>Notes</span>
                </div>
                <div className="notes-content">{order.order_notes}</div>
              </div>
            )}

            {/* Actions */}
            <div className="order-actions">
              <label>Update Status:</label>
              <select 
                value={order.status} 
                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                className="status-select"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && !loading && (
        <div className="empty-state">
          <MdShoppingCart />
          <p>No orders found</p>
        </div>
      )}
    </div>
  );
};

export default OrdersPanel;