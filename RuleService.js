const database = require("./database")
const { RulesNotPresentError } = require("./errors")

var flat = require("flat")
const Rule = database.model("Rule")

class RuleService {
  async put(data) {
    if (!("original" in data)) {
      throw new RulesNotPresentError()
    }
    const rules = eval(`var rules = ${data.original || "{}"}; rules`)
    const bulkWrites = [
      {
        deleteMany: { filter: {} }
      },
      {
        updateOne: {
          filter: { path: "ORIGINAL" },
          update: { path: "ORIGINAL", value: data.original },
          upsert: true
        }
      }
    ]
    const dataToWrite = flat(rules, { delimiter: "/" })
    Object.entries(dataToWrite).forEach(([path, value]) => {
      bulkWrites.push({ insertOne: { document: { path, value } } })
    })
    await Rule.bulkWrite(bulkWrites)
    return {
      rules: flat.unflatten(dataToWrite, { object: true, delimiter: "/" }),
      original: data.original
    }
  }

  async get() {
    const results = await Rule.find()
    let original = null
    const unassembled = results.reduce((final, { path, value }) =>  {
      if (path === "ORIGINAL") {
        original = value
      }
      else {
        final[path] = value
      }
      return final
    }, {})
    return {
      rules: flat.unflatten(unassembled, { object: true, delimiter: "/" }),
      original
    }
  }
}

module.exports = RuleService
