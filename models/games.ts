export class MakinatorData {
    constructor(
      public games: Array<MakinatorGame>,
      public highscore: MakinatorGame,
    ) {}
  }
export interface MakinatorGame {
  score: number;
  time: number;
  lives: number;
  guesses: number;
}