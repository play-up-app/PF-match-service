import supabase from "../config/supabase.js";

export default class MatchRepository {
  async createMatchFromAi(aiMatchId, organizerId) {
    const { data: aiMatchData, error: aiMatchError } = await supabase
      .from("ai_generated_match")
      .select("*, ai_tournament_planning!inner(tournament_id)")
      .eq("id", aiMatchId)
      .single();

    if (aiMatchError || !aiMatchData) {
      throw new Error("Ai generated match not found");
    }

    if (aiMatchData.status == "completed") {
      throw new Error("Ai generated match is already completed");
    }

    if (
      !aiMatchData.resolved_equipe_a_id ||
      !aiMatchData.resolved_equipe_b_id
    ) {
      throw new Error("Teams are not resolved yet");
    }

    // check user permissions to create a match for this tournament
    const { data: tournament } = await supabase
      .from("tournament")
      .select("organizer_id")
      .eq("id", aiMatchData.ai_tournament_planning.tournament_id)
      .single();

    if (!tournament || tournament.organizer_id !== organizerId) {
      throw new Error("Unauthorized: Not tournament organizer");
    }

    // Créer le match avec toutes les données du schéma
    const { data: match, error } = await supabase
      .from("match")
      .insert({
        tournament_id: aiMatchData.ai_tournament_planning.tournament_id,
        team_a_id: aiMatchData.resolved_equipe_a_id,
        team_b_id: aiMatchData.resolved_equipe_b_id,
        court_number: aiMatchData.terrain,
        schedule_time: aiMatchData.debut_horaire,
        status: "scheduled", // Match prêt après validation IA
        phase: aiMatchData.phase,
        round_number: aiMatchData.journee || 1,
        match_number_in_round: parseInt(
          aiMatchData.match_id_ai.split("_").pop() || "1",
        ),
        source_ai_match_id: aiMatchId,
        created_from_ai: true,
        created_by: organizerId,
        last_modified_by: organizerId,
        team_a_score: 0,
        team_b_score: 0,
        current_set: 1,
        current_set_score: { team_a: 0, team_b: 0 },
        sets_data: [],
        metadata: {
          ai_match_id: aiMatchData.match_id_ai,
          poule_id: aiMatchData.poule_id,
          original_team_names: {
            team_a: aiMatchData.equipe_a,
            team_b: aiMatchData.equipe_b,
          },
        },
      })
      .select(
        `
        *,
        tournament:tournament_id(*),
        team_a:team_a_id(*),
        team_b:team_b_id(*)
      `,
      )
      .single();
    if (error) throw new Error(error.message);

    await supabase
      .from("ai_generated_match")
      .update({
        status: "completed",
      })
      .eq("source_ai_match_id", aiMatchId);

    return match;
  }

  async startMatch(matchId, playerId) {
    console.log("startMatch", matchId);
    const { data: match, error } = await supabase
      .from("match")
      .select("*, tournament(*), team_a:team_a_id(*), team_b:team_b_id(*)")
      .eq("id", matchId)
      .single();

    if (error || !match) throw new Error("Match not found");

    if (match.status !== "ready")
      throw new Error("Match is not ready to start");

    await this.validateMatchPermission(playerId, match);

    // mettre à jour le statut du match
    const { data: updatedMatch, error: updateError } = await supabase
      .from("match")
      .update({
        status: "in_progress",
        last_modified_by: playerId,
        actual_start_time: new Date().toISOString(),
      })
      .eq("id", matchId)
      .select("*, tournament(*), team_a:team_a_id(*), team_b:team_b_id(*)")
      .single();

    if (updateError) throw new Error(updateError.message);

    return updatedMatch;
  }

  async updateScore(matchId, team1Score, team2Score, arbitreId) {
    // validation des scores
    if (team1Score < 0 || team2Score < 0) {
      throw new Error("Scores cannot be negative");
    }

    const { data: match, error } = await supabase
      .from("match")
      .select("*, tournament(*), team_a:team_a_id(*), team_b:team_b_id(*)")
      .eq("id", matchId)
      .single();

    if (error || !match) throw new Error("Match not found");

    if (match.status !== "in_progress")
      throw new Error("Match is not in progress");

    await this.validateMatchPermission(arbitreId, match);

    const isMatchFinished = this.isMatchFinished(team1Score, team2Score);
    const updateData = {
      team_a_score: team1Score,
      team_b_score: team2Score,
      last_modified_by: arbitreId,
    };

    if (isMatchFinished) {
      updateData.status = "completed";
      updateData.actual_end_time = new Date().toISOString();
    }

    const { data: updatedMatch, error: updateError } = await supabase
      .from("match")
      .update(updateData)
      .eq("id", matchId)
      .select("*, tournament(*), team_a:team_a_id(*), team_b:team_b_id(*)")
      .single();

    if (updateError) throw new Error(updateError.message);

    return updatedMatch;
  }

  async validateMatchPermission(playerId, match) {
    if (match.tournament.organizer_id === playerId) {
      return true;
    }
    const { data: teams, error: teamsError } = await supabase
      .from("team")
      .select("id")
      .eq("tournament_id", match.tournament_id);

    if (teamsError) {
      throw new Error(`Error fetching teams: ${teamsError.message}`);
    }

    if (!teams || teams.length === 0) {
      throw new Error("No teams found in tournament");
    }

    const teamIds = teams.map(team => team.id);

    // Vérifier si le joueur est membre d'une des équipes
    const { data: playerMembership, error: membershipError } = await supabase
      .from("team_member")
      .select("id")
      .eq("user_id", playerId)
      .in("team_id", teamIds)
      .single();

    if (membershipError && membershipError.code !== "PGRST116") {
      // Ignore l'erreur "No rows returned"
      throw new Error(
        `Error checking player membership: ${membershipError.message}`,
      );
    }

    if (!playerMembership) {
      throw new Error("Player is not a member of any team in this tournament");
    }

    return true;
  }

  async isMatchFinished(team1Score, team2Score) {
    const minWinScore = 25;
    const minLeadToWin = 2;

    return (
      (team1Score >= minWinScore && team1Score - team2Score >= minLeadToWin) ||
      (team2Score >= minWinScore && team2Score - team1Score >= minLeadToWin)
    );
  }
}
