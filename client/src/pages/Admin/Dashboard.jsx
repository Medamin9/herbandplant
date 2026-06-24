import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SERVER } from '../../hooks/config';
import '../../styles/pages/Admins/Dashboard.scss';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ProductsPanel from './components/ProductsPanel';
import CategoriesPanel from './components/CategoriesPanel';
import OrdersPanel from './components/OrdersPanel';
import ReviewsPanel from './components/ReviewsPanel';
import AdminSettings from './components/AdminSettings';
import BannersPanel from './components/BannersPanel';

const Dashboard = () => {
  const [activePanel, setActivePanel] = useState('products');
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${SERVER}/admin/me`, {
        withCredentials: true
      });

      if (response.status === 200) {
        setAdminData(response.data.admin);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      localStorage.removeItem('adminEmail');
      navigate('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${SERVER}/admin/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('adminEmail');
      navigate('/admin/login');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <Sidebar 
        activePanel={activePanel} 
        setActivePanel={setActivePanel}
        onLogout={handleLogout}
      />
      
      <div className="dashboard-content">
        <Header adminData={adminData} />
        
        <div className="panel-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          {activePanel === 'products' && <ProductsPanel />}
          {activePanel === 'categories' && <CategoriesPanel />}
          {activePanel === 'orders' && <OrdersPanel />}
          {activePanel === 'reviews' && <ReviewsPanel />}
          {activePanel === 'banners' && <BannersPanel />}
          {activePanel === 'settings' && <AdminSettings />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;