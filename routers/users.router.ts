import express, { Request, Response } from "express";
import { collections } from "../services/database.service";
import User from "../models/user";
import STATUS_CODES from "../models/status";
import { ObjectId } from "mongodb";
import { GAMES, Game } from "../models/games";

export const usersRouter = express.Router();

usersRouter.use(express.json());

usersRouter.get("/:emailid", async (req: Request, res: Response) => {
  const emailid = req?.params?.emailid;
  console.log(`Getting data for: ${emailid}`);
  try {
    let user: User | null = null;
    if (collections.users) {
      //check if has @ symbol
      if (emailid.includes("@")) {
        user = (await collections.users.findOne({
          email: emailid,
        })) as unknown as User;
      } else {
        user = (await collections.users.findOne({
          _id: new ObjectId(emailid),
        })) as unknown as User;
      }
    }
    if (user) {
      res.status(200).send({ user, status: STATUS_CODES.SUCCESS });
    } else {
      res.status(404).send({
        user: null,
        status: STATUS_CODES.USER_NOT_FOUND,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(404).send({ status: STATUS_CODES.GENERIC_ERROR });
  }
});

usersRouter.post("/update", async (req: Request, res: Response) => {
  const data: User = req.body;
  let id: ObjectId | null = null;
  try {
    if (collections.users) {
      if (data._id) {
        id = new ObjectId(data._id)
        const {email, username, avatar} = data
        await collections.users.updateOne(
          { _id: id },
          { $set: {email, username, avatar} },
        );
      } else {
        const res = await collections.users.updateOne(
          { email: data.email },
          { $set: data },
          {
            upsert: true,
          },
        );
        id = res.upsertedId;
      }
    }
    res.send({ id, status: STATUS_CODES.SUCCESS });
  } catch (error) {
    console.log(error);
    res.send({ status: STATUS_CODES.GENERIC_ERROR });
  }
});

usersRouter.post("/check", async (req: Request, res: Response) => {
  const username: User = req.body.username;
  const email: User = req.body.email;
  try {
    let emailUsers: User[] = [];
    let nameUsers: User[] = [];
    if (collections.users) {
      emailUsers = (await collections.users
        .find({ email })
        .toArray()) as unknown as User[];
      nameUsers = (await collections.users
        .find({ username })
        .toArray()) as unknown as User[];
    }
    if (emailUsers.length !== 0)
      return res.status(200).send({ status: STATUS_CODES.EMAIL_IN_USE });
    else if (nameUsers.length !== 0)
      res.status(200).send({ status: STATUS_CODES.USERNAME_IN_USE });
    else res.status(200).send({ status: STATUS_CODES.NONE_IN_USE });
  } catch (error) {
    console.log(error)
    res.status(500).send({ status: STATUS_CODES.GENERIC_ERROR });
  }
});

usersRouter.get("/:userID/highscores", async (req: Request, res: Response) => {
  const userID = req.params.userID;
  const gameTypes: GAMES[] = req.query.gameTypes as GAMES[];
  const highscores: object[] = [];
  try {
    if (collections.users) {
      const data = await collections.users.findOne(
        { _id: new ObjectId(userID) },
        {},
      );
      for (let gameType of gameTypes) {
        const [service, game] = gameType.split(".");
        if ((data as any)[service][game]) {
          highscores.push({
            game: (data as any)[service][game].sort(
              (a: Game, b: Game) => b.score - a.score,
            )[0],
            gamesPlayed: (data as any)[service][game].length,
          });
        } else {
          highscores.push({game: {score: 0}, gamesPlayed: 0});
        }
        
      }
    }
    res.send({ highscores, status: STATUS_CODES.SUCCESS });
  } catch (error) {
    console.log(error);
    res.send({ status: STATUS_CODES.GENERIC_ERROR });
  }
});

usersRouter.get("/:userID/highscore", async (req: Request, res: Response) => {
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
      if ((data as any)[service][game]) {
        highscore = (data as any)[service][game].sort(
          (a: Game, b: Game) => b.score - a.score,
        )[0];
        gamesPlayed = (data as any)[service][game].length;
      }
    }
    res.send({ highscore, gamesPlayed, status: STATUS_CODES.SUCCESS });
  } catch (error) {
    console.log(error);
    res.send({ status: STATUS_CODES.GENERIC_ERROR });
  }
});
