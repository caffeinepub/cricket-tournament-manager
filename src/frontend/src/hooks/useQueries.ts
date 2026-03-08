import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  MatchId,
  Team,
  TeamId,
  Tournament,
  TournamentId,
  Variant_pending_approved_rejected,
} from "../backend.d";
import { useActor } from "./useActor";

// ─── Tournaments ─────────────────────────────────────────────────────────────

export function useGetTournaments() {
  const { actor, isFetching } = useActor();
  return useQuery<Tournament[]>({
    queryKey: ["tournaments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTournaments();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTournamentById(tournamentId: TournamentId | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Tournament | null>({
    queryKey: ["tournament", tournamentId?.toString()],
    queryFn: async () => {
      if (!actor || tournamentId === null) return null;
      return actor.getTournamentById(tournamentId);
    },
    enabled: !!actor && !isFetching && tournamentId !== null,
  });
}

export function useCreateTournament() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tournament: Tournament) => {
      if (!actor) throw new Error("Not connected");
      return actor.createTournament(tournament);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });
}

export function useUpdateTournament() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      tournament,
    }: {
      id: TournamentId;
      tournament: Tournament;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateTournament(id, tournament);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });
}

export function useDeleteTournament() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: TournamentId) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteTournament(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tournaments"] });
    },
  });
}

// ─── Teams ────────────────────────────────────────────────────────────────────

export function useGetTeamsByTournament(tournamentId: TournamentId | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Team[]>({
    queryKey: ["teams", tournamentId?.toString()],
    queryFn: async () => {
      if (!actor || tournamentId === null) return [];
      return actor.getTeamsByTournament(tournamentId);
    },
    enabled: !!actor && !isFetching && tournamentId !== null,
  });
}

export function useGetTeamsByStatus(
  tournamentId: TournamentId | null,
  status: Variant_pending_approved_rejected,
) {
  const { actor, isFetching } = useActor();
  return useQuery<Team[]>({
    queryKey: ["teams", tournamentId?.toString(), status],
    queryFn: async () => {
      if (!actor || tournamentId === null) return [];
      return actor.getTeamsByStatus(tournamentId, status);
    },
    enabled: !!actor && !isFetching && tournamentId !== null,
  });
}

export function useRegisterTeam() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tournamentId,
      team,
    }: {
      tournamentId: TournamentId;
      team: Team;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.registerTeam(tournamentId, team);
    },
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({
        queryKey: ["teams", variables.tournamentId.toString()],
      });
    },
  });
}

export function useApproveTeam() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      teamId,
      slotNumber,
    }: {
      teamId: TeamId;
      slotNumber: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.approveTeam(teamId, slotNumber);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useRejectTeam() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (teamId: TeamId) => {
      if (!actor) throw new Error("Not connected");
      return actor.rejectTeam(teamId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

// ─── Matches ──────────────────────────────────────────────────────────────────

export function useGetMatchesByTournament(tournamentId: TournamentId | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["matches", tournamentId?.toString()],
    queryFn: async () => {
      if (!actor || tournamentId === null) return [];
      return actor.getMatchesByTournament(tournamentId);
    },
    enabled: !!actor && !isFetching && tournamentId !== null,
  });
}

export function useGenerateKnockoutFixtures() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tournamentId: TournamentId) => {
      if (!actor) throw new Error("Not connected");
      return actor.generateKnockoutFixtures(tournamentId);
    },
    onSuccess: (_data, tournamentId) => {
      void qc.invalidateQueries({
        queryKey: ["matches", tournamentId.toString()],
      });
    },
  });
}

export function useSetMatchResult() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      matchId,
      result,
      winnerId,
    }: {
      matchId: MatchId;
      result: string;
      winnerId: TeamId;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.setMatchResult(matchId, result, winnerId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}
