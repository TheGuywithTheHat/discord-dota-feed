const config = require('./config.json');
const dota = require('./dota.js');
const Discord = require('discord.js');
const client = new Discord.Client();

const threshold_defaults = {
    gpm: 600,
    xpm: 675,
    kills: 15,
    assists: 25,
    deaths: 30,
};

client.on('ready', () => {
    console.log('I am ready!');
    setInterval(check, 60000);
});

client.on('message', message => {
    if (message.content === 'ping') {
        message.reply('pong');
    }
});

function sendMessage(message) {
    //console.log('sending ' + message);
    client.channels.get(config.discord_channel).send(message);
}

function check() {
    //console.log("checking");
    dota.getLatestMatches().then((matches) => {
        //console.log("found " + matches.length + " matches");
        for(match of matches) {
            dota.getMatchInfo(match.match_id).then((details) => {
                var playerList = [];
                var description = '';

                var thresholds = Object.assign({}, threshold_defaults);
                if(details.mode == 23 || details.mode == 19) {
                    thresholds.gpm *= 2;
                    thresholds.xpm *= 2;
                }

                if(details.mode == 19) {
                    thresholds.kills /= 2;
                    thresholds.assists /= 2;
                }


                var match_type = '';

                if(details.mode === 4) {
                    match_type = "single draft";
                } else if(details.mode === 18) {
                    match_type = "ability draft";
                } else if(details.mode === 23) {
                    match_type = "turbo";
                } else if(details.type === 9) {
                    match_type = "battle cup";
                } else if(details.type === 7) {
                    match_type = "ranked";
                } else if(details.mode === 19) {
                    match_type = "Underhollow";
                } else if(details.type === 8) {
                    match_type = "1v1";
                } else if(details.type === 0) {
                    match_type = "normal";
                }

                for(player of details.players) {
                    playerList.push(`${player.name} (${player.hero})`);

                    var stats = [];
                    for(stat in player.stats) {
                        if(player.stats[stat] >= thresholds[stat]) {
                            stats.push(`${player.stats[stat]} ${stat}`);
                        }
                    }

                    if(stats.length > 0) {
                        description += `${player.name} (${player.hero}) got ${listToText(stats)}.\n`;
                    }
                }       

                var title = `${listToText(playerList)} just ${details.won ? 'won' : 'lost'} a ${details.minutes} minute ${match_type} match${details.won ? '!' : '.'}`;
                var url = `https://www.opendota.com/matches/${details.id}`;

                var embed = new Discord.RichEmbed({
                    title,
                    url,
                    description,
                    color: details.won ? 6732650 : 16731212,
                    footer: {
                        //text: `lobby_type: ${details.type}, game_mode: ${details.mode}`
                    }
                });

                sendMessage(embed);
            });
        }
    });
}


function listToText(list) {
    if(list.length == 1) {
        return `${list[0]}`;
    } else if(list.length == 2) {
        return `${list[0]} and ${list[1]}`;
    } else {
        result = '';
        for(var i = 0; i < list.length - 1; i++) {
            result += `${list[i]}, `;
        }
        result += `and ${list[list.length - 1]}`;
        return result;
    }
}

client.login(config.user_token);
