const { Query, Value, Values, Collection } = require("@stargate-oss/stargate-grpc-node-client");
const amazonAsin = require('amazon-asin')

const subscribe = async (client, email, product) => {
    try {
        const existingRecordQuery = new Query()
        existingRecordQuery.setCql("SELECT product FROM amzn_price_tracker.subscription WHERE email = ? LIMIT 1")
        
        const emailValue = new Value()
        emailValue.setString(email)
        const queryValues = new Values()
        queryValues.setValuesList([emailValue])
        existingRecordQuery.setValues(queryValues)

        const existingRecords = await client.executeQuery(existingRecordQuery)
        const resultSet = existingRecords.getResultSet()
        const firstRow = resultSet.getRowsList()[0]

        const productUrlValue = new Value()
        productUrlValue.setString(product)
        const collection = new Collection()
        collection.addElements(productUrlValue)
        const productUrlListValue = new Value()
        productUrlListValue.setCollection(collection)

        if(!firstRow) {
            const newRecordQuery = new Query()
            newRecordQuery.setCql("INSERT INTO amzn_price_tracker.subscription (email, product) VALUES(?, ?)")
            
            const insertQueryValues = new Values()
            insertQueryValues.setValuesList([emailValue, productUrlListValue])
            newRecordQuery.setValues(insertQueryValues)
            
            await client.executeQuery(newRecordQuery)
        } else {
            const [ products ] = firstRow.getValuesList();
            const elementsInProducts = (products.getCollection()).getElementsList().length;
            
            // fail if max capacity reached
            if(elementsInProducts == 5) {
                return "max_capacity"
            }

            const updateRecordQuery = new Query()
            updateRecordQuery.setCql("UPDATE amzn_price_tracker.subscription SET product = product + ? WHERE email = ?")

            const updateQueryValues = new Values()
            updateQueryValues.setValuesList([productUrlListValue, emailValue])
            updateRecordQuery.setValues(updateQueryValues)
            
            await client.executeQuery(updateRecordQuery)
        }
        
        const resultQuery = new Query()
        resultQuery.setCql("SELECT * FROM amzn_price_tracker.subscription WHERE email = ?")
        resultQuery.setValues(queryValues)
        const response = await client.executeQuery(resultQuery)
        
        const responseSet = response.getResultSet()
        const insertedRow = responseSet.getRowsList()[0]
        const [ res_email, res_products] = insertedRow.getValuesList()
        console.log(res_email + " - " + res_products)
    } catch(e) {
        console.log("subscription request failed!", e)
        return "error" 
    }
}

const unsubscribe = async (client, email) => {
    try {
        const deleteQuery = new Query()
        
        deleteQuery.setCql("DELETE FROM amzn_price_tracker.subscription where email = ?")
        
        const emailValue = new Value()
        emailValue.setString(email)
        const queryValues = new Values()
        queryValues.setValuesList([emailValue])
        deleteQuery.setValues(queryValues)

        await client.executeQuery(deleteQuery)
    } catch(e) {
        console.log("unsubscribe request failed!", e)
        return "error"
    }
}

const unsubscribeAll = async (client) => {
    try {
        const truncateQuery = new Query()
        truncateQuery.setCql("TRUNCATE amzn_price_tracker.subscription")
        await client.executeQuery(truncateQuery)
    } catch(e) {
        console.log("truncate request failed!", e)
        return "error" 
    }
}

const isValidProductUrl = (productUrl) => {
    const product = amazonAsin.syncParseAsin(productUrl)
    if(product.ASIN === undefined) {
        return false
    }
    return true
}

module.exports = { subscribe, unsubscribe, unsubscribeAll, isValidProductUrl }