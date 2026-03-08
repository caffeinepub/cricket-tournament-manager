import Array "mo:core/Array";
import Iterate "mo:core/Iter";
import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Initialize the access control system and include authorization mixin
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Type
  public type UserProfile = {
    name : Text;
    phone : ?Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // Tournament Manager Types
  type TournamentId = Nat;
  type TeamId = Nat;
  type MatchId = Nat;

  type Tournament = {
    id : TournamentId;
    name : Text;
    format : { #knockout; #roundrobin };
    entryFee : Nat;
    maxTeams : Nat;
    startDate : Text;
    venue : Text;
    upiId : Text;
    status : { #upcoming; #ongoing; #completed };
    adminNotes : Text;
  };

  type Team = {
    id : TeamId;
    tournamentId : TournamentId;
    teamName : Text;
    captainName : Text;
    phoneNumber : Text;
    players : [Text];
    upiNote : Text;
    slotNumber : ?Nat;
    status : { #pending; #approved; #rejected };
  };

  type Match = {
    id : MatchId;
    tournamentId : TournamentId;
    roundNumber : Nat;
    team1Id : TeamId;
    team2Id : TeamId;
    result : ?Text;
    winnerId : ?TeamId;
  };

  module Tournament {
    public func compare(t1 : Tournament, t2 : Tournament) : Order.Order {
      Nat.compare(t1.id, t2.id);
    };
  };

  module Team {
    public func compare(t1 : Team, t2 : Team) : Order.Order {
      Nat.compare(t1.id, t2.id);
    };
  };

  module Match {
    public func compare(m1 : Match, m2 : Match) : Order.Order {
      Nat.compare(m1.id, m2.id);
    };
  };

  let tournaments = Map.empty<TournamentId, Tournament>();
  let teams = Map.empty<TeamId, Team>();
  let matches = Map.empty<MatchId, Match>();

  var nextTournamentId = 1;
  var nextTeamId = 1;
  var nextMatchId = 1;

  // ---------------------------------
  // Tournament Management Functions
  // ---------------------------------

  // Admin-only: Create Tournament
  public shared ({ caller }) func createTournament(tournament : Tournament) : async TournamentId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create tournaments");
    };
    let id = nextTournamentId;
    nextTournamentId += 1;
    let newTournament : Tournament = {
      id;
      name = tournament.name;
      format = tournament.format;
      entryFee = tournament.entryFee;
      maxTeams = tournament.maxTeams;
      startDate = tournament.startDate;
      venue = tournament.venue;
      upiId = tournament.upiId;
      status = tournament.status;
      adminNotes = tournament.adminNotes;
    };
    tournaments.add(id, newTournament);
    id;
  };

  // Admin-only: Update Tournament
  public shared ({ caller }) func updateTournament(tournamentId : TournamentId, tournament : Tournament) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update tournaments");
    };
    switch (tournaments.get(tournamentId)) {
      case (null) { Runtime.trap("Tournament not found") };
      case (?_) {
        let updatedTournament : Tournament = {
          id = tournamentId;
          name = tournament.name;
          format = tournament.format;
          entryFee = tournament.entryFee;
          maxTeams = tournament.maxTeams;
          startDate = tournament.startDate;
          venue = tournament.venue;
          upiId = tournament.upiId;
          status = tournament.status;
          adminNotes = tournament.adminNotes;
        };
        tournaments.add(tournamentId, updatedTournament);
      };
    };
  };

  // Admin-only: Delete Tournament
  public shared ({ caller }) func deleteTournament(tournamentId : TournamentId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete tournaments");
    };
    switch (tournaments.get(tournamentId)) {
      case (null) { Runtime.trap("Tournament not found") };
      case (?_) {
        tournaments.remove(tournamentId);
        ();
      };
    };
  };

  // ---------------------------------
  // Team Management Functions
  // ---------------------------------

  // User action: Register Team (authenticated users only)
  public shared ({ caller }) func registerTeam(tournamentId : TournamentId, team : Team) : async TeamId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can register teams");
    };
    switch (tournaments.get(tournamentId)) {
      case (null) { Runtime.trap("Tournament not found") };
      case (?_) {
        let id = nextTeamId;
        nextTeamId += 1;
        let newTeam : Team = {
          id;
          tournamentId;
          teamName = team.teamName;
          captainName = team.captainName;
          phoneNumber = team.phoneNumber;
          players = team.players;
          upiNote = team.upiNote;
          slotNumber = null;
          status = #pending;
        };
        teams.add(id, newTeam);
        id;
      };
    };
  };

  // Admin-only: Approve Team
  public shared ({ caller }) func approveTeam(teamId : TeamId, slotNumber : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can approve teams");
    };
    switch (teams.get(teamId)) {
      case (null) { Runtime.trap("Team not found") };
      case (?team) {
        let updatedTeam : Team = {
          id = team.id;
          tournamentId = team.tournamentId;
          teamName = team.teamName;
          captainName = team.captainName;
          phoneNumber = team.phoneNumber;
          players = team.players;
          upiNote = team.upiNote;
          slotNumber = ?slotNumber;
          status = #approved;
        };
        teams.add(teamId, updatedTeam);
      };
    };
  };

  // Admin-only: Reject Team
  public shared ({ caller }) func rejectTeam(teamId : TeamId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reject teams");
    };
    switch (teams.get(teamId)) {
      case (null) { Runtime.trap("Team not found") };
      case (?team) {
        let updatedTeam : Team = {
          id = team.id;
          tournamentId = team.tournamentId;
          teamName = team.teamName;
          captainName = team.captainName;
          phoneNumber = team.phoneNumber;
          players = team.players;
          upiNote = team.upiNote;
          slotNumber = team.slotNumber;
          status = #rejected;
        };
        teams.add(teamId, updatedTeam);
      };
    };
  };

  // ---------------------------------
  // Public Query Functions
  // ---------------------------------

  // Public query: Get all tournaments (accessible to everyone including guests)
  public query ({ caller }) func getTournaments() : async [Tournament] {
    tournaments.values().toArray().sort();
  };

  // Public query: Get tournament by ID (accessible to everyone including guests)
  public query ({ caller }) func getTournamentById(tournamentId : TournamentId) : async ?Tournament {
    tournaments.get(tournamentId);
  };

  // Public query: Get teams by tournament (accessible to everyone including guests)
  public query ({ caller }) func getTeamsByTournament(tournamentId : TournamentId) : async [Team] {
    let teamsIterator = teams.values();
    let filteredIterator = teamsIterator.filter(
      func(team) {
        team.tournamentId == tournamentId;
      }
    );
    filteredIterator.toArray().sort();
  };

  // Public query: Get teams by status (accessible to everyone including guests)
  public query ({ caller }) func getTeamsByStatus(tournamentId : TournamentId, status : { #pending; #approved; #rejected }) : async [Team] {
    let teamsIterator = teams.values();
    let filteredIterator = teamsIterator.filter(
      func(team) {
        team.tournamentId == tournamentId and team.status == status;
      }
    );
    filteredIterator.toArray().sort();
  };

  // Public query: Get matches by tournament (accessible to everyone including guests)
  public query ({ caller }) func getMatchesByTournament(tournamentId : TournamentId) : async [Match] {
    let matchesIterator = matches.values();
    let filteredIterator = matchesIterator.filter(
      func(match) {
        match.tournamentId == tournamentId;
      }
    );
    filteredIterator.toArray().sort();
  };

  // ---------------------------------
  // Fixture and Result Management
  // ---------------------------------

  // Admin-only: Generate knockout fixtures
  public shared ({ caller }) func generateKnockoutFixtures(tournamentId : TournamentId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can generate fixtures");
    };
    let approvedTeamsList = List.empty<Team>();
    for (team in teams.values()) {
      if (team.tournamentId == tournamentId and team.status == #approved) {
        approvedTeamsList.add(team);
      };
    };

    if (approvedTeamsList.size() < 2) { Runtime.trap("Not enough teams to generate fixtures") };

    let approvedTeams = approvedTeamsList.toArray();
    let numTeams = approvedTeams.size();

    for (i in Nat.range(0, numTeams / 2)) {
      let matchId = nextMatchId;
      nextMatchId += 1;
      let team1 = approvedTeams[i * 2];
      let team2 = approvedTeams[i * 2 + 1];

      let newMatch : Match = {
        id = matchId;
        tournamentId;
        roundNumber = 1;
        team1Id = team1.id;
        team2Id = team2.id;
        result = null;
        winnerId = null;
      };
      matches.add(matchId, newMatch);
    };
  };

  // Admin-only: Set match result
  public shared ({ caller }) func setMatchResult(matchId : MatchId, result : Text, winnerId : TeamId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set match results");
    };
    switch (matches.get(matchId)) {
      case (null) { Runtime.trap("Match not found") };
      case (?match) {
        let updatedMatch : Match = {
          id = match.id;
          tournamentId = match.tournamentId;
          roundNumber = match.roundNumber;
          team1Id = match.team1Id;
          team2Id = match.team2Id;
          result = ?result;
          winnerId = ?winnerId;
        };
        matches.add(matchId, updatedMatch);
      };
    };
  };
};
