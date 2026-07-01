import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
    roomId:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },

    roomName:{
        type:String,
        required:true,
        trim:true
    },

    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true
    },

    participants:[
        {
            userId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"user"
            },
            username:{
                type:String
            },
            joinedAt:{
                type:Date,
                default:Date.now
            }
        }
    ],

    codingMode:{
        type:Boolean,
        default:false
    },

    currentLanguage:{
        type:String,
        default:'javascript'
    },

    expiresAt:{
        type:Date,
        default:null
    }
},{timestamps:true});

const Room = new mongoose.model("room", RoomSchema);

export default Room;
