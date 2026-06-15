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
import Boost from "./pages/Boost";
import MyOffers from "./pages/MyOffers";
import Auth from "./pages/Auth";
import Preferences from "./pages/Preferences";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import Terms from "./pages/Terms";
import ReturnsPolicy from "./pages/ReturnsPolicy";
import Messages from "./pages/Messages";
import SellerAnalytics from "./pages/SellerAnalytics";
import SellerProfile from "./pages/SellerProfile";
import UserProfile from "./pages/UserProfile";
import AdminDashboard from "./pages/AdminDashboard";
import Overview from "./pages/admin/Overview";
import ListingModeration from "./pages/admin/ListingModeration";
import UserManagement from "./pages/admin/UserManagement";
import MessageModeration from "./pages/admin/MessageModeration";
import DiscountCodes from "./pages/admin/DiscountCodes";
import CategoryManagement from "./pages/admin/CategoryManagement";
import BrandManagement from "./pages/admin/BrandManagement";
import FlagKeywords from "./pages/admin/FlagKeywords";
import HelpManagement from "./pages/admin/HelpManagement";
import Reports from "./pages/admin/Reports";
import AdminOrders from "./pages/admin/Orders";
import AdminComplaints from "./pages/admin/Complaints";
import TaxSettings from "./pages/admin/TaxSettings";
import EmailTemplates from "./pages/admin/EmailTemplates";
import HelpCenter from "./pages/HelpCenter";
import Unsubscribe from "./pages/Unsubscribe";
import Support from "./pages/Support";
import AdminSupport from "./pages/admin/Support";
import BoostManagement from "./pages/admin/BoostManagement";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminPayouts from "./pages/admin/Payouts";
import CommissionManagement from "./pages/admin/CommissionManagement";
import SiteSettings from "./pages/admin/SiteSettings";
import SellerCoupons from "./pages/admin/SellerCoupons";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnalyticsTracker />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/listings" element={<Listings />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/create-listing" element={<CreateListing />} />
            <Route path="/edit-listing/:id" element={<CreateListing />} />
            <Route path="/my-listings" element={<MyListings />} />
            <Route path="/boost" element={<Boost />} />
            <Route path="/my-offers" element={<MyOffers />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/returns" element={<ReturnsPolicy />} />
            <Route path="/support" element={<Support />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/seller-analytics" element={<SellerAnalytics />} />
            <Route path="/seller/:id" element={<SellerProfile />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<AdminDashboard />}>
              <Route index element={<Overview />} />
              <Route path="listings" element={<ListingModeration />} />
              <Route path="messages" element={<MessageModeration />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="categories" element={<CategoryManagement />} />
              <Route path="brands" element={<BrandManagement />} />
              <Route path="discounts" element={<DiscountCodes />} />
              <Route path="flag-keywords" element={<FlagKeywords />} />
              <Route path="help" element={<HelpManagement />} />
              <Route path="reports" element={<Reports />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="complaints" element={<AdminComplaints />} />
              <Route path="tax" element={<TaxSettings />} />
              <Route path="email-templates" element={<EmailTemplates />} />
              <Route path="support" element={<AdminSupport />} />
              <Route path="boosts" element={<BoostManagement />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="payouts" element={<AdminPayouts />} />
              <Route path="commission" element={<CommissionManagement />} />
              <Route path="site-settings" element={<SiteSettings />} />
            </Route>
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
