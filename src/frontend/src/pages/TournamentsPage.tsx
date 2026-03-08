import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays,
  ChevronRight,
  IndianRupee,
  MapPin,
  Radio,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import type { Tournament } from "../backend.d";
import {
  Variant_roundrobin_knockout,
  Variant_upcoming_completed_ongoing,
} from "../backend.d";
import { useCreateTournament, useGetTournaments } from "../hooks/useQueries";

const SEED_TOURNAMENTS: Omit<Tournament, "id">[] = [
  {
    name: "Mumbai Premier League",
    format: Variant_roundrobin_knockout.knockout,
    entryFee: BigInt(500),
    maxTeams: BigInt(16),
    startDate: "2026-04-01",
    venue: "Wankhede Stadium",
    upiId: "cricket@upi",
    status: Variant_upcoming_completed_ongoing.upcoming,
    adminNotes: "Annual flagship tournament. Prize pool ₹50,000.",
  },
  {
    name: "Delhi T20 Cup",
    format: Variant_roundrobin_knockout.knockout,
    entryFee: BigInt(300),
    maxTeams: BigInt(8),
    startDate: "2026-03-20",
    venue: "Feroz Shah Kotla",
    upiId: "cricket@upi",
    status: Variant_upcoming_completed_ongoing.ongoing,
    adminNotes: "Live tournament. Semi-finals in progress.",
  },
  {
    name: "Chennai Super Slam",
    format: Variant_roundrobin_knockout.roundrobin,
    entryFee: BigInt(400),
    maxTeams: BigInt(12),
    startDate: "2026-05-10",
    venue: "MA Chidambaram Stadium",
    upiId: "cricket@upi",
    status: Variant_upcoming_completed_ongoing.upcoming,
    adminNotes: "Round robin format. All teams play each other.",
  },
  {
    name: "Kolkata Premier T20",
    format: Variant_roundrobin_knockout.knockout,
    entryFee: BigInt(250),
    maxTeams: BigInt(8),
    startDate: "2026-02-15",
    venue: "Eden Gardens",
    upiId: "cricket@upi",
    status: Variant_upcoming_completed_ongoing.completed,
    adminNotes: "Completed. Winners: Royal Strikers.",
  },
];

interface Props {
  onSelectTournament: (id: bigint) => void;
}

export default function TournamentsPage({ onSelectTournament }: Props) {
  const { data: tournaments, isLoading } = useGetTournaments();
  const createTournament = useCreateTournament();

  const mutateAsync = createTournament.mutateAsync;
  const isPending = createTournament.isPending;

  // Seed if empty
  useEffect(() => {
    if (tournaments && tournaments.length === 0 && !isPending) {
      const seedAll = async () => {
        for (const t of SEED_TOURNAMENTS) {
          try {
            await mutateAsync({ ...t, id: BigInt(0) } as Tournament);
          } catch {
            // Ignore seeding errors
          }
        }
      };
      void seedAll();
    }
  }, [tournaments, mutateAsync, isPending]);

  // Derived stats
  const totalCount = tournaments?.length ?? 0;
  const liveCount =
    tournaments?.filter(
      (t) => t.status === Variant_upcoming_completed_ongoing.ongoing,
    ).length ?? 0;
  const upcomingCount =
    tournaments?.filter(
      (t) => t.status === Variant_upcoming_completed_ongoing.upcoming,
    ).length ?? 0;

  return (
    <div className="px-4 py-5">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="pitch-gradient rounded-2xl p-5 mb-4 cricket-pattern overflow-hidden relative"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-yellow-300" />
            <span className="text-yellow-300 text-xs font-body font-semibold uppercase tracking-widest">
              Active Tournaments
            </span>
          </div>
          <h2 className="font-display text-white text-2xl font-bold leading-tight mb-1">
            Find Your Next
            <br />
            <span className="text-yellow-300">Championship</span>
          </h2>
          <p className="text-white/70 text-sm font-body">
            Register your team and compete for glory
          </p>
        </div>
        <div className="absolute right-4 bottom-2 opacity-10">
          <Trophy size={72} className="text-white" />
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
        className="flex gap-2.5 mb-5 overflow-x-auto pb-0.5 scrollbar-none"
        data-ocid="tournaments.stats.row"
      >
        <StatPill
          icon={<Trophy size={13} />}
          label="Total"
          value={isLoading ? "—" : String(totalCount)}
          colorClass="bg-primary/8 text-primary"
        />
        <StatPill
          icon={<Radio size={13} className="animate-pulse" />}
          label="Live Now"
          value={isLoading ? "—" : String(liveCount)}
          colorClass="bg-amber-50 text-amber-600"
          highlight={liveCount > 0}
        />
        <StatPill
          icon={<CalendarDays size={13} />}
          label="Upcoming"
          value={isLoading ? "—" : String(upcomingCount)}
          colorClass="bg-primary/8 text-primary"
        />
      </motion.div>

      {/* Tournament List */}
      <div data-ocid="tournaments.list" className="space-y-3">
        {isLoading || createTournament.isPending ? (
          <>
            {[1, 2, 3].map((i) => (
              <TournamentCardSkeleton key={i} />
            ))}
          </>
        ) : !tournaments || tournaments.length === 0 ? (
          <div
            data-ocid="tournaments.empty_state"
            className="text-center py-16 text-muted-foreground"
          >
            <Trophy size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-display font-semibold text-lg">
              No Tournaments Yet
            </p>
            <p className="text-sm mt-1">Check back soon for upcoming events</p>
          </div>
        ) : (
          <AnimatePresence>
            {tournaments.map((tournament, index) => (
              <motion.div
                key={tournament.id.toString()}
                data-ocid={`tournament.item.${index + 1}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07, duration: 0.35 }}
              >
                <TournamentCard
                  tournament={tournament}
                  onClick={() => onSelectTournament(tournament.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-8 pb-2 text-center">
        <p className="text-xs text-muted-foreground font-body">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== "undefined" ? window.location.hostname : "",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Built with ♥ using caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────
function StatPill({
  icon,
  label,
  value,
  colorClass,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  colorClass: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 shrink-0 px-3.5 py-2.5 rounded-xl border transition-shadow ${
        highlight
          ? "border-amber-200 bg-amber-50 shadow-[0_0_10px_0_oklch(0.75_0.14_65_/_0.2)]"
          : "border-border/60 bg-card"
      }`}
    >
      <span className={`${colorClass}`}>{icon}</span>
      <div>
        <p
          className={`font-display font-black text-lg leading-none ${colorClass}`}
        >
          {value}
        </p>
        <p className="text-[10px] text-muted-foreground font-body mt-0.5">
          {label}
        </p>
      </div>
    </div>
  );
}

// ─── Tournament Card ──────────────────────────────────────────────────────────
function TournamentCard({
  tournament,
  onClick,
}: {
  tournament: Tournament;
  onClick: () => void;
}) {
  const statusConfig = getStatusConfig(tournament.status);
  const formatLabel =
    tournament.format === Variant_roundrobin_knockout.knockout
      ? "Knockout"
      : "Round Robin";
  const isLive =
    tournament.status === Variant_upcoming_completed_ongoing.ongoing;

  return (
    <Card
      className={`cursor-pointer hover:shadow-card-hover transition-all duration-200 active:scale-[0.99] overflow-hidden ${
        isLive
          ? "border-amber-300/60 shadow-[0_2px_12px_0_oklch(0.75_0.14_65_/_0.12)]"
          : "border-border/60"
      }`}
      onClick={onClick}
    >
      {/* Live accent strip — left border glow for live tournaments */}
      {isLive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-400 rounded-l-lg" />
      )}
      <CardContent className={`p-4 ${isLive ? "pl-5" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge
                className={`text-[10px] font-semibold uppercase tracking-wide ${statusConfig.className}`}
              >
                {isLive && (
                  <Radio size={8} className="mr-1 inline animate-pulse" />
                )}
                {statusConfig.label}
              </Badge>
              <Badge
                variant="outline"
                className="text-[10px] font-medium border-primary/20 text-primary"
              >
                {formatLabel}
              </Badge>
            </div>
            <h3 className="font-display font-bold text-base text-foreground leading-tight mb-2 truncate">
              {tournament.name}
            </h3>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin size={12} className="shrink-0" />
                <span className="text-xs truncate">{tournament.venue}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays size={12} className="shrink-0" />
                <span className="text-xs">
                  {formatDate(tournament.startDate)}
                </span>
              </div>
            </div>
          </div>
          <ChevronRight
            size={18}
            className="text-muted-foreground shrink-0 mt-1"
          />
        </div>

        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/60">
          <div className="flex items-center gap-1.5">
            <IndianRupee size={13} className="text-primary" />
            <span className="text-sm font-display font-bold text-primary">
              {tournament.entryFee.toString()}
            </span>
            <span className="text-xs text-muted-foreground">entry</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <Users size={13} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Max {tournament.maxTeams.toString()} teams
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TournamentCardSkeleton() {
  return (
    <Card className="border-border/60">
      <CardContent className="p-4">
        <div className="flex gap-2 mb-3">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-5 w-3/4 mb-3" />
        <Skeleton className="h-3 w-1/2 mb-1.5" />
        <Skeleton className="h-3 w-1/3 mb-3" />
        <div className="border-t border-border/60 pt-3 flex gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusConfig(status: Variant_upcoming_completed_ongoing) {
  switch (status) {
    case Variant_upcoming_completed_ongoing.upcoming:
      return {
        label: "Upcoming",
        className: "bg-primary/10 text-primary border-0",
      };
    case Variant_upcoming_completed_ongoing.ongoing:
      return {
        label: "Live",
        className: "bg-amber-100 text-amber-700 border-0",
      };
    case Variant_upcoming_completed_ongoing.completed:
      return {
        label: "Completed",
        className: "bg-muted text-muted-foreground border-0",
      };
    default:
      return { label: "Unknown", className: "" };
  }
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
