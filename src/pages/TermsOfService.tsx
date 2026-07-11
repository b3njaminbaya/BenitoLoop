import Seo from "@/components/Seo";
import { FaHandshake, FaUser, FaStore, FaCreditCard, FaBan, FaBalanceScale, FaSyncAlt, FaEnvelope, FaGift } from "react-icons/fa";

const CONTACT_EMAIL = "nyuzi@gmail.com";
const LAST_UPDATED = "2026-07-11";

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Seo
                title="Terms of Service — Nyuzi"
                description="Read the terms that govern the use of Nyuzi's services."
                canonical="/termsofservice"
                jsonLd={{
                    "@context": "https://schema.org",
                    "@type": "WebPage",
                    name: "Terms of Service — Nyuzi",
                    url: "/termsofservice",
                }}
            />

            <section className="bg-primary text-primary-foreground py-12 px-6 text-center">
                <h1 className="text-4xl font-bold">Terms of Service</h1>
                <p className="mt-2 text-gold">Last updated: {LAST_UPDATED}</p>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-primary-foreground/70">
                    These terms govern your use of Nyuzi's donation, upcycling, and marketplace platform.
                    Please read them before donating, applying to partner, or buying something.
                </p>
            </section>

            <div className="container mx-auto px-4 py-10 space-y-12 max-w-5xl">

                <section className="bg-card border border-border shadow-sm p-6 rounded-lg">
                    <div className="flex items-center gap-3">
                        <FaHandshake className="text-primary text-2xl" />
                        <h2 className="text-2xl font-semibold text-primary">1. Acceptance of Terms</h2>
                    </div>
                    <p className="mt-4 text-muted-foreground leading-relaxed">
                        By creating an account, submitting a donation, applying to partner, or placing an
                        order on Nyuzi, you agree to these Terms of Service and our Privacy Policy. If you
                        do not agree, please do not use the platform.
                    </p>
                </section>

                <section className="bg-card border border-border shadow-sm p-6 rounded-lg">
                    <div className="flex items-center gap-3">
                        <FaUser className="text-primary text-2xl" />
                        <h2 className="text-2xl font-semibold text-primary">2. Accounts and Eligibility</h2>
                    </div>
                    <p className="mt-4 text-muted-foreground">
                        You're responsible for keeping your account credentials confidential and for
                        activity that happens under your account. You must be at least 18 years old, or
                        have the consent of a parent or guardian, to create an account, donate, or purchase.
                        Donating or checking out as a guest is also supported and does not require an account.
                    </p>
                </section>

                <section className="bg-card border border-border shadow-sm p-6 rounded-lg">
                    <div className="flex items-center gap-3">
                        <FaGift className="text-primary text-2xl" />
                        <h2 className="text-2xl font-semibold text-primary">3. Donations</h2>
                    </div>
                    <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                        <li>By submitting a donation, you confirm the item is yours to give away and that its condition and description are accurate to the best of your knowledge.</li>
                        <li>Donations are given freely and without expectation of payment. Nyuzi may photograph, describe, upcycle, resell, or otherwise repurpose donated items at its discretion.</li>
                        <li>An automated tool suggests a category for your donation based on any photo you attach; this suggestion is advisory only and reviewed by our team before an item enters our workflow.</li>
                        <li>Requesting pickup does not guarantee collection on a specific date — pickup scheduling is currently coordinated manually by our team by email.</li>
                    </ul>
                </section>

                <section className="bg-card border border-border shadow-sm p-6 rounded-lg">
                    <div className="flex items-center gap-3">
                        <FaStore className="text-primary text-2xl" />
                        <h2 className="text-2xl font-semibold text-primary">4. Marketplace & Orders</h2>
                    </div>
                    <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                        <li>Every marketplace item is one-of-a-kind or made in a very limited run from reclaimed materials — availability is shown at checkout and enforced in real time, so an item can sell out between browsing and checkout.</li>
                        <li>Orders are only confirmed once stock has been reserved for your cart and payment has been initiated; you'll be notified immediately if an item you selected is no longer available.</li>
                        <li>Prices, delivery timelines, and product availability are subject to change without notice.</li>
                        <li>Delivery is currently coordinated to the address you provide at checkout; delivery timeframes vary and are communicated by our team after payment is confirmed.</li>
                    </ul>
                </section>

                <section className="bg-card border border-border shadow-sm p-6 rounded-lg">
                    <div className="flex items-center gap-3">
                        <FaCreditCard className="text-primary text-2xl" />
                        <h2 className="text-2xl font-semibold text-primary">5. Payments</h2>
                    </div>
                    <p className="mt-4 text-muted-foreground">
                        Payments are processed via M-Pesa (Safaricom's Daraja API). We never see or store
                        your M-Pesa PIN or full payment credentials — only the transaction receipt number
                        and status. If M-Pesa payment cannot be completed automatically, your order is held
                        for manual payment confirmation by our team. All amounts are in Kenyan Shillings
                        (KES) unless stated otherwise.
                    </p>
                </section>

                <section className="bg-card border border-border shadow-sm p-6 rounded-lg">
                    <div className="flex items-center gap-3">
                        <FaBan className="text-primary text-2xl" />
                        <h2 className="text-2xl font-semibold text-primary">6. Prohibited Activities</h2>
                    </div>
                    <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                        <li>Attempting unauthorized access to Nyuzi accounts, data, or systems.</li>
                        <li>Uploading harmful, illegal, counterfeit, or infringing content, including in donation photos.</li>
                        <li>Submitting a partner application or donation with false or misleading information.</li>
                        <li>Interfering with the operation of the platform, including automated abuse of checkout or donation submission.</li>
                    </ul>
                </section>

                <section className="bg-card border border-border shadow-sm p-6 rounded-lg">
                    <div className="flex items-center gap-3">
                        <FaBalanceScale className="text-primary text-2xl" />
                        <h2 className="text-2xl font-semibold text-primary">7. Limitation of Liability</h2>
                    </div>
                    <p className="mt-4 text-muted-foreground">
                        Nyuzi is provided on an "as is" basis. To the fullest extent permitted under Kenyan
                        law, Nyuzi is not liable for indirect, incidental, or consequential damages arising
                        from your use of the platform, including delays in pickup or delivery, or issues
                        arising from third-party payment processing.
                    </p>
                </section>

                <section className="bg-card border border-border shadow-sm p-6 rounded-lg">
                    <div className="flex items-center gap-3">
                        <FaSyncAlt className="text-primary text-2xl" />
                        <h2 className="text-2xl font-semibold text-primary">8. Changes to These Terms</h2>
                    </div>
                    <p className="mt-4 text-muted-foreground">
                        We may update these terms as the platform evolves. The "Last updated" date at the
                        top reflects the most recent revision. Continued use of Nyuzi after a change
                        constitutes acceptance of the revised terms.
                    </p>
                </section>

                <section className="bg-card border border-border shadow-sm p-6 rounded-lg text-center">
                    <h2 className="text-2xl font-semibold text-primary">9. Contact Us</h2>
                    <p className="mt-4 text-muted-foreground">
                        Questions about these terms? Reach out to our team.
                    </p>
                    <p className="mt-2 font-semibold text-primary">
                        Email: <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">{CONTACT_EMAIL}</a>
                    </p>
                </section>
            </div>
        </div>
    );
};

export default TermsOfService;
