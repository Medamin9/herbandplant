import { useState } from 'react';
import axios from 'axios';
import { SERVER } from '../../../hooks/config';
import { MdEmail, MdLock, MdSave } from 'react-icons/md';
import '../../../styles/pages/Admins/components/AdminSettings.scss';

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    currentPassword: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.put(`${SERVER}/admin`, formData, {
        withCredentials: true
      });

      setSuccess('Credentials updated successfully');
      setFormData({
        currentPassword: '',
        email: '',
        password: ''
      });

      // Update stored email if it was changed
      if (formData.email) {
        localStorage.setItem('adminEmail', response.data.admin.email);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  return (
    <div className="admin-settings">
      <div className="panel-header">
        <h2>Admin Settings</h2>
      </div>

      <div className="settings-form">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Current Password (required for any changes)</label>
            <div className="input-wrapper">
              <MdLock className="input-icon" />
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>New Email (optional)</label>
            <div className="input-wrapper">
              <MdEmail className="input-icon" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter new email"
              />
            </div>
          </div>

          <div className="form-group">
            <label>New Password (optional)</label>
            <div className="input-wrapper">
              <MdLock className="input-icon" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter new password"
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || (!formData.email && !formData.password)}
          >
            <MdSave />
            {loading ? 'Updating...' : 'Update Credentials'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;