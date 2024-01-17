import express, { Request, Response } from "express";
import cors, { CorsOptions } from "cors";
import { connectToDatabase } from "./services/database.service";
import { verifyRouter } from "./routers/verify.router";
import { usersRouter } from "./routers/users.router";
import { SHA256 } from "crypto-js";
import { AuthError, HMAC } from "hmac-auth-express";
import { gamesRouter } from "./routers/games.router";

const app = express();
const port = 3001;

const corsOptions: CorsOptions = {
  origin: [
    "https://makinator.notaroomba.dev",
    "http://makinator.notaroomba.dev",
    // "http://localhost:5173",
    // "http://localhost",
    // "http://172.20.10.5:5173",
    // "http://172.20.10.5"
  ],
};

const genSecret = async (req: Request) => {
  return req ? Math.floor(Date.now() / (60 * 1000)).toString() : "";
};

connectToDatabase()
  .then(() => {
    app.use(cors(corsOptions));
    app.use(express.json({limit: '50mb'}));
    app.use(HMAC(genSecret, { minInterval: 30 }));
    app.use("/users", usersRouter);
    app.use("/verify", verifyRouter);
    app.use("/games", gamesRouter);

    app.use("/", async (_req: Request, res: Response) => {
      res.status(200).send("You arent supposed to be here");
    });
    app.use(
      (
        error: { message: string; code: string },
        req: Request,
        res: Response,
        next: () => void,
      ) => {
        // check by error instance
        if (error instanceof AuthError) {
          res.status(401).json({
            error: "Invalid request",
            info: error.message,
          });
        }
        next();
      },
    );
    app.listen(port, () => {
      console.log(`Server started at http://localhost:${port}`);
    });
  })
  .catch((error: Error) => {
    console.error("Database connection failed", error);
    process.exit();
  });
