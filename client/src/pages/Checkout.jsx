import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiShoppingBag } from 'react-icons/fi';
import '../styles/pages/Checkout.scss';
import axios from 'axios';
import { SERVER } from '../hooks/config';

const Checkout = () => {
  const { items, getCartTotal, clearCart } = useCart();
  console.log(items);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    payment_method: 'cash_on_delivery',
    order_notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customer_name || !formData.customer_email) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        ...formData,
        subtotal: getCartTotal(),
        shipping_cost: 8,
        total: getCartTotal() + 8,
        items: items.map(item => ({
          product_id: item.id,
          product_name: item.name,
          product_price: item.price,
          quantity: item.quantity,
          total_price: item.subtotal,
          volume: item.selectedVolume,
        }))
      };

      const response = await axios.post(`${SERVER}/orders`, orderData);
      clearCart();
      navigate('/checkout-success', { state: { orderId: response.data.order.id } });
    } catch (error) {
      console.error('Erreur lors de la soumission de la commande :', error);
      alert(error.response?.data?.error || 'Erreur lors de la soumission de la commande');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="empty-cart">
            <FiShoppingBag size={48} />
            <h2>Votre panier est vide</h2>
            <p>Ajoutez quelques produits à votre panier avant de passer à la caisse.</p>
            <button onClick={() => navigate('/products')}>
              Voir les produits
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <FiArrowLeft />
            Retour
          </button>
          <h1>Commande</h1>
        </div>

        <div className="checkout-content">
          <div className="order-summary">
            <h2>Récapitulatif de la commande</h2>
            <div className="order-items">
              {items.map((item, index) => (
                <div key={`${item.id}-${item.selectedVolume}-${index}`} className="order-item">
                  <div className="item-image">
                    <img src={SERVER + item.image} alt={item.name} />
                  </div>
                  <div className="item-details">
                    <h3>{item.name}</h3>
                    <p className="item-size">Volume : {item.selectedVolume}</p>
                    <p className="item-quantity">Quantité : {item.quantity}</p>
                    <p className="item-price">{item.price} DT</p>
                  </div>
                  <div className="item-subtotal">
                    Sous-total : {item.subtotal} DT
                  </div>
                </div>
              ))}
            </div>
            <div className="shipment">
              <span>Livraison :</span>
              <span className="shipment-amount">8 DT</span>
            </div>
            <div className="order-total">
              <span>Total :</span>
              <span className="total-amount">{getCartTotal() + 8} DT</span>
            </div>
          </div>

          <div className="checkout-form">
            <h2>Informations de livraison</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="customer_name">Nom complet *</label>
                <input
                  type="text"
                  id="customer_name"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="customer_email">Email *</label>
                <input
                  type="email"
                  id="customer_email"
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="customer_phone">Téléphone</label>
                <input
                  type="tel"
                  id="customer_phone"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="customer_address">Adresse de livraison</label>
                <textarea
                  id="customer_address"
                  name="customer_address"
                  value={formData.customer_address}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="payment_method">Méthode de paiement</label>
                <select
                  id="payment_method"
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleInputChange}
                >
                  <option value="cash_on_delivery">Paiement à la livraison</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="order_notes">Notes supplémentaires</label>
                <textarea
                  id="order_notes"
                  name="order_notes"
                  value={formData.order_notes}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Instructions spéciales ou préférences de livraison..."
                />
              </div>

              <button 
                type="submit" 
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Traitement en cours...' : 'Confirmer la commande'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
