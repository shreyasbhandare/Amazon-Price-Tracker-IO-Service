const path = require('path')
const express = require('express')
const hbs = require('hbs')
const grpc = require('@grpc/grpc-js')
const { StargateClient, StargateBearerToken, promisifyStargateClient } = require('@stargate-oss/stargate-grpc-node-client')
require('dotenv').config({ path: path.join(__dirname, '../../cred.env')})
const { subscribe, unsubscribe, unsubscribeAll, isValidProductUrl } = require('../util/SubscriptionUtils.js')

const app = express()
const port = process.env.PORT || 3000

app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, '../../frontend'))
app.use(express.static(path.join(__dirname, '../../frontend')))
app.use(express.json())

const connectToDb = () => {
    const astra_uri = process.env.ASTRA_URI
    const bearer_token = process.env.BEARER_TOKEN
    const bearerToken = new StargateBearerToken(bearer_token)
    const credentials = grpc.credentials.combineChannelCredentials(grpc.credentials.createSsl(), bearerToken)
    const stargateClient = new StargateClient(astra_uri, credentials)
    console.log("made client");
    const promisifiedClient = promisifyStargateClient(stargateClient)
    console.log("promisified client")
    return promisifiedClient
}

const client = connectToDb()

app.get('/', (req, res) => {
    res.render('index')
})

app.post('/subscribe', async (req, res) => {
    const email = req.body.email
    const productUrl = req.body.productUrl

    if(!isValidProductUrl(productUrl)) {
        res.status(400).send({
            error: "Please enter correct product URL!"
        })
    } else {
        var message = await subscribe(client, email, productUrl)

        if(message === "error") {
            res.status(500).send({
                error: "Sorry! something went wrong on our side, please try again!"
            })
        } else if(message === "max_capacity") {
            res.status(400).send({
                error: "Sorry! you are already subscribed to 5 products"
            })
        } else {
            res.status(201).send({
                confirmMessage: "You are now subscribed! Please check your emails daily."
            })
        }
    } 
})

app.post('/unsubscribe', async (req, res) => {
    const email = req.query.email

    var message = await unsubscribe(client, email)

    if(message === "error") {
        res.render('unsubscribe_page', {
            message: "Sorry! something went wrong!"
        })
    } else {
        res.render('unsubscribe_page', {
            message: "Unsubscribed : " + email
        })
    }
})

app.post('/unsubscribeAll', async (req, res) => {
    var message = await unsubscribeAll(client)

    if(message === "error") {
        res.status(500).send({
            message: "Sorry! something went wrong!"
        })
    } else {
        res.status(200).send({
            message: "Unsubscribed everyone!"
        })
    }
})

app.get('*', (req, res) => {
    res.render('404', {
        title: '404',
        errorMessage: 'Page not found.'
    })
})

app.listen(port, () => {
    console.log("Server is up on port : " + port)
})