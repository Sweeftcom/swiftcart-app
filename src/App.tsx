import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Splash from "./pages/Splash";
import Auth from "./pages/Auth";
import Location from "./pages/Location";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import CategoryProducts from "./pages/CategoryProducts";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import OrderTracking from "./pages/OrderTracking";
import NotFound from "./pages/NotFound";

// Admin and Operational Hubs
import { OrderHeartbeat } from "./admin/OrderHeartbeat";
import { Heatmap } from "./admin/Heatmap";
import { MarketingDashboard } from "./admin/MarketingDashboard";
import { ZoneController } from "./admin/ZoneController";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route path="/" element={<Splash />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/location" element={<Location />} />
            <Route path="/home" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:orderId" element={<OrderTracking />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/category/:slug" element={<CategoryProducts />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:slug" element={<ProductDetail />} />

            {/* Admin & Operations Routes */}
            <Route path="/admin/heartbeat" element={<OrderHeartbeat />} />
            <Route path="/admin/heatmap" element={<Heatmap />} />
            <Route path="/admin/marketing" element={<MarketingDashboard />} />
            <Route path="/admin/zones" element={<ZoneController />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
