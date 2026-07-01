import User from "../models/UserModel.js";
import { validationResult } from "express-validator";
import { CreateRoom, GetAllRooms, JoinRoom, GetRoomByRoomId, DeleteRoom } from "../Services/RoomService.js";
import redisClient from "../Services/RedisService.js";
import crypto from 'crypto';

const CreateRoomController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    try {
        const { roomId, roomName } = req.body;

        const LoggedUser = await User.findOne({ email: req.user.email });
        const userID = LoggedUser._id;
        const username = LoggedUser.username;

        const room = await CreateRoom({ roomId, roomName, userID, username });

        return res.status(200).json({ room });
    }
    catch (error) {
        res.status(400).send(error.message);
    }
};

const GetAllRoomsController = async (req, res) => {
    try {
        const loggedinUser = await User.findOne({ email: req.user.email });
        const AllRooms = await GetAllRooms({ userID: loggedinUser._id });

        return res.status(200).json({ AllRooms });
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

const JoinRoomController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    try {
        const { roomId } = req.body;
        const loggedinUser = await User.findOne({ email: req.user.email });
        const room = await JoinRoom({
            roomId,
            userID: loggedinUser._id,
            username: loggedinUser.username
        });

        return res.status(200).json({ room });
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

const GetRoomByRoomIdController = async (req, res) => {
    try {
        const { roomId } = req.params;

        const room = await GetRoomByRoomId({ roomId });

        return res.status(200).json({ room });
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

const InviteToRoomController = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array() });
    }

    try {
        const { roomId, roomName, recipientIds } = req.body;
        const loggedinUser = await User.findOne({ email: req.user.email });

        const room = await GetRoomByRoomId({ roomId });
        if (room.createdBy.toString() !== loggedinUser._id.toString()) {
            return res.status(403).json({ error: "Only the room owner can invite members" });
        }

        const notifications = [];
        for (const recipientId of recipientIds) {
            const uniqueId = crypto.randomBytes(4).toString('hex');
            const key = `notification:invite:${recipientId}:${uniqueId}`;
            const notificationData = {
                recipientId,
                senderId: loggedinUser._id.toString(),
                senderUsername: loggedinUser.username,
                roomId,
                roomName
            };
            await redisClient.set(key, JSON.stringify(notificationData), { EX: 600 });
            notifications.push({ _id: uniqueId, ...notificationData });
        }

        return res.status(200).json({ notifications });
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

const GetNotificationsController = async (req, res) => {
    try {
        const loggedinUser = await User.findOne({ email: req.user.email });
        const keys = await redisClient.keys(`notification:invite:${loggedinUser._id}:*`);

        if (keys.length === 0) {
            return res.status(200).json({ notifications: [] });
        }

        const values = await redisClient.mGet(keys);
        const notifications = [];

        for (let i = 0; i < keys.length; i++) {
            if (values[i]) {
                const parsed = JSON.parse(values[i]);
                parsed._id = keys[i].split(':').pop();
                notifications.push(parsed);
            }
        }

        return res.status(200).json({ notifications });
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

const MarkNotificationReadController = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const loggedinUser = await User.findOne({ email: req.user.email });
        const key = `notification:invite:${loggedinUser._id}:${notificationId}`;
        await redisClient.del(key);
        return res.status(200).json({ message: "Notification removed" });
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

const DeleteRoomController = async (req, res) => {
    try {
        const { roomId } = req.params;
        const loggedinUser = await User.findOne({ email: req.user.email });

        await DeleteRoom({ roomId, userID: loggedinUser._id });

        // Cleanup Redis data for this room
        await redisClient.del(`chat:${roomId}`);

        return res.status(200).json({ message: "Room deleted successfully" });
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

export {
    CreateRoomController,
    GetAllRoomsController,
    JoinRoomController,
    GetRoomByRoomIdController,
    InviteToRoomController,
    GetNotificationsController,
    MarkNotificationReadController,
    DeleteRoomController
};
