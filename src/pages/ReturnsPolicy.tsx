import { ChevronLeft } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

export default function ReturnsPolicy() {
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
          <h1 className="mb-2 font-heading text-3xl font-bold">
            Returns & Refunds Policy
          </h1>
          <p className="mb-8 text-sm text-muted-foreground">
            Effective Date: 20 May 2026&nbsp;&nbsp;|&nbsp;&nbsp;Last Updated: 20
            May 2026
          </p>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">
              1. Introduction
            </h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong>1.1</strong>
                {' '}
                This Returns & Refunds Policy (“Policy”)
                governs all return, refund, and dispute processes on Sunday
                (“Platform”, “we”, “us”, “our”).
              </p>
              <p>
                <strong>1.2</strong>
                {' '}
                This Policy forms part of the Sunday Terms
                & Conditions and applies to all users (“you”, “your”) engaging
                in transactions on the Platform.
              </p>
              <p>
                <strong>1.3</strong>
                {' '}
                By using the Platform, you agree to be
                bound by this Policy.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">
              2. Nature of Transactions
            </h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong>2.1</strong>
                {' '}
                Sunday operates as a marketplace connecting
                independent buyers and sellers.
              </p>
              <p>
                <strong>2.2</strong>
                {' '}
                All transactions are conducted between
                users. Sunday facilitates dispute resolution and implements
                protection measures but is not a party to the transaction.
              </p>
              <p>
                <strong>2.3</strong>
                {' '}
                Returns and refunds are strictly governed
                by the timelines, processes, and conditions outlined in this
                Policy.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">
              3. Eligibility for Returns and Refunds
            </h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong>3.1</strong>
                {' '}
                A refund request is only valid if:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>The buyer has received the item, and</li>
                <li>
                  The request is submitted within twelve (12) hours of marking
                  the item as “received” on the Platform (“Quality Verification
                  Window”)
                </li>
              </ul>
              <p>
                <strong>3.2</strong>
                {' '}
                Refunds may be considered only in cases
                where:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  The item materially differs from the listing description
                </li>
                <li>
                  The item is damaged, defective, or incomplete upon delivery
                  (which was not listed in description)
                </li>
                <li>The wrong item was delivered</li>
              </ul>
              <p>
                <strong>3.3</strong>
                {' '}
                Refunds will not be granted for:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Change of mind</li>
                <li>Size or fit issues (unless misrepresented)</li>
                <li>Minor wear consistent with a pre-owned item</li>
                <li>Issues clearly disclosed in the listing</li>
                <li>Delays caused by courier services</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">
              4. Complaint and Dispute Process
            </h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong>4.1</strong>
                {' '}
                To initiate a refund request, the buyer
                must submit a complaint through the Platform within the Quality
                Verification Window.
              </p>
              <p>
                <strong>4.2</strong>
                {' '}
                Upon submission:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>A case (ticket) will be created</li>
                <li>Both buyer and seller will be notified</li>
                <li>
                  Relevant details, including images and descriptions, may be
                  requested
                </li>
              </ul>
              <p>
                <strong>4.3</strong>
                {' '}
                Sunday will review the complaint and may:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Request additional evidence from either party</li>
                <li>Review listing details and transaction history</li>
              </ul>
              <p>
                <strong>4.4</strong>
                {' '}
                Sunday reserves the right to make a final
                determination on the outcome of the dispute.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">
              5. Approval of Refunds
            </h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong>5.1</strong>
                {' '}
                If a refund request is approved:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  The buyer must return the item within forty-eight (48) hours
                  of confirmation
                </li>
                <li>
                  The buyer must upload valid shipment proof, including tracking
                  details
                </li>
              </ul>
              <p>
                <strong>5.2</strong>
                {' '}
                Failure to comply with return requirements
                may result in:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Cancellation of the refund</li>
                <li>Release of payment to the seller</li>
              </ul>
              <p>
                <strong>5.3</strong>
                {' '}
                Items must be returned:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>In the same condition as received</li>
                <li>With all original components (if applicable)</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">
              6. Return Shipping and Responsibility
            </h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong>6.1</strong>
                {' '}
                The buyer is responsible for arranging
                return shipment using a trackable courier service.
              </p>
              <p>
                <strong>6.2</strong>
                {' '}
                Sunday may require the use of designated or
                integrated shipping partners for consistency and tracking
                verification.
              </p>
              <p>
                <strong>6.3</strong>
                {' '}
                The buyer bears the risk of return shipment
                until the item is marked as delivered.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">
              7. Seller Receipt Confirmation
            </h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong>7.1</strong>
                {' '}
                The seller is required to confirm receipt
                of the returned item promptly upon delivery.
              </p>
              <p>
                <strong>7.2</strong>
                {' '}
                If the seller does not confirm receipt:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>The case may be flagged for review</li>
                <li>Sunday may verify delivery through tracking information</li>
                <li>
                  The system may update the status based on verified delivery
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">
              8. Lost or Failed Return Shipments
            </h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong>8.1</strong>
                {' '}
                If a return shipment is confirmed lost:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>The refund may be cancelled</li>
              </ul>
              <p>
                <strong>8.2</strong>
                {' '}
                Sunday is not responsible for lost or
                delayed return shipments, as shipping is conducted through
                third-party providers.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">
              9. Refund Completion
            </h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong>9.1</strong>
                {' '}
                Refunds will only be processed after:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  The returned item is confirmed as delivered to the seller, and
                </li>
                <li>The return meets the required conditions</li>
              </ul>
              <p>
                <strong>9.2</strong>
                {' '}
                Refunds will be issued to the original
                payment method, where applicable.
              </p>
              <p>
                <strong>9.3</strong>
                {' '}
                Processing timelines may vary depending on
                the payment provider.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">
              10. Non-Return Cases
            </h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong>10.1</strong>
                {' '}
                In certain cases, Sunday may, at its sole
                discretion:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Issue a refund without requiring a return, or</li>
                <li>Offer a partial refund</li>
              </ul>
              <p>Such decisions will be made on a case-by-case basis.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">
              11. Fraud and Abuse
            </h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong>11.1</strong>
                {' '}
                Any misuse of the refund process,
                including:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>False claims</li>
                <li>Returning incorrect items</li>
                <li>Manipulating disputes</li>
              </ul>
              <p>may result in:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Account suspension or termination</li>
                <li>Forfeiture of refunds</li>
                <li>Legal action where applicable</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">
              12. Limitation of Liability
            </h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong>12.1</strong>
                {' '}
                Sunday provides dispute resolution support
                but does not guarantee refund outcomes.
              </p>
              <p>
                <strong>12.2</strong>
                {' '}
                Sunday shall not be liable for:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Losses arising from user disputes</li>
                <li>Courier-related issues</li>
                <li>Delays in refund processing by third-party providers</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">
              13. Policy Updates
            </h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong>13.1</strong>
                {' '}
                Sunday reserves the right to modify this
                Policy at any time.
              </p>
              <p>
                <strong>13.2</strong>
                {' '}
                Continued use of the Platform constitutes
                acceptance of the updated Policy.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">
              14. Contact
            </h2>
            <div className="space-y-1 text-sm leading-relaxed text-muted-foreground">
              <p>For any questions regarding this Policy:</p>
              <p>
                <strong>Sunday</strong>
              </p>
              <p>
                Email:
                {' '}
                <a
                  href="mailto:xxxx@sndymarket.com"
                  className="
                    text-primary
                    hover:underline
                  "
                >
                  xxxx@sndymarket.com
                </a>
              </p>
              <p>
                Website:
                {' '}
                <Link
                  to="/"
                  className="
                    text-primary
                    hover:underline
                  "
                >
                  www.sndymarket.com
                </Link>
              </p>
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
