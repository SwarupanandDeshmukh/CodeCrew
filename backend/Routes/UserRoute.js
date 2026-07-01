import { Router } from "express";
import {createUserController,loginUserController, logoutController, ProfileController,GetAllUserController} from "../Controllers/UserController.js";
import { body } from "express-validator";
import User from "../models/UserModel.js";
import authUser from "../Middleware/AuthMiddleware.js";

const UserRouter = Router();

UserRouter.post('/register',
    body('username').isLength({min:3}).withMessage('Username should be at least 3 characters long'),
    body('email').isEmail().withMessage('Email must be valid'),
    body('password').isLength({min:3}).withMessage('Password should be at least 3 characters long'),
    createUserController
);

UserRouter.post("/login",
     body('email').isEmail().withMessage('Email must be valid'),
    body('password').isLength({min:3}).withMessage('Password should be at least 3 characters long'),
    loginUserController
)

UserRouter.get("/profile",authUser,ProfileController);

UserRouter.get('/logout',authUser,logoutController)

UserRouter.get('/getUsers',authUser,GetAllUserController);

export default UserRouter;
