class PluginDataManager {

  constructor(data) {

    this.data = data;
  }

  getData (prop) {
    return this.data[prop];
  }

  setData (prop, value) {
    this.data[prop] = value;
  }
}

module.exports = PluginDataManager;