import { Link } from "react-router-dom";
import sundayLogo from "@/assets/sunday-logo.png";

const Footer = () => (
  <footer className="border-t border-border bg-[#99ACFF] text-[#1a1a1a]">
    <div className="container py-12">
      <div className="grid gap-8 md:grid-cols-4">
        <div>
          <img src={sundayLogo} alt="Sunday" className="h-10 w-auto brightness-0 invert" />
          <p className="mt-2 text-sm opacity-70">
            The fashion marketplace for pre-loved luxury & streetwear.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider opacity-60">Shop</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li><Link to="/listings?category=women" className="hover:opacity-100">Women</Link></li>
            <li><Link to="/listings?category=men" className="hover:opacity-100">Men</Link></li>
            <li><Link to="/listings?category=shoes" className="hover:opacity-100">Shoes</Link></li>
            <li><Link to="/listings?category=bags" className="hover:opacity-100">Bags</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider opacity-60">Sell</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li><Link to="/create-listing" className="hover:opacity-100">List an Item</Link></li>
            <li><Link to="/auth" className="hover:opacity-100">Seller Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider opacity-60">Help</h4>
          <ul className="space-y-2 text-sm opacity-80">
            <li><Link to="/help" className="hover:opacity-100">Help Center</Link></li>
            <li><Link to="/help" className="hover:opacity-100">FAQ</Link></li>
            <li><a href="mailto:support@sunday.app" className="hover:opacity-100">Contact</a></li>
            <li><span className="cursor-pointer hover:opacity-100">Terms</span></li>
            <li><span className="cursor-pointer hover:opacity-100">Privacy</span></li>
          </ul>
        </div>
      </div>
      <div className="mt-10 border-t border-border/20 pt-6 text-center text-xs opacity-50">
        © 2026 Sunday. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
