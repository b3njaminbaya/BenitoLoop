import Seo from "@/components/Seo";
import { FaShieldAlt, FaDatabase, FaUserShield, FaEnvelope, FaRegClock, FaRobot, FaHandshake } from "react-icons/fa";

const CONTACT_EMAIL = "nyuzi@gmail.com";
const LAST_UPDATED = "2026-07-11";

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Seo
                title="Privacy Policy — Nyuzi"
                description="Learn how Nyuzi collects, uses, and protects your data."
                canonical="/privacypolicy"
                jsonLd={{
                    "@context": "https://schema.org",
                    "@type": "WebPage",
                    name: "Privacy Policy — Nyuzi",
                    url: "/privacypolicy",
                }}
            />

            <section className="bg-primary text-primary-foreground py-12 px-6 text-center">
                <h1 className="text-4xl font-bold">Privacy Policy</h1>
                <p className="mt-2 text-gold">Last updated: {LAST_UPDATED}</p>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-primary-foreground/70">
                    This policy explains exactly what Nyuzi collects, why, and who it's shared with —
                    written to match how the platform actually works, not a generic template.
                </p>
            </section>

            <div className="container mx-auto px-4 py-10 space-y-12 max-w-5xl">

                <section className="bg-card border border-border shadow-sm p-6 rounded-lg">
                    <div className="flex items-center gap-3">
                        <FaShieldAlt className="text-primary text-2xl" />
                        <h2 className="text-2xl font-semibold text-primary">Our Commitment</h2>
                    </div>
                    <p className="mt-4 text-muted-foreground leading-relaxed">
                        Nyuzi ("we", "us") operates a donation, upcycling, and marketplace platform for
                        reclaimed textiles in Kenya. This policy applies to everyone who visits nyuzi.co.ke,
                        donates an item, applies to partner with us, or buys something in the marketplace —
                        whether or not you create an account.
                    </p>
                </section>

                <section className="bg-card border border-border shadow-sm p-6 rounded-lg">
                    <div className="flex items-center gap-3">
                        <FaDatabase className="text-primary text-2xl" />
                        <h2 className="text-2xl font-semibold text-primary">Information We Collect</h2>
                    </div>
                    <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                        <li><strong>Account details</strong> — name, email address, and password (stored as a salted hash by our authentication provider; we never see or store your raw password).</li>
                        <li><strong>Donation details</strong> — item title, category, condition, notes, whether you requested pickup, and any photos you choose to attach.</li>
                        <li><strong>Order details</strong> — full name, phone number, delivery address, and email address (optional) when you check out, plus what you purchased.</li>
                        <li><strong>Payment information</strong> — when you pay with M-Pesa, your phone number is passed to Safaricom's Daraja API to trigger the payment prompt on your handset. We only ever store the resulting M-Pesa receipt number and payment status — we never see your M-Pesa PIN or full transaction credentials.</li>
                        <li><strong>Partner application details</strong> — your name, email, organization, partnership type, and message.</li>
                        <li><strong>Newsletter signups</strong> — the email address you provide.</li>
                        <li><strong>Cart contents</strong> — kept only in your browser's local storage, not on our servers, until you check out.</li>
                    </ul>
                </section>

                <section className="bg-card border border-border shadow-sm p-6 rounded-lg">
                    <div className="flex items-center gap-3">
                        <FaRobot className="text-primary text-2xl" />
                        <h2 className="text-2xl font-semibold text-primary">Donation Photos & On-Device AI</h2>
                    </div>
                    <p className="mt-4 text-muted-foreground leading-relaxed">
                        If you attach a photo to a donation, it's uploaded to a private storage bucket that
                        only you and Nyuzi admins can access (via time-limited, signed links — the file is
                        never publicly reachable). Separately, the category-suggestion feature on the donation
                        form runs a small image-classification model directly in your browser using
                        TensorFlow.js. That analysis happens entirely on your device — the photo is not sent
                        to any third-party AI service for classification. The category it suggests is stored
                        alongside your donation so our team can see what the tool detected.
                    </p>
                </section>

                <section className="bg-card border border-border shadow-sm p-6 rounded-lg">
                    <div className="flex items-center gap-3">
                        <FaUserShield className="text-primary text-2xl" />
                        <h2 className="text-2xl font-semibold text-primary">How We Use Your Information</h2>
                    </div>
                    <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                        <li>To process donations, coordinate pickups, and list upcycled products for sale.</li>
                        <li>To process orders, initiate M-Pesa payments, and arrange delivery.</li>
                        <li>To send transactional emails: order confirmations, payment receipts, donation acknowledgements, and partner application updates.</li>
                        <li>To review and respond to partner applications.</li>
                        <li>To maintain platform security — for example, every action an administrator takes on your data (viewing a donation, updating an order) is logged for accountability.</li>
                        <li>To comply with Kenyan law, including the Data Protection Act, 2019.</li>
                    </ul>
                </section>

                <section className="bg-card border border-border shadow-sm p-6 rounded-lg">
                    <div className="flex items-center gap-3">
                        <FaHandshake className="text-primary text-2xl" />
                        <h2 className="text-2xl font-semibold text-primary">Who We Share Data With</h2>
                    </div>
                    <p className="mt-4 text-muted-foreground leading-relaxed">
                        We don't sell your data. We share the minimum necessary information with the
                        service providers that make Nyuzi work:
                    </p>
                    <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                        <li><strong>Supabase</strong> — our database, authentication, and file storage provider. All account, donation, order, and photo data is hosted with them, protected by row-level security so only you and authorized admins can read your records.</li>
                        <li><strong>Safaricom (M-Pesa Daraja API)</strong> — receives your phone number and payment amount to process M-Pesa payments.</li>
                        <li><strong>Resend</strong> — delivers our transactional emails (order confirmations, receipts, notifications). Your email address and the relevant order/donation details are shared with them solely to send that message.</li>
                    </ul>
                </section>

                <section className="bg-card border border-border shadow-sm p-6 rounded-lg">
                    <div className="flex items-center gap-3">
                        <FaEnvelope className="text-primary text-2xl" />
                        <h2 className="text-2xl font-semibold text-primary">Your Rights & Choices</h2>
                    </div>
                    <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
                        <li>View your donation and order history any time from My Account.</li>
                        <li>Request access to, correction of, or deletion of your personal data by emailing us.</li>
                        <li>Unsubscribe from the newsletter at any time using the link in any newsletter email.</li>
                        <li>Ask us to delete a donation photo — we'll remove it from storage on request.</li>
                    </ul>
                </section>

                <section className="bg-card border border-border shadow-sm p-6 rounded-lg">
                    <div className="flex items-center gap-3">
                        <FaRegClock className="text-primary text-2xl" />
                        <h2 className="text-2xl font-semibold text-primary">Data Retention & Security</h2>
                    </div>
                    <p className="mt-4 text-muted-foreground leading-relaxed">
                        We keep donation, order, and account records for as long as your account is active
                        or as needed to meet tax and accounting obligations, then delete or anonymize them.
                        All data in transit is encrypted (HTTPS/TLS). Access to your records in our database
                        is restricted by row-level security policies, so only you and authenticated Nyuzi
                        administrators can read them — no method of transmission over the internet is ever
                        100% secure, but we design every feature to minimize what's exposed and to whom.
                    </p>
                </section>

                <section className="bg-card border border-border shadow-sm p-6 rounded-lg text-center">
                    <h2 className="text-2xl font-semibold text-primary">Contact Us</h2>
                    <p className="mt-4 text-muted-foreground">
                        Questions about this policy, or want to exercise any of the rights above? Reach out.
                    </p>
                    <p className="mt-2 font-semibold text-primary">
                        Email: <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">{CONTACT_EMAIL}</a>
                    </p>
                </section>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
