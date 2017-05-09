const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
    console.log('I am ready!');
});

client.on('message', message => {
    if (message.content === 'Test the bot.') {
    try {
        var text = JSON.stringify(message);
    } catch(e) {
        var text = e.name + ': ' + e.message;
    }
    message.reply('<@' + message.author.id + '>, your message:\n```' + text + '```');
    }
});

client.login('MzExMTYzODU5NTgwNzQ3Nzc4.C_Ijtg.32OP4QU9LYx2MKiJUhYy0RIZPmE');
