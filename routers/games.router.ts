import express, { Request, Response } from "express";
import { collections } from "../services/database.service";
import STATUS_CODES from "../models/status";
import { GAMES, HighScore } from "../models/games";
import { ObjectId } from "mongodb";
import { OnlineMakinatorGame } from "../models/online";

export const gamesRouter = express.Router();

gamesRouter.use(express.json());

gamesRouter.post("/update", async (req: Request, res: Response) => {
  const gameData = req.body.game;
  const userID = req.body.userID;
  const gameType: GAMES = req.body.type;
  try {
    if (collections.users) {
     await collections.users.updateOne(
        { _id: new ObjectId(userID) },
        { $push: { [gameType]: gameData } },
      );
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

gamesRouter.get("/online/:userID/", async (req: Request, res: Response) => {
  const userID: string = req?.params?.userID as string;
  let games: OnlineMakinatorGame[] = [];
  try {
    if (collections.makinatorGames) {
      games = ((await collections.makinatorGames.find({["gameData."+userID]: {"$exists": true}}).toArray()) as unknown as OnlineMakinatorGame[]).sort((a, b) => new Date(b.date).getUTCSeconds() - new Date(b.date).getUTCSeconds() ) 
    }
    res.send({ games, status: STATUS_CODES.SUCCESS });
  } catch (error) {
    console.log(error);
    res.send({ status: STATUS_CODES.GENERIC_ERROR });
  }
});