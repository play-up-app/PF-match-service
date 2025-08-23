import express from "express";

export default class MatchRoute {
  constructor(matchController) {
    this.matchController = matchController;
    this.router = express.Router();
    this.createRoutes();
  }

  createRoutes() {
    this.router.post("/from-ai/:aiMatchId", (req, res) =>
      this.matchController.createMatchFromAi(req, res),
    );
    this.router.post("/:matchId/start", (req, res) =>
      this.matchController.startMatch(req, res),
    );
    this.router.patch("/:matchId/score", (req, res) =>
      this.matchController.updateMatch(req, res),
    );
  }
}
