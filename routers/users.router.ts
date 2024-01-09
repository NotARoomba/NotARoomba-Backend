import express, { Request, Response } from "express";
import { collections } from "../services/database.service";
import User from "../models/user";
import STATUS_CODES from "../models/status";
import { ObjectId } from "mongodb";

export const usersRouter = express.Router();

usersRouter.use(express.json());

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
    res.status(404).send({ status: STATUS_CODES.GENERIC_ERROR });
  }
});

usersRouter.post("/update", async (req: Request, res: Response) => {
  const data: User = req.body;
  let id: ObjectId | null = null;
  try {
    if (collections.users) {
      const res = await collections.users.updateOne(
        { email: data.email },
        { $set: data },
        {
          upsert: true,
        },
      );
      id = res.upsertedId
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
      emailUsers = (await collections.users.find({email}).toArray()) as unknown as User[];
      nameUsers = (await collections.users.find({username}).toArray()) as unknown as User[];
    }
    if (emailUsers.length !== 0) return res.status(200).send({ status: STATUS_CODES.EMAIL_IN_USE });
    else if (nameUsers.length !== 0) res.status(200).send({ status: STATUS_CODES.USERNAME_IN_USE });
    else res.status(200).send({ status: STATUS_CODES.NONE_IN_USE }); 
  } catch (error) {
    res.status(500).send({ status: STATUS_CODES.GENERIC_ERROR });
  }
});
