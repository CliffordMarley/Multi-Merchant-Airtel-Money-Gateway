
const {pool} = require('../Config/Database')

module.exports = class{

    async getMerchantByKey(api_key){
        return new Promise((resolve, reject)=>{
            pool.getConnection((err, connection)=>{
                if(err){
                    reject(err)
                }else{
                    connection.query(`SELECT * FROM merchants WHERE api_key = '${api_key}'`, (err, rows)=>{
                        connection.release()
                        if(err){
                            reject(err)
                        }else{
                            if(rows.length > 0){
                                resolve(rows[0])
                            }else{
                                reject({message:'Merchant not found!', statusCode:404})
                            }
                        }
                    })
                }
            })
        })
    }

    async GetMerchantByTxnRef(txn_ref){
        return new Promise((resolve, reject)=>{
            pool.getConnection((err, connection)=>{
                if(err){
                    reject(err)
                }else{
                    const SQL = `SELECT callback_url,partner_reference, airtel_reference, status 
                    FROM merchants m JOIN transactions t ON t.merchant = m.id WHERE t.txn_reference = ?`
                    
                    connection.query(SQL,[txn_ref], (err, rows)=>{
                        connection.release()
                        if(err){
                            reject(err)
                        }else{
                            if(rows.length > 0){
                                resolve(rows[0])
                            }else{
                                reject({message:'Merchant not found!', statusCode:404})
                            }
                        }
                    })
                }
            })
        })
    }
}