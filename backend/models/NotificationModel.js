import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
    recipientId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true
    },

    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true
    },

    senderUsername:{
        type:String,
        required:true
    },

    roomId:{
        type:String,
        required:true
    },

    roomName:{
        type:String,
        required:true
    },

    type:{
        type:String,
        enum:['room-invite'],
        default:'room-invite'
    },

    read:{
        type:Boolean,
        default:false
    }
},{timestamps:true});

const Notification = new mongoose.model("notification", NotificationSchema);

export default Notification;
