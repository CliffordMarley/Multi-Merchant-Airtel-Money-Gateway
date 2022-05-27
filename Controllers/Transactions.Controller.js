const MerchantHelper = require('../Helpers/Merchant.Helper')
const TransactionModel = require('../Models/Transaction.Model')
const TransactionHelper = require('../Helpers/Transaction.Helper')
const MerchantModel = require('../Models/Merchant.Model')
const {notEmpty} = require("../Helpers/Validation.Helper")
const fetch = require('node-fetch')


module.exports = class{
    //Compare this snippet from Routes\Transaction.Routes.js:
    constructor(){
        this.merchanthelper = new MerchantHelper()
        this.txn_model = new TransactionModel()
        this.txn_helper = new TransactionHelper()
        this.merchant_model = new MerchantModel()
    }

    InitiateTransaction = async (req, res)=>{
        try{
            let data = req.body
            console.log(data)
            //Check if all required parameters are present
            if(notEmpty(data.txn_ref) && notEmpty(data.prompt) 
            && notEmpty(data.amount) && notEmpty(data.msisdn)){
                //Auth Merchant
                let merchant = await this.merchanthelper
                .authenticateMerchant(req.headers['x-api-key'])

                if(await this.txn_helper.isPartnerRefUnique(data.txn_ref)){
                    const payload = {
                        merchant:merchant.id,
                        txn_reference: await this.txn_helper.generateTransactionId(),
                        partner_reference:data.txn_ref,
                        description:data.prompt,
                        amount:data.amount,
                        msisdn:data.msisdn
                    }

                //log Transaction Initial Details
                await this.txn_model.LogTransactionRecord(payload)
                this.txn_helper.initiateTransaction(payload)
                .then(message=>{
                    res.json({
                        status:'success',
                        message,
                        data:payload
                    })
                }).catch(async err=>{
                    const updateObj = {
                        "txn_ref":payload.txn_reference,
                        'airtel_money_id':null,
                        'status': 'FAILED'
                    }
                    console.log("Updating transaction status...")
                    await this.txn_model.updateTransactionStatus(updateObj)
                    res.json({
                        status:'error',
                        message:err.message
                    })
                })
                //Send Response
                }else{
                    res.json({
                        status:'error',
                        message:'Transaction reference already exist!'
                    })
                }
            
            }else{
                res.json({
                    status:'error',
                    message:"Invalid/Missing Parameters!"
                })
            }
            
        }catch(err){
            console.log(err)
            res.json({
                status:'error',
                message:err.message
            })
        }
    }

    async InstantPaymentNotification(req, res){
        try{
            console.log('Callback received!')
            const data = req.body
            const payload = {
                "txn_ref":data.transaction.id,
                'airtel_money_id':data.transaction.airtel_money_id,
                'status': (data.transaction.status_code == "TS") ? 'SUCCESS' : 'FAILED'
            }
            console.log("Updating transaction status...")
            await this.txn_model.updateTransactionStatus(payload)
            console.log('Transaction %s updated!', payload.airtel_money_id)

            console.log('Fetching merchant callback...')
            let object = await this.merchant_model.GetMerchantByTxnRef(payload.txn_ref)
            console.log('Merchant details fetched!')

            console.log('Attempting to send callback...')
            this.txn_helper.PostCallback(object)
        }catch(err){
            console.log(err.message)
        }
    }

    async MobiPayTransaction(req, res){
        const data = req.body
        //console.log(data)
        try{
            
            const merchantReference = await TransactionHelper.generateTransactionId()
            const payload = {
                merchantId:process.env.MOBIPAY_MERCHANT_CODE,
                amount:data.amount,
                paymentOptionId:data.walletProvider,
                customerPhone: "0"+data.msisdn.substring(data.msisdn.length - 9),
                currency:"MWK",
                merchantReference,
            }
            res.json({
                'status':'success',
                'message':"Transaction initatiated!"
            })
            console.log(payload)
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            }
            console.log('Pushing Transaction...')
            let response = await fetch(process.env.MOBIPAY_URL,options )
            if(response.status == 200){
                response = await response.json()
                console.log(response)
                const payload = {
                    'txn_ref':data.txn_ref,
                    'status':'SUCCESS',
                }
                await this.PostCallback(payload)   
            }else{
                let hourlyCount = 0;
                let intervalFunc = setInterval( async()=>{
                    if(hourlyCount < 24){
                        try{ 
                            const payload = {
                                'txn_ref':data.txn_ref,
                                'status':'FAILED',
                            }
                            await this.PostCallback(payload)
                            clearInterval(intervalFunc)
                        }catch(err){
                            console.log(err)
                        }
                    }else{
                        clearInterval(intervalFunc)
                    }
                    hourlyCount++
                },1800000)
                
            }
        }catch(err){
            console.log(err)
            console.log("Error Name: %s\nError: %s",err.name, err.message)
            const payload = {
                'txn_ref':data.txn_ref,
                'status':'FAILED',
            }
            await this.PostCallback(payload)
        }
    }

    PostCallback(data){
       return new Promise((resolve, reject)=>{
            const options = {
                method:"POST",
                headers:{
                    'Content-Type':'application/json'
                },
                body:JSON.stringify(data)
            }
            fetch('http://localhost/milatho-lite/app/transactions/ipn.php', options)
            .then(response=>{
                if(response.status == 200){
                    console.log(response.json())
                    console.log('Callback sent succesfully!')
                    //Clear Interval loop
                    resolve('OK')
                }else{
                    console.log('Callback failed to post!\n\nRetrying in 1 hour...') 
                    reject('ERROR')
                }
            }).catch(err=>{
                console.log(err.message)
                console.log('Callback failed to post!\n\nRetrying in 1 hour...') 
                reject('ERROR')

            })    
          
       })
    }

   
}