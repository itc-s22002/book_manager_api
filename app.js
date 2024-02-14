import express from "express";
import createError from "http-errors";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import session from "express-session";
import passport from "passport";
import passportConfig from "./util/auth.js";
import {cdate} from "cdate"


import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js";
import messagesRouter from "./routes/messages.js";
import cors from "cors"
const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(import.meta.dirname, "public")));

// session
app.use(session({
    secret: "Ym6JrhVjwB4IB&ivXWr9+&xw",
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 60 * 60 * 1000}
}));
// passport
app.use(passport.authenticate("session"));
app.use(passportConfig(passport));

//cors
app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true,
    }),
);

// cdate を使えるようにする
app.use((req, res, next) => {
    res.locals.date_format =
        (d) => cdate(d).format("YYYY-MM-DD HH:mm:ss");
    next();
});


app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/messages", messagesRouter);


export default app;