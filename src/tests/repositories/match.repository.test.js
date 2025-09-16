import { jest, expect, describe, it, beforeEach } from "@jest/globals";

// Mock de Supabase
const mockSupabaseClient = {
  from: jest.fn(),
};

// Mock des modules
jest.unstable_mockModule("../../config/supabase.js", () => ({
  default: mockSupabaseClient,
}));

// Import après les mocks
const MatchRepository = (await import("../../repositories/match.repository.js"))
  .default;

describe("MatchRepository", () => {
  let matchRepository;
  const validUUID = "123e4567-e89b-12d3-a456-426614174000";

  beforeEach(() => {
    matchRepository = new MatchRepository();
    jest.clearAllMocks();
  });

  describe("createMatchFromAi", () => {
    const mockAiMatchData = {
      id: validUUID,
      status: "pending",
      resolved_equipe_a_id: validUUID,
      resolved_equipe_b_id: validUUID,
      terrain: 1,
      debut_horaire: "2024-03-21T14:00:00Z",
      phase: "group",
      journee: 1,
      match_id_ai: "match_1",
      poule_id: "poule_1",
      equipe_a: "Team A",
      equipe_b: "Team B",
      ai_tournament_planning: {
        tournament_id: validUUID,
      },
    };

    const mockCreatedMatch = {
      id: validUUID,
      tournament_id: validUUID,
      team_a_id: validUUID,
      team_b_id: validUUID,
      status: "scheduled",
    };

    it("devrait créer un match depuis l'IA avec succès", async () => {
      mockSupabaseClient.from.mockImplementation(table => {
        switch (table) {
          case "ai_generated_match": {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: mockAiMatchData }),
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: null }),
              }),
            };
          }
          case "tournament": {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest
                .fn()
                .mockResolvedValue({ data: { organizer_id: validUUID } }),
            };
          }
          case "match": {
            return {
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mockCreatedMatch }),
              }),
            };
          }
        }
      });

      const result = await matchRepository.createMatchFromAi(
        validUUID,
        validUUID,
      );
      expect(result).toEqual(mockCreatedMatch);
    });

    it("devrait échouer si le match AI n'existe pas", async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null }),
      }));

      await expect(
        matchRepository.createMatchFromAi(validUUID, validUUID),
      ).rejects.toThrow("Ai generated match not found");
    });

    it("devrait échouer si le match AI est déjà complété", async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockAiMatchData, status: "completed" },
        }),
      }));

      await expect(
        matchRepository.createMatchFromAi(validUUID, validUUID),
      ).rejects.toThrow("Ai generated match is already completed");
    });

    it("devrait échouer si les équipes ne sont pas résolues", async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            ...mockAiMatchData,
            resolved_equipe_a_id: null,
            resolved_equipe_b_id: null,
          },
        }),
      }));

      await expect(
        matchRepository.createMatchFromAi(validUUID, validUUID),
      ).rejects.toThrow("Teams are not resolved yet");
    });

    it("devrait échouer si l'insertion du match échoue", async () => {
      mockSupabaseClient.from.mockImplementation(table => {
        if (table === "ai_generated_match") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockAiMatchData }),
          };
        }
        if (table === "tournament") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest
              .fn()
              .mockResolvedValue({ data: { organizer_id: validUUID } }),
          };
        }
        if (table === "match") {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnThis(),
              single: jest
                .fn()
                .mockResolvedValue({ error: new Error("Insert failed") }),
            }),
          };
        }
      });

      await expect(
        matchRepository.createMatchFromAi(validUUID, validUUID),
      ).rejects.toThrow("Insert failed");
    });
  });

  describe("startMatch", () => {
    const mockMatch = {
      id: validUUID,
      status: "ready",
      tournament: {
        organizer_id: validUUID,
      },
    };

    it("devrait démarrer un match avec succès", async () => {
      const mockUpdatedMatch = {
        ...mockMatch,
        status: "in_progress",
        actual_start_time: expect.any(String),
      };

      mockSupabaseClient.from.mockImplementation(table => {
        switch (table) {
          case "match": {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest
                .fn()
                .mockResolvedValueOnce({ data: mockMatch })
                .mockResolvedValueOnce({ data: mockUpdatedMatch }),
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mockUpdatedMatch }),
              }),
            };
          }
          case "team": {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockResolvedValue({ data: [{ id: "team-1" }] }),
            };
          }
          case "team_member": {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              in: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: { id: "member-1" } }),
            };
          }
        }
      });

      const result = await matchRepository.startMatch(validUUID, validUUID);
      expect(result.status).toBe("in_progress");
      expect(result.actual_start_time).toBeTruthy();
    });

    it("devrait échouer si le match n'existe pas", async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null }),
      }));

      await expect(
        matchRepository.startMatch(validUUID, validUUID),
      ).rejects.toThrow("Match not found");
    });

    it("devrait échouer si le match n'est pas prêt", async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockMatch, status: "scheduled" },
        }),
      }));

      await expect(
        matchRepository.startMatch(validUUID, validUUID),
      ).rejects.toThrow("Match is not ready to start");
    });

    it("devrait échouer si la mise à jour du statut échoue", async () => {
      mockSupabaseClient.from.mockImplementation(table => {
        switch (table) {
          case "match": {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest
                .fn()
                .mockResolvedValueOnce({ data: { ...mockMatch } }),
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest
                  .fn()
                  .mockResolvedValue({ error: new Error("update failed") }),
              }),
            };
          }
          case "team": {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockResolvedValue({ data: [{ id: "team-1" }] }),
            };
          }
          case "team_member": {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              in: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: { id: "member-1" } }),
            };
          }
        }
      });

      await expect(
        matchRepository.startMatch(validUUID, validUUID),
      ).rejects.toThrow("update failed");
    });
  });

  describe("updateScore", () => {
    const mockMatch = {
      id: validUUID,
      status: "in_progress",
      tournament: {
        organizer_id: validUUID,
      },
    };

    it("devrait mettre à jour le score avec succès", async () => {
      const mockUpdatedMatch = {
        ...mockMatch,
        team_a_score: 25,
        team_b_score: 20,
      };

      mockSupabaseClient.from.mockImplementation(table => {
        switch (table) {
          case "match": {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest
                .fn()
                .mockResolvedValueOnce({ data: mockMatch })
                .mockResolvedValueOnce({ data: mockUpdatedMatch }),
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mockUpdatedMatch }),
              }),
            };
          }
          case "team": {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockResolvedValue({ data: [{ id: "team-1" }] }),
            };
          }
          case "team_member": {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              in: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: { id: "member-1" } }),
            };
          }
        }
      });

      const result = await matchRepository.updateScore(
        validUUID,
        25,
        20,
        validUUID,
      );
      expect(result.team_a_score).toBe(25);
      expect(result.team_b_score).toBe(20);
    });

    it("devrait échouer avec des scores négatifs", async () => {
      await expect(
        matchRepository.updateScore(validUUID, -1, 0, validUUID),
      ).rejects.toThrow("Scores cannot be negative");
    });

    it("devrait échouer si le match n'est pas en cours", async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockMatch, status: "completed" },
        }),
      }));

      await expect(
        matchRepository.updateScore(validUUID, 25, 20, validUUID),
      ).rejects.toThrow("Match is not in progress");
    });

    it("devrait marquer le match comme terminé si le score est gagnant", async () => {
      const mockUpdatedMatch = {
        ...mockMatch,
        team_a_score: 25,
        team_b_score: 20,
        status: "completed",
        actual_end_time: expect.any(String),
      };

      mockSupabaseClient.from.mockImplementation(table => {
        switch (table) {
          case "match": {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest
                .fn()
                .mockResolvedValueOnce({ data: mockMatch })
                .mockResolvedValueOnce({ data: mockUpdatedMatch }),
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: mockUpdatedMatch }),
              }),
            };
          }
          case "team": {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockResolvedValue({ data: [{ id: "team-1" }] }),
            };
          }
          case "team_member": {
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              in: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: { id: "member-1" } }),
            };
          }
        }
      });

      const result = await matchRepository.updateScore(
        validUUID,
        25,
        20,
        validUUID,
      );
      expect(result.status).toBe("completed");
      expect(result.actual_end_time).toBeTruthy();
    });
  });

  describe("isMatchFinished", () => {
    it("devrait retourner true quand l'équipe A gagne", async () => {
      const result = await matchRepository.isMatchFinished(25, 20);
      expect(result).toBe(true);
    });

    it("devrait retourner true quand l'équipe B gagne", async () => {
      const result = await matchRepository.isMatchFinished(20, 25);
      expect(result).toBe(true);
    });

    it("devrait retourner false quand le score est insuffisant", async () => {
      const result = await matchRepository.isMatchFinished(20, 20);
      expect(result).toBe(false);
    });

    it("devrait retourner false quand l'écart est insuffisant", async () => {
      const result = await matchRepository.isMatchFinished(25, 24);
      expect(result).toBe(false);
    });
  });

  describe("validateMatchPermission", () => {
    const mockMatch = {
      id: validUUID,
      tournament_id: validUUID,
      tournament: {
        organizer_id: validUUID,
      },
    };

    it("devrait autoriser l'organisateur du tournoi", async () => {
      const result = await matchRepository.validateMatchPermission(
        mockMatch.tournament.organizer_id,
        mockMatch,
      );
      expect(result).toBe(true);
    });

    it("devrait autoriser un membre d'équipe du tournoi", async () => {
      mockSupabaseClient.from.mockImplementation(table => {
        switch (table) {
          case "team":
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockResolvedValue({ data: [{ id: "team-1" }] }),
            };
          case "team_member":
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              in: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: { id: "member-1" } }),
            };
        }
      });

      const result = await matchRepository.validateMatchPermission(
        "other-user",
        mockMatch,
      );
      expect(result).toBe(true);
    });

    it("devrait échouer si la requête des équipes échoue", async () => {
      mockSupabaseClient.from.mockImplementation(table => {
        if (table === "team") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              error: new Error("Database error"),
            }),
          };
        }
      });

      await expect(
        matchRepository.validateMatchPermission("other-user", mockMatch),
      ).rejects.toThrow("Error fetching teams: Database error");
    });

    it("devrait échouer si aucune équipe n'est trouvée", async () => {
      mockSupabaseClient.from.mockImplementation(table => {
        if (table === "team") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [] }),
          };
        }
      });

      await expect(
        matchRepository.validateMatchPermission("other-user", mockMatch),
      ).rejects.toThrow("No teams found in tournament");
    });

    it("devrait échouer si la requête des membres échoue", async () => {
      mockSupabaseClient.from.mockImplementation(table => {
        if (table === "team") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [{ id: "team-1" }] }),
          };
        }
        if (table === "team_member") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              error: {
                message: "Database error",
                code: "PGRST117", // Code différent de PGRST116
              },
            }),
          };
        }
      });

      await expect(
        matchRepository.validateMatchPermission("other-user", mockMatch),
      ).rejects.toThrow("Error checking player membership: Database error");
    });

    it("devrait refuser l'accès si l'utilisateur n'est pas membre", async () => {
      mockSupabaseClient.from.mockImplementation(table => {
        switch (table) {
          case "team":
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockResolvedValue({ data: [{ id: "team-1" }] }),
            };
          case "team_member":
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              in: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: null }),
            };
        }
      });

      await expect(
        matchRepository.validateMatchPermission("unauthorized-user", mockMatch),
      ).rejects.toThrow(
        "Player is not a member of any team in this tournament",
      );
    });
  });

  // describe("createMatchFromAi - sécurité organisateur", () => {
  //   it("devrait refuser si l'utilisateur n'est pas l'organisateur", async () => {
  //     const aiData = {
  //       id: validUUID,
  //       status: "pending",
  //       resolved_equipe_a_id: validUUID,
  //       resolved_equipe_b_id: validUUID,
  //       terrain: 1,
  //       debut_horaire: "2024-03-21T14:00:00Z",
  //       phase: "group",
  //       journee: 1,
  //       match_id_ai: "match_1",
  //       poule_id: "poule_1",
  //       ai_tournament_planning: { tournament_id: validUUID },
  //     };

  //     mockSupabaseClient.from.mockImplementation(table => {
  //       if (table === "ai_generated_match") {
  //         return {
  //           select: jest.fn().mockReturnThis(),
  //           eq: jest.fn().mockReturnThis(),
  //           single: jest.fn().mockResolvedValue({ data: aiData }),
  //         };
  //       }
  //       if (table === "tournament") {
  //         return {
  //           select: jest.fn().mockReturnThis(),
  //           eq: jest.fn().mockReturnThis(),
  //           single: jest
  //             .fn()
  //             .mockResolvedValue({ data: { organizer_id: "other" } }),
  //         };
  //       }
  //     });

  //     await expect(
  //       matchRepository.createMatchFromAi(validUUID, validUUID),
  //     ).rejects.toThrow("Unauthorized: Not tournament organizer");
  //   });
  // });

  describe("createMatchsFromAi", () => {
    it("devrait créer les matchs pour chaque entrée IA", async () => {
      const spy = jest
        .spyOn(matchRepository, "createMatchFromAi")
        .mockResolvedValue({ id: "m1" });

      mockSupabaseClient.from.mockImplementation(table => {
        if (table === "ai_generated_match") {
          const chain = {
            select: jest.fn(),
            eq: jest.fn(),
          };
          chain.select.mockReturnValue(chain);
          chain.eq.mockResolvedValue({
            data: [
              {
                id: "ai1",
                ai_tournament_planning: { tournament_id: validUUID },
              },
            ],
            error: null,
          });
          return chain;
        }
      });

      const result = await matchRepository.createMatchsFromAi(
        validUUID,
        validUUID,
      );
      expect(result).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith("ai1", validUUID);
    });

    it("devrait échouer si la récupération des matchs IA échoue", async () => {
      mockSupabaseClient.from.mockImplementation(table => {
        if (table === "ai_generated_match") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest
              .fn()
              .mockResolvedValue({ error: new Error("fetch error") }),
          };
        }
      });

      await expect(
        matchRepository.createMatchsFromAi(validUUID, validUUID),
      ).rejects.toThrow("fetch error");
    });
  });

  describe("getMatchsByTournamentId", () => {
    it("devrait retourner la liste des matchs", async () => {
      mockSupabaseClient.from.mockImplementation(table => {
        if (table === "match") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [{ id: "m1" }] }),
          };
        }
      });

      const result = await matchRepository.getMatchsByTournamentId(validUUID);
      expect(result).toEqual([{ id: "m1" }]);
    });

    it("devrait lever une erreur si la requête échoue", async () => {
      mockSupabaseClient.from.mockImplementation(table => {
        if (table === "match") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ error: new Error("db error") }),
          };
        }
      });

      await expect(
        matchRepository.getMatchsByTournamentId(validUUID),
      ).rejects.toThrow("db error");
    });
  });

  describe("updateMatchStatus", () => {
    it("devrait lever une erreur pour un status invalide", async () => {
      await expect(
        matchRepository.updateMatchStatus(validUUID, "weird"),
      ).rejects.toThrow("Status invalide");
    });

    it("devrait lever une erreur si l'update échoue", async () => {
      mockSupabaseClient.from.mockImplementation(table => {
        if (table === "match") {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              single: jest
                .fn()
                .mockResolvedValue({ error: new Error("update err") }),
            }),
          };
        }
      });

      await expect(
        matchRepository.updateMatchStatus(validUUID, "ready"),
      ).rejects.toThrow("update err");
    });
  });

  describe("getMatchById", () => {
    it("devrait lever une erreur si la requête échoue", async () => {
      mockSupabaseClient.from.mockImplementation(table => {
        if (table === "match") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest
              .fn()
              .mockResolvedValue({ error: new Error("not found") }),
          };
        }
      });

      await expect(matchRepository.getMatchById(validUUID)).rejects.toThrow(
        "not found",
      );
    });
  });
});
