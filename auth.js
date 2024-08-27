let express = require('express');
let router = express.Router();
const bcrypt = require('bcrypt');
const usersColl = require('./models/users');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
require("dotenv").config()
let jwt_secret = process.env.JWT_secret
let jwt = require('jsonwebtoken')
router.use(express.json());
router.use(bodyParser.urlencoded({ extended: false }));
router.use(cookieParser());

// Middlewares

TokenCheckerMiddleware = async (req,res,next) => {
    let token = req.headers['Authorization'] ? req.headers['Authorization'] : null
    if (token) {
        try {
            user_verify = jwt.verify(token,jwt_secret)
            res.locals.id = user_verify.id
            res.locals.valid = true

            next()
        } catch (error) {
            res.locals.valid = false
            next()
        }
    }else {
        next();
        res.locals.valid = false
    }
}

refreshTokenChecker = async (req,res,next) => {

    try {
        let refresh_token = req.cookies.refreshToken

        if (refresh_token) {
            let user_verify = jwt.verify(refresh_token,jwt_secret)
            let newJWT = await generateJWT(user_verify._id,"5m")
            res.set("Authorization",`Bearer ${newJWT}`)
            res.locals.valid = true
            
            res.locals.id = user_verify.id
            next()
        }
        else{
            res.locals.valid = false
            next()
        }
    } catch (error) {
        res.locals.valid = false
        next()
    }
}

loginMiddleware = async function(req,res,next) {
    
    res.locals.valid === true && next()
    let data = req.body
    let usercheck = await usersColl.findOne({username:data.username})
    if (usercheck) {
       let result = await bcrypt.compare(data.password,usercheck.password)
       req.u_id = usercheck._id.toString()
        if (result) {
            next()
        } else res.send("invalid username or password")
    }
}

signinMiddleware = async (req,res,next) => {
    let data = req.body
    let usercheck = await usersColl.findOne({username:data.username})
    usercheck ? res.send("username already exists") : next()
}

generateHashMiddleware = async (req,res,next) => {
    let data = req.body
    let salt = 10
    let hashed_password = await bcrypt.hash(data.password,salt)
        userData = new usersColl({
            username:data.username,
            password:hashed_password
        })
    let newUser = await userData.save()
    res.locals.u_id = newUser._id.toString()
    next()
}

generateJWT = async (data,exp) => {
    let token = jwt.sign({id:data},jwt_secret,{expiresIn:exp})
    return token
}

// Routes

router.post("/signin",TokenCheckerMiddleware,refreshTokenChecker,signinMiddleware,generateHashMiddleware,async(req,res)=>{
    if (res.locals.valid == true) {
        res.redirect("../todos")
    }else{
    let headerJWT = await generateJWT(res.locals.u_id,"5m")
    let refresh_token = await generateJWT(res.locals.u_id,"2h")
    res.set('Authorization',headerJWT).cookie('refreshToken',refresh_token,{httpOnly:true,sameSite:'strict'}).redirect("../todos")
    }
})

router.post("/login",TokenCheckerMiddleware,refreshTokenChecker,loginMiddleware,async(req,res)=>{
    if (res.locals.valid == true) {

    res.redirect("../todos")
    } else {
    let token = await generateJWT(req.u_id,"5m")
    let refresh_token = await generateJWT(req.u_id,"2h")
    res.set("Authorization",token).cookie('refreshToken',refresh_token,{httpOnly:true,sameSite:'strict'}).redirect("../todos")
    }
})
exports.auth = {TokenCheckerMiddleware,refreshTokenChecker,router}