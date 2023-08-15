import { Transform } from "stream";

export class EncryptTransform extends Transform {
  constructor(option) {
    super(option);
  }

  _transform(buf, encoding, next) {
    this.push(buf, "binary");
    process.nextTick(next);
  }

  _flush(next) {
    this.push(null);
    process.nextTick(next);
  }
}

export class DecryptTransform extends Transform {
  constructor(option) {
    super(option);
  }

  _transform(buf, encoding, next) {
    this.push(buf, "hex");
    process.nextTick(next);
  }

  _flush(next) {
    this.push(null);
    process.nextTick(next);
  }
}
