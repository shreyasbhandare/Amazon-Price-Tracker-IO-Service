const path = require('path')
const express = require('express')
const hbs = require('hbs')
const { Client } = require("cassandra-driver")
require('dotenv').config({ path: path.join(__dirname, '../../cred.env')})
const { subscribe, unsubscribe, unsubscribeAll } = require('../util/SubscriptionUtils.js')

const app = express()
const port = process.env.PORT || 3000

app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, '../../frontend'))
app.use(express.static(path.join(__dirname, '../../frontend')))
app.use(express.json())

const client = new Client({
    cloud: {
        secureConnectBundle: "./backend/secure-connect-amzn-price-tracker.zip",
    },
    credentials: {
      username: process.env.DATASTAX_USERNAME,
      password: process.env.DATASTAX_PASSWORD,
    },
});


app.get('/', (req, res) => {
    res.render('index')
})

app.post('/subscribe', async (req, res) => {
    const email = req.body.email
    const productUrl = req.body.productUrl

    var message = await subscribe(client, email, productUrl)

    if(message === "error") {
        res.status(500).send({
            error: "Sorry! something went wrong on our side, please try again!"
        })
    } else {
        res.status(201).send({
            confirmMessage: "You are now subscribed! Please check your emails daily."
        })
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