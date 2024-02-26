import express, { Request, Response } from "express";
import cors, { CorsOptions } from "cors";
import { collections, connectToDatabase } from "./services/database.service";
import { verifyRouter } from "./routers/verify.router";
import { usersRouter } from "./routers/users.router";
import { SHA256 } from "crypto-js";
import { AuthError, HMAC } from "hmac-auth-express";
import { gamesRouter } from "./routers/games.router";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import NotARoombaEvents from "./models/events";
import { MakinatorIrrationalGame, ONLINE_GAME_TYPE } from "./models/games";
import { OnlineMakinatorGame } from "./models/online";
import STATUS_CODES from "./models/status";

const app = express();
const httpServer = createServer(app);
const port = 3001;

const corsOptions: CorsOptions = {
  origin: [
    "https://makinator.notaroomba.dev",
    "http://makinator.notaroomba.dev",
    "http://localhost:5173",
    "http://localhost",
    "https://localhost:5173",
    "https://localhost",
    // "http://172.20.10.5:5173",
    // "http://172.20.10.5"
  ],
};

const io = new Server(httpServer, {cors: corsOptions});
export let usersConnected: {[key: string]: string[]} = {};

const genSecret = async (req: Request) => {
  return req ? Math.floor(Date.now() / (60 * 1000)).toString() : "";
};

connectToDatabase()
  .then(() => {
    app.use(cors(corsOptions));
    app.use(express.json({limit: '50mb'}));
    // app.use(HMAC(genSecret, { minInterval: 30 }));
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
    // multiplayer support
    // on client connect, add conenction to object like niveles
    // additionally check for current games and add the user to the room to continue playing
    // add statuses to each connection (in game, idle, etc)
    // then listen for events such as create a game or join a game and push or update a game accordingly
    // on client disconnect allow 1 minute of absence until the game is closed and the other user wins by default
    //
    io.on(NotARoombaEvents.CONNECT, (socket: Socket) => {
      console.log(`New client connected: ${socket.id}`);
      socket.on(NotARoombaEvents.REGISTER_USER, async (userID: string, callback) => {
        if (usersConnected[userID]) {
          usersConnected[userID].push(socket.id);
        } else {
          usersConnected[userID] = [socket.id];
        }
        const game = await collections.makinatorGames?.findOne({["gameData."+userID]: {"$exists": true}, winner: null});
        console.log(game)
        // need to add the user to the already existing game
        if (game) {
          socket.join(game.gameID)
          return callback(game);
        } else return callback(null);
      });
      socket.on(NotARoombaEvents.CREATE_GAME, async (userID: string, gameType: ONLINE_GAME_TYPE, callback) => {
        // create a game with one user in it and generate an ID
        const gameID = SHA256(userID+Date.now().toString()).toString().substring(0, 6).toUpperCase();
        await collections.makinatorGames?.insertOne({gameID, gameType, gameData: {[userID]: {score: 0, lives: 3, time: 0, digits: 0}}, winner: null});
        await socket.join(gameID);
        return callback(gameID);
      });
      socket.on(NotARoombaEvents.JOIN_GAME, async (userID: string, gameID: string, gameType: ONLINE_GAME_TYPE, callback) => {
        const currentGames = (await collections.makinatorGames?.find({ gameID, gameType, winner: null }).toArray()) as unknown as OnlineMakinatorGame[]
        if (currentGames?.length == 0) return callback(STATUS_CODES.NO_GAME_FOUND);
        if (Object.keys(currentGames[0].gameData).length !== 1) return callback(STATUS_CODES.GAME_FULL);
        await socket.join(gameID);
        if (!Object.keys(currentGames[0].gameData).includes(userID)) {
          await collections.makinatorGames?.updateOne({gameID, gameType}, {$set: {["gameData."+userID]: {score: 0, lives: 3, time: 0, digits: 0}}});
          setTimeout(() => io.to(gameID).emit(NotARoombaEvents.START_GAME), 2500)
        } else {
          io.to(gameID).emit(NotARoombaEvents.REQUEST_GAME_DATA);
        }
        return callback(STATUS_CODES.SUCCESS);
      });
      socket.on(NotARoombaEvents.UPDATE_GAME_DATA, async (userID: string, gameData: MakinatorIrrationalGame) => {
        const gameID = Array.from(socket.rooms.values())[1];
        console.log(gameID)
        const opponentID = Object.keys((await collections.makinatorGames?.findOne({gameID}) as unknown as OnlineMakinatorGame).gameData).find((v) => v !== Object.keys(usersConnected).find(key => usersConnected[key].includes(Array.from(socket.rooms.values())[0])));
        Object.keys(usersConnected).find(key => usersConnected[key].includes(Array.from(socket.rooms.values())[0]))
        // to not let the user continue if their opponent does not appear
        if (!opponentID) {
          //settimeout to end the game if the user does not appear in a minute
          setTimeout(async () => {
            if (!Object.keys(usersConnected).find(key => usersConnected[key].includes(Array.from(socket.rooms.values())[0]))) {
              // need to find game and end it
              await collections.makinatorGames?.updateOne({gameID}, {$set: {winner: userID, ["gameData."+userID]: gameData}});
              io.to(gameID).emit(NotARoombaEvents.END_GAME); // later client will request game data
            }
          }, 60 * 1000);
          return;
        }
        await collections.makinatorGames?.updateOne({gameID}, {$set: {["gameData."+userID]: gameData}})
        if (gameData.lives == 0) {
          await collections.makinatorGames?.updateOne({gameID}, {$set: {winner: opponentID, ["gameData."+userID]: gameData}})
          io.to(gameID).emit(NotARoombaEvents.END_GAME); // later client will request game data
        }
        io.to(gameID).emit(NotARoombaEvents.REQUEST_GAME_DATA);
      });
      socket.on(NotARoombaEvents.REQUEST_GAME_DATA, async (callback) => {
        const gameID = Array.from(socket.rooms.values())[1];
        const game = await collections.makinatorGames?.findOne({gameID});
        return callback(game);
      })
      socket.on(NotARoombaEvents.UPDATE_GAME_STATE, async () => {
        const gameID = Array.from(socket.rooms.values())[1];
        socket.to(gameID).emit(NotARoombaEvents.UPDATE_GAME_STATE);
      })
      socket.on(NotARoombaEvents.DISCONNECT, async () => {
        for (var user in usersConnected) {
          if (
            usersConnected.hasOwnProperty(user) &&
            usersConnected[user].includes(socket.id)
          ) {
            // remove game created if any and no other users are connected
            const currentGame = await collections.makinatorGames?.findOne({["gameData."+user]: {"$exists": true}, winner: null});
            if (Object.keys(currentGame?.gameData).length <= 1) await collections.makinatorGames?.deleteOne({["gameData."+user]: {"$exists": true}, winner: null});
            delete usersConnected[user];
          }
        } // find currently active games and sent a timeout to end the game
      });
    });
    httpServer.listen(port);
    console.log("Server started!")
    // app.listen(port, () => {
    //   console.log(`Server started at http://localhost:${port}`);
    // });
  })
  .catch((error: Error) => {
    console.error("Database connection failed", error);
    process.exit();
  });
