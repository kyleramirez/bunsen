const database = require("./database")
const { RulesNotPresentError, RulesNotJSONError } = require("./errors")

var flat = require("flat")
const Rule = database.model("Rule")

function extractFromPosition(raw, position) {
  const positionInt = parseInt(position)
  const matcher = /(\n)/g
  const beforeRule = raw.slice(0, positionInt)
  const beforeRuleMatch = beforeRule.match(matcher)
  const linesBeforeRule = beforeRuleMatch ? beforeRuleMatch.length : 0
  let lastLinePosition = 0
  let matchArr = null
  while (matchArr = matcher.exec(beforeRule)) {
    lastLinePosition = matchArr.index + 1
  }
  return { line: linesBeforeRule + 1, column: (positionInt - lastLinePosition) + 1 }
}

class RuleService {
  async put(data) {
    if (!("original" in data)) {
      throw new RulesNotPresentError()
    }
    try {
      Function("rules","JSON.parse(`${rules}`)")(data.original)
    }
    catch (e) {
      if (/at position (\d+)$/.test(e.message)) {
        const [, position ] = e.message.match(/at position (\d+)$/)
        throw new RulesNotJSONError(extractFromPosition(data.original, position))
      }
      throw e
    }
    const matcher = /:([^"tfn]*)/g
    const rulePositions = []
    const rules = JSON.parse(data.original, function(key, value) {
      if (key !== "") {
        let matchesArr = matcher.exec(data.original)
        if (matchesArr) {
          let match = matchesArr[0]
          let index = matchesArr.index
          while(match.indexOf("{") !== -1) {
            matchesArr = matcher.exec(data.original)
            match = matchesArr[0]
            index = matchesArr.index
          }
          rulePositions.push(extractFromPosition(data.original, index + match.length))
        }
      }
      return value
    })
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
    let index = 0
    for (let path in dataToWrite) {
      if (dataToWrite.hasOwnProperty(path)) {
        const value = dataToWrite[path]
        const position = rulePositions[index]
        dataToWrite[path] = {
          rule: value,
          position
        }
        bulkWrites.push({
          insertOne: {
            document: { path, value, position }
          }
        })
        index++
      }
    }
    await Rule.bulkWrite(bulkWrites)
    return {
      rules: flat.unflatten(dataToWrite, { object: true, delimiter: "/" }),
      original: data.original
    }
  }

  async get() {
    const results = await Rule.find()
    let original = null
    const unassembled = results.reduce((final, { path, value: rule, position }) =>  {
      if (path === "ORIGINAL") {
        original = rule
      }
      else {
        final[path] = {
          rule,
          position
        }
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
