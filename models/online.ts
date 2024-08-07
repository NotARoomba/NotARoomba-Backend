import { Game, MakinatorIrrationalGame, ONLINE_GAME_TYPE } from "./games";

export class OnlineMakinatorGame {
  constructor(
    public _id: string,
    public gameID: string,
    public gameType: ONLINE_GAME_TYPE,
    public gameData: {
      [key: string]: MakinatorIrrationalGame,
    },
    public usernames: string[],
    public date: Date,
    public winner: string | null,
  ) {}
}

// export class OnlineAsteroidsGame {
//   constructor(
//     public _id: string,
//     public gameID: string,
//     public gameType: ONLINE_GAME_TYPE,
//     public gameData: {
//       [key: string]: Game,
//     },
//     public usernames: string[],
//     public date: Date,
//     public score: number,
//   ) {}
// }
