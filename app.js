const express = require("express")
const logger = require("morgan")
const DataShardService = require("./DataShardService")
const { catchThis } = require("./utils")

const app = express()
app.use(logger("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.get("/data*.json", async function(req, res) {
  const { originalUrl } = req
  const [err, data] = await catchThis(new DataShardService(originalUrl).get())
  if (err && err.httpStatus) {
    return res.status(err.httpStatus).send(err)
  }
  res.json(data)
})

app.post("/data*.json", async function(req, res) {
  const { originalUrl, body } = req
  const [err, data] = await catchThis(new DataShardService(originalUrl).push(body))
  if (err && err.httpStatus) {
    return res.status(err.httpStatus).send(err)
  }
  res.status(201).json(data)
})

app.put("/data*.json", async function(req, res) {
  const { originalUrl, body } = req
  const [err, data] = await catchThis(new DataShardService(originalUrl).put(body))
  if (err && err.httpStatus) {
    return res.status(err.httpStatus).send(err)
  }
  res.status(202).json(data)
})

app.patch("/data*.json", async function(req, res) {
  const { originalUrl, body } = req
  const [err, data] = await catchThis(new DataShardService(originalUrl).patch(body))
  if (err && err.httpStatus) {
    return res.status(err.httpStatus).send(err)
  }
  res.status(202).json(data)
})

app.delete("/data*.json", async function(req, res) {
  const { originalUrl } = req
  const [err] = await catchThis(new DataShardService(originalUrl).delete())
  if (err && err.httpStatus) {
    return res.status(err.httpStatus).send(err)
  }
  res.status(204).send()
})

module.exports = app;
