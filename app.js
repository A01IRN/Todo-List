let express = require('express');
let app = express();
const todosColl = require("./models/todos");
let auth_control = require('./auth').auth.router
let db = require('./db');
const pug = require('pug');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
app.use(cookieParser());
app.use("/auth",auth_control)
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine','pug')
app.set('views','./views');
const {TokenCheckerMiddleware,refreshTokenChecker} = require('./auth').auth;
inputValidation = (req,res,next) => {
    let dataBody = req.body
    if (!dataBody.todo | typeof dataBody.todo !== "string" | Object.keys(dataBody).length !== 3) {
        res.send("invalid")
    }
    if (!dataBody.description | typeof dataBody.description !== "string") {
        res.send("invalid")
    }
    if (!dataBody.priority | typeof Number(dataBody.priority) !== "number" | !(dataBody.priority<=5 & dataBody.priority>=1)) {
        res.send("invalid")
    }else{
    next()
    }
}

app.get('/login',TokenCheckerMiddleware,refreshTokenChecker, async (req, res) =>{
    if (res.locals.valid == true) {
        res.redirect("./todos")
    }
    else res.render('login')
});

app.get('/signin',TokenCheckerMiddleware,refreshTokenChecker, async (req, res) =>{
    if (res.locals.valid == true) {
        res.redirect("./todos")
    }
    else res.render('signin')
});

app.get("/todos",TokenCheckerMiddleware,refreshTokenChecker,async(req,res)=>{
    if (res.locals.valid === true) {
        try {
            let allDatas = await todosColl.find({user_id:res.locals.id})
            let mydata = []
            allDatas.forEach(el=>{
                let {_id,todo,description,priority}=el;
                mydata.push(`id: ${_id} || todo: ${todo} || description: ${description} || priority: ${priority}`)
            })
            res.render("todos",{mydata})
        } catch (error) {
            res.status(500).json({data:"internal error"})
        }
    } else {
        res.redirect("../login")
    }
})

app.get("/todos/add",TokenCheckerMiddleware,refreshTokenChecker,async (req,res) => {
    if (res.locals.valid === true) {
        res.render("add")
    }
    else{
        res.redirect("../../login")
    }
})

app.post("/todos/add",TokenCheckerMiddleware,refreshTokenChecker,inputValidation,async (req,res) => {
    if (res.locals.valid === true) {
        
        const newTodo = new todosColl({
            user_id:res.locals.id,
            todo : req.body.todo,
            description : req.body.description,
            priority : req.body.priority
        })
        try {
           let data = await newTodo.save()
           res.redirect("../todos")
        } catch (error) {
            res.status(400).send("not saved")
        }
    }
    else{
        res.redirect("../../login")
    }
})

app.get("/todos/delete",TokenCheckerMiddleware,refreshTokenChecker,async (req,res) => {
    if (res.locals.valid === true) {
        res.render("delete")
    }
    else{
        res.redirect("../../login")
    }
})

app.post("/todos/delete",TokenCheckerMiddleware,refreshTokenChecker,async (req,res) => {
    if (res.locals.valid === true) {
        console.log(req.body);
        console.log(res.locals);
        try {
            let data = await todosColl.findById(req.body.del_id).findOne({user_id:res.locals.id}).deleteOne()
            res.redirect("../todos")
        } catch (error) {
            res.send("didnt delete")
        }
    }
    else{
        res.redirect("../../login")
    }
})

db.on('error',err=>console.log(err))
db.once('connected',()=>console.log("DB connected"))
app.listen(3000)