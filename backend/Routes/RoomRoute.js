import { Router } from "express";
import {body} from "express-validator"
import {
    CreateRoomController,
    GetAllRoomsController,
    JoinRoomController,
    GetRoomByRoomIdController,
    InviteToRoomController,
    GetNotificationsController,
    MarkNotificationReadController,
    DeleteRoomController
} from "../Controllers/RoomController.js";
import authUser from "../Middleware/AuthMiddleware.js";

const RoomRouter = Router();

RoomRouter.post('/create',
    authUser,
    body('roomId').isString().withMessage("Room ID is required"),
    body('roomName').isString().withMessage("Room name is required"),
    CreateRoomController
);

RoomRouter.get('/allRooms',
    authUser,
    GetAllRoomsController
);

RoomRouter.post('/join',
    authUser,
    body('roomId').isString().withMessage("Room ID is required"),
    JoinRoomController
);

RoomRouter.get('/get/:roomId',
    authUser,
    GetRoomByRoomIdController
);

RoomRouter.post('/invite',
    authUser,
    body('roomId').isString().withMessage("Room ID is required"),
    body('roomName').isString().withMessage("Room name is required"),
    body('recipientIds').isArray({min:1}).withMessage("Recipients should be an array"),
    InviteToRoomController
);

RoomRouter.get('/notifications',
    authUser,
    GetNotificationsController
);

RoomRouter.put('/notifications/:notificationId/read',
    authUser,
    MarkNotificationReadController
);

RoomRouter.delete('/delete/:roomId',
    authUser,
    DeleteRoomController
);

export default RoomRouter;
