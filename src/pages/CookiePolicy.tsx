import Seo from "@/components/Seo";
import { FaCookieBite, FaLock, FaShoppingBag, FaChartBar, FaEnvelope } from "react-icons/fa";

const CONTACT_EMAIL = "nyuzi@gmail.com";
const LAST_UPDATED = "2026-07-11";

const CookiePolicy = () => {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Seo
                title="Cookie Policy — Nyuzi"
                description="What Nyuzi stores in your browser, and why."
                canonical="/cookiepolicy"
                jsonLd={{
                    "@context": "https://schema.org",
                    "@type": "WebPage",
                    name: "Cookie Policy — Nyuzi",
                    url: "/cookiepolicy",
                }}
            />

            <section className="bg-primary text-primary-foreground py-12 px-6 text-center">
                <h1 className="text-4xl font-bold">Cookie Policy</h1>
                <p className="mt-2 text-gold">Last updated: {LAST_UPDATED}</p>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-primary-foreground/70">
                    A short, honest policy: here's exactly what Nyuzi stores in your browser.
                </p>
            </section>

            <div className="container mx-auto px-4 py-10 space-y-12 max-w-5xl">

                <section className="bg-card border border-border shadow-sm p-6 rounded-lg">
                    <div className="flex items-center gap-3">
                        <FaCookieBite className="text-primary text-2xl" />
                        <h2 className="text-2xl font-semibold text-primary">We Don't Use Tracking Cookies</h2>
                    </div>
                    <p className="mt-4 text-muted-foreground leading-relaxed">
                        Nyuzi does not use advertising cookies, third-party tracking pixels, or analytics
                        cookies. We don't run Google Analytics, Facebook Pixel, or any similar service. What
                        follows is a complete list of everything Nyuzi stores in your browser — all of it is
                        local storage (not a traditional cookie), stays on your device, and is never sold or
                        shared with advertisers.
                    </p>
                </section>

                <section className="bg-card border border-border shadow-sm p-6 rounded-lg">
                    <div className="flex items-center gap-3">
                        <FaLock className="text-primary text-2xl" />
                        <h2 className="text-2xl font-semibold text-primary">Essential: Keeping You Signed In</h2>
                    </div>
                    <p className="mt-4 text-muted-foreground leading-relaxed">
                        If you create an account, our authentication provider (Supabase) stores your session
                        token in your browser's local storage so you don't have to sign in on every visit.
                        This is strictly necessary for accounts to work and can't be turned off without
                        signing out.
                    </p>
                </section>

                <section className="bg-card border border-border shadow-sm p-6 rounded-lg">
                    <div className="flex items-center gap-3">
                        <FaShoppingBag className="text-primary text-2xl" />
                        <h2 className="text-2xl font-semibold text-primary">Essential: Your Shopping Cart</h2>
                    </div>
                    <p className="mt-4 text-muted-foreground leading-relaxed">
                        Items you add to your cart are saved to local storage on your device so your cart
                        survives a page refresh. This data never leaves your browser until you check out —
                        we don't see your cart contents until you submit an order.
                    </p>
                </section>

                <section className="bg-card border border-border shadow-sm p-6 rounded-lg">
                    <div className="flex items-center gap-3">
                        <FaChartBar className="text-primary text-2xl" />
                        <h2 className="text-2xl font-semibold text-primary">If This Ever Changes</h2>
                    </div>
                    <p className="mt-4 text-muted-foreground leading-relaxed">
                        If we ever introduce analytics or marketing cookies in the future, we'll update this
                        page, change the "Last updated" date above, and — where required by law — ask for
                        your consent before setting them.
                    </p>
                </section>

                <section className="bg-card border border-border shadow-sm p-6 rounded-lg text-center">
                    <h2 className="text-2xl font-semibold text-primary">Questions?</h2>
                    <p className="mt-4 text-muted-foreground">
                        See our <a href="/privacypolicy" className="text-primary hover:underline">Privacy Policy</a> for how we handle the personal data you actively give us (like your name, order, or donation details), or reach out directly.
                    </p>
                    <p className="mt-2 font-semibold text-primary">
                        Email: <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">{CONTACT_EMAIL}</a>
                    </p>
                </section>
            </div>
        </div>
    );
};

export default CookiePolicy;
