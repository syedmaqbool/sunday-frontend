import { ChevronLeft } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

export default function Cookies() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container flex-1 py-12">
        <Link
          to="/"
          className="
            mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground
            hover:text-foreground
          "
        >
          <ChevronLeft className="h-4 w-4" />
          {' '}
          Back to home
        </Link>
        <article className="mx-auto max-w-3xl">
          <h1 className="mb-2 font-heading text-3xl font-bold">Cookie Policy</h1>
          <p className="mb-8 text-sm text-muted-foreground">
            Effective Date: 2 July 2026&nbsp;&nbsp;|&nbsp;&nbsp;Last Updated: 2 July 2026
          </p>

          <section className="mb-8">
            <p className="text-sm leading-relaxed text-muted-foreground">
              This Cookie Policy explains how Sunday (“we,” “our,” or “us”) uses cookies and
              similar technologies when you visit our website and use our services (the
              “Platform”). It should be read alongside our
              {' '}
              <Link to="/privacy" className="underline">Privacy Policy</Link>
              .
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">1. What Are Cookies?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Cookies are small text files stored on your device (computer, tablet or mobile) when
              you visit a website. They help websites remember your actions and preferences over
              time. We also use similar technologies such as local storage and pixels.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">2. Types of Cookies We Use</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>
                <strong>Strictly necessary cookies</strong>
                {' '}
                — required for the Platform to work,
                such as keeping you signed in, remembering your cart, and securing your session.
                These cannot be turned off.
              </li>
              <li>
                <strong>Functional cookies</strong>
                {' '}
                — remember choices you make (like language or
                filters) to give you a better experience.
              </li>
              <li>
                <strong>Analytics cookies</strong>
                {' '}
                — help us understand how visitors use the
                Platform so we can improve pages, features and performance.
              </li>
              <li>
                <strong>Marketing cookies</strong>
                {' '}
                — may be used to show relevant offers and
                measure the effectiveness of campaigns.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">3. Third-Party Cookies</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Some cookies are set by trusted third-party services we use (for example analytics
              providers and payment processors). These providers process data under their own
              privacy policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">4. Managing Your Preferences</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              When you first visit Sunday you will see a cookie banner where you can accept or
              reject non-essential cookies. You can also control cookies through your browser
              settings — most browsers let you block or delete cookies. Please note that disabling
              certain cookies may affect how the Platform works for you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">5. Changes to This Policy</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We may update this Cookie Policy from time to time. Changes will be posted on this
              page with an updated revision date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">6. Contact Us</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Questions about this Cookie Policy? Email us at
              {' '}
              <a href="mailto:areebaghouriii@gmail.com" className="underline">areebaghouriii@gmail.com</a>
              .
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
