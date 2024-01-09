export class MakinatorData {
  constructor(
    public guessGames: Array<MakinatorGuessGame>,

  ) {}
}
export interface MakinatorGuessGame extends Game {
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
  MAKINATOR_ONLINE = "makinatorData.onlineGames"
}
