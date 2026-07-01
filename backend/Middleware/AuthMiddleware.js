import jwt from 'jsonwebtoken';

const authUser = async (req,res,next) =>{

    try {
        let token = null;

        // Check cookies
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        // Check Authorization header
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if(!token || token === 'null' || token === 'undefined')
        {
            return res.status(401).json({error:"Unauthorized user"});
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch(error) {
        return res.status(401).json({error:"Invalid or expired token"});
    }
}

export default authUser;