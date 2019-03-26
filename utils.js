exports.catchThis = async function(operation) {
  let err, val
  try { val = await operation }
  catch(e) { err = e }
  return [err, val]
}

class PushId {
  /* Thanks https://gist.github.com/mikelehen/3596a30bd69384624c11 */
  constructor() {
    let now = new Date().getTime()
    const duplicateTime = (now === PushId.lastPushTime)
    PushId.lastPushTime = now

    const timeStampChars = new Array(8)

    for (var i = 7; i >= 0; i--) {
      timeStampChars[i] = PushId.PUSH_CHARS.charAt(now % 64);
      now = Math.floor(now / 64);
    }

    if (now !== 0) {
      throw new Error("Failed to convert entire timestamp.")
    }

    this.name = timeStampChars.join("")

    if (!duplicateTime) {
      for (i = 0; i < 12; i++) {
        PushId.lastRandChars[i] = Math.floor(Math.random() * 64)
      }
    }
    else {
      for (i = 11; i >= 0 && PushId.lastRandChars[i] === 63; i--) {
        PushId.lastRandChars[i] = 0
      }
      PushId.lastRandChars[i]++
    }

    for (i = 0; i < 12; i++) {
      this.name += PushId.PUSH_CHARS.charAt(PushId.lastRandChars[i]);
    }

    if (this.name.length != 20) {
      throw new Error("Length should be 20.")
    }
  }

  toString() {
    return this.name
  }
}
PushId.PUSH_CHARS = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz"
PushId.lastPushTime = 0
PushId.lastRandChars = []
exports.PushId = PushId
