import express from "express";
import {PrismaClient} from "@prisma/client";
import {check, validationResult} from "express-validator";

const router = express.Router();
const prisma = new PrismaClient();


/**
 * 権限のチェック
 */
router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({message: "not login"});
        return;
    }
    if (!req.user.isAdmin) {
        res.status(401).json({message: "unauthenticated", isAdmin: req.user.isAdmin});
        return;
    }
    next();
});

/**
 * 書籍情報登録
 */
router.post("/book/create", [
    check("isbn13").notEmpty({ignore_whitespace: true}),
    check("title").notEmpty({ignore_whitespace: true}),
    check("author").notEmpty({ignore_whitespace: true}),
    check("publishDate").notEmpty({ignore_whitespace: true}),
], async (req, res, next) => {
    if (!validationResult(req).isEmpty()) {
        res.status(400).json({message: "NG"});
        return;
    }
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
        res.status(201).json({result: "OK"});
    } catch (error) {
        res.status(400).json({result: "NG"});
    }

})

/**
 * 書籍情報更新
 */
router.put("/book/update", async (req, res, next) => {
    try {
        const {bookId, isbn13, title, author, publishDate} = req.body
        await prisma.books.update({
            where: {
                id: BigInt(bookId)
            },
            data: {
                isbn13,
                title,
                author,
                publishDate,
            }
        });
        res.status(200).json({result: "OK"});
    } catch (error) {
        res.status(400).json({result: "NG"});
    }
})

/**
 * 全ユーザの貸出中書籍一覧
 */
router.get("/rental/current", async (req, res, next) => {

    const rental = await
        prisma.rental.findMany({
            where: {
                returnDate: {
                    not: null
                }
            },
            select: {
                id: true,
                usersId: true,
                users: true,
                booksId: true,
                book: true,
                rentalDate: true,
                returnDeadline: true
            },
        })

    const returnBooks = rental.map((b) => ({
        rentalId: Number(b.id),
        userId: Number(b.usersId),
        userName: b.users.name,
        bookId: Number(b.booksId),
        bookName: b.book.title,
        rentalDate: (b.rentalDate),
        returnDeadline: (b.returnDeadline)
    }))

    res.status(200).json({returnBooks: returnBooks});

})

/**
 * 特定ユーザの貸出中書籍一覧
 */
router.get("/rental/current/:uid", async (req, res, next) => {
    const uid = BigInt(req.params.uid);
    let userName = ""
    let books = null

    const rental = await
        prisma.rental.findMany({
                where: {
                    usersId: uid,
                    returnDate: {
                        not: null
                    }
                },
                select: {
                    id: true,
                    usersId: true,
                    users: true,
                    booksId: true,
                    book: true,
                    rentalDate: true,
                    returnDeadline: true
                },
            }
        )

    if(rental[0]){
         userName = rental[0].users.name
            books = rental.map((b) => ({
            rentalId: Number(b.id),
            bookId: Number(b.booksId),
            bookName: b.book.title,
            rentalDate: (b.rentalDate),
            returnDeadline: (b.returnDeadline)
        }))

    }

    const userId = Number(uid)

    res.status(200).json({userId, userName, rentalBooks: books});

})
export default router
