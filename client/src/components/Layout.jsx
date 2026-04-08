import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, Search, Briefcase, Activity } from "lucide-react";
import StockSearch from "./StockSearch";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/opportunities", icon: Search, label: "Opportunities" },
  { to: "/portfolio", icon: Briefcase, label: "Portfolio" },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="border-b border-border bg-bg-secondary/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-4 h-14 flex items-center gap-4">
          <NavLink to="/" className="flex items-center gap-2 text-gain font-semibold text-lg no-underline shrink-0">
            <Activity className="w-5 h-5" />
            <span className="font-mono hidden sm:inline">StockPulse</span>
          </NavLink>
          <div className="flex-1 max-w-md">
            <StockSearch placeholder="Search ticker or company..." />
          </div>
          <nav className="flex items-center gap-1 shrink-0">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors no-underline ${
                    isActive
                      ? "bg-bg-card text-text-primary"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-[1440px] mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
