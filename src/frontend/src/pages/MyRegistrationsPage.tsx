import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BookUser, CheckCircle2, Clock, Trophy, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Team } from "../backend.d";
import { Variant_pending_approved_rejected } from "../backend.d";
import {
  useGetTeamsByTournament,
  useGetTournaments,
} from "../hooks/useQueries";
import {
  type LocalRegistration,
  getLocalRegistrations,
} from "../utils/registrations";

// A component that fetches team data for a specific tournament
function RegistrationItem({
  reg,
  tournamentName,
  index,
}: {
  reg: LocalRegistration;
  tournamentName: string | undefined;
  index: number;
}) {
  const tId = BigInt(reg.tournamentId);
  const { data: teams } = useGetTeamsByTournament(tId);
  const team = teams?.find((t) => t.id.toString() === reg.teamId);

  const statusConfig = team
    ? getTeamStatusConfig(team.status)
    : {
        label: "Loading",
        icon: <Clock size={10} className="mr-1 inline" />,
        className: "bg-gray-100 text-gray-600 border-0",
      };

  return (
    <motion.div
      data-ocid={`registrations.item.${index}`}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <Card className="border-border/60 shadow-card">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-base text-foreground truncate">
                {reg.teamName}
              </p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">
                Captain: {reg.captainName}
              </p>
              {tournamentName && (
                <div className="flex items-center gap-1 mt-1.5">
                  <Trophy size={11} className="text-primary shrink-0" />
                  <p className="text-xs text-primary font-medium truncate">
                    {tournamentName}
                  </p>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-1">
                Registered:{" "}
                {new Date(reg.registeredAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Badge className={`text-[10px] ${statusConfig.className}`}>
                {statusConfig.icon}
                {statusConfig.label}
              </Badge>
              {team?.slotNumber !== undefined && (
                <div className="gold-gradient text-amber-900 text-xs font-display font-bold px-2 py-0.5 rounded-lg">
                  Slot #{team.slotNumber.toString()}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function MyRegistrationsPage() {
  const [registrations, setRegistrations] = useState<LocalRegistration[]>([]);
  const { data: tournaments } = useGetTournaments();

  useEffect(() => {
    setRegistrations(getLocalRegistrations());
  }, []);

  const tournamentMap = new Map<string, string>();
  for (const t of tournaments ?? []) {
    tournamentMap.set(t.id.toString(), t.name);
  }

  return (
    <div className="px-4 py-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5"
      >
        <div className="flex items-center gap-2 mb-1">
          <BookUser size={18} className="text-primary" />
          <h2 className="font-display font-bold text-xl text-foreground">
            My Registrations
          </h2>
        </div>
        <p className="text-sm text-muted-foreground font-body">
          Track your team registrations
        </p>
      </motion.div>

      {registrations.length === 0 ? (
        <motion.div
          data-ocid="registrations.empty_state"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4"
        >
          {/* Designed empty state card */}
          <div className="pitch-gradient rounded-2xl p-6 cricket-pattern overflow-hidden relative mb-4 text-center">
            <div className="relative z-10">
              <div className="bg-white/15 rounded-full p-4 w-fit mx-auto mb-3">
                <Trophy size={32} className="text-yellow-300" />
              </div>
              <h3 className="font-display font-bold text-white text-xl leading-tight mb-1.5">
                No Registrations Yet
              </h3>
              <p className="text-white/70 text-sm font-body max-w-xs mx-auto">
                You haven&apos;t registered any teams. Join a tournament and
                compete for the trophy!
              </p>
            </div>
          </div>

          {/* CTA instruction card */}
          <div className="bg-card border border-primary/15 rounded-xl p-4 flex items-start gap-3 shadow-xs">
            <div className="bg-primary/10 rounded-xl p-2 shrink-0 mt-0.5">
              <BookUser size={18} className="text-primary" />
            </div>
            <div>
              <p className="font-display font-semibold text-sm text-foreground mb-0.5">
                How to register
              </p>
              <p className="text-xs text-muted-foreground font-body leading-relaxed">
                Go to the{" "}
                <span className="font-semibold text-primary">
                  Tournaments tab
                </span>{" "}
                → tap any tournament → open{" "}
                <span className="font-semibold text-primary">
                  Register Team
                </span>{" "}
                → complete payment &amp; submit the form.
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {registrations.map((reg, index) => (
            <RegistrationItem
              key={reg.teamId}
              reg={reg}
              tournamentName={tournamentMap.get(reg.tournamentId)}
              index={index + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function getTeamStatusConfig(status: Variant_pending_approved_rejected) {
  switch (status) {
    case Variant_pending_approved_rejected.pending:
      return {
        label: "Pending",
        icon: <Clock size={10} className="mr-1 inline" />,
        className: "bg-amber-100 text-amber-700 border-0",
      };
    case Variant_pending_approved_rejected.approved:
      return {
        label: "Approved",
        icon: <CheckCircle2 size={10} className="mr-1 inline" />,
        className: "bg-green-100 text-green-700 border-0",
      };
    case Variant_pending_approved_rejected.rejected:
      return {
        label: "Rejected",
        icon: <XCircle size={10} className="mr-1 inline" />,
        className: "bg-red-100 text-red-700 border-0",
      };
  }
}
