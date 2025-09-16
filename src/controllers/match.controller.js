export default class MatchController {
  constructor(matchRepository) {
    this.matchRepository = matchRepository;
  }

  async createMatchFromAi(req, res) {
    try {
      const match = await this.matchRepository.createMatchFromAi(
        req.params.aiMatchId,
        "9d78e50a-b679-40e1-8625-cc344b8856ac",
      );
      res.status(201).json({
        success: true,
        message: "Match created successfully",
        data: match,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async startMatch(req, res) {
    try {
      console.log("startMatch", req.params.matchId);
      const match = await this.matchRepository.startMatch(
        req.params.matchId,
        "9d78e50a-b679-40e1-8625-cc344b8856ac",
      );
      res.status(200).json({
        success: true,
        message: "Match started successfully",
        data: match,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateMatch(req, res) {
    try {
      const match = await this.matchRepository.updateScore(
        req.params.matchId,
        req.body.team1Score,
        req.body.team2Score,
        "9d78e50a-b679-40e1-8625-cc344b8856ac",
      );
      res.status(200).json({
        success: true,
        message: "Match updated successfully",
        data: match,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async createMatchsFromAi(req, res) {
    try {
      console.log("createMatchsFromAi", req.params.tournamentId);
      const matchs = await this.matchRepository.createMatchsFromAi(
        req.params.tournamentId,
        "9d78e50a-b679-40e1-8625-cc344b8856ac",
      );
      res.status(200).json({
        success: true,
        message: "Matchs created successfully",
        data: matchs,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getMatchsByTournamentId(req, res) {
    try {
      const matchs = await this.matchRepository.getMatchsByTournamentId(
        req.params.tournamentId,
      );
      res.status(200).json({
        success: true,
        message: "Matchs fetched successfully",
        data: matchs,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateMatchStatus(req, res) {
    try {
      const match = await this.matchRepository.updateMatchStatus(
        req.params.matchId,
        req.body.status,
      );
      res.status(200).json({
        success: true,
        message: "Match status updated successfully",
        data: match,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getMatchById(req, res) {
    try {
      const match = await this.matchRepository.getMatchById(req.params.matchId);
      res.status(200).json({
        success: true,
        message: "Match fetched successfully",
        data: match,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}
