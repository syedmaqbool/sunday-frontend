import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import LoadingSpinner from './components/LoadingSpinner';

const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'));
const BoostManagement = lazy(() => import('./pages/admin/BoostManagement'));
const BrandManagement = lazy(() => import('./pages/admin/BrandManagement'));
const Contact = lazy(() => import('./pages/Contact'));
const CategoryManagement = lazy(() => import('./pages/admin/CategoryManagement'));
const CommissionManagement = lazy(() => import('./pages/admin/CommissionManagement'));
const AdminComplaints = lazy(() => import('./pages/admin/Complaints'));
const DiscountCodes = lazy(() => import('./pages/admin/DiscountCodes'));
const EmailTemplates = lazy(() => import('./pages/admin/EmailTemplates'));
const FlagKeywords = lazy(() => import('./pages/admin/FlagKeywords'));
const HelpManagement = lazy(() => import('./pages/admin/HelpManagement'));
const ListingModeration = lazy(() => import('./pages/admin/ListingModeration'));
const MessageModeration = lazy(() => import('./pages/admin/MessageModeration'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const Overview = lazy(() => import('./pages/admin/Overview'));
const AdminPayouts = lazy(() => import('./pages/admin/Payouts'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const RolesPermissions = lazy(() => import('./pages/admin/RolesPermissions'));
const SellerCoupons = lazy(() => import('./pages/admin/SellerCoupons'));
const SiteSettings = lazy(() => import('./pages/admin/SiteSettings'));
const StaffUsers = lazy(() => import('./pages/admin/StaffUsers'));
const AdminSupport = lazy(() => import('./pages/admin/Support'));
const TaxSettings = lazy(() => import('./pages/admin/TaxSettings'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Auth = lazy(() => import('./pages/Auth'));
const Boost = lazy(() => import('./pages/Boost'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Cookies = lazy(() => import('./pages/Cookies'));
const CreateListing = lazy(() => import('./pages/CreateListing'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const Index = lazy(() => import('./pages/Index'));
const ListingDetail = lazy(() => import('./pages/ListingDetail'));
const Listings = lazy(() => import('./pages/Listings'));
const Messages = lazy(() => import('./pages/Messages'));
const MyListings = lazy(() => import('./pages/MyListings'));
const MyOffers = lazy(() => import('./pages/MyOffers'));
const NotFound = lazy(() => import('./pages/NotFound'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const PaymentCancel = lazy(() => import('./pages/PaymentCancel'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const Preferences = lazy(() => import('./pages/Preferences'));
const Privacy = lazy(() => import('./pages/Privacy'));
const ReturnsPolicy = lazy(() => import('./pages/ReturnsPolicy'));
const SellerAnalytics = lazy(() => import('./pages/SellerAnalytics'));
const SellerProfile = lazy(() => import('./pages/SellerProfile'));
const Support = lazy(() => import('./pages/Support'));
const Terms = lazy(() => import('./pages/Terms'));
const Unsubscribe = lazy(() => import('./pages/Unsubscribe'));
const UserProfile = lazy(() => import('./pages/UserProfile'));

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><Index /></Suspense>} path="/" />
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><Listings /></Suspense>} path="/listings" />
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><Contact /></Suspense>} path="/contact" />
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><ListingDetail /></Suspense>} path="/listing/:id" />
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><CreateListing /></Suspense>} path="/create-listing" />
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><CreateListing /></Suspense>} path="/edit-listing/:id" />
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><MyListings /></Suspense>} path="/my-listings" />
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><Boost /></Suspense>} path="/boost" />
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><MyOffers /></Suspense>} path="/my-offers" />
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><Checkout /></Suspense>} path="/checkout" />
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><Preferences /></Suspense>} path="/preferences" />
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><HelpCenter /></Suspense>} path="/help" />
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><Terms /></Suspense>} path="/terms" />
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><ReturnsPolicy /></Suspense>} path="/returns" />
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><Support /></Suspense>} path="/support" />
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><Messages /></Suspense>} path="/messages" />
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><Cookies /></Suspense>} path="/cookies" />
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><SellerAnalytics /></Suspense>} path="/seller-analytics" />
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><SellerProfile /></Suspense>} path="/seller/:id" />
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><UserProfile /></Suspense>} path="/profile" />
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><Privacy /></Suspense>} path="/privacy" />
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><OrderConfirmation /></Suspense>} path="/order-confirmation/:id" />
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><PaymentSuccess /></Suspense>} path="/payment/success" />
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><PaymentCancel /></Suspense>} path="/payment/cancel" />
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><Auth /></Suspense>} path="/auth" />
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><ForgotPassword /></Suspense>} path="/forgot-password" />
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><AdminDashboard /></Suspense>} path="/admin">
        <Route element={<Suspense fallback={<LoadingSpinner className="min-h-[calc(100vh-8rem)]" />}><Overview /></Suspense>} index />
        <Route element={<Suspense fallback={<LoadingSpinner className="min-h-[calc(100vh-8rem)]" />}><ListingModeration /></Suspense>} path="listings" />
        <Route element={<Suspense fallback={<LoadingSpinner className="min-h-[calc(100vh-8rem)]" />}><MessageModeration /></Suspense>} path="messages" />
        <Route element={<Suspense fallback={<LoadingSpinner className="min-h-[calc(100vh-8rem)]" />}><UserManagement /></Suspense>} path="users" />
        <Route element={<Suspense fallback={<LoadingSpinner className="min-h-[calc(100vh-8rem)]" />}><CategoryManagement /></Suspense>} path="categories" />
        <Route element={<Suspense fallback={<LoadingSpinner className="min-h-[calc(100vh-8rem)]" />}><BrandManagement /></Suspense>} path="brands" />
        <Route element={<Suspense fallback={<LoadingSpinner className="min-h-[calc(100vh-8rem)]" />}><DiscountCodes /></Suspense>} path="discounts" />
        <Route element={<Suspense fallback={<LoadingSpinner className="min-h-[calc(100vh-8rem)]" />}><FlagKeywords /></Suspense>} path="flag-keywords" />
        <Route element={<Suspense fallback={<LoadingSpinner className="min-h-[calc(100vh-8rem)]" />}><HelpManagement /></Suspense>} path="help" />
        <Route element={<Suspense fallback={<LoadingSpinner className="min-h-[calc(100vh-8rem)]" />}><Reports /></Suspense>} path="reports" />
        <Route element={<Suspense fallback={<LoadingSpinner className="min-h-[calc(100vh-8rem)]" />}><AdminOrders /></Suspense>} path="orders" />
        <Route element={<Suspense fallback={<LoadingSpinner className="min-h-[calc(100vh-8rem)]" />}><AdminComplaints /></Suspense>} path="complaints" />
        <Route element={<Suspense fallback={<LoadingSpinner className="min-h-[calc(100vh-8rem)]" />}><TaxSettings /></Suspense>} path="tax" />
        <Route element={<Suspense fallback={<LoadingSpinner className="min-h-[calc(100vh-8rem)]" />}><EmailTemplates /></Suspense>} path="email-templates" />
        <Route element={<Suspense fallback={<LoadingSpinner className="min-h-[calc(100vh-8rem)]" />}><AdminSupport /></Suspense>} path="support" />
        <Route element={<Suspense fallback={<LoadingSpinner className="min-h-[calc(100vh-8rem)]" />}><BoostManagement /></Suspense>} path="boosts" />
        <Route element={<Suspense fallback={<LoadingSpinner className="min-h-[calc(100vh-8rem)]" />}><AdminAnalytics /></Suspense>} path="analytics" />
        <Route element={<Suspense fallback={<LoadingSpinner className="min-h-[calc(100vh-8rem)]" />}><AdminPayouts /></Suspense>} path="payouts" />
        <Route element={<Suspense fallback={<LoadingSpinner className="min-h-[calc(100vh-8rem)]" />}><CommissionManagement /></Suspense>} path="commission" />
        <Route element={<Suspense fallback={<LoadingSpinner className="min-h-[calc(100vh-8rem)]" />}><SiteSettings /></Suspense>} path="site-settings" />
        <Route element={<Suspense fallback={<LoadingSpinner className="min-h-[calc(100vh-8rem)]" />}><SellerCoupons /></Suspense>} path="seller-coupons" />
        <Route element={<Suspense fallback={<LoadingSpinner className="min-h-[calc(100vh-8rem)]" />}><StaffUsers /></Suspense>} path="access-control/staff-users" />
        <Route element={<Suspense fallback={<LoadingSpinner className="min-h-[calc(100vh-8rem)]" />}><RolesPermissions /></Suspense>} path="access-control/roles" />
      </Route>
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><Unsubscribe /></Suspense>} path="/unsubscribe" />
      <Route element={<Suspense fallback={<LoadingSpinner className="min-h-screen" />}><NotFound /></Suspense>} path="*" />
    </Routes>
  );
}
