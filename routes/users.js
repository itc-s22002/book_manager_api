import express from "express";
import passport from "passport";
import {check, validationResult} from "express-validator";
import {calcHash, generateSalt} from "../util/auth.js";
import {PrismaClient} from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

/* GET users listing. */
/**
 * ログイン状態のチェック
 */
router.get("/", function (req, res, next) {
    if (!req.user) {
        res.status(401).json({result: "NG"});
    } else {
        res.status(201).json({result: "OK", isAdmin: req.user.isAdmin});
    }
});

/**
 * ログイン状態のチェック
 */
router.get("/check", (req,res,next) =>{
    if (!req.user) {
        res.status(401).json({result: "NG"});
    } else {
        res.status(201).json({result: "OK", isAdmin: req.user.isAdmin});
    }
})

/**
 * ログイン
 */
router.post("/login", passport.authenticate("local", {
    failWithError: true
}), (req, res, next) => {
    const {isAdmin} = req.user
    res.json({result: "OK",isAdmin:isAdmin});
});


/**
 * ユーザー作成
 */
router.post("/signup", [
    check("email").notEmpty({ignore_whitespace: true}),
    check("password").notEmpty({ignore_whitespace: true})
], async (req, res, next) => {
    if (!validationResult(req).isEmpty()) {
        res.status(400).json({result: "NG"});
        return;
    }
    const {email,name,password} = req.body;
    const salt = generateSalt();
    const hashed = calcHash(password, salt);
    try {
        await prisma.users.create({
            data: {
                email,
                name,
                password: hashed,
                salt
            }
        });
        res.status(201).json({
            result: "created"
        });
    } catch (e) {
        switch (e.code) {
            case "P2002":
                res.status(409).json({result: "NG"});
                break;
            default:
                console.error(e);
                res.status(500).json({result: "unknown error"});
        }
    }
});

/**
* ログアウト
*/
router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
    });
    res.status(200).json({result: "OK"});
});
export default router;
