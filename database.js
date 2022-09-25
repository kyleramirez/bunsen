const mongoose = require("mongoose")
const connection = mongoose.connect(
  "mongodb://localhost/bunsendev",
  {
    useNewUrlParser: true,
    useCreateIndex: true,
  }
);

mongoose.model("DataShard", new mongoose.Schema({
  path: { type: String, unique: true },
  value: {}
}), "data_shards")

mongoose.model("Rule", new mongoose.Schema({
  path: { type: String, unique: true },
  value: {},
  position: {}
}))

module.exports = mongoose
