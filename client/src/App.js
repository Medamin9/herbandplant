// src/App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { CartProvider } from './context/CartContext';
import Home from './pages/Home';
import Login from './pages/Admin/Login';
import Dashboard from './pages/Admin/Dashboard';
import Products from './pages/Products';
import Product from './pages/Product';
import Contact from './pages/Contact';
import AboutUs from './pages/AboutUs';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';

function App() {
  return (
    <CartProvider>
      <Router>
        <div>
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/Products" element={<Products />} />
              <Route path="/Product/:name" element={<Product />} />
              <Route path="/Contact" element={<Contact />} />
              <Route path="/Aboutus" element={<AboutUs />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout-success" element={<CheckoutSuccess />} />

              <Route path='/admin/login' element={<Login />} />
              <Route path='/admin/dashboard' element={<Dashboard />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;