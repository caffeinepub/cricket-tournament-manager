import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Loader2,
  Pencil,
  Phone,
  Plus,
  ShieldCheck,
  Swords,
  Trash2,
  Trophy,
  User,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Match, Team, Tournament } from "../backend.d";
import {
  Variant_pending_approved_rejected,
  Variant_roundrobin_knockout,
  Variant_upcoming_completed_ongoing,
} from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useApproveTeam,
  useCreateTournament,
  useDeleteTournament,
  useGenerateKnockoutFixtures,
  useGetMatchesByTournament,
  useGetTeamsByTournament,
  useGetTournaments,
  useIsCallerAdmin,
  useRejectTeam,
  useSetMatchResult,
  useUpdateTournament,
} from "../hooks/useQueries";

// ─── Admin Gate ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { login, isLoggingIn } = useInternetIdentity();

  if (adminLoading) {
    return (
      <div className="px-4 py-5 space-y-3">
        <Skeleton className="h-8 w-40 mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="px-4 py-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-6"
        >
          <div className="bg-primary/10 p-5 rounded-full mb-4">
            <ShieldCheck size={48} className="text-primary" />
          </div>
          <h2 className="font-display font-bold text-xl text-foreground mb-2">
            Admin Access Required
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs font-body">
            Connect your admin wallet to access the tournament management panel.
          </p>
        </motion.div>

        <Button
          data-ocid="admin.login.button"
          onClick={login}
          disabled={isLoggingIn}
          className="bg-primary text-primary-foreground font-display font-bold px-8 h-12 rounded-xl"
        >
          {isLoggingIn ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <ShieldCheck size={16} className="mr-2" />
              Connect Admin Wallet
            </>
          )}
        </Button>
      </div>
    );
  }

  return <AdminDashboard />;
}

// ─── Admin Dashboard ─────────────────────────────────────────────────────────
function AdminDashboard() {
  const { data: tournaments } = useGetTournaments();

  // Aggregate stats
  const totalTournaments = tournaments?.length ?? 0;
  const upcomingCount =
    tournaments?.filter(
      (t) => t.status === Variant_upcoming_completed_ongoing.upcoming,
    ).length ?? 0;
  const liveCount =
    tournaments?.filter(
      (t) => t.status === Variant_upcoming_completed_ongoing.ongoing,
    ).length ?? 0;

  return (
    <div className="px-4 py-5">
      {/* Admin Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 mb-4"
      >
        <div className="bg-primary/10 p-2 rounded-xl">
          <ShieldCheck size={20} className="text-primary" />
        </div>
        <div>
          <h2 className="font-display font-bold text-xl text-foreground leading-none">
            Admin Panel
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tournament organizer dashboard
          </p>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-2.5 mb-5"
        data-ocid="admin.stats.panel"
      >
        <AdminStatCard
          label="Tournaments"
          value={totalTournaments}
          icon={<Trophy size={16} />}
          colorClass="text-primary bg-primary/8"
        />
        <AdminStatCard
          label="Upcoming"
          value={upcomingCount}
          icon={<Zap size={16} />}
          colorClass="text-primary bg-primary/8"
        />
        <AdminStatCard
          label="Live Now"
          value={liveCount}
          icon={<Users size={16} />}
          colorClass="text-amber-600 bg-amber-50"
          highlight={liveCount > 0}
        />
      </motion.div>

      <Tabs defaultValue="tournaments" className="w-full">
        <TabsList className="grid grid-cols-3 w-full bg-card shadow-xs rounded-xl mb-5">
          <TabsTrigger
            value="tournaments"
            data-ocid="admin.tournaments.tab"
            className="rounded-lg font-display font-semibold text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Tournaments
          </TabsTrigger>
          <TabsTrigger
            value="teams"
            data-ocid="admin.teams.tab"
            className="rounded-lg font-display font-semibold text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Teams
          </TabsTrigger>
          <TabsTrigger
            value="fixtures"
            data-ocid="admin.fixtures.tab"
            className="rounded-lg font-display font-semibold text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Fixtures
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tournaments">
          <AdminTournamentsTab />
        </TabsContent>
        <TabsContent value="teams">
          <AdminTeamsTab />
        </TabsContent>
        <TabsContent value="fixtures">
          <AdminFixturesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Admin Stat Card ──────────────────────────────────────────────────────────
function AdminStatCard({
  label,
  value,
  icon,
  colorClass,
  highlight = false,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 border flex flex-col gap-1 ${
        highlight
          ? "border-amber-200 bg-amber-50 shadow-[0_0_10px_0_oklch(0.75_0.14_65_/_0.15)]"
          : "border-border/60 bg-card"
      }`}
    >
      <span className={`${colorClass} p-1.5 rounded-lg w-fit`}>{icon}</span>
      <p
        className={`font-display font-black text-xl leading-none ${colorClass.split(" ")[0]}`}
      >
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground font-body leading-tight">
        {label}
      </p>
    </div>
  );
}

// ─── Tournaments Tab ──────────────────────────────────────────────────────────
function AdminTournamentsTab() {
  const { data: tournaments, isLoading } = useGetTournaments();
  const createTournament = useCreateTournament();
  const updateTournament = useUpdateTournament();
  const deleteTournament = useDeleteTournament();
  const [showForm, setShowForm] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(
    null,
  );

  function handleEdit(t: Tournament) {
    setEditingTournament(t);
    setShowForm(true);
  }

  function handleCreate() {
    setEditingTournament(null);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingTournament(null);
  }

  async function handleDelete(id: bigint) {
    try {
      await deleteTournament.mutateAsync(id);
      toast.success("Tournament deleted");
    } catch {
      toast.error("Delete failed");
    }
  }

  return (
    <div className="space-y-4">
      {!showForm && (
        <Button
          data-ocid="admin.create_tournament.button"
          onClick={handleCreate}
          className="w-full bg-primary text-primary-foreground font-display font-bold h-11 rounded-xl"
        >
          <Plus size={16} className="mr-2" />
          Create Tournament
        </Button>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <TournamentForm
              tournament={editingTournament}
              onSave={async (data) => {
                try {
                  if (editingTournament) {
                    await updateTournament.mutateAsync({
                      id: editingTournament.id,
                      tournament: data,
                    });
                    toast.success("Tournament updated");
                  } else {
                    await createTournament.mutateAsync(data);
                    toast.success("Tournament created");
                  }
                  handleFormClose();
                } catch {
                  toast.error("Save failed. Please try again.");
                }
              }}
              onCancel={handleFormClose}
              isPending={
                createTournament.isPending || updateTournament.isPending
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!showForm && (
        <div className="space-y-3">
          {isLoading ? (
            [1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))
          ) : tournaments?.length === 0 ? (
            <div
              data-ocid="admin.tournaments.empty_state"
              className="text-center py-10 text-muted-foreground"
            >
              <Trophy size={36} className="mx-auto mb-2 opacity-30" />
              <p className="font-display font-semibold">No Tournaments</p>
            </div>
          ) : (
            tournaments?.map((t, idx) => (
              <motion.div
                key={t.id.toString()}
                data-ocid={`admin.tournament.item.${idx + 1}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="border-border/60">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-sm truncate">
                          {t.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.venue} · ₹{t.entryFee.toString()} · Max{" "}
                          {t.maxTeams.toString()} teams
                        </p>
                        <p className="text-xs text-muted-foreground">
                          UPI: {t.upiId}
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:bg-primary/10"
                          onClick={() => handleEdit(t)}
                          data-ocid={`admin.tournament.edit_button.${idx + 1}`}
                        >
                          <Pencil size={14} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              data-ocid={`admin.tournament.delete_button.${idx + 1}`}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Tournament?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete &ldquo;{t.name}
                                &rdquo; and all associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-ocid="admin.tournament.delete.cancel_button">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                data-ocid="admin.tournament.delete.confirm_button"
                                className="bg-destructive text-destructive-foreground"
                                onClick={() => handleDelete(t.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tournament Form ──────────────────────────────────────────────────────────
interface TournamentFormProps {
  tournament: Tournament | null;
  onSave: (data: Tournament) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

function TournamentForm({
  tournament,
  onSave,
  onCancel,
  isPending,
}: TournamentFormProps) {
  const [name, setName] = useState(tournament?.name ?? "");
  const [venue, setVenue] = useState(tournament?.venue ?? "");
  const [startDate, setStartDate] = useState(tournament?.startDate ?? "");
  const [entryFee, setEntryFee] = useState(
    tournament?.entryFee.toString() ?? "500",
  );
  const [maxTeams, setMaxTeams] = useState(
    tournament?.maxTeams.toString() ?? "16",
  );
  const [upiId, setUpiId] = useState(tournament?.upiId ?? "");
  const [format, setFormat] = useState<Variant_roundrobin_knockout>(
    tournament?.format ?? Variant_roundrobin_knockout.knockout,
  );
  const [status, setStatus] = useState<Variant_upcoming_completed_ongoing>(
    tournament?.status ?? Variant_upcoming_completed_ongoing.upcoming,
  );
  const [adminNotes, setAdminNotes] = useState(tournament?.adminNotes ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !venue || !startDate || !upiId) {
      toast.error("Please fill in all required fields");
      return;
    }
    const data: Tournament = {
      id: tournament?.id ?? BigInt(0),
      name,
      venue,
      startDate,
      entryFee: BigInt(Number.parseInt(entryFee) || 0),
      maxTeams: BigInt(Number.parseInt(maxTeams) || 8),
      upiId,
      format,
      status,
      adminNotes,
    };
    await onSave(data);
  }

  return (
    <Card className="border-primary/20 shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base">
          {tournament ? "Edit Tournament" : "New Tournament"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <FormField label="Tournament Name *">
            <Input
              placeholder="e.g. City Cricket Cup 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Venue *">
            <Input
              placeholder="e.g. City Sports Complex"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Start Date *">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Entry Fee (₹)">
              <Input
                type="number"
                min="0"
                placeholder="500"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
              />
            </FormField>
            <FormField label="Max Teams">
              <Input
                type="number"
                min="2"
                max="64"
                placeholder="16"
                value={maxTeams}
                onChange={(e) => setMaxTeams(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="UPI ID *">
            <Input
              placeholder="yourname@upi"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Format">
            <Select
              value={format}
              onValueChange={(v) => setFormat(v as Variant_roundrobin_knockout)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Variant_roundrobin_knockout.knockout}>
                  Knockout
                </SelectItem>
                <SelectItem value={Variant_roundrobin_knockout.roundrobin}>
                  Round Robin
                </SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Status">
            <Select
              value={status}
              onValueChange={(v) =>
                setStatus(v as Variant_upcoming_completed_ongoing)
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Variant_upcoming_completed_ongoing.upcoming}>
                  Upcoming
                </SelectItem>
                <SelectItem value={Variant_upcoming_completed_ongoing.ongoing}>
                  Ongoing
                </SelectItem>
                <SelectItem
                  value={Variant_upcoming_completed_ongoing.completed}
                >
                  Completed
                </SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Admin Notes">
            <Input
              placeholder="Internal notes (optional)"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </FormField>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="admin.tournament.save_button"
              className="flex-1 bg-primary text-primary-foreground font-display font-bold"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 size={14} className="mr-1.5 animate-spin" />
              ) : null}
              {tournament ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Teams Tab ────────────────────────────────────────────────────────────────
function AdminTeamsTab() {
  const { data: tournaments } = useGetTournaments();
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | Variant_pending_approved_rejected
  >("all");

  const tId = selectedTournamentId ? BigInt(selectedTournamentId) : null;
  const { data: teams, isLoading } = useGetTeamsByTournament(tId);
  const approveTeam = useApproveTeam();
  const rejectTeam = useRejectTeam();

  const filteredTeams = teams?.filter((t) => {
    if (statusFilter === "all") return true;
    return t.status === statusFilter;
  });

  async function handleApprove(teamId: bigint, slotNumber: string) {
    const slot = Number.parseInt(slotNumber);
    if (Number.isNaN(slot) || slot < 1) {
      toast.error("Enter a valid slot number");
      return;
    }
    try {
      await approveTeam.mutateAsync({ teamId, slotNumber: BigInt(slot) });
      toast.success("Team approved and slot assigned!");
    } catch {
      toast.error("Failed to approve team");
    }
  }

  async function handleReject(teamId: bigint) {
    try {
      await rejectTeam.mutateAsync(teamId);
      toast.success("Team rejected");
    } catch {
      toast.error("Failed to reject team");
    }
  }

  return (
    <div className="space-y-4">
      <Select
        value={selectedTournamentId}
        onValueChange={setSelectedTournamentId}
      >
        <SelectTrigger className="w-full h-11 font-body rounded-xl">
          <SelectValue placeholder="Select tournament..." />
        </SelectTrigger>
        <SelectContent>
          {tournaments?.map((t) => (
            <SelectItem key={t.id.toString()} value={t.id.toString()}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedTournamentId && (
        <>
          {/* Status filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(
              [
                "all",
                Variant_pending_approved_rejected.pending,
                Variant_pending_approved_rejected.approved,
                Variant_pending_approved_rejected.rejected,
              ] as const
            ).map((s) => (
              <button
                type="button"
                key={s}
                data-ocid={`admin.teams.filter.${s}.tab`}
                onClick={() => setStatusFilter(s)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-display font-semibold transition-colors ${
                  statusFilter === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-primary/10"
                }`}
              >
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Teams list */}
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : !filteredTeams || filteredTeams.length === 0 ? (
            <div
              data-ocid="admin.teams.empty_state"
              className="text-center py-10 text-muted-foreground"
            >
              <Users size={36} className="mx-auto mb-2 opacity-30" />
              <p className="font-display font-semibold">No teams found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTeams.map((team, idx) => (
                <AdminTeamCard
                  key={team.id.toString()}
                  team={team}
                  index={idx + 1}
                  onApprove={(slot) => handleApprove(team.id, slot)}
                  onReject={() => handleReject(team.id)}
                  isProcessing={approveTeam.isPending || rejectTeam.isPending}
                />
              ))}
            </div>
          )}
        </>
      )}

      {!selectedTournamentId && (
        <div className="text-center py-10 text-muted-foreground">
          <Users size={36} className="mx-auto mb-2 opacity-30" />
          <p className="font-display font-semibold">Select a tournament</p>
          <p className="text-xs mt-1">to manage team registrations</p>
        </div>
      )}
    </div>
  );
}

function AdminTeamCard({
  team,
  index,
  onApprove,
  onReject,
  isProcessing,
}: {
  team: Team;
  index: number;
  onApprove: (slot: string) => void;
  onReject: () => void;
  isProcessing: boolean;
}) {
  const [slotInput, setSlotInput] = useState("");
  const [expanded, setExpanded] = useState(false);

  const isPending = team.status === Variant_pending_approved_rejected.pending;
  const isApproved = team.status === Variant_pending_approved_rejected.approved;

  return (
    <Card
      data-ocid={`admin.team.item.${index}`}
      className={`border-border/60 ${isApproved ? "border-green-200 bg-green-50/30" : ""}`}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs font-mono text-muted-foreground font-bold">
                #{index}
              </span>
              <p className="font-display font-bold text-sm truncate">
                {team.teamName}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User size={10} />
                {team.captainName}
              </span>
              <span className="flex items-center gap-1">
                <Phone size={10} />
                {team.phoneNumber}
              </span>
            </div>
            {team.upiNote && (
              <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                <CreditCard size={10} />
                <span className="truncate">TxnID: {team.upiNote}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <TeamStatusBadge status={team.status} />
            {team.slotNumber !== undefined && (
              <span className="text-xs font-display font-bold text-primary">
                Slot #{team.slotNumber.toString()}
              </span>
            )}
          </div>
        </div>

        {/* Expand for details */}
        <button
          type="button"
          className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          onClick={() => setExpanded(!expanded)}
        >
          <span>{team.players.length} players registered</span>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2 border-t border-border/50 grid grid-cols-2 gap-1">
                {team.players.map((p, playerIndex) => {
                  const playerNum = playerIndex + 1;
                  return (
                    <p
                      key={`player-${p}-${playerNum}`}
                      className="text-xs text-muted-foreground"
                    >
                      {playerNum}. {p}
                    </p>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Approve / Reject for pending teams */}
        {isPending && (
          <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-2">
            <Input
              placeholder="Slot #"
              type="number"
              min="1"
              value={slotInput}
              onChange={(e) => setSlotInput(e.target.value)}
              className="h-8 text-sm w-20 shrink-0"
            />
            <Button
              data-ocid={`admin.team.approve_button.${index}`}
              size="sm"
              className="h-8 bg-green-600 hover:bg-green-700 text-white font-display font-semibold flex-1 text-xs"
              onClick={() => onApprove(slotInput)}
              disabled={isProcessing || !slotInput}
            >
              {isProcessing ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <CheckCircle2 size={12} className="mr-1" />
              )}
              Approve
            </Button>
            <Button
              data-ocid={`admin.team.reject_button.${index}`}
              size="sm"
              variant="outline"
              className="h-8 border-destructive/50 text-destructive hover:bg-destructive/10 font-display font-semibold flex-1 text-xs"
              onClick={onReject}
              disabled={isProcessing}
            >
              <XCircle size={12} className="mr-1" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TeamStatusBadge({
  status,
}: { status: Variant_pending_approved_rejected }) {
  switch (status) {
    case Variant_pending_approved_rejected.pending:
      return (
        <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">
          Pending
        </Badge>
      );
    case Variant_pending_approved_rejected.approved:
      return (
        <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">
          Approved
        </Badge>
      );
    case Variant_pending_approved_rejected.rejected:
      return (
        <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">
          Rejected
        </Badge>
      );
  }
}

// ─── Fixtures Tab ─────────────────────────────────────────────────────────────
function AdminFixturesTab() {
  const { data: tournaments } = useGetTournaments();
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("");
  const generateFixtures = useGenerateKnockoutFixtures();
  const setMatchResult = useSetMatchResult();

  const tId = selectedTournamentId ? BigInt(selectedTournamentId) : null;
  const { data: matches, isLoading: matchesLoading } =
    useGetMatchesByTournament(tId);
  const { data: teams } = useGetTeamsByTournament(tId);

  const teamsMap = new Map<string, Team>();
  for (const t of teams ?? []) {
    teamsMap.set(t.id.toString(), t);
  }

  async function handleGenerateFixtures() {
    if (!tId) return;
    try {
      await generateFixtures.mutateAsync(tId);
      toast.success("Fixtures generated!");
    } catch {
      toast.error(
        "Failed to generate fixtures. Ensure enough approved teams exist.",
      );
    }
  }

  return (
    <div className="space-y-4">
      <Select
        value={selectedTournamentId}
        onValueChange={setSelectedTournamentId}
      >
        <SelectTrigger className="w-full h-11 font-body rounded-xl">
          <SelectValue placeholder="Select tournament..." />
        </SelectTrigger>
        <SelectContent>
          {tournaments?.map((t) => (
            <SelectItem key={t.id.toString()} value={t.id.toString()}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedTournamentId && (
        <>
          <Button
            data-ocid="admin.generate_fixtures.button"
            onClick={handleGenerateFixtures}
            disabled={generateFixtures.isPending}
            className="w-full bg-primary text-primary-foreground font-display font-bold h-11 rounded-xl"
          >
            {generateFixtures.isPending ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <Zap size={16} className="mr-2" />
            )}
            Generate Knockout Fixtures
          </Button>

          {matchesLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : !matches || matches.length === 0 ? (
            <div
              data-ocid="admin.fixtures.empty_state"
              className="text-center py-8 text-muted-foreground"
            >
              <Swords size={36} className="mx-auto mb-2 opacity-30" />
              <p className="font-display font-semibold">No Fixtures Yet</p>
              <p className="text-xs mt-1">
                Generate fixtures after approving teams
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match, idx) => (
                <AdminMatchCard
                  key={match.id.toString()}
                  match={match}
                  index={idx + 1}
                  teamsMap={teamsMap}
                  onSetResult={async (result, winnerId) => {
                    try {
                      await setMatchResult.mutateAsync({
                        matchId: match.id,
                        result,
                        winnerId,
                      });
                      toast.success("Match result saved!");
                    } catch {
                      toast.error("Failed to save result");
                    }
                  }}
                  isSaving={setMatchResult.isPending}
                />
              ))}
            </div>
          )}
        </>
      )}

      {!selectedTournamentId && (
        <div className="text-center py-10 text-muted-foreground">
          <Trophy size={36} className="mx-auto mb-2 opacity-30" />
          <p className="font-display font-semibold">Select a tournament</p>
          <p className="text-xs mt-1">to manage fixtures</p>
        </div>
      )}
    </div>
  );
}

function AdminMatchCard({
  match,
  index,
  teamsMap,
  onSetResult,
  isSaving,
}: {
  match: Match;
  index: number;
  teamsMap: Map<string, Team>;
  onSetResult: (result: string, winnerId: bigint) => Promise<void>;
  isSaving: boolean;
}) {
  const team1 = teamsMap.get(match.team1Id.toString());
  const team2 = teamsMap.get(match.team2Id.toString());
  const [result, setResult] = useState(match.result ?? "");
  const [winnerId, setWinnerId] = useState<string>(
    match.winnerId?.toString() ?? "",
  );
  const hasResult = !!match.result;

  return (
    <Card data-ocid={`admin.match.item.${index}`} className="border-border/60">
      <CardContent className="p-3">
        {/* Round badge */}
        <div className="flex items-center gap-2 mb-2">
          <Badge
            variant="outline"
            className="text-[10px] border-primary/20 text-primary"
          >
            Round {match.roundNumber.toString()}
          </Badge>
          {hasResult && (
            <Badge className="text-[10px] bg-green-100 text-green-700 border-0">
              Result Set
            </Badge>
          )}
        </div>

        {/* Teams */}
        <div className="flex items-center gap-2 mb-3">
          <span className="flex-1 text-right font-display font-bold text-sm truncate">
            {team1?.teamName ?? `Team ${match.team1Id.toString()}`}
          </span>
          <span className="bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded shrink-0">
            VS
          </span>
          <span className="flex-1 font-display font-bold text-sm truncate">
            {team2?.teamName ?? `Team ${match.team2Id.toString()}`}
          </span>
        </div>

        {/* Result form */}
        <div className="space-y-2">
          <Input
            placeholder="Enter match result (e.g. Royal Strikers won by 5 wickets)"
            value={result}
            onChange={(e) => setResult(e.target.value)}
            className="text-sm"
          />
          <Select value={winnerId} onValueChange={setWinnerId}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select winner..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={match.team1Id.toString()}>
                {team1?.teamName ?? `Team ${match.team1Id.toString()}`}
              </SelectItem>
              <SelectItem value={match.team2Id.toString()}>
                {team2?.teamName ?? `Team ${match.team2Id.toString()}`}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="w-full h-9 bg-primary text-primary-foreground font-display font-semibold"
            disabled={!result || !winnerId || isSaving}
            onClick={() => onSetResult(result, BigInt(winnerId))}
            data-ocid={`admin.match.save_button.${index}`}
          >
            {isSaving ? (
              <Loader2 size={13} className="mr-1.5 animate-spin" />
            ) : (
              <CheckCircle2 size={13} className="mr-1.5" />
            )}
            Save Result
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold text-foreground/80 font-body">
        {label}
      </Label>
      {children}
    </div>
  );
}
