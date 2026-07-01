import User from "../models/UserModel.js";
import { validationResult } from "express-validator";
import { CreateRoom, GetAllRooms, JoinRoom, GetRoomByRoomId } from "../Services/RoomService.js";
import Notification from "../models/NotificationModel.js";

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

        const notifications = [];
        for (const recipientId of recipientIds) {
            const notification = await Notification.create({
                recipientId,
                senderId: loggedinUser._id,
                senderUsername: loggedinUser.username,
                roomId,
                roomName,
                type: 'room-invite'
            });
            notifications.push(notification);
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
        const notifications = await Notification.find({
            recipientId: loggedinUser._id,
            read: false
        }).sort({ createdAt: -1 });

        return res.status(200).json({ notifications });
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

const MarkNotificationReadController = async (req, res) => {
    try {
        const { notificationId } = req.params;
        await Notification.findByIdAndUpdate(notificationId, { read: true });
        return res.status(200).json({ message: "Notification marked as read" });
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
    MarkNotificationReadController
};
