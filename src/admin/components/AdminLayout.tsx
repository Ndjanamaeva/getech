import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Warehouse,
  ShoppingCart,
  LogOut,
  Menu,
  X,
  Bell,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { Logo } from '@/frontend/components/ui/Logo';
import { useAuth } from '@/backend/lib/auth';
import { fetchNotifications, markNotificationRead } from '@/backend/services/admin';
import { useEffect } from 'react';
import type { Notification } from '@/backend/types';
import { formatDateTime, quoteStatusLabels } from '@/backend/lib/utils';

const navItems = [
  { label: 'Tableau de bord', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Catalogue', to: '/admin/produits', icon: Package },
  { label: 'Demandes', to: '/admin/demandes', icon: ClipboardList },
  { label: 'Devis', to: '/admin/devis', icon: FileText },
  { label: 'Stock', to: '/admin/stock', icon: Warehouse },
  { label: 'Ventes', to: '/admin/ventes', icon: ShoppingCart },
];

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchNotifications();
        if (active) setNotifications(data);
      } catch {
        // silent
      }
    })();
    return () => {
      active = false;
    };
  }, [location.pathname]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const handleNotifClick = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  return (
    <div className="min-h-screen bg-brand-bg flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-brand-deep text-white transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
          <Link to="/admin">
            <Logo variant="light" />
          </Link>
          <button
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fermer la barre latérale"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-accent text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-3 py-4 border-t border-white/10 flex-shrink-0">
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5"
          >
            <ExternalLink className="h-4 w-4" />
            Voir le site public
          </Link>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main — scrolls independently of the fixed sidebar */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-brand-border bg-white px-4 sm:px-6">
          <button
            className="rounded-lg p-2 text-brand-text hover:bg-brand-bg lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir la barre latérale"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative rounded-lg p-2 text-brand-muted hover:bg-brand-bg"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-accent px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} aria-hidden="true" />
                  <div className="absolute right-0 mt-2 w-80 z-40 rounded-xl border border-brand-border bg-white shadow-xl max-h-96 overflow-y-auto">
                    <div className="px-4 py-3 border-b border-brand-border font-semibold text-brand-text">
                      Notifications
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-brand-muted">Aucune notification</div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleNotifClick(n.id)}
                          className={`flex w-full flex-col gap-1 border-b border-brand-border/50 px-4 py-3 text-left hover:bg-brand-bg/50 ${
                            n.is_read ? 'opacity-60' : ''
                          }`}
                        >
                          <span className="text-sm font-medium text-brand-text">{n.title}</span>
                          <span className="text-xs text-brand-muted">{n.message}</span>
                          <span className="text-[10px] text-brand-muted">{formatDateTime(n.created_at)}</span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent text-xs font-bold text-white">
                {(profile?.full_name ?? 'A')[0].toUpperCase()}
              </div>
              <span className="hidden sm:block font-medium text-brand-text">
                {profile?.full_name ?? 'Administrateur'}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export { quoteStatusLabels };
