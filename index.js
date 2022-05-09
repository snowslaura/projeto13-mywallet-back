import express, {json} from "express"
import cors from "cors"
import chalk from "chalk"
import dotenv from "dotenv"
dotenv.config();


import authRouter from "./routes/authRouter.js";
import homeRouter from "./routes/homeRouter.js";

const app = express();

app.use(cors());
app.use(json());


app.use(authRouter);

app.use(homeRouter);



const PORT = process.env.PORTA || 5000;

app.listen(PORT, ()=>{
    console.log(chalk.green.bold(`Server is running on port http://localhost:${PORT}` ))
})