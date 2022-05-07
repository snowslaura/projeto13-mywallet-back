import express, {json} from "express"
import cors from "cors"
import chalk from "chalk"
import dotenv from "dotenv"
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcrypt"
import {v4 as uuid} from "uuid"
import joi from "joi"
import dayjs from "dayjs";
import 'dayjs/locale/pt-br.js'
dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect(() =>{
    db = mongoClient.db(process.env.BANCO_MONGO);
})

const app = express();

app.use(cors());
app.use(json());



app.post("/sign-up", async (req,res) =>{
    const user = req.body; //name, email, password, confirmation

    const passwordHash = bcrypt.hashSync(user.password,parseInt(process.env.HASH));

    const schema = joi.object({
        name: joi.string().required(),
        email: joi.string().email(),
        password:joi.string().alphanum().min(6).max(8).required(),
        confirmation:joi.ref("password")
    })

    const {error} = schema.validate(user,{abortEarly: false})

    if(error){
        res.status(422)
        return 
    }

    try{
        const checkUser = await db.collection("users").findOne({email: user.email})
        if(checkUser){
            res.sendStatus(409)
            return
        }
        delete user.confirmation
        await db.collection("users").insertOne({...user, password: passwordHash});
        res.sendStatus(201);
    }catch(e){
        console.error(e);
        res.sendStatus(500);
    }

})

app.post("/", async (req,res)=>{
    const {email, password} = req.body;
    try{
        const user = await db.collection("users").findOne({email});
        if(user && bcrypt.compareSync(password, user.password)){
            const token = uuid();
            await db.collection("sessions").insertOne({
                userId:user._id,
                token
            })
            res.send(token).status(200);
        }else{
            res.sendStatus(401);
        }
    }catch(e){
        console.error(e);
        res.sendStatus(500)
    }
})

app.get("/home", async (req,res)=>{
    const {authorization} = req.header;
    const token = authorization?.replace('Bearer ','');
    if(!token) return res.sendStatus(401);
    try{        
        const session = await db.collection("sessions").findOne({token})
        if(!session) return res.sendStatus(401)

        const user = await db.collection("users").findOne({_id: session.userId })
        if(user){
            const userBalance = await db.collection("balance").find({id: user._id}).toArray();
            if(!balance) return res.sendStatus(401) 
            res.send(userBalance).status(200)
        }else{
            res.sendStatus(404)
        }  

    }catch(e){
        console.error(e);
        res.sendStatus(500);
    }
})

app.post("/home", async (req,res)=>{
    const balance = req.body; // amount, description, type

    const schema = joi.object({
        amount: joi.number().required(),
        description:joi.string().required(),
        type: joi.valid("income", "outcome").required()
    })

    const {error} = schema.validate(balance,{abortEarly:false});
    if(error) return res.sendStatus(422);

    const {authorization} = req.header;
    const token = authorization?.replace('Bearer ','');
    if(!token) return res.sendStatus(401);

    try{
        const session = await db.collection("sessions").findOne({token})
        if(!session) return res.sendStatus(401)
        await db.collection("balance").insertOne({...balance, userId:session.userId, date: dayjs().format(DD/MM), id: new ObjectId()})
    }catch(e){
        console.error(e);
        res.sendStatus(500)
    } 
})

app.delete("/home:id", async (req,res)=>{
    const {authorization} = req.header;
    const token = authorization?.replace('Bearer ','');
    if(!token) return res.sendStatus(401);

    const {id} = req.params // id transação

    try{
        const balance = await db.collection("balance").findOne({id: new ObjectId(id)});
        if(!balance) return res.sendStatus(404);

        const checkUser = await db.collection("user").findOne({id:balance.userId});
        if(!checkUser) return res.sendStatus(401);

        await db.collection("balance").deleteOne({id: new ObjectId(id)});
        res.sendStatus(200)      
    }catch(e){
        console.error(e)
        res.sendStatus(500);
    }

})

app.put("/home:id", async (req,res)=>{
    const {authorization} = req.header;
    const token = authorization?.replace('Bearer ','');
    if(!token) return res.sendStatus(401);

    const {id} = req.params // id transação
    const {amount, description} = req.body;

    try{
        const balance = await db.collection("balance").findOne({id: new ObjectId(id)});
        if(!balance) return res.sendStatus(404);

        const checkUser = await db.collection("user").findOne({id:balance.userId});
        if(!checkUser) return res.sendStatus(401);

        await db.collection("balance").updateOne({id: new ObjectId(id)}, {$set:{amount, description}});
        res.sendStatus(200)      
    }catch(e){
        console.error(e)
        res.sendStatus(500);
    }

})

app.put("/home", async (req,res)=>{

    const {authorization} = req.header;
    const token = authorization?.replace('Bearer ','');
    if(!token) return res.sendStatus(401);

    try{       
        const session = await db.colletcion("session").findOne({token});
        if(!session) return res.sendStatus(404)
        
        const checkUser = await db.collection("user").findOne({_id:session.userId});
        if(!checkUser) return res.sendStatus(401);

        await db.collection("sessions").updateOne({_id: new ObjectId(id)},{$set:{token:""}});
        res.sendStatus(200)      
    }catch(e){
        console.error(e)
        res.sendStatus(500);
    }
})


const PORT = process.env.PORTA || 5000;

app.listen(PORT, ()=>{
    console.log(chalk.green.bold(`Server is running on port http://localhost:${PORT}` ))
})