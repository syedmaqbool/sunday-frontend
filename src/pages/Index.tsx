import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CategoryGrid from "@/components/CategoryGrid";
import TrendingProducts from "@/components/TrendingProducts";
import FeaturedListings from "@/components/FeaturedListings";
import TopFAQs from "@/components/TopFAQs";
import MobileAppBanner from "@/components/MobileAppBanner";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="flex min-h-screen flex-col">
    <Navbar />
    <main className="flex-1">
      <HeroSection />
      <CategoryGrid />
      <TrendingProducts />
      <FeaturedListings />
      <TopFAQs />
    </main>
    <MobileAppBanner />
    <Footer />
  </div>
);

export default Index;
