/*
Author: Nhi Nguyen
Date: 11/19/2021
Description: Create a simple ToDo List, including register, login, adding new tasks and
            display as a unorder list.  
*/

//set up libarary 
import express from 'express';
import { engine } from 'express-handlebars';

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import bcrypt from 'bcrypt';

import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';

const saltRound = 10;
const port = 8080;

const dbPromise = open({
    filename: "./database/todolist.sqlite",
    driver: sqlite3.Database,
});

const app = express();

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');

app.use(cookieParser());
app.use(express.urlencoded());

app.use("/static", express.static("./static"));

//Authentication Middleware 
const authMiddleware = async (req, res, next) => {
    if (!req.cookies || !req.cookies.authToken) {
      return next();
    }
    const db = await dbPromise;
    const authToken = await db.get(
      "SELECT * FROM authtokens WHERE token = ?",
      req.cookies.authToken
    );
    if (!authToken) {
      return next();
    }
    const user = await db.get(
      "SELECT user_id, username FROM users WHERE user_id = ?",
      authToken.user_id
    );
    req.user = user;
    next();
  };

app.use(authMiddleware);

//GETs requests
app.get("/", async (req, res) => {
    const db = await dbPromise;
    if (!req.user) {
        return res.redirect("/login")
    }
    const task = await db.all('SELECT * FROM tasks WHERE user_id= ?', 
    req.user.user_id);

    res.render('home', {task, user: req.user.username});
})

app.get('/register', (req, res) => {
    if (req.user) {
        return res.redirect("/");
    }
    res.render('register');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/logout', (req, res) => {
    res.clearCookie("authToken"); //
    res.redirect("/login");
})

//POST requestes 
app.post('/register', async (req, res) => {
    const { username, password, confirmPassword } = req.body;
    const db = await dbPromise;

    //if user didn't enter all fields
    if (!username || !password || !confirmPassword) {
        return res.render("register", { error: "all fields are reuired" });
    }

    //if entered and confirm password aren't match
    if (password !== confirmPassword) {
        return res.render('register', { error: "password must match " });
    }

    try {
        //hash password and insert to users database 
        const passHash = await bcrypt.hash(password, saltRound);
        await db.run('INSERT INTO users(username, password) VALUES (?, ?)',
            username,
            passHash);

        //insert token to authToken database
        const addedUser = await db.get('SELECT * FROM users WHERE username= ?',
            username);

        const token = uuidv4();

        await db.run('INSERT INTO authtokens (token, user_id) VALUES (?,?)',
            token,
            addedUser.user_id);

        //write token to cookie
        res.cookie("authToken", token);
    }
    catch (e) {
        console.log(e);
        if (e.message === "SQLITE_CONSTRAINT: UNIQUE constraint failed: User.username") {
            return res.render('register', { error: "username already taken" });
        }
        return res.render('register', { error: "something went wrong" });
    }

    res.redirect("/");
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const db = await dbPromise;

    //if user didn't enter all fields
    if (!username || !password) {
        return res.render("login", { error: "all fields are required" });
    }

    try {
        //check if username exists in database
        const getUser = await db.get('SELECT * FROM users WHERE username =?',
            username);
        if (!getUser) {
            return res.render('login',
                { error: "username or password incorrect" });
        }

        //check if password matches through bcryot
        const passMatch = await bcrypt.compare(password, getUser.password);
        if (!passMatch) {
            return res.render('login',
                { error: "username or password incorrect" });
        }

        //insert token to authToken database
        const token = uuidv4();
        await db.run('INSERT INTO authtokens (token, user_id) VALUES (?,?)',
            token,
            getUser.user_id);

        //write token to cookie
        res.cookie("authToken", token);
    }
    catch (e) {
        console.log(e);
        return res.render('login', { error: "something went wrong" });
    }

    res.redirect("/");
});

app.post("/tasks", async (req, res) => {
    if (!req.user) {
        res.redirect('/');
    }
    const db = await dbPromise;
    await db.run("INSERT INTO tasks(user_id, task_desc, is_complete) VALUES (?,?,?)",
        req.user.user_id,
        req.body.tasks,
        false);
    res.redirect("/");
});

const setup = async () => {
    const db = await dbPromise;
    db.migrate({ force: false });
    app.listen(port, () => {
        console.log(`Server start on port: ${port}`);
    })
};

setup();