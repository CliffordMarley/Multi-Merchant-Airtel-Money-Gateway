let notEmpty = (field)=>{
    if(field && field != null && field != "" && field != typeof undefined){
        return true
    }
    return false
}

module.exports = {notEmpty}