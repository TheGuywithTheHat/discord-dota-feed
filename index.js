const config = require('config.json');

const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
    console.log('I am ready!');
});

client.on('message', message => {
    if (message.author.username == 'dp') {
        message.reply(':bad:');
    } else if (message.content === 'ping') {
        message.reply('pong');
    }
});

client.login(config.user_token);
