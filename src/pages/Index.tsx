import CategoryGrid from '@/components/CategoryGrid';
import FeaturedListings from '@/components/FeaturedListings';
import Footer from '@/components/Footer';
import HeroSection from '@/components/HeroSection';
import MobileAppBanner from '@/components/MobileAppBanner';
import Navbar from '@/components/Navbar';
import TopFAQs from '@/components/TopFAQs';
import TrendingProducts from '@/components/TrendingProducts';
import WhyShopWithUs from '@/components/WhyShopWithUs';

export default function Index() {
  return (
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
}
