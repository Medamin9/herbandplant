import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { SERVER } from '../../../hooks/config';
import { MdAdd, MdEdit, MdDelete, MdImage, MdUpload, MdClose, MdExpandMore, MdExpandLess } from 'react-icons/md';
import '../../../styles/pages/Admins/components/CategoriesPanel.scss';

const CategoriesPanel = () => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [formData, setFormData] = useState({
    name: ''
  });
  const [subcategoryFormData, setSubcategoryFormData] = useState({
    name: '',
    category_id: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [existingImage, setExistingImage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const imageRef = useRef();

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
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

  const fetchSubcategories = async () => {
    try {
      const response = await axios.get(`${SERVER}/subcategories`);
      setSubcategories(response.data.subcategories);
    } catch (err) {
      console.error('Failed to fetch subcategories', err);
    }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const getSubcategoriesForCategory = (categoryId) => {
    return subcategories.filter(sub => sub.category_id === categoryId);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setExistingImage('');
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

  const handleSubcategorySubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      if (editingSubcategory) {
        await axios.put(`${SERVER}/subcategories/${editingSubcategory.id}`, subcategoryFormData, {
          withCredentials: true
        });
        setSuccessMessage('Subcategory updated successfully!');
      } else {
        await axios.post(`${SERVER}/subcategories`, subcategoryFormData, {
          withCredentials: true
        });
        setSuccessMessage('Subcategory created successfully!');
      }

      setTimeout(() => {
        setShowSubcategoryForm(false);
        setEditingSubcategory(null);
        setSelectedCategoryForSub(null);
        resetSubcategoryForm();
        fetchSubcategories();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save subcategory');
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

  const resetSubcategoryForm = () => {
    setSubcategoryFormData({ name: '', category_id: '' });
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({ name: category.name });
    setExistingImage(category.image || '');
    setShowForm(true);
    setError('');
    setSuccessMessage('');
  };

  const handleEditSubcategory = (subcategory) => {
    setEditingSubcategory(subcategory);
    setSubcategoryFormData({
      name: subcategory.name,
      category_id: subcategory.category_id
    });
    setShowSubcategoryForm(true);
    setError('');
    setSuccessMessage('');
  };

  const handleAddSubcategory = (categoryId) => {
    setSelectedCategoryForSub(categoryId);
    setSubcategoryFormData({
      name: '',
      category_id: categoryId
    });
    setShowSubcategoryForm(true);
    setError('');
    setSuccessMessage('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await axios.delete(`${SERVER}/categories/${id}`, {
        withCredentials: true
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

  const handleDeleteSubcategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subcategory?')) return;
    
    try {
      await axios.delete(`${SERVER}/subcategories/${id}`, {
        withCredentials: true
      });
      setSuccessMessage('Subcategory deleted successfully!');
      fetchSubcategories();
    } catch (err) {
      if (err.response?.status === 400) {
        setError(err.response.data.error);
      } else {
        setError('Failed to delete subcategory');
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
          <h2>Categories & Subcategories Management</h2>
          <p>Create and manage product categories and their subcategories</p>
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

      {/* Category Form Modal */}
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

      {/* Subcategory Form Modal */}
      {showSubcategoryForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingSubcategory ? 'Edit Subcategory' : 'Add New Subcategory'}</h3>
              <button className="close-modal" onClick={() => {
                setShowSubcategoryForm(false);
                setEditingSubcategory(null);
                setSelectedCategoryForSub(null);
                resetSubcategoryForm();
              }}>
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleSubcategorySubmit}>
              <div className="form-group">
                <label>Parent Category *</label>
                <select
                  value={subcategoryFormData.category_id}
                  onChange={(e) => setSubcategoryFormData({...subcategoryFormData, category_id: e.target.value})}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Subcategory Name *</label>
                <input
                  type="text"
                  value={subcategoryFormData.name}
                  onChange={(e) => setSubcategoryFormData({...subcategoryFormData, name: e.target.value})}
                  placeholder="Enter subcategory name"
                  required
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowSubcategoryForm(false);
                    setEditingSubcategory(null);
                    setSelectedCategoryForSub(null);
                    resetSubcategoryForm();
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
                      {editingSubcategory ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingSubcategory ? 'Update Subcategory' : 'Create Subcategory'
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
        <div className="categories-list">
          {categories.map(category => {
            const categorySubcategories = getSubcategoriesForCategory(category.id);
            const isExpanded = expandedCategories[category.id];
            
            return (
              <div key={category.id} className="category-item">
                <div className="category-main">
                  <div className="category-info">
                    <div className="category-image">
                      {category.image ? (
                        <img src={`${SERVER}${category.image}`} alt={category.name} />
                      ) : (
                        <div className="image-placeholder">
                          <MdImage />
                        </div>
                      )}
                    </div>
                    <div className="category-details">
                      <h4>{category.name}</h4>
                      <p>{category.products_count || 0} products · {categorySubcategories.length} subcategories</p>
                    </div>
                  </div>
                  
                  <div className="category-actions">
                    {categorySubcategories.length > 0 && (
                      <button 
                        className="btn-icon"
                        onClick={() => toggleCategory(category.id)}
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? <MdExpandLess /> : <MdExpandMore />}
                      </button>
                    )}
                    <button 
                      className="btn-icon"
                      onClick={() => handleAddSubcategory(category.id)}
                      title="Add Subcategory"
                    >
                      <MdAdd />
                    </button>
                    <button 
                      className="btn-icon"
                      onClick={() => handleEdit(category)}
                      title="Edit Category"
                    >
                      <MdEdit />
                    </button>
                    <button 
                      className="btn-icon danger"
                      onClick={() => handleDelete(category.id)}
                      title="Delete Category"
                    >
                      <MdDelete />
                    </button>
                  </div>
                </div>

                {isExpanded && categorySubcategories.length > 0 && (
                  <div className="subcategories-list">
                    {categorySubcategories.map(subcategory => (
                      <div key={subcategory.id} className="subcategory-item">
                        <div className="subcategory-info">
                          <span className="subcategory-name">{subcategory.name}</span>
                        </div>
                        <div className="subcategory-actions">
                          <button 
                            className="btn-icon-small"
                            onClick={() => handleEditSubcategory(subcategory)}
                            title="Edit Subcategory"
                          >
                            <MdEdit />
                          </button>
                          <button 
                            className="btn-icon-small danger"
                            onClick={() => handleDeleteSubcategory(subcategory.id)}
                            title="Delete Subcategory"
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
          })}
        </div>
      )}
    </div>
  );
};

export default CategoriesPanel;
