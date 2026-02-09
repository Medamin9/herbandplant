import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { SERVER } from '../../../hooks/config';
import { 
  MdAdd, MdEdit, MdDelete, MdImage, MdUpload, 
  MdClose, MdVisibility, MdArrowBack, MdSave 
} from 'react-icons/md';
import '../../../styles/pages/Admins/components/ProductsPanel.scss';

const ProductsPanel = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    volumes: '',
    description: '',
    long_description: '',
    composition: '',
    usage: '',
    promotion: 0,
    new_product: false,
    top_vente: false,
    stock_repture: false,
    category_id: ''
  });
  const [bannerFile, setBannerFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [existingBanner, setExistingBanner] = useState('');
  const [existingImages, setExistingImages] = useState([]);
  
  const bannerRef = useRef();
  const imagesRef = useRef();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${SERVER}/products`);
      setProducts(response.data.products);
    } catch (err) {
      setError('Failed to fetch products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${SERVER}/categories`);
      setCategories(response.data.categories);
    } catch (err) {
      console.error('Failed to fetch categories');
    }
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      setExistingBanner(''); // Clear existing banner when new file is selected
    }
  };

  const handleImagesUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 3); // Limit to 3 files
    setImageFiles(files);
    setExistingImages([]); // Clear existing images when new files are selected
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError('');
    
    try {
      const data = new FormData();
      
      // Append form data
      Object.keys(formData).forEach(key => {
        if (key === 'volumes') {
          const values = formData[key]
            .split(',')
            .map(item => item.trim())
            .filter(item => item);
          data.append(key, JSON.stringify(values));
        } else {
          data.append(key, formData[key]);
        }
      });

      if (bannerFile) {
        data.append('banner', bannerFile);
      } else if (existingBanner) {
        data.append('banner', existingBanner);
      }

      // Handle images upload
      if (imageFiles.length > 0) {
        imageFiles.forEach(file => {
          data.append('images', file);
        });
      } else if (existingImages.length > 0) {
        data.append('images', JSON.stringify(existingImages));
      }

      let response;
      if (editingProduct) {
        response = await axios.put(`${SERVER}/products/${editingProduct.id}`, data, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Product updated successfully!');
      } else {
        response = await axios.post(`${SERVER}/products`, data, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Product created successfully!');
      }

      setShowForm(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save product: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      volumes: '',
      description: '',
      long_description: '',
      composition: '',
      usage: '',
      promotion: 0,
      new_product: false,
      top_vente: false,
      stock_repture: false,
      category_id: ''
    });
    setBannerFile(null);
    setImageFiles([]);
    setExistingBanner('');
    setExistingImages([]);
    if (bannerRef.current) bannerRef.current.value = '';
    if (imagesRef.current) imagesRef.current.value = '';
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      ...product,
      volumes: product.volumes?.join(', ') || '',
    });
    setExistingBanner(product.banner || '');
    setExistingImages(product.images || []);
    setShowForm(true);
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setViewMode('detail');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await axios.delete(`${SERVER}/products/${id}`, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Product deleted successfully!');
      fetchProducts();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete product: ' + (err.response?.data?.message || err.message));
    }
  };

  const removeExistingImage = (index) => {
    const updatedImages = [...existingImages];
    updatedImages.splice(index, 1);
    setExistingImages(updatedImages);
  };

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !filterCategory || product.category_id === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      return 0;
    });

  if (loading) return <div className="loading">Loading products...</div>;

  if (viewMode === 'detail' && selectedProduct) {
    return (
      <div className="product-detail-view">
        <div className="detail-header">
          <button className="btn-back" onClick={() => setViewMode('grid')}>
            <MdArrowBack /> Back to Products
          </button>
          <h2>{selectedProduct.name}</h2>
          <div className="detail-actions">
            <button className="btn-primary" onClick={() => handleEdit(selectedProduct)}>
              <MdEdit /> Edit
            </button>
            <button className="btn-danger" onClick={() => handleDelete(selectedProduct.id)}>
              <MdDelete /> Delete
            </button>
          </div>
        </div>

        <div className="detail-content">
          <div className="detail-images">
            <div className="main-image">
              <img src={`${SERVER}${selectedProduct.banner}`} alt={selectedProduct.name} />
            </div>
            <div className="thumbnail-images">
              {selectedProduct.images?.map((img, index) => (
                <img key={index} src={`${SERVER}${img}`} alt={`${selectedProduct.name} ${index + 1}`} />
              ))}
            </div>
          </div>

          <div className="detail-info">
            <div className="info-section">
              <h3>Product Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Name:</label>
                  <span>{selectedProduct.name}</span>
                </div>
                <div className="info-item">
                  <label>Price:</label>
                  <span>${selectedProduct.price}</span>
                </div>
                <div className="info-item">
                  <label>Category:</label>
                  <span>{selectedProduct.category_name || 'Uncategorized'}</span>
                </div>
                <div className="info-item">
                  <label>Promotion:</label>
                  <span>{selectedProduct.promotion || 0}%</span>
                </div>
                <div className="info-item">
                  <label>Volumes:</label>
                  <span>{selectedProduct.volumes?.join(', ') || 'Not specified'}</span>
                </div>
                <div className="info-item full-width">
                  <label>Description:</label>
                  <p>{selectedProduct.description || 'No description available'}</p>
                </div>
                <div className="info-item full-width">
                  <label>Long description:</label>
                  <p>{selectedProduct.long_description || 'No long description available'}</p>
                </div><div className="info-item full-width">
                  <label>Composition:</label>
                  <p>{selectedProduct.composition || 'No composition available'}</p>
                </div><div className="info-item full-width">
                  <label>Usage:</label>
                  <p>{selectedProduct.usage || 'No Usage available'}</p>
                </div>
                <div className="info-item">
                  <label>New Product:</label>
                  <span>{selectedProduct.new_product ? 'Yes' : 'No'}</span>
                </div>
                <div className="info-item">
                  <label>Top Selling:</label>
                  <span>{selectedProduct.top_vente ? 'Yes' : 'No'}</span>
                </div>
                <div className="info-item">
                  <label>Rupture de stock:</label>
                  <span>{selectedProduct.stock_repture ? 'Yes' : 'No'}</span>
                </div>
                <div className="info-item">
                  <label>Created:</label>
                  <span>{new Date(selectedProduct.created_at).toLocaleDateString()}</span>
                </div>
                <div className="info-item">
                  <label>Last Updated:</label>
                  <span>{new Date(selectedProduct.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="products-panel">
      <div className="panel-header">
        <h2>Products Management</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          <MdAdd /> Add Product
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      <div className="controls-row">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-controls">
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
            <option value="newest">Sort by Newest</option>
          </select>
        </div>
      </div>

      <div className="products-grid">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                {product.banner ? (
                  <img src={`${SERVER}${product.banner}`} alt={product.name} />
                ) : (
                  <MdImage className="placeholder-image" />
                )}
                {product.promotion > 0 && (
                  <div className="promotion-badge">
                    {Number(product.promotion)}%
                  </div>
                )}
                {product.new_product && (
                  <div className="new-badge">NEW</div>
                )}
                {product.top_vente && (
                  <div className="bestseller-badge">BESTSELLER</div>
                )}
                {product.stock_repture && (
                  <div className="outofstock-badge">OUT OF STOCK</div>
                )}
              </div>
              
              <div className="product-info">
                <h4>{product.name}</h4>
                <div className="price-container">
                  {product.promotion > 0 ? (
                    <>
                      <span className="original-price">{product.price} DT</span>
                      <span className="discounted-price">
                        {(product.price * (1 - product.promotion / 100)).toFixed(2)} DT
                      </span>
                    </>
                  ) : (
                    <span className="price">${product.price}</span>
                  )}
                </div>
                <p className="category">{product.category_name || 'Uncategorized'}</p>
                <p className="description">{product.description?.substring(0, 60)}...</p>
              </div>
              
              <div className="product-actions">
                <button 
                  className="btn-icon view"
                  onClick={() => handleViewDetails(product)}
                  title="View Details"
                >
                  <MdVisibility />
                </button>
                <button 
                  className="btn-icon"
                  onClick={() => handleEdit(product)}
                  title="Edit"
                >
                  <MdEdit />
                </button>
                <button 
                  className="btn-icon danger"
                  onClick={() => handleDelete(product.id)}
                  title="Delete"
                >
                  <MdDelete />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-products">
            <MdImage />
            <p>No products found</p>
            <button 
              className="btn-primary"
              onClick={() => setShowForm(true)}
            >
              <MdAdd /> Add Your First Product
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit' : 'Add'} Product</h3>
              <button className="btn-close" onClick={() => {
                setShowForm(false);
                setEditingProduct(null);
                resetForm();
              }}>
                <MdClose />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Promotion (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.promotion}
                    onChange={(e) => setFormData({...formData, promotion: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Volumes (comma separated)</label>
                  <input
                    type="text"
                    value={formData.volumes}
                    onChange={(e) => setFormData({...formData, volumes: e.target.value})}
                    placeholder="30ML, 50ML, 100ML"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Banner Image *</label>
                  <div className="file-upload">
                    <input
                      ref={bannerRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                    />
                    <div className="upload-area">
                      <MdUpload className="upload-icon" />
                      <span>{bannerFile ? bannerFile.name : 'Choose banner image'}</span>
                    </div>
                  </div>
                  {existingBanner && !bannerFile && (
                    <div className="existing-image">
                      <img src={`${SERVER}${existingBanner}`} alt="Current banner" />
                      <span>Current banner</span>
                    </div>
                  )}
                </div>

                <div className="form-group full-width">
                  <label>Product Images (Max 3)</label>
                  <div className="file-upload">
                    <input
                      ref={imagesRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImagesUpload}
                    />
                    <div className="upload-area">
                      <MdUpload className="upload-icon" />
                      <span>{imageFiles.length > 0 ? `${imageFiles.length} files selected` : 'Choose product images'}</span>
                    </div>
                  </div>
                  
                  {/* Existing images */}
                  {existingImages.length > 0 && imageFiles.length === 0 && (
                    <div className="existing-images">
                      <p>Current images (click to remove):</p>
                      <div className="image-grid">
                        {existingImages.map((img, index) => (
                          <div key={index} className="existing-image" onClick={() => removeExistingImage(index)}>
                            <img src={`${SERVER}${img}`} alt={`Product ${index + 1}`} />
                            <span className="remove-text">Remove</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New image previews */}
                  {imageFiles.length > 0 && (
                    <div className="image-previews">
                      <p>New images:</p>
                      <div className="image-grid">
                        {imageFiles.map((file, index) => (
                          <div key={index} className="image-preview">
                            <img src={URL.createObjectURL(file)} alt={`Preview ${index + 1}`} />
                            <span>{file.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="4"
                    placeholder="Enter product description..."
                  />
                </div>
                <div className="form-group full-width">
                  <label>Long Description</label>
                  <textarea
                    value={formData.long_description}
                    onChange={(e) => setFormData({...formData, long_description: e.target.value})}
                    rows="4"
                    placeholder="Enter product Long description..."
                  />
                </div>
                <div className="form-group full-width">
                  <label>Composition</label>
                  <textarea
                    value={formData.composition}
                    onChange={(e) => setFormData({...formData, composition: e.target.value})}
                    rows="4"
                    placeholder="Enter product composition..."
                  />
                </div><div className="form-group full-width">
                  <label>Usage</label>
                  <textarea
                    value={formData.usage}
                    onChange={(e) => setFormData({...formData, usage: e.target.value})}
                    rows="4"
                    placeholder="Enter product Long usage..."
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.new_product}
                      onChange={(e) => setFormData({...formData, new_product: e.target.checked})}
                    />
                    <span className="checkmark"></span>
                    New Product
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.top_vente}
                      onChange={(e) => setFormData({...formData, top_vente: e.target.checked})}
                    />
                    <span className="checkmark"></span>
                    Top Selling
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.stock_repture}
                      onChange={(e) => setFormData({...formData, stock_repture: e.target.checked})}
                    />
                    <span className="checkmark"></span>
                    Rupture de stock
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingProduct(null);
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
                    <>Uploading...</>
                  ) : (
                    <>
                      {editingProduct ? <><MdSave /> Update</> : <><MdAdd /> Create</>} Product
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPanel;