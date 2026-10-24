import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import About from "@/pages/About";
import { Faq, Shipping, Contact } from "@/pages/InfoPages";
import Checkout from "@/pages/Checkout";
import { PaymentSuccess, PaymentCancel } from "@/pages/PaymentResult";
import Account from "@/pages/Account";
import AdminLayout from "@/pages/admin/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import Products from "@/pages/admin/Products";
import ProductForm from "@/pages/admin/ProductForm";
import Orders from "@/pages/admin/Orders";
import Discounts from "@/pages/admin/Discounts";
import Content from "@/pages/admin/Content";
import Leads from "@/pages/admin/Leads";

function PreviewRoute() {
  const { user } = useAuth();
  if (user === null) return null;
  if (!user || user.role !== "admin") return <Navigate to="/admin" replace />;
  return <ProductDetail preview />;
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/shop/:slug" element={<ProductDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/faq" element={<Faq />} />
              <Route path="/shipping" element={<Shipping />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/cancel" element={<PaymentCancel />} />
              <Route path="/account" element={<Account />} />
              <Route path="/preview/:slug" element={<PreviewRoute />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<Products />} />
                <Route path="products/new" element={<ProductForm />} />
                <Route path="products/:id" element={<ProductForm />} />
                <Route path="orders" element={<Orders />} />
                <Route path="discounts" element={<Discounts />} />
                <Route path="content" element={<Content />} />
                <Route path="leads" element={<Leads />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster theme="dark" position="bottom-left" toastOptions={{ style: { background: "#121215", border: "1px solid rgba(255,255,255,0.1)", color: "#fafafa", borderRadius: "2px" } }} />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
