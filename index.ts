import express, { Request, Response } from "express";
import cors, { CorsOptions } from "cors";
import { connectToDatabase } from "./services/database.service";
import { verifyRouter } from "./routers/verify.router";
import { usersRouter } from "./routers/users.router";

const app = express();
const port = 3001;

const corsOptions: CorsOptions = {
  origin: [
    "https://makinator.notaroomba.dev",
    "http://makinator.notaroomba.dev",
    "http://localhost:5173",
    "http://localhost",
  ],
};

connectToDatabase()
  .then(() => {
    app.use(cors(corsOptions));
    app.use(express.json());
    app.use("/users", usersRouter);
    app.use("/verify", verifyRouter);

    app.use("/", async (_req: Request, res: Response) => {
      res.status(200).send("You arent supposed to be here");
    });
    app.listen(port, () => {
      console.log(`Server started at http://localhost:${port}`);
    });
  })
  .catch((error: Error) => {
    console.error("Database connection failed", error);
    process.exit();
  });
