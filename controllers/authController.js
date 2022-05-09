import db from "./../db.js"
import joi from "joi"
import bcrypt from "bcrypt"
import {v4 as uuid} from "uuid"
import { ObjectId } from "mongodb"


export async function signUp(req,res){
    
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
}

export async function signIn(req,res){
    const {email, password} = req.body;
    try{
        const user = await db.collection("users").findOne({email});
        const userSessionExists = await db.collection("sessions").findOne({userId: new ObjectId(user._id)})
        if(user && bcrypt.compareSync(password, user.password) && userSessionExists){
            const token = uuid(); 
            await db.collection("sessions").updateOne({userId:user._id},{$set:{token}})
            res.send({token, name:user.name}).status(200);
        }
        else if(user && bcrypt.compareSync(password, user.password)){
            const token = uuid();            
            await db.collection("sessions").insertOne({userId:user._id, token})            
            res.send({token, name:user.name}).status(200);
        }else{
            res.sendStatus(401);
        }
    }catch(e){
        console.error(e);
        res.sendStatus(500)
    }
}
