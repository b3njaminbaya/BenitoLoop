import { useState } from "react";
import { Link, NavLink, Navigate, Outlet } from "react-router-dom";
import { Gift, Handshake, History, LayoutDashboard, LogOut, Mail, Menu, Package, Receipt, Star, Tag, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import Seo from "@/components/Seo";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: Tag },
  { to: "/admin/orders", label: "Orders", icon: Receipt },
  { to: "/admin/donations", label: "Donations", icon: Gift },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/partners", label: "Partner Applications", icon: Handshake },
  { to: "/admin/audit-log", label: "Audit Log", icon: History },
  { to: "/admin/email-log", label: "Email Log", icon: Mail },
  { to: "/admin/users", label: "Users", icon: Users },
];

const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { user, signOut } = useAuth();

  return (
    <div className="flex h-full flex-col">
      <Link to="/" className="flex items-center gap-2 px-6 py-6">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-gold" aria-hidden />
        <span className="font-display text-lg font-semibold tracking-tight">Nyuzi</span>
        <span className="ml-auto text-xs uppercase tracking-wide text-primary-foreground/50">Admin</span>
      </Link>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-foreground/10 text-gold"
                    : "text-primary-foreground/80 hover:bg-primary-foreground/5 hover:text-primary-foreground"
                }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-primary-foreground/10 px-3 py-4">
        <Link
          to="/"
          onClick={onNavigate}
          className="block px-3 py-1.5 text-sm text-primary-foreground/70 hover:text-primary-foreground"
        >
          ← Back to site
        </Link>
        <div className="mt-2 flex items-center justify-between px-3">
          <span className="truncate text-xs text-primary-foreground/50">{user?.email}</span>
          <button
            onClick={() => signOut()}
            aria-label="Sign out"
            className="text-primary-foreground/70 hover:text-primary-foreground"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminLayout = () => {
  const { user, isAdmin, loading } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (loading) {
    return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
        <p className="mt-2 text-muted-foreground">This account doesn't have admin access.</p>
        <Button asChild className="mt-6 bg-primary hover:bg-primary-dark">
          <Link to="/">Back to site</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Seo title="Admin — Nyuzi" />

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-primary-dark text-primary-foreground">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed inset-x-0 top-0 z-40 flex items-center justify-between bg-primary-dark text-primary-foreground px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-gold" aria-hidden />
          <span className="font-display text-lg font-semibold">Nyuzi Admin</span>
        </Link>
        <button onClick={() => setMobileNavOpen(true)} aria-label="Open admin menu">
          <Menu size={22} />
        </button>
      </div>
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="bg-primary-dark text-primary-foreground p-0 w-64">
          <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
