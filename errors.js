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
