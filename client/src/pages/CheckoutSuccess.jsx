import { useLocation, useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiHome, FiShoppingBag } from 'react-icons/fi';
import '../styles/pages/CheckoutSuccess.scss';

const CheckoutSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId;

  return (
    <div className="checkout-success-page">
      <div className="success-container">
        <div className="success-content">
          <div className="success-icon">
            <FiCheckCircle size={80} />
          </div>
          
          <h1>Order Confirmed!</h1>
          
          <p className="success-message">
            Thank you for your order. We’ve received your request and will process it shortly.
          </p>

          {orderId && (
            <div className="order-info">
              <p>Order Number: <strong>#{orderId}</strong></p>
              <p>Please keep this number for order tracking.</p>
            </div>
          )}

          <div className="next-steps">
            <h2>Next steps:</h2>
            <ul>
              <li>We’ll confirm your order via email</li>
              <li>You’ll receive updates on your order status</li>
              <li>We’ll contact you to arrange delivery</li>
            </ul>
          </div>

          <div className="action-buttons">
            <button 
              className="home-btn"
              onClick={() => navigate('/')}
            >
              <FiHome />
              Back to Home
            </button>
            
            <button 
              className="products-btn"
              onClick={() => navigate('/products')}
            >
              <FiShoppingBag />
              Continue Shopping
            </button>
          </div>

          <div className="contact-info">
            <p>Have questions? Contact us:</p>
            <p><strong>Email:</strong> m.anna@yahoo.com  </p>
            <p><strong>Phone:</strong> +971 507140470 </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
