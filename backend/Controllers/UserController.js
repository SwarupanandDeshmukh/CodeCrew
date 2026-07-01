import {createUser,GetAllUsers} from '../Services/UserService.js'
import User from '../models/UserModel.js'
import { validationResult } from 'express-validator'

const createUserController = async (req,res) =>{

    const errors = validationResult(req);

    if(!errors.isEmpty())
       return res.status(401).json({'error':errors.array()})

    try{
        const user = await createUser(req.body);
        const token = user.generateToken();
        delete user._doc.password;
        return res.status(200).json({user,token});
    }
    catch(error)
    {
        return res.status(401).send(error.message);
    }

}

const loginUserController = async (req,res) =>{
    const errors = validationResult(req)
    if(!errors.isEmpty())
    {
        return res.status(401).json({"error":errors.array()});
    }

    try{

    const {email,password} = req.body;
    const user  = await User.findOne({email:email}).select("+password");
    if(!user)
    {
        return res.status(401).json({"error":"No such user"});
    }

    const match = await user.ComparePassword(password);
    if(!match)
    {
        return res.status(401).json({"error":"Invalid password"});
    }

    const token = user.generateToken();

    delete user._doc.password;
    return res.status(200).json({user,token});
}
catch(error)
{
    return res.status(401).send(error);
}
    
}



const ProfileController = async (req,res) =>{
    return res.status(200).send(req.user);
}




const logoutController = async (req,res) =>{
    try{
        return res.status(200).send("user logout successfully");
    }
    catch(error)
    {
        return res.status(400).send(error.message);
    }
}

const GetAllUserController = async(req,res) =>{
    try{
        const loggedinUser = await User.findOne({email:req.user.email});

        const allUser = await GetAllUsers({userID:loggedinUser._id})

        return res.status(200).json({allUser})
    }
    catch(error)
    {
        return res.status(400).json({error:error.message});
    }
}

export {createUserController,loginUserController,ProfileController,logoutController,GetAllUserController};
