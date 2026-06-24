import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { SERVER } from '../../../hooks/config';
import { MdAdd, MdEdit, MdDelete, MdImage, MdUpload, MdClose } from 'react-icons/md';
import '../../../styles/pages/Admins/components/CategoriesPanel.scss';

const CategoriesPanel = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [existingImage, setExistingImage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const imageRef = useRef();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${SERVER}/categories`);
      setCategories(response.data.categories);
    } catch (err) {
      setError('Failed to fetch categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setExistingImage(''); // Clear existing image when new file is selected
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const data = new FormData();
      data.append('name', formData.name);
      
      if (imageFile) {
        data.append('image', imageFile);
      } else if (existingImage) {
        data.append('image', existingImage);
      }

      let response;
      if (editingCategory) {
        response = await axios.put(`${SERVER}/categories/${editingCategory.id}`, data, {
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccessMessage('Category updated successfully!');
      } else {
        response = await axios.post(`${SERVER}/categories`, data, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccessMessage('Category created successfully!');
      }

      setTimeout(() => {
        setShowForm(false);
        setEditingCategory(null);
        resetForm();
        fetchCategories();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save category');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '' });
    setImageFile(null);
    setExistingImage('');
    if (imageRef.current) imageRef.current.value = '';
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({ name: category.name });
    setExistingImage(category.image || '');
    setShowForm(true);
    setError('');
    setSuccessMessage('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await axios.delete(`${SERVER}/categories/${id}`, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccessMessage('Category deleted successfully!');
      fetchCategories();
    } catch (err) {
      if (err.response?.status === 400) {
        setError(err.response.data.error);
      } else {
        setError('Failed to delete category');
      }
    }
  };

  if (loading) return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      fontSize: '18px',
      color: '#6c757d'
    }}>
      <div className="loading-spinner"></div>
      <p>Loading categories...</p>
    </div>
  );

  return (
    <div className="categories-panel">
      <div className="panel-header">
        <div className="header-content">
          <h2>Categories Management</h2>
          <p>Create and manage product categories</p>
        </div>
        <button 
          className="btn-primary add-category-btn"
          onClick={() => setShowForm(true)}
        >
          <MdAdd /> Add New Category
        </button>
      </div>

      {error && (
        <div className="message-banner error">
          <span>{error}</span>
          <button onClick={() => setError('')} className="close-btn">
            <MdClose />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="message-banner success">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="close-btn">
            <MdClose />
          </button>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
              <button className="close-modal" onClick={() => {
                setShowForm(false);
                setEditingCategory(null);
                resetForm();
              }}>
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter category name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Category Image</label>
                <div className="file-upload-container">
                  <div className="file-upload">
                    <input
                      ref={imageRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <div className="upload-content">
                      <MdUpload className="upload-icon" />
                      <span>{imageFile ? imageFile.name : 'Choose category image'}</span>
                    </div>
                  </div>
                  <p className="file-hint">Recommended: Square image, 500x500px, JPG or PNG</p>
                </div>
                
                {(existingImage && !imageFile) && (
                  <div className="existing-image">
                    <p>Current Image:</p>
                    <div className="image-preview">
                      <img src={`${SERVER}${existingImage}`} alt="Current category" />
                    </div>
                  </div>
                )}
                
                {imageFile && (
                  <div className="image-preview">
                    <p>New Image Preview:</p>
                    <img src={URL.createObjectURL(imageFile)} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCategory(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <div className="spinner"></div>
                      {editingCategory ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingCategory ? 'Update Category' : 'Create Category'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <MdImage />
          </div>
          <h3>No categories yet</h3>
          <p>Get started by creating your first product category</p>
          <button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            <MdAdd /> Create Category
          </button>
        </div>
      ) : (
        <div className="categories-grid">
          {categories.map(category => (
            <div key={category.id} className="category-card">
              <div className="card-header">
                <div className="category-image">
                  {category.image ? (
                    <img src={`${SERVER}${category.image}`} alt={category.name} />
                  ) : (
                    <div className="image-placeholder">
                      <MdImage />
                    </div>
                  )}
                </div>
                <div className="action-overlay">
                  <button 
                    className="btn-icon"
                    onClick={() => handleEdit(category)}
                  >
                    <MdEdit />
                  </button>
                </div>
              </div>
              
              <div className="card-content">
                <h4>{category.name}</h4>
                <p>{category.products_count || 0} products</p>
              </div>
              
              <div className="card-actions">
                <button 
                  className="btn-icon"
                  onClick={() => handleEdit(category)}
                >
                  <MdEdit />
                </button>
                <button 
                  className="btn-icon danger"
                  onClick={() => handleDelete(category.id)}
                >
                  <MdDelete />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoriesPanel;