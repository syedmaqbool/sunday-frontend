import bannerImage from '@/assets/mobile-app-banner.png';

export default function MobileAppBanner() {
  return (
    <section className="
      mx-auto mb-12 w-full max-w-7xl overflow-hidden rounded-3xl shadow-xl
      md:mb-16
    "
    >
      <img
        src={bannerImage}
        alt="Sunday Mobile App — coming soon"
        className="block h-auto w-full"
      />
    </section>
  );
}
