import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AnalyticsTracker } from '@/components/AnalyticsTracker';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { queryClient } from '@/queries/client';
import AdminAnalytics from './pages/admin/Analytics';
import BoostManagement from './pages/admin/BoostManagement';
import BrandManagement from './pages/admin/BrandManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import CommissionManagement from './pages/admin/CommissionManagement';
import AdminComplaints from './pages/admin/Complaints';
import DiscountCodes from './pages/admin/DiscountCodes';
import EmailTemplates from './pages/admin/EmailTemplates';
import FlagKeywords from './pages/admin/FlagKeywords';
import HelpManagement from './pages/admin/HelpManagement';
import ListingModeration from './pages/admin/ListingModeration';
import MessageModeration from './pages/admin/MessageModeration';
import AdminOrders from './pages/admin/Orders';
import Overview from './pages/admin/Overview';
import AdminPayouts from './pages/admin/Payouts';
import Reports from './pages/admin/Reports';
import SellerCoupons from './pages/admin/SellerCoupons';
import SiteSettings from './pages/admin/SiteSettings';
import AdminSupport from './pages/admin/Support';
import TaxSettings from './pages/admin/TaxSettings';
import UserManagement from './pages/admin/UserManagement';
import AdminDashboard from './pages/AdminDashboard';
import Auth from './pages/Auth';
import Boost from './pages/Boost';
import Checkout from './pages/Checkout';
import CreateListing from './pages/CreateListing';
import HelpCenter from './pages/HelpCenter';
import Index from './pages/Index';
import ListingDetail from './pages/ListingDetail';
import Listings from './pages/Listings';
import Messages from './pages/Messages';
import MyListings from './pages/MyListings';
import MyOffers from './pages/MyOffers';
import NotFound from './pages/NotFound';
import Preferences from './pages/Preferences';
import ReturnsPolicy from './pages/ReturnsPolicy';
import SellerAnalytics from './pages/SellerAnalytics';
import SellerProfile from './pages/SellerProfile';
import Support from './pages/Support';
import Terms from './pages/Terms';
import Unsubscribe from './pages/Unsubscribe';
import UserProfile from './pages/UserProfile';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AnalyticsTracker />
              <Routes>
                <Route element={<Index />} path="/" />
                <Route element={<Listings />} path="/listings" />
                <Route element={<ListingDetail />} path="/listing/:id" />
                <Route element={<CreateListing />} path="/create-listing" />
                <Route element={<CreateListing />} path="/edit-listing/:id" />
                <Route element={<MyListings />} path="/my-listings" />
                <Route element={<Boost />} path="/boost" />
                <Route element={<MyOffers />} path="/my-offers" />
                <Route element={<Checkout />} path="/checkout" />
                <Route element={<Preferences />} path="/preferences" />
                <Route element={<HelpCenter />} path="/help" />
                <Route element={<Terms />} path="/terms" />
                <Route element={<ReturnsPolicy />} path="/returns" />
                <Route element={<Support />} path="/support" />
                <Route element={<Messages />} path="/messages" />
                <Route element={<SellerAnalytics />} path="/seller-analytics" />
                <Route element={<SellerProfile />} path="/seller/:id" />
                <Route element={<UserProfile />} path="/profile" />
                <Route element={<Auth />} path="/auth" />
                <Route element={<AdminDashboard />} path="/admin">
                  <Route element={<Overview />} index />
                  <Route element={<ListingModeration />} path="listings" />
                  <Route element={<MessageModeration />} path="messages" />
                  <Route element={<UserManagement />} path="users" />
                  <Route element={<CategoryManagement />} path="categories" />
                  <Route element={<BrandManagement />} path="brands" />
                  <Route element={<DiscountCodes />} path="discounts" />
                  <Route element={<FlagKeywords />} path="flag-keywords" />
                  <Route element={<HelpManagement />} path="help" />
                  <Route element={<Reports />} path="reports" />
                  <Route element={<AdminOrders />} path="orders" />
                  <Route element={<AdminComplaints />} path="complaints" />
                  <Route element={<TaxSettings />} path="tax" />
                  <Route element={<EmailTemplates />} path="email-templates" />
                  <Route element={<AdminSupport />} path="support" />
                  <Route element={<BoostManagement />} path="boosts" />
                  <Route element={<AdminAnalytics />} path="analytics" />
                  <Route element={<AdminPayouts />} path="payouts" />
                  <Route element={<CommissionManagement />} path="commission" />
                  <Route element={<SiteSettings />} path="site-settings" />
                  <Route element={<SellerCoupons />} path="seller-coupons" />
                </Route>
                <Route element={<Unsubscribe />} path="/unsubscribe" />
                <Route element={<NotFound />} path="*" />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
