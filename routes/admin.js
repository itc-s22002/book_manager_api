import express from "express";
import {PrismaClient} from "@prisma/client";
import {check, validationResult} from "express-validator";

const router = express.Router();
const prisma = new PrismaClient();

const pageSize = 5;

/**
 * 権限のチェック
 */
router.use((req, res, next) => {
    if (!req.user.isAdmin) {
        res.status(401).json({message: "unauthenticated",isAdmin:req.user.isAdmin});
        return;
    }
    next();
});

/**
 * 書籍情報登録
 */
router.post("/book/create",async (req,res,next)=>{
    try {
        const {isbn13, title, author, publishDate} = req.body
        await prisma.books.create({
            data: {
                isbn13,
                title,
                author,
                publishDate,
            }
        });
        res.status(200).json({result: "OK"});
    }catch (error){
        res.status(400).json({result:"NG",error:error});
    }

})

export default router
