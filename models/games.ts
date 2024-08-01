export class MakinatorData {
  constructor(public irrationalGames: Array<MakinatorIrrationalGame>) {}
}
export class AsteroidsData {
  constructor(public games: Array<AsteroidsGame>) {}
}
export interface MakinatorIrrationalGame extends MakinatorGame {
  digits: number;
}

export interface MakinatorGuessGame extends MakinatorGame {
  guesses: number;
}

export interface Game {
  score: number;
}

export interface MakinatorGame extends Game {
  lives: number;
  time: number;
}
export interface AsteroidsGame extends Game {
  level: number;
}

export enum GAMES {
  MAKINATOR_GUESS = "makinatorData.guessGames",
  MAKINATOR_PI = "makinatorData.piGames",
  MAKINATOR_E = "makinatorData.eGames",
  MAKINATOR_ONLINE = "makinatorData.onlineGames",
  ASTEROIDS = "asteroidsData.games",
  // ASTEROIDS_ONLINE = "asteroidsData.onlineGames",
}

export interface HighScore {
  _id: string;
  username: string;
  avatar: string;
  score: number;
  time?: number;
  level?: string;
}

export type ONLINE_GAME_TYPE = GAMES.MAKINATOR_PI | GAMES.MAKINATOR_E;
