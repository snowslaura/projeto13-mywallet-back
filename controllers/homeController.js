import db from "./../db.js"
import dotenv from "dotenv"
import joi from "joi"
import dayjs from "dayjs";
import 'dayjs/locale/pt-br.js'
import { ObjectId } from "mongodb";

dotenv.config();

export async function getBalance(req,res){    
    const {authorization} = req.headers;
    const token = authorization?.replace('Bearer ','');

    try{ 

        const session = await db.collection("sessions").findOne({token})
        const user = await db.collection("users").findOne({_id: session.userId })
        if(user){
            const userBalance = await db.collection("balance").find({userId: user._id}).toArray();
            if(!userBalance) return res.sendStatus(401) 
            res.send(userBalance).status(200)
        }else{
            res.sendStatus(404)
        }  

    }catch(e){
        console.error(e);
        res.sendStatus(500);
    }
}

export async function postBalance(req,res){    
    const balance = req.body; // amount, description, type
    
    const schema = joi.object({
        amount: joi.string().required(),
        description:joi.string().required(),
        type: joi.valid("income", "outcome").required()
    })
    
    const {error} = schema.validate(balance,{abortEarly:false});
    if(error) return res.sendStatus(422);
    
    const {authorization} = req.headers;
    const token = authorization?.replace('Bearer ','');

    try{
        const session = await db.collection("sessions").findOne({token})
        const user = await db.collection("users").findOne({_id:session.userId});
        await db.collection("balance").insertOne({...balance, userId:session.userId, date: dayjs().format("DD/MM")})
        res.sendStatus(201);
    }catch(e){
        console.error(e);
        res.sendStatus(500)
    } 
}

export async function editBalance (req,res){
    const {authorization} = req.headers;
    const token = authorization?.replace('Bearer ','');

    const {id, type} = req.params // id transação
    const {amount, description} = req.body;

    try{
        const balance = await db.collection("balance").findOne({_id: new ObjectId(id)});
        if(!balance) return res.sendStatus(404);

        const user = await db.collection("users").findOne({_id:new ObjectId(balance.userId)});

        await db.collection("balance").updateOne({_id: new ObjectId(id)}, {$set:{amount, description}});
        res.sendStatus(200)      
    }catch(e){
        console.error(e)
        res.sendStatus(500);
    }
}

export async function deleteBalance(req,res){
    const {authorization} = req.headers;
    const token = authorization?.replace('Bearer ','');

    const {id} = req.params // id transação
    
    try{
        const balance = await db.collection("balance").findOne({_id: new ObjectId(id)});
        if(!balance) return res.sendStatus(404);

        const user = await db.collection("users").findOne({_id:new ObjectId(balance.userId)});        

        await db.collection("balance").deleteOne({_id: new ObjectId(id)});
        res.sendStatus(200)      
    }catch(e){
        console.error(e)
        res.sendStatus(500);
    }
}

export async function logOut(req,res){
    const {authorization} = req.headers;
    const token = authorization?.replace('Bearer ','');

    try{       
        const session = await db.collection("sessions").findOne({token});        
        const user = await db.collection("users").findOne({_id:session.userId});
        await db.collection("sessions").updateOne({userId: new ObjectId(user._id)},{$set:{token:""}});
        res.sendStatus(204)      
    }catch(e){
        console.error(e)
        res.sendStatus(500);
    }
}