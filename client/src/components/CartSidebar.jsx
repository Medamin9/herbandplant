import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { FiX, FiShoppingBag, FiPlus, FiMinus, FiTrash2 } from 'react-icons/fi';
import { SERVER } from '../hooks/config';
import '../styles/components/CartSidebar.scss';
import { IoChevronForward } from "react-icons/io5";

const CartSidebar = ({ isOpen, onClose }) => {
  const { items, getCartTotal, getCartItemCount, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClose = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onClose();
      setIsAnimating(false);
    }, 300);
  };

  const handleQuantityChange = (id, selectedVolume, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(id, selectedVolume);
    } else {
      updateQuantity(id, selectedVolume, newQuantity);
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    handleClose();
    navigate('/checkout');
  };

  const handleClearCart = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vider le panier ?')) {
      clearCart();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`cart-sidebar-overlay ${isAnimating ? 'closing' : ''}`} onClick={handleClose}>
      <div className={`cart-sidebar ${isAnimating ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <button className="close-btn" onClick={handleClose}>
            <FiX size={24} />
          </button>
        </div>

        <div className="cart-content">
          {items.length === 0 ? (
            <div className="empty-cart">
              <FiShoppingBag size={48} />
              <h3>Votre panier est vide</h3>
              <p>Ajoutez des produits à votre panier</p>
              <button className="shop-btn" onClick={() => { handleClose(); navigate('/products'); }}>
                Voir les produits
              </button>
            </div>
          ) : (
            <>
              <div className="cart-items">
                <span className='notice'> {getCartItemCount()} {getCartItemCount() > 1 ? 'articles' : 'article'} dans votre panier </span>
                {items.map((item, index) => (
                  <div key={`${item.id}-${item.selectedVolume}-${index}`} className="cart-item">
                    <div className="item-image">
                      <img src={`${SERVER}${item.image}`} alt={item.name} />
                    </div>
                    <div className="item-details">
                      <div className="item-header">
                        <h4 className="item-name">{item.name}</h4>
                        <button
                          className="remove-item-btn"
                          onClick={() => removeFromCart(item.id, item.selectedVolume)}
                        >
                          <FiX />
                        </button>
                      </div>
                      <p className="item-price">{item.price} DT</p>
                      <p className="item-variant">
                        Volume: {item.selectedVolume}
                      </p>
                      <div className="item-controls">
                        <div className="quantity-controls">
                          <span className="quantity">Qté: {item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="summary-row">
                  <span>Coût Total :</span>
                  <span>{getCartTotal()} DT</span>
                </div>
                <div className="summary-row">
                  <span>Livraison Standard:</span>
                  <span>8 DT</span>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>{getCartTotal() + 8} DT</span>
                </div>
              </div>

              <div className="cart-actions">
                <button className="clear-cart-btn" onClick={handleClose}>
                  <IoChevronForward size={18} /> Continuer vos achat
                </button>
                <button className="checkout-btn" onClick={handleCheckout}>
                  Acheter
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartSidebar;
