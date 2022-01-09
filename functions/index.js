const functions = require("firebase-functions");
const admin = require('firebase-admin')
const express = require('express')

admin.initializeApp()

const app = express()

const conversor = {
  toFirestore: (game) => ({
    title: game.title,
    price: game.price,
  }),
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options)

    return {
      title: data.title,
      price: data.price
    }
  }
}

const gamesCollection = admin.firestore().collection('games').withConverter(conversor)

const mapToEntity = (doc) => ({ id: doc.id, ...doc.data() })

app.get('/games', async (req, res) => {
  try {
    const { docs } = await gamesCollection.get()

    const games = docs.map(doc => mapToEntity(doc))

    return res.status(200).json(games)
  } catch (error) {
    functions.logger.error(error)
    return res.status(500).send(error)
  }
})

app.get('/games/:id', async (req, res) => {
  try {
    const id = req.params.id

    const doc = await gamesCollection.doc(id).get()

    functions.logger.log({ doc })

    const game = mapToEntity(doc)

    return res.status(200).json(game)
  } catch (error) {
    functions.logger.error(error)
    return res.status(500).send(error)
  }
})

app.post('/games', async (req, res) => {
  try {
    const game = req.body

    await gamesCollection.add(game)

    return res.status(200).send()
  } catch (error) {
    return res.status(500).send(error)
  }
})

app.delete('/games/:id', async (req, res) => {
  try {
    const id = req.params.id
    const doc = await gamesCollection.doc(id).get()

    if (!doc.exists) res.status(404).send('game não encontrado')

    await gamesCollection.doc(id).delete()

    return res.status(200).send()
  } catch (error) {
    functions.logger.error(error)
    return res.status(500).send(error)
  }
})

app.put('/games/:id', async (req, res) => {
  try {

    const id = req.params.id
    const game = req.body

    await gamesCollection.doc(id).update(game)

    return res.status(200).send()
  } catch (error) {
    functions.logger.error(error)
    return res.status(500).send(error)
  }
})

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

exports.helloWorld = functions.https.onRequest(app)