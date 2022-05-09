import {Router} from "express"
import dotenv from "dotenv"

dotenv.config();

import { getBalance, postBalance, logOut, editBalance, deleteBalance } from "../controllers/homeController.js";

import { validateToken } from "../middlewares/authMiddleware.js";

const homeRouter = Router();

homeRouter.get("/home", validateToken, getBalance);

homeRouter.post("/home", validateToken, postBalance);

homeRouter.delete("/home/:id", validateToken, deleteBalance);

homeRouter.put("/home/:id/:type", validateToken, editBalance);

homeRouter.put("/home", logOut);

export default homeRouter;