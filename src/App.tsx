import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

// View placeholders (to be created next)
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import CheckoutAuth from './pages/CheckoutAuth';
import Checkout from './pages/Checkout';
import Contact from './pages/Contact';
import Policy from './pages/Policy';
import Admin from './pages/admin/Admin';
import Profile from './pages/Profile';
import TrackOrder from './pages/TrackOrder';
import ResetPassword from './pages/ResetPassword';

const App = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout-auth" element={<CheckoutAuth />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Policy type="privacy" />} />
          <Route path="/terms" element={<Policy type="terms" />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin/*" element={<Admin />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
