import express, { Request, Response } from "express";
import { collections } from "../services/database.service";
import User from "../models/user";
import STATUS_CODES from "../models/status";
import { ObjectId } from "mongodb";
import { GAMES, Game, MakinatorGuessGame } from "../models/games";

export const gamesRouter = express.Router();

gamesRouter.use(express.json());

gamesRouter.post("/update", async (req: Request, res: Response) => {
  const gameData = req.body.game;
  const userID = req.body.userID;
  const gameType: GAMES = req.body.type;
  const [service, game] = gameType.split('.');
  try {
    if (collections.users) {
      const res = await collections.users.updateOne(
        { _id: userID },
        { $push: { [service]: {[game]: gameData}} },
      );
    }
    res.send({ status: STATUS_CODES.SUCCESS });
  } catch (error) {
    console.log(error);
    res.send({ status: STATUS_CODES.GENERIC_ERROR });
  }
});

gamesRouter.post("/highscore", async (req: Request, res: Response) => {
    const userID = req.body.userID;
    const gameType: GAMES = req.body.type;
    const [service, game] = gameType.split('.');
    let highscore: Game | null = null;
    try {
      if (collections.users) {
        const res = await collections.users.findOne(
          { _id: userID },
          { [service]: {[game]: {}} },
        ) as unknown as Game[];
        highscore = res.sort(
            (a: Game, b: Game) => b.score - a.score)[0]
      }
      res.send({ highscore, status: STATUS_CODES.SUCCESS });
    } catch (error) {
      console.log(error);
      res.send({ status: STATUS_CODES.GENERIC_ERROR });
    }
  });
