import { MakinatorData } from "./games";

export default class User {
  constructor(
    public avatar: string,
    public username: string,
    public email: string,
    public dateJoined: Date,
    public gameData: Array<MakinatorData>,
  ) {}
}
