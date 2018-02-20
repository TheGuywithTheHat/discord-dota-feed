const config = require('./config.json');

const dotaAPI = require('dota2-api').create(config.steam_key);

function getHistories() {
    players = [];
    for(var player in config.players) {
        players.push(player);
    }
    return Promise.all(players.map((k) => getHistory(k)))
}

function getHistory(id) {
    return dotaAPI.getMatchHistory({ account_id: id });
}

function getLatestNumber() {
    var max = 0;
    getHistories().then((histories) => {
        for(var matchList of histories) {
            for(var match of matchList.matches) {
                console.log(match.match_id);
            }
        }
    });
}

module.exports = {
    getLatestNumber
};

getLatestNumber();
