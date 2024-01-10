import { MakinatorData } from "./games";

interface GetData {
  [key: string]: any
}

export default class User implements GetData {
  constructor(
    public avatar: string,
    public username: string,
    public email: string,
    public dateJoined: Date,
    public makinatorData: Array<MakinatorData>,
  ) {}
}
