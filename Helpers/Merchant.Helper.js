const MerchantModel = require('../Models/Merchant.Model')
module.exports = class{

    constructor(){
        this.merchant = new MerchantModel()
    }

    async authenticateMerchant(x_api_key){
        return new Promise((resolve, reject)=>{
            if(x_api_key && x_api_key != null && x_api_key != typeof undefined){
                this.merchant.getMerchantByKey(x_api_key).then(merchant=>{
                    resolve(merchant)
                }).catch(err=>{
                    reject(err)
                })
            }else{
                reject({message:'Unauthorised API Key is required!', statusCode:401})
            }
        })
    }
}