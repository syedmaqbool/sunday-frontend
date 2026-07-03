import { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ChevronLeft } from "lucide-react";

const Privacy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container flex-1 py-12">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to home
        </Link>
        <article className="mx-auto max-w-3xl">
          <h1 className="mb-2 font-heading text-3xl font-bold">Privacy Policy</h1>
          <p className="mb-8 text-sm text-muted-foreground">
            Effective Date: 2 July 2026&nbsp;&nbsp;|&nbsp;&nbsp;Last Updated: 2 July 2026
          </p>

          <section className="mb-8">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Welcome to Sunday (“we,” “our,” or “us”), a marketplace platform where users can buy and sell used or thrift products. Your privacy is important to us, and this Privacy Policy explains how we collect, use, store, and protect your information when you use our website, mobile application, and related services (collectively, the “Platform”).
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              By using Sunday, you agree to the practices described in this Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">1. Information We Collect</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">We may collect the following types of information:</p>

            <h3 className="mt-4 mb-2 font-heading text-lg font-semibold">A. Information You Provide</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">When you create an account or use our services, we may collect:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>Full name or username</li>
              <li>Email address</li>
              <li>Phone number (optional)</li>
              <li>Profile picture (optional)</li>
              <li>Billing or payment information</li>
              <li>Shipping or pickup details</li>
              <li>Product listings, descriptions, and photos</li>
              <li>Messages sent through the platform</li>
            </ul>

            <h3 className="mt-4 mb-2 font-heading text-lg font-semibold">B. Automatically Collected Information</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">When you use Sunday, we may automatically collect:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>IP address</li>
              <li>Browser type and device information</li>
              <li>Operating system</li>
              <li>Usage activity and browsing behavior</li>
              <li>Cookies and tracking technologies</li>
              <li>Location information (if enabled)</li>
            </ul>

            <h3 className="mt-4 mb-2 font-heading text-lg font-semibold">C. Transaction Information</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">We may collect details related to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>Purchases and sales</li>
              <li>Payment history</li>
              <li>Order details</li>
              <li>Refunds or disputes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">2. How We Use Your Information</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">We use your information to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>Create and manage user accounts</li>
              <li>Facilitate buying and selling transactions</li>
              <li>Improve platform functionality and user experience</li>
              <li>Process payments and prevent fraud</li>
              <li>Provide customer support</li>
              <li>Communicate updates, promotions, and service notifications</li>
              <li>Monitor platform safety and security</li>
              <li>Enforce our Terms of Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">3. User Listings and Public Information</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              When you post items for sale on Sunday, your product listings may be publicly visible, your username/profile information may be displayed, and uploaded images and descriptions can be viewed by other users. Please avoid sharing sensitive personal information in listings or messages.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">4. Payments</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Payments may be processed through third-party payment providers. Sunday does not store complete credit/debit card information on its servers unless explicitly stated. Third-party payment providers may have their own privacy policies and security practices.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">5. Sharing of Information</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We do not sell your personal information. However, we may share information with:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>Payment processors</li>
              <li>Shipping or logistics providers</li>
              <li>Service providers and hosting partners</li>
              <li>Law enforcement or regulatory authorities when legally required</li>
              <li>Other users as necessary to complete transactions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">6. Cookies and Tracking Technologies</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Sunday may use cookies and similar technologies to keep users logged in, remember preferences, analyze traffic and usage, improve website performance, and deliver relevant content. Users may disable cookies through browser settings, though some features may not function properly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">7. Data Security</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We implement reasonable technical and organizational measures to protect your information against unauthorized access, loss, misuse, or disclosure. However, no internet-based platform can guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">8. User Responsibilities</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">Users are responsible for:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>Maintaining account confidentiality</li>
              <li>Providing accurate information</li>
              <li>Ensuring listed products comply with applicable laws</li>
              <li>Avoiding prohibited or illegal items</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">9. Children’s Privacy</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Sunday is not intended for users under the age of 13 (or applicable minimum age in your jurisdiction). We do not knowingly collect personal information from children.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">10. Your Rights</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">You have the right to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and data</li>
              <li>Withdraw consent</li>
              <li>Request a copy of your stored information</li>
            </ul>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              To exercise these rights, contact us at <a href="mailto:areebaghouriii@gmail.com" className="text-primary hover:underline">areebaghouriii@gmail.com</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">11. Account Deletion</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Users may request account deletion through account settings. Certain information may be retained for legal, fraud prevention, or operational purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">12. Third-Party Links</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Sunday may contain links to third-party websites or services. We are not responsible for their privacy practices or content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">13. Changes to This Privacy Policy</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date. Continued use of the Platform after changes means you accept the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">14. Contact Information</h2>
            <div className="space-y-1 text-sm leading-relaxed text-muted-foreground">
              <p><strong>Sunday</strong></p>
              <p>Email: <a href="mailto:areebaghouriii@gmail.com" className="text-primary hover:underline">areebaghouriii@gmail.com</a></p>
              <p>Website: <Link to="/" className="text-primary hover:underline">www.sndymarket.com</Link></p>
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
