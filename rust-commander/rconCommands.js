module.exports = (rcon) => {

  return {
    getUserCount() {
      return rcon.sendCommand('status').then((result) => {
        let players = result.match(/players : ([0-9]+) \(([0-9]+) max\) \(([0-9]+) queued\) \(([0-9]+) joining\)/)
        return {
          online: players[1],
          max: players[2],
          queue: players[3],
          joining: players[4]
        }
      })
    },
    getWorldSize() {
      return rcon.sendCommand('worldsize').then((result) => {
        let worldsize = result.match(/^server.worldsize: "([0-9]+)"/)
        return worldsize[1]
      })
    },
    getSeed() {
      return rcon.sendCommand('seed').then((result) => {
        let seed = result.match(/^server.seed: "(.+)"/)
        return seed[1]
      });
    },
    setHostname(hostname) {
      return rcon.sendCommand(`server.hostname "${hostname}"`);
    },
    setDescription(description) {
      return rcon.sendCommand(`server.description "${description}"`);
    }
  }

}
