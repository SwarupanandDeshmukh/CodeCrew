import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';
import http from 'http';
import connectDB from './db/db.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Room from './models/RoomModel.js';
import generateResult from './Services/AIService.js';
import redisClient from './Services/RedisService.js';



const port = process.env.PORT || 5000;

connectDB();


const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];

        const roomId = socket.handshake.query.roomId;

        if (!roomId)
            return next(new Error('Room ID is required'))

        const room = await Room.findOne({ roomId });
        if (!room)
            return next(new Error('Room not found'));

        socket.room = room;

        if (!token)
            return next(new Error("Authentication Error"));

        const decode = jwt.verify(token, process.env.JWT_SECRET);

        if (!decode)
            return next(new Error("Authentication Error"));
        socket.user = decode;
        next();
    }
    catch (error) {
        next(error);
    }
});

io.on('connection', socket => {

    console.log("User connected via socket");

    const roomId = socket.handshake.query.roomId;

    if (!roomId) {
        console.log('No room ID provided');
        return;
    }
    socket.join(roomId);

    // Send chat history from Redis to the newly connected user
    const chatKey = `chat:${roomId}`;
    redisClient.lRange(chatKey, 0, -1)
        .then(history => {
            const parsedHistory = history.map(msg => JSON.parse(msg));
            socket.emit('chat-history', parsedHistory);
        })
        .catch(err => console.log('Error fetching chat history:', err));

    socket.on('project-message', async data => {

        const message = data.message;

        const aiMessage = message.includes("@ai");

        // Store user message in Redis
        const messageData = JSON.stringify({
            sender: data.sender,
            message: data.message,
            timestamp: new Date().toISOString()
        });
        await redisClient.rPush(chatKey, messageData);
        await redisClient.expire(chatKey, 86400);

        socket.broadcast.to(roomId).emit('project-message', data)

        if (aiMessage) {

            const prompt = message.replace('@ai', '');

            const result = await generateResult(prompt);

            // Store AI response in Redis
            const aiMessageData = JSON.stringify({
                sender: 'AI',
                message: result,
                timestamp: new Date().toISOString()
            });
            await redisClient.rPush(chatKey, aiMessageData);
            await redisClient.expire(chatKey, 86400);

            io.to(roomId).emit('project-message', {
                message: result,
                sender: 'AI'
            });

            return;
        }


    })

    socket.on('coding-session-toggle', data => {
        if (socket.user.userId.toString() !== socket.room.createdBy.toString()) {
            return;
        }
        socket.broadcast.to(roomId).emit('coding-session-toggle', data);
    });

    socket.on('event', data => { /* … */ });
    socket.on('disconnect', () => {
        console.log('user Disconnected');
        socket.leave(roomId);
    });
});

server.listen(port, () => {
    console.log(`The server is running at ${port}`)
})
