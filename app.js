var express = require("express")
var logger = require("morgan")
const database = require("./database")

var flat = require("flat")
const { unflatten } = flat
var app = express()
app.use(logger("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

const DataShard = database.model("DataShard")

function splitUrl(url) {
  return url.match(/\/(?:[^\/\.]+)/g).slice(1).map(piece => piece.slice(1))
}

function convertPathAndParamsToObject(path, originalObject) {
  return path.reverse().reduce((value, key) => ({ [key]: value }), originalObject)
}

app.get("/data*.json", function(req, res) {
  const { originalUrl } = req
  const searchParts = splitUrl(originalUrl)
  const regexSearch = `^${searchParts.length ? searchParts.join("\\.") : ".*"}(?:\\.|$)`
  const keyReplacer = searchParts.join(".") + "."
  DataShard.find({ path: { $regex : RegExp(regexSearch) }}).then(results => {
    if (!results.length) {
      return res.status(404).send()
    }
    if (results.length === 1) {
      return res.json(results[0].value)
    }
    const unassembled = results.reduce((final, { path, value }) =>  {
      const key = searchParts.length ? path.replace(keyReplacer, "") : path
      final[key] = value
      return final
    }, {})
    res.json(flat.unflatten(unassembled))
  })
})

app.put("/data*.json", function(req, res) {
  const { originalUrl, body } = req
  const pieces = splitUrl(originalUrl)
  const params = convertPathAndParamsToObject(pieces, body)
  const flattened = flat(params)
  const entries = Object.entries(flattened)
    .filter(([key, value]) => !JSON.stringify(value).match(/(?:\[]|{})/))
    .map(([path, value]) => ({
      updateOne: {
        filter: { path },
        update: { path, value },
        upsert: true
      }
    }))
  DataShard.bulkWrite(entries)
    .then(result => res.json(result))
    .catch(err => res.json(err))
})

module.exports = app;
