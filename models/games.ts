export class MakinatorData {
  constructor(public irrationalGames: Array<MakinatorIrrationalGame>) {}
}
export interface MakinatorIrrationalGame extends Game {
  time: number;
  lives: number;
  guesses: number;
}

export interface Game {
  score: number;
}

export enum GAMES {
  MAKINATOR_GUESS = "makinatorData.guessGames",
  MAKINATOR_PI = "makinatorData.piGames",
  MAKINATOR_E = "makinatorData.eGames",
  MAKINATOR_ONLINE = "makinatorData.onlineGames",
}

export interface HighScore {
  username: string;
  score: number;
  time: number;
}

export type ONLINE_GAME_TYPE = GAMES.MAKINATOR_PI | GAMES.MAKINATOR_E;
