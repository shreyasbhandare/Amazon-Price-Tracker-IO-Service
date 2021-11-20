const subscribe = async (client, email, product) => {
    try {
        await client.connect();
    
        //await client.execute("CREATE TABLE amzn_price_tracker.subscription (email text PRIMARY KEY, product list<text>)");
        //await client.execute("drop table amzn_price_tracker.subscription");
        const existingRecordQuery = "SELECT count(*) FROM amzn_price_tracker.subscription WHERE email = ? LIMIT 1"
        const params = [ email ]
        const existingRecords = await client.execute(existingRecordQuery, params, {prepare: true})

        if(existingRecords.rows[0].count.low == 0) {
            const newRecordQuery = "INSERT INTO amzn_price_tracker.subscription (email, product) VALUES(?, ?)"
            const newParms = [email, [ product ]]
            await client.execute(newRecordQuery, newParms, {prepare: true})
        } else {
            const updateRecordQuery = "UPDATE amzn_price_tracker.subscription SET product = product + ? WHERE email = ?"
            const updateParams = [[ product ], email]
            await client.execute(updateRecordQuery, updateParams, {prepare: true})
        }

        const resultQuery = "SELECT * FROM amzn_price_tracker.subscription WHERE email = ?"
        const result = await client.execute(resultQuery, params, { prepare : true })
        console.log(`Your cluster returned ${result.rows[0].email} - ${result.rows[0].product}`)

        //await client.shutdown();
    } catch(e) {
        console.log("subscription request failed!", e)
        return "error" 
    }
}

const unsubscribe = async (client, email) => {
    try {
        await client.connect();
        const deleteQuery = "DELETE FROM amzn_price_tracker.subscription where email = ?"
        const params = [ email ]
        await client.execute(deleteQuery, params, { prepare : true })
    } catch(e) {
        console.log("unsubscribe request failed!", e)
        return "error"
    }
}

const unsubscribeAll = async (client) => {
    try {
        await client.connect();
        const truncateQuery = "TRUNCATE amzn_price_tracker.subscription"
        await client.execute(truncateQuery)
    } catch(e) {
        console.log("truncate request failed!", e)
        return "error" 
    }
}

module.exports = { subscribe, unsubscribe, unsubscribeAll }