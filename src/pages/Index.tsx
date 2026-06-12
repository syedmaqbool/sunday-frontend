import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CategoryGrid from "@/components/CategoryGrid";
import TrendingProducts from "@/components/TrendingProducts";
import FeaturedListings from "@/components/FeaturedListings";
import TopFAQs from "@/components/TopFAQs";
import WhyShopWithUs from "@/components/WhyShopWithUs";
import MobileAppBanner from "@/components/MobileAppBanner";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="flex min-h-screen flex-col">
    <Navbar />
    <main className="flex-1">
      <HeroSection />
      <CategoryGrid />
      <FeaturedListings variant="fresh" />
      <WhyShopWithUs />
      <TrendingProducts />
      <FeaturedListings variant="personalized" />
      <TopFAQs />
    </main>
    <MobileAppBanner />
    <Footer />
  </div>
);

export default Index;
