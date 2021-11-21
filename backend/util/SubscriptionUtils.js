const { Query, Value, Values, Collection } = require("@stargate-oss/stargate-grpc-node-client");

const subscribe = async (client, email, product) => {
    try {
        const existingRecordQuery = new Query()
        existingRecordQuery.setCql("SELECT count(*) FROM amzn_price_tracker.subscription WHERE email = ? LIMIT 1")
        
        const emailValue = new Value()
        emailValue.setString(email)
        const queryValues = new Values()
        queryValues.setValuesList([emailValue])
        existingRecordQuery.setValues(queryValues)

        const existingRecords = await client.executeQuery(existingRecordQuery)
        const resultSet = existingRecords.getResultSet()
        const rows = resultSet.getRowsList()

        console.log(rows[0].array[0][0][2])
        const productUrlValue = new Value()
        productUrlValue.setString(product)
        const collection = new Collection()
        collection.addElements(productUrlValue)
        const productUrlListValue = new Value()
        productUrlListValue.setCollection(collection)

        if(rows[0].array[0][0][2] == 0) {
            console.log("insert")
            const newRecordQuery = new Query()
            newRecordQuery.setCql("INSERT INTO amzn_price_tracker.subscription (email, product) VALUES(?, ?)")
            
            const insertQueryValues = new Values()
            insertQueryValues.setValuesList([emailValue, productUrlListValue])
            newRecordQuery.setValues(insertQueryValues)
            
            console.log("before insert")
            await client.executeQuery(newRecordQuery)
        } else {
            console.log("update")

            const updateRecordQuery = new Query()
            updateRecordQuery.setCql("UPDATE amzn_price_tracker.subscription SET product = product + ? WHERE email = ?")

            const updateQueryValues = new Values()
            updateQueryValues.setValuesList([productUrlListValue, emailValue])
            updateRecordQuery.setValues(updateQueryValues)
            
            console.log("before update")
            await client.executeQuery(updateRecordQuery)
        }

        const resultQuery = new Query()
        resultQuery.setCql("SELECT * FROM amzn_price_tracker.subscription WHERE email = ?")
        resultQuery.setValues(queryValues)
        const response = await client.executeQuery(resultQuery)
        
        const responseSet = response.getResultSet();
        const firstRow = responseSet.getRowsList()[0];
        const [ res_email, res_products] = firstRow.getValuesList();
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
        
        const emailValue = new Value();
        emailValue.setString(email);
        const queryValues = new Values();
        queryValues.setValuesList([emailValue]);
        deleteQuery.setValues(queryValues);

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

module.exports = { subscribe, unsubscribe, unsubscribeAll }