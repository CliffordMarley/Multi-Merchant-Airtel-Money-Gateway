const TransactionController = require('../Controllers/Transactions.Controller')
module.exports = router=>{

    router.get('/transactions/status-test', (req, res)=>{
        res.json({
            status:'success',
            message:'Transaction endpoints Status running...'
        })
    })

    router.post('/transactions', new TransactionController().InitiateTransaction);
    router.post('/transactions/ipn', new TransactionController().InstantPaymentNotification);
    router.post('/transactions/malipo', new TransactionController().MobiPayTransaction)
    return router
}