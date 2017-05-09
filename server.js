const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
    console.log('I am ready!');
});

let myId = '311163859580747778';
let ingores = [
    myId
];

function pick(arr) {
    return arr[Math.floor(arr.length * Math.random())];
}

function reply(message) {
    let c = message.content;
    let lc = c.toLowerCase().trim();
    
    if (lc === 'нет') {
        return 'крипера ответ.';
    }
    if (lc === 'неа') {
        return 'крипера отвеа.';
    }
    if (let m = c.match(/(Dragon2488|Archengius)/)) {
        return '`' + m[0] + '` is deprecated. Use `AntiquiAvium` instead.';
    }
    if (lc.match(/как так[?!]*$/)) {
        return pick([
            'ну вот как-то так.',
            'как-то так, да вот как бы не так.',
            'вот как-то так-то так вот.',
            'как-то так, да никак-то никак.',
            'так-то так, да как-то так как никак.'
        ]);
    }
}

client.on('message', message => {
    try {
        if (message.author.id in ignores) {
            return;
        }

        if (message.mentions.users.has(myId)) {
            message.react('wave');
        }

        let reply = checkReply(message);

        if (reply) {
            message.reply(reply);
        }

    } catch(e) {
        message.reply(e.name + ': ' + e.message);
    }
});

client.login('MzExMTYzODU5NTgwNzQ3Nzc4.C_Ijtg.32OP4QU9LYx2MKiJUhYy0RIZPmE');
