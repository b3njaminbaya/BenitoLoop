import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "@/components/layout/PublicLayout";
import { CartProvider } from "@/lib/cart-context";
import { AuthProvider } from "@/lib/auth-context";
import Index from "./pages/Index";
import PartnerWithUs from "./pages/PartnerWithUs";
import NotFound from "./pages/NotFound";

const Donate = lazy(() => import("./pages/Donate"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Impact = lazy(() => import("./pages/Impact"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminDonations = lazy(() => import("./pages/admin/AdminDonations"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminPartners = lazy(() => import("./pages/admin/AdminPartners"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminAuditLog = lazy(() => import("./pages/admin/AdminAuditLog"));
const AdminEmailLog = lazy(() => import("./pages/admin/AdminEmailLog"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderStatus = lazy(() => import("./pages/OrderStatus"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const MyAccount = lazy(() => import("./pages/MyAccount"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Suspense fallback={<div className="p-6 text-center text-muted-foreground">Loading…</div>}>
              <Routes>
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/donate" element={<Donate />} />
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/product/:slug" element={<ProductDetail />} />
                  <Route path="/impact" element={<Impact />} />
                  <Route path="/privacypolicy" element={<PrivacyPolicy />} />
                  <Route path="/termsofservice" element={<TermsOfService />} />
                  <Route path="/cookiepolicy" element={<CookiePolicy />} />
                  <Route path="/partnerwithus" element={<PartnerWithUs />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order/:id" element={<OrderStatus />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/account" element={<MyAccount />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="donations" element={<AdminDonations />} />
                  <Route path="reviews" element={<AdminReviews />} />
                  <Route path="partners" element={<AdminPartners />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="audit-log" element={<AdminAuditLog />} />
                  <Route path="email-log" element={<AdminEmailLog />} />
                  <Route path="users" element={<AdminUsers />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
