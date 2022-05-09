import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let db = null;
const mongoClient = new MongoClient(process.env.MONGO_URI);
try{
    await mongoClient.connect();   
    db = mongoClient.db(process.env.BANCO_MONGO);
    console.log("MongoDB database is running");   
}catch(e){
    console.log("Error connecting to database", e);
}

export default db;