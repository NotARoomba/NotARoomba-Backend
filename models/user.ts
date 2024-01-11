import { MakinatorData } from "./games";

export default class User {
  constructor(
    public _id: string,
    public avatar: string,
    public username: string,
    public email: string,
    public dateJoined: Date,
    public makinatorData: Array<MakinatorData>,
  ) {}
}
