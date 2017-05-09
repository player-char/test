const Discord = require('discord.js');
const client = new Discord.Client();

const vm = require('vm');


client.on('ready', () => {
    console.log('I am ready!');
	client.user.setGame('Discord');
});

let myId = '311163859580747778';
let ignores = [
    myId
];
let wrecked = false;

function chance(a) {
	return Math.random < a;
}

function pick(arr) {
    return arr[Math.floor(arr.length * Math.random())];
}

function capReply(message, text) {
	if (!text) {
		return;
	}
	if (!message.guild) {
		text = text.slice(0, 1).toUpperCase() + text.slice(1);
	}
	message.reply(text);
}

function checkReply(message) {
    let c = message.content;
    let lc = c.toLowerCase().trim();
	let m = null;
    
	// exact match
    if (lc === 'нет') {
        return 'крипера ответ.';
    }
    if (lc === 'неа') {
        return 'крипера отвеа.';
    }
	
	// bad words
	if ((' ' + lc).match('([^а-яА-ЯёЁ]((н[аеи]|п?о)?ху[йеяюиё]|муд[аеияо]|сук[аиеу]|бля|п[ие]до|([усв]|от|р[ао]з|(пр|[дзвпн])[аыоие])?ъ?[её]б|о?п[иеёюй]зд|(вы|у)?си?ра)|(fu|di|su)ck)')) {
		return 'please, be polite!';
	}
	
	// bad words 2
	if ((' ' + lc).match('[^а-яА-ЯёЁ](д(ау|ове)н)')) {
		return 'пожалуйста, не обзывайся.';
	}
	
	// ники Драгона
	m = c.match(/(Dragon2488|Archengius)/);
    if (m) {
        return '`' + m[0] + '` is deprecated. Use `AntiquiAvium` instead.';
    }
    if (lc.match(/драгон/)) {
        return 'Он вам не Драгон.';
    }
	
	// как так?
    if (lc.match(/как так[?!]*$/)) {
        return pick([
            'ну вот как-то так.',
            'как-то так, да вот как бы не так.',
            'вот как-то так-то так вот.',
            'как-то так, да никак-то никак.',
            'так-то так, да как-то так как никак.'
        ]);
    }
	
	// приветствие
	if (lc.match(/(привет|здравствуй|доброе утро|добрый день|добрый вечер)/)
	&& message.mentions.users.has(myId) || !message.mentions.users.size) {
		return pick([
			'привет!',
			'здравствуй!',
			'и тебе не хворать!',
			'привет-привет.',
			'привет.'
		]);
	}
	
	// разное
	if (lc.match(/да ладно/)) {
		return 'холодно-прохладно.';
	}
	if (lc.match(/нормально/)) {
		return 'нормально или хорошо?';
	}
	if (lc.match(/хорошо/) && chance(0.4)) {
		return 'хорошо или замечательно?';
	}
	
	// решение примеров
	m = (' ' + lc).match(/ [ ()0-9.*\/+-]*[0-9][ ()0-9.*\/+-]*[*\/+-][ ()0-9.*\/+-]*[0-9][()0-9.*\/+-]*/);
	if (m && m.length == 1) {
		try {
			let result = eval(m[0]);
			if (typeof result === 'number') {
				return String(result);
			}
		} catch(e) {}
	}
	
}

client.on('message', message => {
	if (wrecked || message.system) {
		return;
	}
    try {
		
		// бот должен игнорить себя
        if (ignores.indexOf(message.author.id) !== -1) {
            return;
        }
		
		// выбор ответа
        let reply = checkReply(message);

        if (reply) {
			// крипера ответ
            capReply(message, reply);
        } else {
			// если просто призвали
			if (message.mentions.users.has(myId)) {
				if (!message.guild || message.channel.id === '236835572692287488') {
					capReply(message, pick([
						'а?',
						'что?',
						'зачем звал?',
						'ку-ку.',
						'да ладно, можешь не призывать. Всё равно я ещё мало чего умею.'
					]));
				} else {
					message.react(pick['👋😑😁🖐🍌📯🙃😓'.split('')]);
				}
			}
		}

    } catch(e) {
		console.error(e);
		//wrecked = true;
        //message.reply(e.name + ': ' + e.message);
    }
});

client.login('MzExMTYzODU5NTgwNzQ3Nzc4.C_Ijtg.32OP4QU9LYx2MKiJUhYy0RIZPmE');
