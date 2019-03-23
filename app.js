var express = require('express')
var logger = require('morgan')
var flat = require("flat")
const { unflatten } = flat
var app = express();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const data = {}
const dig = (pieces, object) => {
  return pieces.reduce((ref, property) => {
    try {
      if (property in ref) {
        return ref[property]
      }
    }
    catch(e) {
      throw new ReferenceError("BAD_REQUEST")
    }
    throw new ReferenceError("NOT_FOUND")
  }, object)
}


app.get("/data*.json", function(req, res) {
  const { originalUrl } = req
  const pieces = originalUrl.match(/\/(?:[^\/\.]+)/g)
  try {
    res.type('application/json');
    res.send(dig(pieces.slice(1).map(piece => piece.slice(1)), unflatten(data)))
  }
  catch(e) {
    if (e.message === "NOT_FOUND") {
      return res.status(404).send()
    }
    if (e.message === "BAD_REQUEST") {
    return res.status(400).send()
    }
    res.status(500).send(e.message)
  }
})

app.post("/data*.json", function(req, res) {
  const { originalUrl, body } = req
  const pieces = originalUrl.match(/\/(?:[^\/\.]+)/g).slice(1).map(piece => piece.slice(1))
  
  const params = pieces.reverse().reduce((final, current) => ({ [current]: final }), body)
  res.type("application/json")
  Object.assign(data, flat(params))
  console.log(data)
  res.send(body)
})

module.exports = app;
