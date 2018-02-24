const config = require('./config.json');
const dota = require('./dota.js');
const Discord = require('discord.js');
const client = new Discord.Client();

const thresholds = {
    gpm: 600,
    xpm: 675,
    kills: 15,
    assists: 23,
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

                for(player of details.players) {
                    playerList.push(`${player.name} (${player.hero})`);

                    var stats = [];
                    for(stat in player.stats) {
                        if(player.stats[stat] >= thresholds[stat]) {
                            stats.push(`${player.stats[stat]} ${stat}`);
                        }
                    }

                    if(stats.length > 0 && details.mode == 22) {
                        description += `${player.name} (${player.hero}) got ${listToText(stats)}.\n`;
                    }
                }       

                var title = `${listToText(playerList)} just ${details.won ? 'won' : 'lost'} a ${details.minutes} minute${details.mode == 23 ? ' turbo' : ''} match${details.won ? '!' : '.'}`;
                var url = `https://www.opendota.com/matches/${details.id}`;

                var embed = new Discord.RichEmbed({
                    title,
                    url,
                    description,
                    color: details.won ? 6732650 : 16731212,
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
