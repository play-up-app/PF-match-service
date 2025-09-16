import express from "express";

export default class MatchRoute {
  constructor(matchController) {
    this.matchController = matchController;
    this.router = express.Router();
    this.createRoutes();
  }

  createRoutes() {
    this.router.get("/tournament/:tournamentId", (req, res) =>
      this.matchController.getMatchsByTournamentId(req, res),
    );
    this.router.get("/:matchId", (req, res) =>
      this.matchController.getMatchById(req, res),
    );
    this.router.post("/from-ai/:aiMatchId", (req, res) =>
      this.matchController.createMatchFromAi(req, res),
    );
    this.router.post("/:matchId/start", (req, res) =>
      this.matchController.startMatch(req, res),
    );
    this.router.patch("/:matchId/score", (req, res) =>
      this.matchController.updateMatch(req, res),
    );
    this.router.post("/from-ai/tournament/:tournamentId", (req, res) =>
      this.matchController.createMatchsFromAi(req, res),
    );
    this.router.patch("/:matchId/status", (req, res) =>
      this.matchController.updateMatchStatus(req, res),
    );
  }
}
