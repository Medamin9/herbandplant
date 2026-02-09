import '../../../styles/pages/Admins/components/Header.scss';

const Header = ({ adminData }) => {
  return (
    <header className="dashboard-header">
      <div className="header-content">
        <h1>Dashboard</h1>
        <div className="admin-info">
          <span>Welcome, {adminData?.email}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;