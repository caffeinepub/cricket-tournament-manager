import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Variant_pending_approved_rejected,
  Variant_roundrobin_knockout,
  Variant_upcoming_completed_ongoing,
} from "../backend.d";
import type { Team } from "../backend.d";
import UpiQrCode from "../components/cricket/UpiQrCode";
import {
  useGetTeamsByTournament,
  useGetTournamentById,
  useRegisterTeam,
} from "../hooks/useQueries";
import { addLocalRegistration } from "../utils/registrations";

interface Props {
  tournamentId: bigint;
  onBack: () => void;
}

export default function TournamentDetailPage({ tournamentId, onBack }: Props) {
  const { data: tournament, isLoading } = useGetTournamentById(tournamentId);
  const { data: teams, isLoading: teamsLoading } =
    useGetTeamsByTournament(tournamentId);
  const registerTeam = useRegisterTeam();

  // Form state
  const [teamName, setTeamName] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [upiNote, setUpiNote] = useState("");
  const [players, setPlayers] = useState<{ id: string; name: string }[]>([
    { id: "p1", name: "" },
    { id: "p2", name: "" },
  ]);
  const [registrationSuccess, setRegistrationSuccess] = useState<{
    teamId: bigint;
    slot?: bigint;
  } | null>(null);

  function addPlayer() {
    if (players.length < 11) {
      setPlayers((prev) => [...prev, { id: `p${Date.now()}`, name: "" }]);
    }
  }

  function removePlayer(id: string) {
    if (players.length > 1) {
      setPlayers((prev) => prev.filter((p) => p.id !== id));
    }
  }

  function updatePlayer(id: string, value: string) {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: value } : p)),
    );
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim() || !captainName.trim() || !phoneNumber.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!upiNote.trim()) {
      toast.error("Please enter your UPI transaction ID after payment");
      return;
    }

    try {
      const team: Team = {
        id: BigInt(0),
        tournamentId,
        teamName: teamName.trim(),
        captainName: captainName.trim(),
        phoneNumber: phoneNumber.trim(),
        upiNote: upiNote.trim(),
        players: players.map((p) => p.name).filter((name) => name.trim()),
        status: Variant_pending_approved_rejected.pending,
      };

      const teamId = await registerTeam.mutateAsync({ tournamentId, team });

      // Save to localStorage
      addLocalRegistration({
        teamId: teamId.toString(),
        tournamentId: tournamentId.toString(),
        teamName: teamName.trim(),
        captainName: captainName.trim(),
        registeredAt: new Date().toISOString(),
      });

      setRegistrationSuccess({ teamId });
      toast.success("Registration submitted! Awaiting admin approval.");

      // Reset form
      setTeamName("");
      setCaptainName("");
      setPhoneNumber("");
      setUpiNote("");
      setPlayers([
        { id: "p1", name: "" },
        { id: "p2", name: "" },
      ]);
    } catch (err) {
      toast.error("Registration failed. Please try again.");
      console.error(err);
    }
  }

  if (isLoading) {
    return (
      <div className="px-4 py-5">
        <Skeleton className="h-8 w-24 mb-5" />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-10 w-full mb-3" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="px-4 py-5 text-center">
        <p className="text-muted-foreground">Tournament not found</p>
        <Button onClick={onBack} className="mt-4" variant="outline">
          Go Back
        </Button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(tournament.status);
  const formatLabel =
    tournament.format === Variant_roundrobin_knockout.knockout
      ? "Knockout"
      : "Round Robin";

  // Calculate slots remaining
  const approvedTeams =
    teams?.filter(
      (t) => t.status === Variant_pending_approved_rejected.approved,
    ) ?? [];
  const maxTeamsNum = Number(tournament.maxTeams);
  const slotsRemaining = Math.max(0, maxTeamsNum - approvedTeams.length);
  const isFull = slotsRemaining === 0;

  return (
    <div className="min-h-full">
      {/* Detail Header */}
      <div className="pitch-gradient px-4 pt-3 pb-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-white/80 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-body">Back</span>
        </button>

        <div className="flex items-start gap-2 mb-3">
          <Badge className={`${statusConfig.className} text-[10px]`}>
            {statusConfig.label}
          </Badge>
          <Badge
            variant="outline"
            className="border-white/30 text-white/80 text-[10px]"
          >
            {formatLabel}
          </Badge>
        </div>

        <h2 className="font-display text-white text-xl font-bold leading-tight mb-3">
          {tournament.name}
        </h2>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5 text-white/75">
            <MapPin size={13} />
            <span className="text-xs truncate">{tournament.venue}</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/75">
            <CalendarDays size={13} />
            <span className="text-xs">{formatDate(tournament.startDate)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-yellow-300">
            <span className="text-sm font-display font-black">
              ₹{tournament.entryFee.toString()}
            </span>
            <span className="text-xs text-white/60">entry fee</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users
              size={13}
              className={isFull ? "text-red-300" : "text-white/75"}
            />
            <span
              className={`text-xs font-semibold ${
                isFull
                  ? "text-red-300"
                  : slotsRemaining <= 3
                    ? "text-yellow-300"
                    : "text-white/75"
              }`}
            >
              {teamsLoading
                ? `Max ${tournament.maxTeams.toString()} teams`
                : isFull
                  ? "Fully booked"
                  : `${slotsRemaining} slot${slotsRemaining !== 1 ? "s" : ""} left`}
            </span>
          </div>
        </div>

        {tournament.adminNotes && (
          <p className="text-white/60 text-xs mt-2 font-body italic">
            {tournament.adminNotes}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="px-4 -mt-3">
        <Tabs defaultValue="register" className="w-full">
          <TabsList className="grid grid-cols-2 w-full bg-card shadow-card rounded-xl mb-4">
            <TabsTrigger
              value="register"
              className="rounded-lg font-display font-semibold text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Register Team
            </TabsTrigger>
            <TabsTrigger
              value="teams"
              className="rounded-lg font-display font-semibold text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Teams ({teams?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          {/* Register Tab */}
          <TabsContent value="register" className="space-y-4">
            {registrationSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center"
              >
                <CheckCircle2 size={48} className="text-primary mx-auto mb-3" />
                <h3 className="font-display font-bold text-lg text-foreground mb-1">
                  Registration Submitted!
                </h3>
                <p className="text-muted-foreground text-sm mb-3">
                  Your team ID:{" "}
                  <span className="font-mono font-bold text-primary">
                    #{registrationSuccess.teamId.toString()}
                  </span>
                </p>
                {registrationSuccess.slot ? (
                  <div className="gold-gradient rounded-xl p-3 inline-block mb-3">
                    <p className="font-display font-black text-amber-900">
                      Slot #{registrationSuccess.slot.toString()} Assigned
                    </p>
                  </div>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700 border-0 text-sm px-3 py-1">
                    <Clock size={12} className="mr-1.5" />
                    Pending Admin Approval
                  </Badge>
                )}
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRegistrationSuccess(null)}
                    className="border-primary/30 text-primary"
                  >
                    Register Another Team
                  </Button>
                </div>
              </motion.div>
            ) : (
              <>
                {/* UPI Payment Section */}
                <Card className="border-primary/15 shadow-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display text-base flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">
                        1
                      </span>
                      Pay Entry Fee via UPI
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <UpiQrCode
                      upiId={tournament.upiId}
                      amount={tournament.entryFee}
                      name={tournament.name}
                    />
                  </CardContent>
                </Card>

                {/* Registration Form */}
                <Card className="border-primary/15 shadow-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display text-base flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">
                        2
                      </span>
                      Register Your Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="teamName"
                          className="font-body text-sm font-semibold"
                        >
                          Team Name *
                        </Label>
                        <Input
                          id="teamName"
                          data-ocid="team.name.input"
                          placeholder="e.g. Royal Strikers"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          required
                          className="text-base"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="captainName"
                          className="font-body text-sm font-semibold"
                        >
                          Captain Name *
                        </Label>
                        <Input
                          id="captainName"
                          data-ocid="team.captain.input"
                          placeholder="e.g. Rohit Sharma"
                          value={captainName}
                          onChange={(e) => setCaptainName(e.target.value)}
                          required
                          className="text-base"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="phoneNumber"
                          className="font-body text-sm font-semibold"
                        >
                          Phone Number *
                        </Label>
                        <Input
                          id="phoneNumber"
                          data-ocid="team.phone.input"
                          type="tel"
                          placeholder="e.g. 9876543210"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          required
                          className="text-base"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label
                          htmlFor="upiNote"
                          className="font-body text-sm font-semibold"
                        >
                          UPI Transaction ID *
                        </Label>
                        <Input
                          id="upiNote"
                          data-ocid="team.upi.input"
                          placeholder="Enter transaction ID after payment"
                          value={upiNote}
                          onChange={(e) => setUpiNote(e.target.value)}
                          required
                          className="text-base"
                        />
                        <p className="text-xs text-muted-foreground">
                          Copy this from your UPI app after payment
                        </p>
                      </div>

                      {/* Players */}
                      <div className="space-y-2">
                        <Label className="font-body text-sm font-semibold">
                          Player Names (up to 11)
                        </Label>
                        <div className="space-y-2">
                          {players.map((player, idx) => (
                            <div
                              key={player.id}
                              className="flex items-center gap-2"
                            >
                              <span className="text-xs text-muted-foreground w-5 text-center font-mono font-bold">
                                {idx + 1}
                              </span>
                              <Input
                                data-ocid={`player.input.${idx + 1}`}
                                placeholder={`Player ${idx + 1} name`}
                                value={player.name}
                                onChange={(e) =>
                                  updatePlayer(player.id, e.target.value)
                                }
                                className="text-base flex-1"
                              />
                              {players.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 text-destructive hover:bg-destructive/10 shrink-0"
                                  onClick={() => removePlayer(player.id)}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                        {players.length < 11 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full border-dashed border-primary/30 text-primary hover:bg-primary/5"
                            onClick={addPlayer}
                            data-ocid="player.add_button"
                          >
                            <Plus size={14} className="mr-1.5" />
                            Add Player ({players.length}/11)
                          </Button>
                        )}
                      </div>

                      <Button
                        type="submit"
                        data-ocid="tournament.register.submit_button"
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-display font-bold text-base h-12 rounded-xl"
                        disabled={registerTeam.isPending}
                      >
                        {registerTeam.isPending ? (
                          <>
                            <Loader2 size={16} className="mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Registration"
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="space-y-3 pb-4">
            {teamsLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </>
            ) : !teams || teams.length === 0 ? (
              <div
                data-ocid="teams.empty_state"
                className="text-center py-10 text-muted-foreground"
              >
                <Users size={40} className="mx-auto mb-2 opacity-30" />
                <p className="font-display font-semibold">No Teams Yet</p>
                <p className="text-xs mt-1">Be the first to register!</p>
              </div>
            ) : (
              teams.map((team, index) => (
                <TeamCard
                  key={team.id.toString()}
                  team={team}
                  index={index + 1}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function TeamCard({ team, index }: { team: Team; index: number }) {
  const statusConfig = getTeamStatusConfig(team.status);
  return (
    <Card data-ocid={`teams.item.${index}`} className="border-border/60">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs text-muted-foreground font-mono font-bold">
                #{index}
              </span>
              <p className="font-display font-bold text-sm text-foreground">
                {team.teamName}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Captain: {team.captainName}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge className={`text-[10px] ${statusConfig.className}`}>
              {statusConfig.icon}
              {statusConfig.label}
            </Badge>
            {team.slotNumber !== undefined && (
              <span className="text-xs font-display font-bold text-primary">
                Slot #{team.slotNumber.toString()}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
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

function getStatusConfig(status: Variant_upcoming_completed_ongoing) {
  switch (status) {
    case Variant_upcoming_completed_ongoing.upcoming:
      return {
        label: "Upcoming",
        className: "bg-primary/20 text-white border-0",
      };
    case Variant_upcoming_completed_ongoing.ongoing:
      return {
        label: "Live",
        className: "bg-yellow-400 text-yellow-900 border-0",
      };
    case Variant_upcoming_completed_ongoing.completed:
      return {
        label: "Completed",
        className: "bg-white/20 text-white border-0",
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
