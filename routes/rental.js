import express from "express";
import {PrismaClient} from "@prisma/client";
import {check, validationResult} from "express-validator";

const router = express.Router();
const prisma = new PrismaClient();

const maxItemCount = 10;

/**
 * ログイン状態のチェック
 */
// router.use((req, res, next) => {
//     if (!req.user) {
//         res.status(401).json({message: "unauthenticated"});
//         return;
//     }
//     next();
// });

/**
 * 書籍貸出
 */
router.post("/start", async (req, res, next) => {
    try {
        const currentDate = new Date();
        const returnDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const {bookId} = req.body
        await prisma.rental.create({
            data: {
                booksId: BigInt(bookId),
                usersId: BigInt(req.user.id),
                returnDeadline: returnDate
            }
        });
        res.status(200).json({result: "OK"});
    } catch (error) {
        res.status(400).json({result: "NG", error: error});
    }

})

/**
 * 書籍返却
 */
router.put("/return", async (req, res, next) => {
    try {
        const currentDate = new Date();
        const returnDate = new Date(currentDate.getTime());
        const {rentalId} = req.body
        await prisma.rental.update({
            where: {
                id: BigInt(rentalId)
            },
            data: {
                returnDate: returnDate
            }
        });
        res.status(200).json({result: "OK"});
    } catch (error) {
        res.status(400).json({result: "NG", error: error});
    }
})

/**
 * 借用書籍一覧
 */
router.get("/current", async (req, res, next) => {
    try {

        const rentalBooks = await prisma.rental.findMany({
                select: {id: true,booksId: true, book:true,rentalDate: true,returnDeadline:true},
            })

        const returnBooks = rentalBooks.map((b) => ({
            rentalId: Number(b.id),
            bookId: Number(b.booksId),
            bookName:String(b.book.title),
            rentalData: b.rentalDate,
            returnDeadline: b.returnDeadline
        }))

        res.status(200).json({rentalBooks: returnBooks});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
})

/**
 * 借用書籍履歴
 */
router.get("/history", async (req, res, next) => {
    try {
        const rentalBooks = await prisma.rental.findMany({
            select: {booksId: true, book:true,rentalDate: true,returnDate:true},
        })

        const returnBooks = rentalBooks.map((b) => ({
            bookId: Number(b.booksId),
            bookName:String(b.book.title),
            rentalData: b.rentalDate,
            returnDate:b.rentalDate
        }))

        res.status(200).json({rentalHistory: returnBooks});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
})

export default router