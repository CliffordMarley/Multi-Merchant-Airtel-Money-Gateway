const {pool} = require('../Config/Database')

module.exports = class{

    async LogTransactionRecord(data){
        return new Promise((resolve, reject)=>{
            pool.getConnection((err, connection)=>{
                if(err){
                    reject(err)
                }else{
                    const SQL = `INSERT INTO transactions(txn_reference, partner_reference,
                        description, merchant, amount) VALUES(?,?,?,?,?)`
                    const Params = [data.txn_reference, data.partner_reference, 
                        data.description, data.merchant, data.amount]
                    connection.query(SQL, Params, (err, results)=>{
                        connection.release()
                        if(err){
                            reject(err)
                        }else{
                            resolve('Transaction registerred successfully!')
                        }
                    })
                }
            })
        })
    }

    //Create function to check if txn_reference already exist
    static async CheckTransactionExist(txn_reference){
        return new Promise((resolve, reject)=>{
            pool.getConnection((err, connection)=>{
                if(err){
                    reject(err)
                }else{
                    const SQL = `SELECT * FROM transactions WHERE txn_reference = ?`
                    connection.query(SQL, txn_reference, (err, results)=>{
                        connection.release()
                        if(err){
                            reject(err)
                        }else{
                            if(results.length > 0){
                                resolve(results)
                            }else{
                                resolve(false)
                            }
                        }
                    })
                }
            })
        })
    }

    static async CheckPartnerRefExist(partner_reference){
        return new Promise((resolve, reject)=>{
            pool.getConnection((err, connection)=>{
                if(err){
                    reject(err)
                }else{
                    const SQL = `SELECT * FROM transactions WHERE partner_reference = ?`
                    connection.query(SQL, partner_reference, (err, results)=>{
                        connection.release()
                        if(err){
                            reject(err)
                        }else{
                            if(results.length > 0){
                                resolve(results)
                            }else{
                                resolve(false)
                            }
                        }
                    })
                }
            })
        })
    }

     async updateTransactionStatus(data){
        return new Promise((resolve, reject)=>{
            pool.getConnection((err, connection)=>{
                if(err){
                    reject(err)
                }else{
                    const SQL = `UPDATE transactions SET status = ?, airtel_reference = ? WHERE txn_reference = ?`
                    const PARAMS = [data.status, data.airtel_money_id, data.txn_ref]
                    connection.query(SQL, PARAMS, (err, results)=>{
                        connection.release()
                        if(err){
                            reject(err)
                        }else{
                            resolve('OK')
                        }
                    })
                }
            })
        })
    }

}