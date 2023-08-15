const data = {};
export default class temporaryStorage {
  constructor() {
    this._data = {};
  }

  add(key, value) {
    this._data[key] = value;
  }

  get(key) {
    const result = this._data[key];
    return result;
  }

  has(key) {
    const result = this._data.hasOwnProperty(key);
    return result;
  }

  del(key) {
    this._data[key] = undefined;
  }
}
