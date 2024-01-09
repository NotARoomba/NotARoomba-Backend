import express, { Request, Response } from "express";
import { collections } from "../services/database.service";
import User from "../models/user";
import STATUS_CODES from "../models/status";

export const usersRouter = express.Router();

usersRouter.use(express.json());

usersRouter.get("/", async (req: Request, res: Response) => {
  try {
    let users: User[] = [];
    if (collections.users) {
      users = (await collections.users.find({}).toArray()) as unknown as User[];
    }
    res.status(200).send({ users, status: STATUS_CODES.SUCCESS });
  } catch (error) {
    res.status(500).send({ status: STATUS_CODES.GENERIC_ERROR });
  }
});

usersRouter.get("/:email", async (req: Request, res: Response) => {
  const email = req?.params?.email;
  console.log(`Getting data for: ${email}`);
  try {
    let user: User | null = null;
    if (collections.users) {
      user = (await collections.users.findOne({ email })) as unknown as User;
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
    res.status(404).send({ user: null, error: true, msg: error });
  }
});

usersRouter.post("/update", async (req: Request, res: Response) => {
  const data: User = req.body;
  try {
    if (collections.users) {
      await collections.users.updateOne(
        { email: data.email },
        { $set: data },
        {
          upsert: true,
        },
      );
    }
    res.send({ status: STATUS_CODES.SUCCESS });
  } catch (error) {
    console.log(error);
    res.send({ error: true, msg: error });
  }
});
