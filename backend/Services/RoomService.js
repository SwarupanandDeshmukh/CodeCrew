import mongoose from "mongoose";
import Room from "../models/RoomModel.js";

const CreateRoom = async ({roomId, roomName, userID, username}) =>{
    if(!roomId)
        throw new Error("Room ID is required");
    if(!roomName)
        throw new Error("Room name is required");
    if(!userID)
        throw new Error("User ID is required");

    const existingRoom = await Room.findOne({roomId});
    if(existingRoom)
        throw new Error("Room ID already exists. Choose a different one.");

    const room = await Room.create({
        roomId:roomId,
        roomName:roomName,
        createdBy:userID,
        participants:[{
            userId:userID,
            username:username,
            joinedAt:new Date()
        }]
    });

    return room;
}

const GetAllRooms = async ({userID}) =>{
    if(!userID)
        throw new Error("User ID is required");

    const AllRooms = await Room.find({
        'participants.userId':userID
    }).sort({updatedAt:-1});

    return AllRooms;
}

const JoinRoom = async ({roomId, userID, username}) =>{
    if(!roomId)
        throw new Error("Room ID is required");
    if(!userID)
        throw new Error("User ID is required");

    const room = await Room.findOne({roomId});
    if(!room)
        throw new Error("Room not found");

    const alreadyJoined = room.participants.some(
        p => p.userId.toString() === userID.toString()
    );

    if(alreadyJoined)
        return room;

    room.participants.push({
        userId:userID,
        username:username,
        joinedAt:new Date()
    });

    await room.save();
    return room;
}

const GetRoomByRoomId = async ({roomId}) =>{
    if(!roomId)
        throw new Error("Room ID is required");

    const room = await Room.findOne({roomId}).populate('participants.userId','username email avatar');

    if(!room)
        throw new Error("Room not found");

    return room;
}

export {CreateRoom, GetAllRooms, JoinRoom, GetRoomByRoomId};
