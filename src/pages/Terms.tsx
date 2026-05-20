import { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ChevronLeft } from "lucide-react";

const Terms = () => {
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
          <h1 className="mb-2 font-heading text-3xl font-bold">Terms & Conditions</h1>
          <p className="mb-8 text-sm text-muted-foreground">
            Effective Date: 20 May 2026&nbsp;&nbsp;|&nbsp;&nbsp;Last Updated: 20 May 2026
          </p>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">1. Introduction</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <strong>1.1</strong> These Terms & Conditions (“Terms”) govern your access to and use of Sunday (“Platform”, “we”, “us”, “our”), a marketplace that enables users to buy and sell pre-owned fashion items.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              <strong>1.2</strong> By accessing or using the Platform, you agree to be bound by these Terms. If you do not agree, you must not use the Platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">2. Eligibility</h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p><strong>2.1</strong> You must be at least 13 years of age to use the Platform.</p>
              <p><strong>2.2</strong> You agree to provide accurate, complete, and up-to-date information.</p>
              <p><strong>2.3</strong> We reserve the right to suspend or terminate accounts that provide false or misleading information.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">3. User Accounts</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <strong>3.1</strong> You are responsible for:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activity conducted under your account</li>
              <li>Ensuring your information remains accurate</li>
            </ul>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              <strong>3.2</strong> Sunday shall not be liable for unauthorized access due to user negligence.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">4. Marketplace Role</h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p><strong>4.1</strong> Sunday operates solely as a technology platform connecting buyers and sellers.</p>
              <p><strong>4.2</strong> Sunday does not:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Own, store, or control listed items</li>
                <li>Guarantee product quality, authenticity, or legality</li>
                <li>Act as a party to transactions between users</li>
              </ul>
              <p><strong>4.3</strong> Sunday is not responsible for the performance of buyers, sellers, or third-party service providers, including shipping partners.</p>
              <p><strong>4.4</strong> Any processes, timelines, or controls implemented by Sunday are for user protection and platform integrity only and do not constitute an assumption of liability.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">5. Listings and Seller Obligations</h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p><strong>5.1</strong> All listings are subject to review and approval.</p>
              <p><strong>5.2</strong> Sellers must ensure that:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Listings are accurate and not misleading</li>
                <li>Images reflect the actual product</li>
                <li>Items comply with applicable laws and do not infringe rights</li>
              </ul>
              <p><strong>5.3</strong> Sunday reserves the right to remove or suspend listings at its discretion.</p>
              <p><strong>5.4</strong> Sunday reserves the right to remove or suspend accounts at its discretion. Low user ratings may lead to an admin review of the account and may result in suspension or deletion.</p>
              <p><strong>5.5</strong> For suspected fraudulent activity, users can report accounts and listings through our complaint form — a representative of Sunday will be in touch to investigate.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">6. Transaction Process</h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p><strong>6.1 Bidding, Offer and Acceptance</strong></p>
              <p>Buyers may place bids on listings, and buyers and sellers may negotiate until a final price is agreed. If the seller accepts a buyer’s offer, the offer shall be deemed binding, and an order will be automatically created on the Platform. Upon acceptance, the listing is marked as inactive and reserved for the buyer for 6 hours.</p>
              <p><strong>6.2 Checkout Requirement</strong></p>
              <p>The buyer must complete checkout within six (6) hours of acceptance. Failure to do so may result in:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Cancellation of the transaction</li>
                <li>Reactivation of the listing</li>
                <li>Account review or restriction</li>
              </ul>
              <p><strong>6.3 Order Confirmation</strong></p>
              <p>An order is confirmed only upon successful payment.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">7. Shipping and Delivery</h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p><strong>7.1 Seller Responsibility</strong></p>
              <p>Sellers are solely responsible for arranging and completing shipment of sold items. Sellers are recommended to take the following measures to ensure safe delivery:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Use tracked shipping</li>
                <li>Confirm receipt through tracking company</li>
                <li>Insure parcel through the tracking company</li>
              </ul>
              <p><strong>7.2 Approved Shipping Providers</strong></p>
              <p>Sunday may restrict shipping to selected courier partners integrated within the Platform to standardize tracking and reduce risk. Users agree to use only such approved providers where applicable.</p>
              <p><strong>7.3 Shipment Timeline</strong></p>
              <p>Sellers must dispatch the order and upload valid tracking details within forty-eight (48) hours of order confirmation. Failure to comply may result in:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Order cancellation</li>
                <li>Buyer refund</li>
                <li>Seller account flagging</li>
                <li>Listing being placed on hold</li>
              </ul>
              <p><strong>7.4 Delivery and Tracking</strong></p>
              <p>Buyers must confirm receipt upon delivery. If no confirmation is provided:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>The order may be flagged</li>
                <li>Sunday may review courier tracking data</li>
                <li>Order status may be updated based on available information</li>
              </ul>
              <p><strong>7.5 Lost Shipments</strong></p>
              <p>A shipment will only be considered lost if confirmed by the courier. If a shipment is confirmed lost through the courier, the buyer will be refunded.</p>
              <p><strong>7.6 Limitation of Responsibility</strong></p>
              <p>Sunday does not provide logistics services and is not responsible for delays, loss, damage, or non-delivery of items. All shipment-related processes implemented by Sunday are risk mitigation and user protection measures only and do not imply liability or guarantee delivery outcomes.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">8. Quality Verification and Order Completion</h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p><strong>8.1</strong> Upon marking an order as received, the buyer has twelve (12) hours to verify that the item matches the listing description.</p>
              <p><strong>8.2</strong> If no action is taken within this period:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>The order will be deemed accepted</li>
                <li>The transaction will be marked as completed</li>
                <li>Seller payout will be initiated</li>
              </ul>
              <p><strong>8.3</strong> Order will only be considered complete once quality is verified. In case the buyer claims insufficient quality, a refund case will be opened up. A refund may be initiated as per the Platform’s Returns and Refund Policy.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">9. Returns and Refunds</h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p><strong>9.1</strong> Returns and refunds on the Platform are governed by Sunday’s separate Returns & Refunds Policy, as updated from time to time.</p>
              <p><strong>9.2</strong> By using the Platform, you agree to be bound by the terms set out in the Returns & Refunds Policy.</p>
              <p><strong>9.3</strong> Users are required to review the Returns & Refunds Policy prior to engaging in any transaction on the Platform.</p>
              <p><strong>9.4</strong> In the event of any conflict between these Terms and the Returns & Refunds Policy, the Returns & Refunds Policy shall prevail with respect to return and refund matters.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">10. Payments and Payouts</h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p><strong>10.1</strong> Payments are processed via third-party providers.</p>
              <p><strong>10.2</strong> If Sunday charges service fees, transaction fees, or commissions:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Fees will be clearly disclosed before payment</li>
                <li>Users agree to pay all applicable fees and taxes</li>
              </ul>
              <p><strong>10.3</strong> All seller payouts will be administered through bank transfers only.</p>
              <p><strong>10.4</strong> Seller payouts:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Initiated after quality verification</li>
                <li>Processed within five (5) working days</li>
              </ul>
              <p><strong>10.5</strong> In case of using a family member’s or a friend’s bank account details for seller payout, it will be assumed by us that you have obtained consent from the owner of bank account details.</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">11. Prohibited Items and Activities</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">Users may not list or sell:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>Illegal products</li>
              <li>Stolen goods</li>
              <li>Counterfeit items</li>
              <li>Weapons or explosives</li>
              <li>Drugs or controlled substances</li>
              <li>Adult or explicit content</li>
              <li>Hazardous materials</li>
              <li>Fraudulent or misleading products</li>
            </ul>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Users must not:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>List illegal, counterfeit, or restricted items</li>
              <li>Engage in fraud or deceptive practices</li>
              <li>Manipulate platform systems, pricing, or reviews</li>
              <li>Harass or abuse other users</li>
              <li>Attempting to use information from other accounts for any purpose prohibited by the platform</li>
            </ul>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Violations may result in suspension or termination.</p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">12. Intellectual Property</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              All platform content is owned by or licensed to Sunday and may not be used without prior written consent.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">13. Limitation of Liability</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">To the maximum extent permitted by law, Sunday shall not be liable for:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>User disputes</li>
              <li>Shipment-related issues</li>
              <li>Transaction losses</li>
              <li>Indirect or consequential damages</li>
              <li>Platform interruptions</li>
            </ul>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Use of the Platform is at your own risk.</p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">14. Indemnification</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              You agree to indemnify and hold Sunday harmless from any claims arising from your use of the Platform, violation of these Terms, or breach of applicable laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">15. Termination</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Sunday reserves the right to suspend or terminate accounts that violate these Terms or pose risk to the Platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">16. Privacy</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Use of the Platform is governed by our Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">17. Governing Law</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              These Terms shall be governed by the laws of the Islamic Republic of Pakistan.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">18. Changes to Terms</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Sunday may update these Terms at any time. Continued use constitutes acceptance of changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-semibold">19. Contact</h2>
            <div className="space-y-1 text-sm leading-relaxed text-muted-foreground">
              <p><strong>Sunday</strong></p>
              <p>Email: xxxx@sndymarket.com</p>
              <p>Website: <Link to="/" className="text-primary hover:underline">www.sndymarket.com</Link></p>
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
