import express from "express";
import {PrismaClient} from "@prisma/client";
import {check, validationResult} from "express-validator";

const router = express.Router();
const prisma = new PrismaClient();

const maxItemCount = 10;

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
 * メッセージの一覧
 */

router.get("/list",async(req, res, next) => {
    try {
        const page = req.query.page ? +req.query.page : 1;
        const skip = maxItemCount * (page - 1);

        const [books,count] = await Promise.all([
            prisma.books.findMany({
                select:{id:true,title:true,author:true},
                skip,
                take: maxItemCount,
            }),
            prisma.books.count()
        ])

        const returnBooks = books.map((b) =>({
            id: Number(b.id),
            title:b.title,
            author:b.author
        }))

        const maxPageCount = Math.ceil(count / maxItemCount);

        res.status(200).json({books:returnBooks, maxPage:maxPageCount});
    }catch (error){
        res.status(500).json({message: error.message});
    }
})

/**
 * 特定のデータを取得して返す
 */
router.get("/detail/:id", async (req, res, next) => {
    try {
        const bid = +req.params.id;
        const books = await prisma.books.findMany({
            where:{id:bid}
        });
        const booksInfo = books.map((b) =>({
            id: Number(b.id),
            isbn13: Number(b.isbn13),
            title:b.title,
            author:b.author,
            publishDate:b.publishDate
        }))
        res.status(200).json({message: "ok",booksInfo});
    }catch (error){
        res.status(400).json({message: error.message});
    }
});
export default router;