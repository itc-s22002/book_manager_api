import express from "express";
import {PrismaClient} from "@prisma/client";
import {check, validationResult} from "express-validator";
import cookieParser from "cookie-parser";

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
 * 書籍貸出
 */
router.post("/start", async (req, res, next) => {
    const {bookId} = req.body

    const returnReturnDate = await prisma.rental.findMany({
        select: {returnDate: true},
        where: {
            booksId: BigInt(bookId),
            returnDate: null
        }
    })
    if (!Boolean(returnReturnDate[0])) {
        try {
            const currentDate = new Date();
            const returnDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
            const rentalsData = await prisma.rental.create({
                data: {
                    booksId: BigInt(bookId),
                    usersId: BigInt(req.user.id),
                    returnDeadline: returnDate
                }
            });

            const rentalInfo = {
                id: Number(rentalsData.id),
                bookId: Number(rentalsData.booksId),
                rentalData: rentalsData.rentalDate,
                returnDeadline: rentalsData.returnDeadline
            }


            res.status(201).json({
                id:rentalInfo.id,
                bookId:rentalInfo.bookId,
                rentalDate:rentalInfo.rentalData,
                returnDeadline:rentalInfo.returnDeadline
            });
        } catch (error) {
            res.status(400).json({result: "NG"});
        }
    } else {
        res.status(409).json({result: "NG"});
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
        res.status(400).json({result: "NG"});
    }
})

/**
 * 借用書籍一覧
 */
router.get("/current", async (req, res, next) => {
    const rentalBooks = await prisma.rental.findMany({
        select: {id: true, booksId: true, book: true, rentalDate: true, returnDeadline: true,returnDate:true},
        where:{
            returnDate:null
        }
    })

    const returnBooks = rentalBooks.map((b) => ({
        rentalId: Number(b.id),
        bookId: Number(b.booksId),
        bookName: String(b.book.title),
        rentalDate: b.rentalDate,
        returnDeadline: b.returnDeadline,
    }))

    res.status(200).json({rentalBooks: returnBooks});

})

/**
 * 借用書籍履歴
 */
router.get("/history", async (req, res, next) => {
    const rentalBooks = await prisma.rental.findMany({
        select: {id:true,booksId: true, book: true, rentalDate: true, returnDate: true}
    })

    const returnBooks = rentalBooks.map((b) => ({
        rentalId:Number(b.id),
        bookId: Number(b.booksId),
        bookName: String(b.book.title),
        rentalDate: b.rentalDate,
        returnDate: b.returnDate
    }))

    res.status(200).json({rentalHistory: returnBooks});

})

export default router