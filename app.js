var express = require('express');
// var path = require('path');
// var cookieParser = require('cookie-parser');
var logger = require('morgan');

// var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');

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
    res.send(dig(pieces.map(piece => piece.slice(1)),data))
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

// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);
// app.use('/users', usersRouter);

module.exports = app;
