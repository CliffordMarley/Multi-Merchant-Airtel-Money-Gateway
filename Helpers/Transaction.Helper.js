const fetch = require('node-fetch')
const TransactionModel = require('../Models/Transaction.Model')

module.exports = class{

    static async generateTransactionId(){
        //Generate new 14 character TransactionId with prefix of 'TXN'
        return new Promise((resolve, reject)=>{
                        
            let txn_id = 'TXN' + Math.floor(Math.random() * 100000000)
            //Check if transaction id already exist
            TransactionModel.CheckTransactionExist(txn_id).then(async(result)=>{
                if(result){
                    //Generate new TransactionId
                    await this.generateTransactionId().then((result)=>{
                        resolve(result)
                    })
                }else{
                    resolve(txn_id)
                }
            })
        })        
    }

    //Validate if Partner reference already exist in Transaction
    async isPartnerRefUnique(partner_reference){
        return new Promise((resolve, reject)=>{
            TransactionModel.CheckPartnerRefExist(partner_reference).then((result)=>{
                if(result){
                    resolve(false)
                }else{
                    resolve(true)
                }
            })
        })
    }

    async initiateTransaction(data){
        return new Promise(async (resolve, reject)=>{
            try{
                const payload = {
                    "reference": data.description,
                    "subscriber": {
                        "country": "MW",
                        "currency": "MWK",
                        "msisdn": this.normalizeNumber(data.msisdn)
                    },
                    "transaction": {
                        "amount": parseFloat(data.amount),
                        "country": "MW",
                        "currency": "MWK",
                        "id": data.txn_reference
                    }
                }
                
                const access_token = await this.authorizeTransaction()
                
                const options = {
                    method:"POST",
                    headers:{
                        'Content-Type':'application/json',
                        'Accept':'*/*',
                        'X-Country':'MW',
                        'X-Currency':'MWK',
                        'Authorization':"Bearer "+access_token	
                    },
                    body:JSON.stringify(payload)
                }
                console.log(options)
                let response = await fetch(process.env.AIRTEL_PUSH_URL, options)
                
                if(response.status == 200){
                    response = await response.json()
                    
                    if(response.status.success){
                        resolve("Transaction Initiated Successfully!")
                    }else{
                        reject({message:response.status.message})
                    }
                }else{
                    let error = await response.json()
                    reject(error)
                }
            }catch(err){
                reject(err)
            }
        })
    }

    async authorizeTransaction(){
       
        return new Promise(async (resolve, reject)=>{
            
            const options = {
                method:"POST",
                headers:{
                    'Content-Type':'application/json',
                    'Accept':'*/*'
                },
                body:JSON.stringify({
                    "client_id": process.env.CLIENT_ID,
                    "client_secret": process.env.CLIENT_SECRET,
                    "grant_type": "client_credentials"
                })
            }
            let response = await fetch(process.env.AIRTEL_AUTH_URL, options)
            if(response.status == 200){
                response = await response.json()
                console.log(response)
                if(response.access_token && response.access_token != null){
                    resolve(response.access_token)
                }else{
                    reject({message:'Invalid Access Token', statusCode:400})	
                }
            }else{
                reject({message:response.statusText, statusCode:response.status})
            }
        })
    }

    async PostCallback(data){
        try{
            const bodyObject = {
                'id':data.partner_reference,
                'airtel_txn_id':data.airtel_reference,
                'status':data.status
            }

            const options = {
                method:"POST",
                headers:{
                    'Content-Type':"application/json"
                },
                body:JSON.stringify(bodyObject)
            }

            let response = await fetch(data.callback_url, options)
            if(response.ok){
                console.log('Callback Forwarded to merchant!')
            }else{
                console.log(response.statusText)
                console.log('Failed to send callback!')
            }
        }catch(err){
            console.log(err.message)
        }
    }
    
    normalizeNumber(msisdn){
        console.log(msisdn)
        //Return last 9 digits of the number 
        return msisdn.substring(msisdn.length - 9)
    }

}