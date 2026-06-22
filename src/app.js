const express = require('express')
const app = express()
const authRouter = require('./routes/auth.routes')
const accountRouter = require('./routes/account.routes')
const cookieParser = require('cookie-parser')
const transactionRoutes = require('./routes/transaction.routes')


app.use(express.json())
app.use(cookieParser())


app.use("/api/auth",authRouter)
app.use("/api/accounts",accountRouter)
app.use("/api/transactions",transactionRoutes)

module.exports=app

    