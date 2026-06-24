import { useState, useEffect } from 'react';
import axios from 'axios';
import { SERVER } from '../../../hooks/config';
import { MdDelete, MdPerson, MdRateReview, MdImage } from 'react-icons/md';
import '../../../styles/pages/Admins/components/ReviewsPanel.scss';

const ReviewsPanel = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    author: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${SERVER}/reviews`);
      setReviews(response.data.reviews);
    } catch (err) {
      setError('Failed to fetch reviews');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({...formData, image: file});
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.description.trim() || !formData.author.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('description', formData.description);
      submitData.append('author', formData.author);
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      await axios.post(`${SERVER}/reviews`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess('Review added successfully!');
      setShowForm(false);
      setFormData({ description: '', author: '', image: null });
      setImagePreview(null);
      fetchReviews();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add review');
      console.error('Add review error:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    
    try {
      await axios.delete(`${SERVER}/reviews/${id}`, {
        withCredentials: true
      });
      setSuccess('Review deleted successfully!');
      fetchReviews();
    } catch (err) {
      setError('Failed to delete review');
      console.error('Delete review error:', err);
    }
  };

  if (loading) return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      fontSize: '18px',
      color: '#6c757d'
    }}>
      Loading reviews...
    </div>
  );

  return (
    <div className="reviews-panel">
      <div className="panel-header">
        <h2>Reviews Management</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          <MdRateReview /> Add Review
        </button>
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

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Review</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Author Name</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({...formData, author: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Review Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="4"
                  required
                />
              </div>

              <div className="form-group">
                <label>Author Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => {
                  setShowForm(false);
                  setImagePreview(null);
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="reviews-list">
        {reviews.map(review => (
          <div key={review.id} className="review-card">
            <div className="review-content">
              <div className="review-author">
                {review.image ? (
                  <img src={`${SERVER}${review.image}`} alt={review.author} className="author-image" />
                ) : (
                  <MdPerson />
                )}
                <span>{review.author}</span>
              </div>
              <p className="review-text">"{review.description}"</p>
            </div>
            
            <div className="review-actions">
              <button 
                className="btn-icon danger"
                onClick={() => handleDelete(review.id)}
              >
                <MdDelete />
              </button>
            </div>
          </div>
        ))}
      </div>

      {reviews.length === 0 && !loading && (
        <div className="empty-state">
          <MdRateReview />
          <p>No reviews yet</p>
        </div>
      )}
    </div>
  );
};

export default ReviewsPanel;