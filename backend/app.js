import express from 'express';
import morgan from 'morgan';
import UserRouter from './Routes/UserRoute.js';
import cookieParser from 'cookie-parser';
import cors from 'cors'
import RoomRouter from './Routes/RoomRoute.js';
import AIRouter from './Routes/AIRoute.js';

const app = express();


app.use(cors())
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({extended : true}))
app.use(cookieParser());
app.use('/users',UserRouter)
app.use('/room',RoomRouter)
app.use('/ai',AIRouter);


app.get("/",(req,res) => {
    res.send('Hello world');
});

export default app;
