import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import Listings from "./pages/Listings";
import ListingDetail from "./pages/ListingDetail";
import CreateListing from "./pages/CreateListing";
import MyListings from "./pages/MyListings";
import MyOffers from "./pages/MyOffers";
import Auth from "./pages/Auth";
import Preferences from "./pages/Preferences";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import Messages from "./pages/Messages";
import SellerAnalytics from "./pages/SellerAnalytics";
import SellerProfile from "./pages/SellerProfile";
import AdminDashboard from "./pages/AdminDashboard";
import Overview from "./pages/admin/Overview";
import ListingModeration from "./pages/admin/ListingModeration";
import UserManagement from "./pages/admin/UserManagement";
import MessageModeration from "./pages/admin/MessageModeration";
import DiscountCodes from "./pages/admin/DiscountCodes";
import CategoryManagement from "./pages/admin/CategoryManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/listings" element={<Listings />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/create-listing" element={<CreateListing />} />
            <Route path="/edit-listing/:id" element={<CreateListing />} />
            <Route path="/my-listings" element={<MyListings />} />
            <Route path="/my-offers" element={<MyOffers />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/seller-analytics" element={<SellerAnalytics />} />
            <Route path="/seller/:id" element={<SellerProfile />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<AdminDashboard />}>
              <Route index element={<Overview />} />
              <Route path="listings" element={<ListingModeration />} />
              <Route path="messages" element={<MessageModeration />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="categories" element={<CategoryManagement />} />
              <Route path="discounts" element={<DiscountCodes />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
