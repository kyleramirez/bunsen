exports.NotFoundError = class NotFoundError extends Error {
  constructor(...args) {
    super(...args)
    this.httpStatus = 404
  }

  toJSON() {
    return { message: "Not found." }
  }
}

exports.InvalidPathError = class InvalidPathError extends Error {
  constructor(...args) {
    super(...args)
    this.httpStatus = 400
  }

  toJSON() {
    return { message: "Cannot write invalid object path." }
  }
}

exports.RulesNotPresentError = class RulesNotPresentError extends Error {
  constructor(...args) {
    super(...args)
    this.httpStatus = 422
  }

  toJSON() {
    return {
      message: 'Rules are required. Rules must be sent in JSON. Example: \'{"original":"{\\".read\\":true}"}\''
    }
  }
}

exports.RulesNotJSONError = class RulesNotJSONError extends Error {
  constructor(position) {
    super()
    this.httpStatus = 422
    this.position = position
  }

  toJSON() {
    return {
      position: this.position,
      message: 'Rules need to be in JSON format.'
    }
  }
}
