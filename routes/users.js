import express from "express";
import passport from "passport";
import {check, validationResult} from "express-validator";
import {calcHash, generateSalt} from "../util/auth.js";
import {PrismaClient} from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

/* GET users listing. */
/*
* 状態確認
*/
router.get("/", function (req, res, next) {
    if (!req.user) {
        res.status(401).json({message: "unauthenticated"});
    } else {
        res.status(200).json({message: "logged in", user: req.user});
    }
});

/*
* ログイン
*/
router.post("/login",
    passport.authenticate("local", {failureRedirect: "/users/error"}), (req, res, next) => {
        res.status(200).json({message: "OK"});

    }
);
router.get("/error", (req, res, next) => {
    res.status(401).json({message: "name and/or password is invalid"});
})


/*
* 新規登録
*/
router.post("/signup", async (req, res, next) => {
    try {
        const {name, pass} = req.body;
        if (!name && !pass) {
            res.status(400).json({message: "not name/pass"});
        }else {
            const salt = generateSalt();
            const hashedPassword = calcHash(pass, salt);
            await prisma.user.create({
                data: {
                    name,
                    pass: hashedPassword,
                    salt
                }
            });
            res.status(201).json({message: "created!"});
        }
    } catch (e) {
        switch (e.code) {
            case "P2002":
                res.status(400).json({
                    message: "username is already registered"
                })
                break
            default:
                console.error(e)
                res.status(500).json({message: "unknown error"});
        }
    }
});

/*
* ログアウト
*/
router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
    });
    res.status(200).json({message: "OK"});
});

/*
* ユーザー一覧
*/
router.get("/read", async (req, res, next) => {
    try {
        const documents = await prisma.user.findMany({
            select: {id: true, name: true},
            orderBy: [
                {createdAt: "desc"}
            ]
        });
        res.status(201).json({message: "ok", documents});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
})

export default router;
