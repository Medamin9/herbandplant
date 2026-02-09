import { MdInventory, MdCategory, MdShoppingCart, MdRateReview, MdSettings, MdLogout } from 'react-icons/md';
import '../../../styles/pages/Admins/components/Sidebar.scss';

const Sidebar = ({ activePanel, setActivePanel, onLogout }) => {
  const menuItems = [
    { id: 'products', label: 'Products', icon: <MdInventory /> },
    { id: 'categories', label: 'Categories', icon: <MdCategory /> },
    { id: 'orders', label: 'Orders', icon: <MdShoppingCart /> },
    { id: 'reviews', label: 'Reviews', icon: <MdRateReview /> },
    { id: 'settings', label: 'Settings', icon: <MdSettings /> },
  ];

  return (
    <div className="admin-sidebar">
      <div className="sidebar-header">
        <h2>Admin Panel</h2>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activePanel === item.id ? 'active' : ''}`}
            onClick={() => setActivePanel(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}>
          <MdLogout />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;