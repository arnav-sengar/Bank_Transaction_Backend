const  userModel = require('../models/user.model')
const jwt = require('jsonwebtoken')
/**
 * user register controller
 * POST api/auth/register
 */
async function userRegisterController(req,res){
    
    const{ email,password,name } = req.body

    const isExist = await userModel.findOne({
        email
    })

    if(isExist){
        return res.status(422).json({
            message:"User Already exists",
            status:"FAILED"
        })
    }

    const user = await userModel.create({
        email, password, name
    })

    const token = jwt.sign({userId:user._id},process.env.JWT_SECRET,{expiresIn:"3d"})

    res.cookie("token",token)
    res.status(201).json({
        user:{
            email:user.email,
            name:user.name
        },
        token
    })
}

/**
 * user login controller
 * POST api/auth/login
 */

async function userLoginController(req,res){

    const {email,password} = req.body

    const user = await userModel.findOne({email}).select("+password")

    if(!user){
        return res.status(401).json({
            message:"Email or password is Invalid"
        })
    }

    const isValidPassword = await user.comparePassword(password)

    if(!isValidPassword){
        return res.status(401).json({
            message:"Email or password is Invalid"
        })
    }

    const token = jwt.sign({userId:user._id},process.env.JWT_SECRET,{expiresIn:"3d"})

    res.cookie("token",token)
    res.status(200).json({
        user:{
            email:user.email,
            name:user.name
        },
        token
    })
}

/**
 * - User Logout Controller
 * - POST /api/auth/logout
  */
async function userLogoutController(req, res) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[ 1 ]

    if (!token) {
        return res.status(200).json({
            message: "User logged out successfully"
        })
    }

    res.clearCookie("token")

    res.status(200).json({
        message: "User logged out successfully"
    })

}

module.exports = {userRegisterController, userLoginController, userLogoutController}