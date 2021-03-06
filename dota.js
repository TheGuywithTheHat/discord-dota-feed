const fs = require('fs');
const config = require('./config.json');
const dotaAPI = require('dota2-api').create(config.steam_key);
const lastMatchName = './lastmatch.txt';

var heroes = {};
var last; // last match parsed

try {
    setLast(fs.readFileSync(lastMatchName));
} catch(ex) {
    getLatestNumber().then(setLast);
}

dotaAPI.getHeroes({ language: 'english' }).then((heroList) => {
    for(hero of heroList.result.heroes) {
        heroes[hero.id] = hero.localized_name;
    }
});

function setLast(latest) {
    if(typeof latest == 'string') {
        latest = parseInt(latest)
    }
    last = latest;
    fs.writeFileSync(lastMatchName, '' + latest);
}

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
    return new Promise((resolve) => {
        var max = 0;
        getHistories().then((histories) => {
            for(var matchList of histories) {
                for(var match of matchList.result.matches) {
                    //console.log(match.match_id + ": " + typeof match.match_id);
                    max = Math.max(max, match.match_id);
                }
            }
            resolve(max);
        }).catch((err) => {
            console.log(err);
        });
    });
}

function getLatestMatches() {
    return new Promise((resolve) => {
        matches = {};
        ids = [];
        getHistories().then((histories) => {
            if(!last) {
                throw 'last parsed not yet found';
            }
            //console.log("found histories: " + histories.length);
            for(var matchList of histories) {
                for(var match of matchList.result.matches) {
                    var id = match.match_id;
                    if(id > last && !(id in matches)) {
                        console.log("adding " + id);
                        matches[id] = match;
                        ids.push(id);
                    }
                }
            }

            if(ids.length > 0) {
                ids.sort((a, b) => { return a - b });
                //console.log("sorted: " + ids);
                if(last != ids[ids.length - 1]) {
                    console.log("New latest: " + ids[ids.length - 1]);
                }
                setLast(ids[ids.length - 1]);

                for(var i = 0; i < ids.length; i++) {
                    ids[i] = matches[ids[i]];
                }
            }

            resolve(ids);
        }).catch((err) => {
            console.log(err);
        });
    });
}

function getMatchInfo(id) {
    id = id + '';
    return new Promise((resolve) => {
        dotaAPI.getMatchDetails({ match_id: id }).then((deets) => {
            deets = deets.result;
            var details = {
                players: [],
                id: deets.match_id,
                minutes: Math.floor(deets.duration / 60),
                mode: deets.game_mode,
                type: deets.lobby_type,
            };

            for(player of deets.players) {
                var playerName = config.players[player.account_id] || config.friends[player.account_id]
                if(playerName !== undefined) {
                    var p = {};
                    p.name = playerName;
                    p.hero = heroes[player.hero_id];

                    p.stats = {};
                    p.stats.gpm = player.gold_per_min;
                    p.stats.xpm = player.xp_per_min;
                    p.stats.kills = player.kills;
                    p.stats.assists = player.assists;
                    p.stats.deaths = player.deaths;

                    details.players.push(p);
                    details.won = player.player_slot > 127 != deets.radiant_win;

                    if(deets.game_mode === 19) {
                        details.won = player.custom_game.winner;
                    }
                }
            }

            resolve(details);
        });
    });
}

module.exports = {
    getLatestMatches,
    getMatchInfo,
};
