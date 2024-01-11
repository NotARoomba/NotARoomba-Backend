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
  const gameType: GAMES = req.body.type;
  const [service, game] = gameType.split(".");
  let highscores: HighScore[] = [];
  try {
    if (collections.users) {
      highscores = await collections.users.aggregate([
        // Unwind the guessGames array
        {
          $unwind: "$makinatorData.guessGames"
        },
        // Project the necessary fields
        {
          $project: {
            _id: 1,
            username: 1,
            "makinatorData.guessGames.time": 1,
            "makinatorData.guessGames.score": 1
          }
        },
        // Sort by time in ascending order and score in descending order
        {
          $sort: {
            "makinatorData.guessGames.time": 1,
            "makinatorData.guessGames.score": -1
          }
        },
        // Group by document ID and find the top score for each game
        {
          $group: {
            _id: "$_id",
            username: {
              $first: "$username"
            },
            highestScore: {
              $first: {
                time: "$makinatorData.guessGames.time",
                score: "$makinatorData.guessGames.score"
              }
            }
          }
        },
        // Sort globally by the lowest time and highest score
        {
          $sort: {
            "highestScore.time": 1,
            "highestScore.score": -1
          }
        },
        // Project to clean up the result
        {
          $project: {
            _id: 1,
            username: 1,
            score: "$highestScore.score",
            time: "$highestScore.time"
          }
        }
      ]).toArray() as unknown as HighScore[]
    }
    res.send({ highscores, status: STATUS_CODES.SUCCESS });
  } catch (error) {
    console.log(error);
    res.send({ status: STATUS_CODES.GENERIC_ERROR });
  }
});


gamesRouter.post("/:userID/highscores", async (req: Request, res: Response) => {
  const userID = req.params.userID;
  const gameTypes: GAMES[] = req.body.types;
  const highscores: object[] = [];
  try {
    if (collections.users) {
      const data = await collections.users.findOne(
        { _id: new ObjectId(userID) },
        {},
      );
      for (let gameType of gameTypes) {
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

gamesRouter.post("/:userID/highscore", async (req: Request, res: Response) => {
  const userID = req.params.userID;
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
