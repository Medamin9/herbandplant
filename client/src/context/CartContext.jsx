import { createContext, useContext, useReducer, useEffect, useState } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM':
      const existingItem = state.items.find(
        item => item.id === action.payload.id && 
               item.selectedVolume === action.payload.selectedVolume
      );

      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id && 
            item.selectedVolume === action.payload.selectedVolume
              ? {
                  ...item,
                  quantity: item.quantity + action.payload.quantity,
                  subtotal: item.price * (item.quantity + action.payload.quantity),
                }
              : item
          )
        };
      } else {
        return {
          ...state,
          items: [...state.items, action.payload]
        };
      }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => 
          !(item.id === action.payload.id && 
            item.selectedVolume === action.payload.selectedVolume
        ))
      };

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id && 
          item.selectedVolume === action.payload.selectedVolume
            ? {
                ...item,
                quantity: action.payload.quantity,
                subtotal: item.price * action.payload.quantity,
              }
            : item
        )
      };

    case 'CLEAR_CART':
      return {
        ...state,
        items: []
      };

    case 'RESTORE_CART':
      return {
        ...state,
        items: action.payload
      };

    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [initialized, setInitialized] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      dispatch({ type: 'RESTORE_CART', payload: parsedCart });
    }
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (initialized) {
      localStorage.setItem('cart', JSON.stringify(state.items));
    }
  }, [state.items, initialized]);

  const addToCart = (product, quantity, selectedVolume) => {
    const finalPrice =
    product.promotion > 0
      ? product.price - (product.price * product.promotion) / 100
      : product.price;
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: product.id,
        name: product.name,
        price: finalPrice,
        image: product.banner,
        quantity,
        selectedVolume,
        subtotal: finalPrice * quantity
      }
    });
  };

  const removeFromCart = (id, selectedVolume) => {
    dispatch({
      type: 'REMOVE_ITEM',
      payload: { id, selectedVolume }
    });
  };

  const updateQuantity = (id, selectedVolume, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id, selectedVolume);
    } else {
      dispatch({
        type: 'UPDATE_QUANTITY',
        payload: { id, selectedVolume, quantity }
      });
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getCartTotal = () => {
    return state.items.reduce((total, item) => total + item.subtotal, 0);
  };

  const getCartItemCount = () => {
    return state.items.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    items: state.items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};