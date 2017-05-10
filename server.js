const Discord = require('discord.js');
const client = new Discord.Client();


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
	if (Array.isArray(text)) {
		text = pick(text);
	}
	if (!message.guild) {
		text = text.slice(0, 1).toUpperCase() + text.slice(1);
	}
	message.reply(text);
}

function checkReply(message) {
	let mentioned = message.mentions.users.has(myId);
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
    if (lc === '> 1') {
        return ['1 <', '< 1', '1 >', '>1<', '<1>'];
    }
	
	// phrase end
	if (lc.match(/(да|ну) ладно[?!. ]*$/)) {
		return 'холодно-прохладно.';
	}
	if (lc.match(/да ну[?!. ]*$/)) {
		return 'ну да.';
	}
	if (lc.match(/ну да[?!. ]*$/)) {
		return 'да ну?';
	}
    if (lc.match(/creep[ @_-]creep[?!. ]*$/)) {
        return 'creeperize!';
    }
	
	// bad words end
    if (lc.match(/(^|[^а-яА-ЯёЁ])блять[?!.,]*$/)) {
        return 'нехорошо такие слова употреблять.';
    }
	
	// bad words
	if (lc.match(/((^|[^а-яА-ЯёЁ])((н[аеи]|п?о)?ху[йеяюиё]|муд[аеияо]|сук[аиеу]|бля|п[ие]до|([усв]|от|р[ао]з|(пр|[дзвпн])[аыоие])?ъ?[её]б|епт|о?п[иеёюй]зд|(вы|у)?си?ра)|(fu|di|su)ck)/)) {
		return 'please, be polite!';
	}
	// bad words 2
	if (lc.match(/лох[?!.]*$/)) {
		return 'во дворе растёт горох.';
	}
	if (lc.match(/(^|[^а-яА-ЯёЁ])(д(ау|ове)н|кр[ие]тин|свол[ао]ч|ид[ие]от|мраз)/)) {
		return 'обзываться нехорошо.';
	}
	
	// ники Драгона
	m = c.match(/(Dragon2488|Archengius)/);
    if (m) {
        return '`' + m[0] + '` is deprecated. Use `AntiquiAvium` instead.';
    }
    if (lc.match(/драгон/)) {
        return ['Он вам не Драгон.', '#онвамнедрагон'];
    }
	
	// как так?
    if (lc.match(/как так[?!]*$/)) {
        return [
            'ну вот как-то так.',
            'как-то так, да вот как бы не так.',
            'вот как-то так-то так вот.',
            'как-то так, да никак-то никак.',
            'так-то так, да как-то так как никак.',
        ];
    }
	
	// прощание
	if (lc.match(/(пока|до скорой|прощай|до свидан[иь]я)/)
	&& (mentioned || !message.mentions.users.size)) {
		if (chance(0.2)) {
			return [
				'эй, ты куда? Не бросай меня!',
				'не уходи! Мне скучно одному!',
				'ага, щас! Не так быстро!',
				'не бросай меня одного!',
				'эй, а как же я?',
			];
		}
		return [
			'пока!',
			'пока.',
			'пока-пока.',
			'до свидания!',
			'до свидания.',
			'до скорой встречи!',
		];
	}
	
	// приветствие
	if (lc.match(/(привет|здравствуй|доброе утро|добрый день|добрый вечер)/)
	&& (mentioned || !message.mentions.users.size)) {
		if (chance(0.02)) {
			return 'крипера ответ!';
		}
		return [
			'привет!',
			'привет.',
			'привет-привет.',
			'здравствуй!',
			'и тебе не хворать!',
		];
	}
	
	// разное
	if (lc.match(/нормально/)) {
		return 'нормально или хорошо?';
	}
	if (lc.match(/хорошо/) && chance(0.4)) {
		return 'хорошо или замечательно?';
	}
	
	// решение примеров
	m = (' ' + lc).match(/ [ ()0-9.*\/+-]*[0-9][ ()0-9.*\/+-]*[*\/+-][ ()0-9.*\/+-]*[0-9][()0-9.*\/+-]*/g);
	if (m && m.length == 1) {
		try {
			let result = eval(m[0]);
			if (typeof result === 'number') {
				return String(parseFloat(result.toPrecision(15)));
			}
		} catch(e) {}
	}
	
	// если просто призвали
	if (mentioned) {
		if (chance(0.7) && (!message.guild || message.channel.id === '236835572692287488')) {
			return [
				'а?',
				'что?',
				'зачем звал?',
				'ку-ку.',
				'привет.',
				'да ладно, можешь не призывать. Всё равно я ещё мало чего умею.',
			];
		} else {
			message.react(pick('👋 😑 😁 🖐 🍌 📯 🙃 😓'.split(' ')));
			return;
		}
	}
	
	// :creeper:
	if (lc.match(/(^|[^а-яА-ЯёЁ])(creep|крип)/)) {
		if (message.guild) {
			let creep = message.guild.emojis.get('276820460744736779');
			if (creep) {
				message.react(creep);
				return;
			}
		}
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
		
		let mentioned = message.mentions.users.has(myId);
		
		// крипера ответ
		capReply(message, checkReply(message, mentioned));

    } catch(e) {
		console.error(e);
		//wrecked = true;
        //message.reply(e.name + ': ' + e.message);
    }
});

client.login('MzExMTYzODU5NTgwNzQ3Nzc4.C_Ijtg.32OP4QU9LYx2MKiJUhYy0RIZPmE');
