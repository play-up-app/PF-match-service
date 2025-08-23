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
}
