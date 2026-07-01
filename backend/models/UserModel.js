import mongoose from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const UserSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        trim:true,
        minLength:[3,'username should be atleast 3 characters long'],
        maxLength:[30,'username should be atmost 30 characters long'],
    },

    email:{
        type:String,
        required:true,
        trim:true,
        unique:true,
        minLength:[6,'email should be atleast 6 characters long'],
        maxLength:[50,'email should be atmost 50 characters long'],
    },

    password:{
        type:String,
        select:false,
    },

    avatar:{
        type:String,
        default:''
    }
},{timestamps:true});


UserSchema.statics.hashPassword = async function (password) {
    return await bcrypt.hash(password,5);
}

UserSchema.methods.ComparePassword = async function (password) {
    return await bcrypt.compare(password,this.password);
}

UserSchema.methods.generateToken = function (){
    return jwt.sign({email:this.email, username:this.username, userId:this._id},process.env.JWT_SECRET,{expiresIn:'24h'});
}

const User = new mongoose.model('user',UserSchema);

export default User;