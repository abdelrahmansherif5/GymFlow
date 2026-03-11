import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Home, CalendarDays, Dumbbell, Settings as SettingsIcon } from "lucide-react";
import { useSettings } from "@/hooks/use-gymflow";
import { useTranslation } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";

export function BottomNavLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: settings } = useSettings();
  
  const lang = settings?.language || "en";
  const theme = settings?.theme || "dark";
  const t = useTranslation(lang);

  // Apply theme and direction
  useEffect(() => {
    const root = document.documentElement;
    root.dir = lang === "ar" ? "rtl" : "ltr";
    
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [lang, theme]);

  const navItems = [
    { href: "/", icon: Home, label: t("home") },
    { href: "/days", icon: CalendarDays, label: t("days") },
    { href: "/machines", icon: Dumbbell, label: t("machines") },
    { href: "/settings", icon: SettingsIcon, label: t("settings") },
  ];

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col max-w-md mx-auto relative shadow-2xl overflow-hidden">
      
      {/* Decorative top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 scroll-smooth">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full max-w-md bg-card/80 backdrop-blur-xl border-t border-white/5 z-50 px-6 py-4 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        <ul className="flex justify-between items-center">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <li key={item.href}>
                <Link href={item.href} className="relative flex flex-col items-center justify-center w-16 h-12 gap-1 group">
                  <div className={`relative p-2 rounded-xl transition-all duration-300 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                    <Icon strokeWidth={isActive ? 2.5 : 2} size={22} className="relative z-10" />
                    
                    {isActive && (
                      <motion.div 
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-primary/15 rounded-xl -z-0"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </div>
                  <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
