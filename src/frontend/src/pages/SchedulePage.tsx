import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Flag,
  Swords,
  Trophy,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { Match, Team } from "../backend.d";
import {
  useGetMatchesByTournament,
  useGetTeamsByTournament,
  useGetTournaments,
} from "../hooks/useQueries";

export default function SchedulePage() {
  const { data: tournaments, isLoading: tournamentsLoading } =
    useGetTournaments();
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");

  const tournamentId = selectedTournamentId
    ? BigInt(selectedTournamentId)
    : null;

  const { data: matches, isLoading: matchesLoading } =
    useGetMatchesByTournament(tournamentId);
  const { data: teams } = useGetTeamsByTournament(tournamentId);

  const teamsMap = new Map<string, Team>();
  for (const t of teams ?? []) {
    teamsMap.set(t.id.toString(), t);
  }

  // Group matches by round
  const matchesByRound = new Map<number, Match[]>();
  for (const m of matches ?? []) {
    const round = Number(m.roundNumber);
    if (!matchesByRound.has(round)) matchesByRound.set(round, []);
    matchesByRound.get(round)!.push(m);
  }
  const sortedRounds = Array.from(matchesByRound.keys()).sort((a, b) => a - b);

  return (
    <div className="px-4 py-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5"
      >
        <div className="flex items-center gap-2 mb-1">
          <Calendar size={18} className="text-primary" />
          <h2 className="font-display font-bold text-xl text-foreground">
            Match Schedule
          </h2>
        </div>
        <p className="text-sm text-muted-foreground font-body">
          View fixtures and results
        </p>
      </motion.div>

      {/* Tournament Selector */}
      <div className="mb-5">
        <Select
          value={selectedTournamentId}
          onValueChange={setSelectedTournamentId}
        >
          <SelectTrigger
            data-ocid="schedule.tournament.select"
            className="w-full bg-card border-border rounded-xl h-11 font-body"
          >
            <SelectValue placeholder="Select a tournament..." />
          </SelectTrigger>
          <SelectContent>
            {tournamentsLoading ? (
              <SelectItem value="loading" disabled>
                Loading...
              </SelectItem>
            ) : (
              tournaments?.map((t) => (
                <SelectItem key={t.id.toString()} value={t.id.toString()}>
                  {t.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Matches */}
      {!selectedTournamentId ? (
        <div className="text-center py-16">
          <Calendar
            size={48}
            className="mx-auto mb-3 text-muted-foreground/30"
          />
          <p className="font-display font-semibold text-muted-foreground">
            Select a Tournament
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            to view fixtures and match schedule
          </p>
        </div>
      ) : matchesLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : !matches || matches.length === 0 ? (
        <div data-ocid="schedule.empty_state" className="text-center py-16">
          <Swords size={48} className="mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-display font-semibold text-muted-foreground">
            Fixtures Not Generated Yet
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Admin will generate the match bracket soon
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {sortedRounds.map((round) => (
            <RoundSection
              key={round}
              round={round}
              matches={matchesByRound.get(round)!}
              teamsMap={teamsMap}
              totalRounds={sortedRounds.length}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function getRoundLabel(round: number, total: number): string {
  if (round === total) return "Final";
  if (round === total - 1) return "Semi-Final";
  if (round === total - 2) return "Quarter-Final";
  return `Round ${round}`;
}

function RoundSection({
  round,
  matches,
  teamsMap,
  totalRounds,
}: {
  round: number;
  matches: Match[];
  teamsMap: Map<string, Team>;
  totalRounds: number;
}) {
  const roundLabel = getRoundLabel(round, totalRounds);
  const isFinal = round === totalRounds;
  const isSemiFinal = round === totalRounds - 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (round - 1) * 0.1 }}
    >
      {isFinal ? (
        /* ── Gold Final Banner ── */
        <div className="gold-gradient rounded-xl px-4 py-3 mb-3 flex items-center justify-between shadow-gold-glow">
          <div className="flex items-center gap-2.5">
            <Trophy size={20} className="text-amber-900" />
            <div>
              <p className="font-display font-black text-base text-amber-900 leading-none">
                THE FINAL
              </p>
              <p className="text-[10px] text-amber-800/70 font-body mt-0.5">
                Championship match
              </p>
            </div>
          </div>
          <span className="text-xs text-amber-800/70 font-body">
            {matches.length} match{matches.length !== 1 ? "es" : ""}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            {isSemiFinal ? (
              <Trophy size={14} className="text-primary/60" />
            ) : (
              <Flag size={14} className="text-primary/50" />
            )}
            <span
              className={`font-display font-bold text-sm ${
                isSemiFinal ? "text-primary" : "text-foreground"
              }`}
            >
              {roundLabel}
            </span>
          </div>
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">
            {matches.length} match{matches.length !== 1 ? "es" : ""}
          </span>
        </div>
      )}
      <div className="space-y-2.5">
        {matches.map((match, idx) => (
          <MatchCard
            key={match.id.toString()}
            match={match}
            teamsMap={teamsMap}
            index={idx + 1}
            isFinal={isFinal}
          />
        ))}
      </div>
    </motion.div>
  );
}

function MatchCard({
  match,
  teamsMap,
  index,
  isFinal = false,
}: {
  match: Match;
  teamsMap: Map<string, Team>;
  index: number;
  isFinal?: boolean;
}) {
  const team1 = teamsMap.get(match.team1Id.toString());
  const team2 = teamsMap.get(match.team2Id.toString());
  const winner = match.winnerId
    ? teamsMap.get(match.winnerId.toString())
    : null;
  const hasResult = !!match.result;

  return (
    <Card
      data-ocid={`schedule.match.item.${index}`}
      className={`border-border/60 overflow-hidden ${
        hasResult ? "bg-secondary/30" : ""
      } ${isFinal ? "border-amber-200 shadow-[0_2px_12px_0_oklch(0.75_0.14_65_/_0.12)]" : ""}`}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* Team 1 */}
          <div
            className={`flex-1 text-right ${winner && winner.id !== match.team1Id ? "opacity-40" : ""}`}
          >
            {winner && winner.id === match.team1Id && (
              <Trophy size={12} className="inline mr-1 text-yellow-500" />
            )}
            <p
              className={`font-display font-bold leading-tight ${
                isFinal ? "text-base" : "text-sm"
              }`}
            >
              {team1?.teamName ?? `Team ${match.team1Id.toString()}`}
            </p>
            {team1?.captainName && (
              <p className="text-[10px] text-muted-foreground">
                c. {team1.captainName}
              </p>
            )}
          </div>

          {/* VS */}
          <div className="flex flex-col items-center shrink-0 gap-1">
            <div
              className={`text-[10px] font-display font-black px-2 py-0.5 rounded-md ${
                isFinal
                  ? "gold-gradient text-amber-900"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              VS
            </div>
            {hasResult ? (
              <Badge className="bg-green-100 text-green-700 border-0 text-[9px] px-1.5">
                <CheckCircle2 size={8} className="mr-0.5 inline" />
                Done
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-700 border-0 text-[9px] px-1.5">
                <Clock size={8} className="mr-0.5 inline" />
                Pending
              </Badge>
            )}
          </div>

          {/* Team 2 */}
          <div
            className={`flex-1 text-left ${winner && winner.id !== match.team2Id ? "opacity-40" : ""}`}
          >
            {winner && winner.id === match.team2Id && (
              <Trophy size={12} className="inline mr-1 text-yellow-500" />
            )}
            <p
              className={`font-display font-bold leading-tight ${
                isFinal ? "text-base" : "text-sm"
              }`}
            >
              {team2?.teamName ?? `Team ${match.team2Id.toString()}`}
            </p>
            {team2?.captainName && (
              <p className="text-[10px] text-muted-foreground">
                c. {team2.captainName}
              </p>
            )}
          </div>
        </div>

        {/* Result */}
        {match.result && (
          <div className="mt-2 pt-2 border-t border-border/50 text-center">
            <p className="text-xs text-muted-foreground font-body">
              <span className="font-semibold text-foreground">Result: </span>
              {match.result}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
