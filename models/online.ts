import { MakinatorGuessGame, ONLINE_GAME_TYPE } from "./games";
import User from "./user";

export class OnlineMakinatorGame {
  constructor(
    public _id: string,
    public gameID: string,
    public gameType: ONLINE_GAME_TYPE,
    public gameData: {
      [key: string]: MakinatorGuessGame,
    },
    public winner: User | null,
  ) {}
}
