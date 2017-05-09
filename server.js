const Discord = require('discord.js');
const client = new Discord.Client();

const vm = require('vm');


client.on('ready', () => {
    console.log('I am ready!');
});

let myId = '311163859580747778';
let ignores = [
    myId
];
let wrecked = false;

function pick(arr) {
    return arr[Math.floor(arr.length * Math.random())];
}

function checkReply(message) {
    let c = message.content;
    let lc = c.toLowerCase().trim();
	let m = null;
    
    if (lc === 'нет') {
        return 'крипера ответ.';
    }
    if (lc === 'неа') {
        return 'крипера отвеа.';
    }
	
	m = c.match(/(Dragon2488|Archengius)/);
    if (m) {
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
	
	m = lc.match(/[ ()0-9.*\/+-]*[0-9][ ()0-9.*\/+-]*[*\/+-][ ()0-9.*\/+-]*[0-9][()0-9.*\/+-]*/);
	
	if (m) {
		try {
			result = eval(m[0]);
			if (typeof result === 'number') {
				return String(result);
			}
		} catch(e) {}
	}
	
}

client.on('message', message => {
	if (wrecked) {
		return;
	}
    try {
        if (ignores.indexOf(message.author.id) !== -1) {
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
		wrecked = true;
        message.reply(e.name + ': ' + e.message);
    }
});

client.login('MzExMTYzODU5NTgwNzQ3Nzc4.C_Ijtg.32OP4QU9LYx2MKiJUhYy0RIZPmE');
