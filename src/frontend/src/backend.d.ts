import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type TournamentId = bigint;
export interface Tournament {
    id: TournamentId;
    status: Variant_upcoming_completed_ongoing;
    venue: string;
    name: string;
    upiId: string;
    maxTeams: bigint;
    entryFee: bigint;
    adminNotes: string;
    startDate: string;
    format: Variant_roundrobin_knockout;
}
export interface Match {
    id: MatchId;
    result?: string;
    winnerId?: TeamId;
    team1Id: TeamId;
    team2Id: TeamId;
    roundNumber: bigint;
    tournamentId: TournamentId;
}
export type MatchId = bigint;
export type TeamId = bigint;
export interface Team {
    id: TeamId;
    status: Variant_pending_approved_rejected;
    teamName: string;
    captainName: string;
    upiNote: string;
    players: Array<string>;
    phoneNumber: string;
    tournamentId: TournamentId;
    slotNumber?: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_pending_approved_rejected {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum Variant_roundrobin_knockout {
    roundrobin = "roundrobin",
    knockout = "knockout"
}
export enum Variant_upcoming_completed_ongoing {
    upcoming = "upcoming",
    completed = "completed",
    ongoing = "ongoing"
}
export interface backendInterface {
    approveTeam(teamId: TeamId, slotNumber: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createTournament(tournament: Tournament): Promise<TournamentId>;
    deleteTournament(tournamentId: TournamentId): Promise<void>;
    generateKnockoutFixtures(tournamentId: TournamentId): Promise<void>;
    getCallerUserRole(): Promise<UserRole>;
    getMatchesByTournament(tournamentId: TournamentId): Promise<Array<Match>>;
    getTeamsByStatus(tournamentId: TournamentId, status: Variant_pending_approved_rejected): Promise<Array<Team>>;
    getTeamsByTournament(tournamentId: TournamentId): Promise<Array<Team>>;
    getTournamentById(tournamentId: TournamentId): Promise<Tournament | null>;
    getTournaments(): Promise<Array<Tournament>>;
    isCallerAdmin(): Promise<boolean>;
    registerTeam(tournamentId: TournamentId, team: Team): Promise<TeamId>;
    rejectTeam(teamId: TeamId): Promise<void>;
    setMatchResult(matchId: MatchId, result: string, winnerId: TeamId): Promise<void>;
    updateTournament(tournamentId: TournamentId, tournament: Tournament): Promise<void>;
}
