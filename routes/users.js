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
// router.post("/login",
//     passport.authenticate("local", {failureRedirect: "/users/error"}), (req, res, next) => {
//         res.status(200).json({message: "OK"});
//
//     }
// );
// router.get("/error", (req, res, next) => {
//     res.status(401).json({message: "name and/or password is invalid"});
// })

router.post("/login", passport.authenticate("local", {
    failWithError: true
}), (req, res, next) => {
    const {isAdmin} = req.user
    res.json({result: "OK",isAdmin:isAdmin});
});


/*
* 新規登録
*/
router.post("/signup", [
    // 入力値チェックミドルウェア
    check("email").notEmpty({ignore_whitespace: true}),
    check("password").notEmpty({ignore_whitespace: true})
], async (req, res, next) => {
    if (!validationResult(req).isEmpty()) {
        res.status(400).json({result: "NG"});
        return;
    }
    const {email,name, password} = req.body;
    const salt = generateSalt();
    const hashed = calcHash(password, salt);
    try {
        await prisma.user.create({
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
        // データベース側で何らかのエラーが発生したときにここへ来る。
        switch (e.code) {
            case "P2002":
                // このエラーコードは、データベースの制約違反エラーっぽい。
                // おそらくUnique制約が設定されている name なので
                // すでに登録されている名前と同じ名前のユーザを登録しようとした。
                res.status(409).json({result: "NG"});
                break;
            default:
                // その他のエラー全てに対応できないので
                // 詳細をコンソールに吐き出して、クライアントにはエラーのことだけ伝える。
                console.error(e);
                res.status(500).json({
                    result: "unknown error"
                });
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
    res.status(200).json({result: "OK"});
});
export default router;
