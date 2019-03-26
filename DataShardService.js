const database = require("./database")
const { NotFoundError, InvalidPathError } = require("./errors")
const { PushId } = require("./utils")


var flat = require("flat")
const DataShard = database.model("DataShard")

function splitPath(url) {
  return url.match(/\/(?:[^\/\.]+)/g).slice(1).map(piece => piece.slice(1))
}

function convertPathAndParamsToObject(path, originalObject) {
  return path.reverse().reduce((value, key) => ({ [key]: value }), originalObject)
}

class ServerTimestamp {
  valueOf() {
    if (this._value) {
      return this._value
    }
    this._value = (new Date()).toISOString()
    return this._value
  }
}

class DataShardService {

  constructor(location) {
    this.location = location
    this.bulkWrites = []
  }

  stageDeleteMany(path) {
    /* Do validations here */
    this.bulkWrites.push({
      deleteMany: {
        filter: {
          path
        }
      }
    })
  }

  validatePathValue(path, value) {
    if (/(?:\[]|{})/.test(JSON.stringify(value))) {
      return null
    }
    if (/\.{2,}/.test(path)) {
      if (/\.\.sv$/.test(path) && value === "timestamp") {
        return {
          path: path.replace(/\.\.sv$/, ""),
          value: new ServerTimestamp()
        }
      }
      throw new InvalidPathError()
    }
    return { path, value }
    /* Do validations here */
  }

  stageWrites(data) {
    Object.entries(flat(data)).forEach(([path, value]) => {
      const document = this.validatePathValue(path, value)
      if (document) {
        this.bulkWrites.push({
          insertOne: { document }
        })
      }
    })
  }

  stageWrite(data) {
    Object.entries(flat(data)).forEach(([path, value]) => {
      const update = this.validatePathValue(path, value)
      if (update) {
        this.bulkWrites.push({
          updateOne: {
            filter: { path: update.path },
            update,
            upsert: true
          }
        })
      }
    })
  }

  async commit() {
    if (this.bulkWrites.length) {
      /* Time to handle errors */
      return await DataShard.bulkWrite(this.bulkWrites)
    }
    return true
  }

  async get() {
    const searchParts = splitPath(this.location)
    const regexSearch = `^${searchParts.length ? searchParts.join("\\.") : ".*"}(?:\\.|$)`
    const results = await DataShard.find({ path: { $regex : RegExp(regexSearch) }})

    if (!results.length) {
      throw new NotFoundError()
    }
    if (results.length === 1 && results[0].path === searchParts.join(".")) {
      return results[0].value
    } 
    const keyReplacer = `${searchParts.join(".")}.`
    const unassembled = results.reduce((final, { path, value }) =>  {
      const key = searchParts.length ? path.replace(keyReplacer, "") : path
      final[key] = value
      return final
    }, {})

    return flat.unflatten(unassembled, { object: true })
  }

  async put(data) {
    const pathParts = splitPath(this.location)
    this.stageDeleteMany(new RegExp(`^${pathParts.length ? pathParts.join("\\.") : ".*"}(?:\\.|$)`))
    const params = convertPathAndParamsToObject(pathParts, data)
    this.stageWrites(params)
    await this.commit()
    const results = this.bulkWrites
    if (results.length === 1 && results[0].insertOne.document.path === pathParts.join(".")) {
      return results[0].insertOne.document.value
    }
    const keyReplacer = `${pathParts.join(".")}.`
    const unassembled = results.reduce((final, { insertOne }) =>  {
      const { path, value } = insertOne.document
      const key = pathParts.length ? path.replace(keyReplacer, "") : path
      final[key] = value
      return final
    }, {})
    return flat.unflatten(unassembled, { object: true })
  }

  async push(data) {
    const pathParts = splitPath(this.location)
    const name = new PushId().toString()
    const dataAtLocation = { [name]: data }
    const dataToWrite = convertPathAndParamsToObject(pathParts, dataAtLocation)
    this.stageWrites(dataToWrite)
    await this.commit()
    return { name }
  }

  async patch(data) {
    const pathParts = splitPath(this.location)
    const dataToWrite = convertPathAndParamsToObject(pathParts, data)
    this.stageWrite(dataToWrite)
    await this.commit()
    const results = this.bulkWrites
    if (results.length === 1 && results[0].updateOne.update.path === pathParts.join(".")) {
      return results[0].updateOne.update.value
    }
    const keyReplacer = `${pathParts.join(".")}.`
    const unassembled = results.reduce((final, { updateOne }) =>  {
      const { path, value } = updateOne.update
      const key = pathParts.length ? path.replace(keyReplacer, "") : path
      final[key] = value
      return final
    }, {})
    return flat.unflatten(unassembled, { object: true })
  }

  async delete() {
    const pathParts = splitPath(this.location)
    this.stageDeleteMany(new RegExp(`^${pathParts.length ? pathParts.join("\\.") : ".*"}(?:\\.|$)`))
    await this.commit()
  }
}

module.exports = DataShardService