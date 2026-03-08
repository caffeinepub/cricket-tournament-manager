import { Toaster } from "@/components/ui/sonner";
import { BookUser, Calendar, ShieldCheck, Trophy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import AdminPage from "./pages/AdminPage";
import MyRegistrationsPage from "./pages/MyRegistrationsPage";
import SchedulePage from "./pages/SchedulePage";
import TournamentDetailPage from "./pages/TournamentDetailPage";
import TournamentsPage from "./pages/TournamentsPage";

type Tab = "tournaments" | "schedule" | "registrations" | "admin";

const NAV_ITEMS = [
  {
    id: "tournaments" as Tab,
    icon: Trophy,
    label: "Tournaments",
    ocid: "nav.tournaments.link",
  },
  {
    id: "schedule" as Tab,
    icon: Calendar,
    label: "Schedule",
    ocid: "nav.schedule.link",
  },
  {
    id: "registrations" as Tab,
    icon: BookUser,
    label: "My Teams",
    ocid: "nav.registrations.link",
  },
  {
    id: "admin" as Tab,
    icon: ShieldCheck,
    label: "Admin",
    ocid: "nav.admin.link",
  },
] as const;

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("tournaments");
  const [selectedTournamentId, setSelectedTournamentId] = useState<
    bigint | null
  >(null);

  function handleSelectTournament(id: bigint) {
    setSelectedTournamentId(id);
  }

  function handleBackToList() {
    setSelectedTournamentId(null);
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="pitch-gradient sticky top-0 z-40 shadow-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/generated/cricket-ball-logo-transparent.dim_120x120.png"
              alt="Cricket Ball"
              className="w-8 h-8 object-contain drop-shadow-sm"
            />
            <div>
              <h1 className="font-display text-white text-lg font-bold leading-none tracking-tight">
                CricketHub
              </h1>
              <p className="text-white/60 text-xs font-body">
                Tournament Manager
              </p>
            </div>
          </div>
          <div className="gold-gradient text-[0.65rem] font-display font-bold px-2.5 py-1 rounded-full text-amber-900 tracking-wide uppercase">
            Live
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-nav overflow-y-auto">
        {activeTab === "tournaments" && !selectedTournamentId && (
          <TournamentsPage onSelectTournament={handleSelectTournament} />
        )}
        {activeTab === "tournaments" && selectedTournamentId !== null && (
          <TournamentDetailPage
            tournamentId={selectedTournamentId}
            onBack={handleBackToList}
          />
        )}
        {activeTab === "schedule" && <SchedulePage />}
        {activeTab === "registrations" && <MyRegistrationsPage />}
        {activeTab === "admin" && <AdminPage />}
      </main>

      {/* Bottom Navigation — enhanced with active pill indicator */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-nav bg-card border-t border-border shadow-[0_-2px_16px_0_oklch(0.35_0.12_148_/_0.1)]">
        <div className="flex h-full">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                data-ocid={item.ocid}
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id === "tournaments") setSelectedTournamentId(null);
                }}
                className="flex flex-1 flex-col items-center justify-center gap-0.5 relative pt-1 transition-colors"
                aria-current={isActive ? "page" : undefined}
              >
                {/* Active top-line indicator */}
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-primary"
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      exit={{ scaleX: 0, opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                </AnimatePresence>

                <span
                  className={`p-1.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-primary/12 text-primary scale-110"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon size={19} />
                </span>
                <span
                  className={`text-[10px] font-body font-semibold tracking-wide transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <Toaster position="top-center" richColors />
    </div>
  );
}
