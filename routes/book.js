import express from "express";
import {PrismaClient} from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

const maxItemCount = 5;

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
 * 書籍一覧
 */
router.get("/list", async (req, res, next) => {
    const page = req.query.page ? +req.query.page : 1;
    const skip = maxItemCount * (page - 1);

    const [books, count] = await Promise.all([
        prisma.books.findMany({
            select: {id: true, title: true, author: true, Rental: true},
            skip,
            take: maxItemCount,
        }),
        prisma.books.count()
    ])
    const returnBooks = books.map((b) => (
            {
                id: Number(b.id),
                title: b.title,
                author: b.author,

                isRental: Boolean(b.Rental.map((r) => (
                    r.returnDate === null
                )).pop())

            }
        )
    )
    const maxPageCount = Math.ceil(count / maxItemCount);
    res.status(200).json({books: returnBooks, maxPage: maxPageCount});
})

/**
 * 書籍詳細
 */
router.get("/detail/:id", async (req, res, next) => {
    const bid = +req.params.id;
    let rentalInfo = null
    const [books, rental] = await Promise.all([
        prisma.books.findMany({
            select: {id: true, title:true,isbn13: true, author: true, publishDate: true, Rental: true,},
            where: {id: bid}
        }),
        prisma.rental.findMany({
            select: {users: true, rentalDate: true, returnDeadline: true},
            where: {bookId: bid}
        })
    ])
    if (rental[0]){
        rentalInfo = rental.map((ren) => ({
            userName: ren.users.name,
            rentalDate: ren.rentalDate,
            returnDeadline: ren.returnDeadline
        }))
    }
    const booksInfo = books.map((b) => ({
        id: Number(b.id),
        isbn13: Number(b.isbn13),
        title: b.title,
        author: b.author,
        publishDate: b.publishDate,
        rentalInfo
    }))
    res.status(200).json({
        id:booksInfo[0].id,
        isbn13: booksInfo[0].isbn13,
        title: booksInfo[0].title,
        author: booksInfo[0].author,
        publishDate: booksInfo[0].publishDate,
        rentalInfo
    });

});
export default router;