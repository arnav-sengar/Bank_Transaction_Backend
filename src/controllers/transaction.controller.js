const transactionModel = require('../models/transaction.model')
const ledgerModel = require('../models/ledger.model')
const accountModel = require('../models/accounts.model')
const mongoose = require('mongoose')
/**
 * CREATE A NEW TRANSACTION
 * 
 * The 10 steps transfer flow--
 * 
 *      1. Validate request
 *      2. Validate Idempotency key
 *      3. Check the account status
 *      4. Derive sender balance from ledger
 *      5. Create transaction(default pending state)
 *      6. Create DEBIT ledger entry
 *      7. Create CREDIT ledger entry
 *      8. Mark the transaction completed
 *      9. Commit MongoDB session
 *      10.Send E-mail notification(optional)
 */

async function createTransaction(req,res){

    /**
     *  VALIDATE REQUEST
     */
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body

    if(!fromAccount || !toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message:"Missing required Values"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        _id:fromAccount
    })

    const toUserAccount = await accountModel.findOne({
        _id:toAccount
    })

    if(!fromUserAccount || !toUserAccount){
        return res.status(400).json({
            message:"Invalid fromAccount or toAccount"
        })
    }

    /**
     *  VALIDATE IDEMPOTENCY KEY
     */

    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey
    })

    if(isTransactionAlreadyExists){
        if(isTransactionAlreadyExists.status === "COMPLETE"){
            return res.status(200).json({
                message:"Transaction Complete"
            })
        }

        if(isTransactionAlreadyExists.status === "PENDING"){
            return res.status(200).json({
                message:"Transaction in process"
            })
        }

        if(isTransactionAlreadyExists.status === "FAILED"){
            return res.status(500).json({
                message:"Transaction Failed, please retry"
            })
        }

        if(isTransactionAlreadyExists.status === "REVERSED"){
            return res.status(200).json({
                message:"Transaction was reversed, please retry"
            })
        }
    }

    /**
     * CHECK ACCOUNT STATUS
     */

    if(fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE"){
        return res.status(400).json({
            message:"Both the accounts must be active to process a transaction"
        })
    }

    /**
     *  DERIVE SENDER BALANCE FROM LEDGER
     */

    const balance = await fromUserAccount.getBalance()

    if(balance < amount){
        res.status(400).json({
            message:`Insufficient Balance`
        })
    }

    /**
     *  CREATE TRANSACTION
     */

    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = await transactionModel.create({
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status:"PENDING"
    },{session})

    const debitLedgerEntry = await ledgerModel.create({
        account:fromAccount,
        amount,
        transaction:transaction._id,
        type:"DEBIT",

    },{session})

    const creditLedgerEntry = await ledgerModel.create({
        account: toAccount,
        amount,
        transaction:transaction._id,
        type:"CREDIT",

    },{session})

    transaction.status = "COMPLETED"
    await transaction.save({session})

    await session.commitTransaction()
    session.endSession()
}

async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        })
    }

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid toAccount"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    })

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        })
    }


    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = new transactionModel({
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    })

    const debitLedgerEntry = await ledgerModel.create([ {
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    } ], { session })

    const creditLedgerEntry = await ledgerModel.create([ {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    } ], { session })

    transaction.status = "COMPLETE"
    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message: "Initial funds transaction completed successfully",
        transaction: transaction
    })


}

module.exports = {createTransaction, createInitialFundsTransaction}