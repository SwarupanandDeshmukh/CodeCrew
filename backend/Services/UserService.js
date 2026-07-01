import User from '../models/UserModel.js'

const createUser = async ({username, email , password}) => {

    if(!username || !email || !password)
        throw new Error('Username, email and password are required');

    const hashedPassword = await User.hashPassword(password);

    const user = await User.create({
        username : username,
        email : email,
        password : hashedPassword,
    })

    return user;
}

const GetAllUsers = async({userID}) =>{
    if(!userID)
        throw new Error("User ID is required");

    const allUser = await User.find({
        _id :{$ne:userID}
    });

    return allUser;
}

export {createUser,GetAllUsers};