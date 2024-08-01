import * as mongoDB from "mongodb";
import * as dotenv from "ts-dotenv";

const env = dotenv.load({
  MONGODB: String,
  USER_DB_NAME: String,
  USER_COLLECTION: String,
  GAME_DB_NAME: String,
  MAKINATOR_GAME_COLLECTION: String,
  ASTEROIDS_GAME_COLLECTION: String,
});

export const collections: {
  users?: mongoDB.Collection;
  makinatorGames?: mongoDB.Collection;
  asteroidsGames?: mongoDB.Collection;
} = {};

export async function connectToDatabase() {
  const client: mongoDB.MongoClient = new mongoDB.MongoClient(env.MONGODB);
  await client.connect();

  const userDB: mongoDB.Db = client.db(env.USER_DB_NAME);
  const usersCollection: mongoDB.Collection = userDB.collection(
    env.USER_COLLECTION,
  );
  collections.users = usersCollection;

  const gameDB: mongoDB.Db = client.db(env.GAME_DB_NAME);
  const makinatorGamesCollection: mongoDB.Collection = gameDB.collection(
    env.MAKINATOR_GAME_COLLECTION,
  );
  collections.makinatorGames = makinatorGamesCollection;

  const asteroidsGamesCollection: mongoDB.Collection = gameDB.collection(
    env.ASTEROIDS_GAME_COLLECTION,
  );
  collections.asteroidsGames = asteroidsGamesCollection;

  console.log("Successfully connected to database!");
}
