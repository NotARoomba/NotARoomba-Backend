import express, { Request, Response } from "express";
import { collections } from "../services/database.service";
import STATUS_CODES from "../models/status";
import { GAMES, Game, HighScore, MakinatorGuessGame } from "../models/games";
import User from "../models/user";
import { ObjectId } from "mongodb";

export const gamesRouter = express.Router();

gamesRouter.use(express.json());

gamesRouter.post("/update", async (req: Request, res: Response) => {
  const gameData = req.body.game;
  const userID = req.body.userID;
  const gameType: GAMES = req.body.type;
  try {
    if (collections.users) {
      const data = await collections.users.updateOne(
        { _id: new ObjectId(userID) },
        { $push: { [gameType]: gameData } },
      );
      console.log(data);
    }
    res.send({ status: STATUS_CODES.SUCCESS });
  } catch (error) {
    console.log(error);
    res.send({ status: STATUS_CODES.GENERIC_ERROR });
  }
});

gamesRouter.post("/highscores", async (req: Request, res: Response) => {
  const userID = req.body.userID;
  const gameTypes: GAMES[] = req.body.types;
  const highscores: HighScore[] = [];
  console.log(userID, gameTypes)
  try {
    if (collections.users) {
      const data = await collections.users.findOne(
        { _id: new ObjectId(userID) },
        {},
      );
      console.log(data);
      for (let gameType of gameTypes) {
        console.log(gameType)
        const [service, game] = gameType.split(".");
        highscores.push({
          game: (data as any)[service][game].sort(
            (a: Game, b: Game) => b.score - a.score,
          )[0],
          gamesPlayed: (data as any)[service][game].length,
        });
      }
    }
    res.send({ highscores, status: STATUS_CODES.SUCCESS });
  } catch (error) {
    console.log(error);
    res.send({ status: STATUS_CODES.GENERIC_ERROR });
  }
});

gamesRouter.post("/highscore", async (req: Request, res: Response) => {
  const userID = req.body.userID;
  const gameType: GAMES = req.body.type;
  const [service, game] = gameType.split(".");
  let highscore: Game | null = null;
  let gamesPlayed = 0;
  try {
    if (collections.users) {
      const data = (await collections.users.findOne(
        { _id: new ObjectId(userID) },
        {},
      )) as unknown as User;
      highscore = (data as any)[service][game].sort(
        (a: Game, b: Game) => b.score - a.score,
      )[0];
      gamesPlayed = (data as any)[service][game].length;
    }
    res.send({ highscore, gamesPlayed, status: STATUS_CODES.SUCCESS });
  } catch (error) {
    console.log(error);
    res.send({ status: STATUS_CODES.GENERIC_ERROR });
  }
});
