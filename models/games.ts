export class MakinatorData {
  constructor(
    public guessGames: Array<MakinatorGuessGame>,

  ) {}
}
export interface MakinatorGuessGame {
  score: number;
  time: number;
  lives: number;
  guesses: number;
}
