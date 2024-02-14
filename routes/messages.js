import express from "express";
import {PrismaClient} from "@prisma/client";
import {check, validationResult} from "express-validator";

const router = express.Router();
const prisma = new PrismaClient();

const pageSize = 5;

/**
 * ログイン状態のチェック
 */
router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({message: "unauthenticated"});
        return;
    }
    next();
});
/**
 * メッセージの投稿
 */
router.post("/create",async (req,res,next)=>{
    try {
        const {text} = req.body;
        await prisma.message.create({
            data: {
                accountId: req.user.id,
                text
            }
        });
        res.status(200).json({message: "created"});
    }catch (error){
        res.status(400).json({message: error.message});
    }

})
/**
 * メッセージの一覧
 */

router.get("/read?:page",async(req, res, next) => {
    try {
        const page = +req.params.page || 1;
        const documents = await prisma.message.findMany({
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: [
                {createdAt: "desc"}
            ]
        });
        res.status(201).json({message: "ok", documents});
    }catch (error){
        res.status(500).json({message: error.message});
    }
})

/**
 * 特定のデータを取得して返す
 */
router.get("/:uid/read?:page", async (req, res, next) => {
    try {
        const uid = +req.params.uid;
        const page = +req.params.page || 1;
        const messages = await prisma.message.findMany({
            where: {accountId: uid},
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: [
                {createdAt: "desc"}
            ]
        });
        const user = await prisma.user.findMany({
            select:{id:true,name:true},
            where: {id: uid},

        });
        res.status(200).json({message: "ok",user:user ,messages});
    }catch (error){
        res.status(400).json({message: error.message});
    }
});
export default router;