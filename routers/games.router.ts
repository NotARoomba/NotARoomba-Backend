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

gamesRouter.get("/:gameType/highscores/", async (req: Request, res: Response) => {
  const gameType: GAMES = req?.params?.gameType as GAMES;
  let highscores: HighScore[] = [];
  try {
    if (collections.users) {
      highscores = await collections.users.aggregate([
        // Unwind the guessGames array
        {
          $unwind: `$${gameType}`
        },
        // Project the necessary fields
        {
          $project: {
            _id: 1,
            username: 1,
            avatar: 1,
            [`${gameType}.time`]: 1,
            [`${gameType}.score`]: 1
          }
        },
        // Sort by time in ascending order and score in descending order
        {
          $sort: {
            [`${gameType}.score`]: -1
          }
        },
        // Group by document ID and find the top score for each game
        {
          $group: {
            _id: "$_id",
            username: {
              $first: "$username"
            },
            avatar: {
              $first: "$avatar"
            },
            highestScore: {
              $first: {
                time: [`$${gameType}.time`],
                score: [`$${gameType}.score`]
              }
            }
          }
        },
        // Sort globally by the lowest time and highest score
        {
          $sort: {
            "highestScore.score": -1
          }
        },
        // Project to clean up the result
        {
          $project: {
            _id: 1,
            username: 1,
            avatar: 1,
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


gamesRouter.get("/:userID/highscores", async (req: Request, res: Response) => {
  const userID = req.params.userID;
  const gameTypes: GAMES[] = req.query.gameTypes as GAMES[];
  console.log(gameTypes, userID, "AAAAAAAAAAAAAAAAAAAAAaa")
  console.log("HIGHSCORES")
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

gamesRouter.get("/:userID/highscore", async (req: Request, res: Response) => {
  const userID = req.params.userID;
  const gameType: GAMES = req.query.gameType as GAMES;
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
