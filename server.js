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
	return Math.random() < a;
}

function pick(arr) {
    return arr[Math.floor(arr.length * Math.random())];
}

function customReact(message, name) {
	if (!message.guild) {
		return false;
	}
	let arr = message.guild.emojis.array();
	for (let i = 0; i < arr.length; i++) {
		if (arr[i].name == name) {
			message.react(arr[i]);
			return true;
		}
	}
	return false;
}

function capReply(message, text, flags) {
	if (!text) {
		return;
	}
	if (Array.isArray(text)) {
		text = pick(text);
	}
	
	flags.r &&= !!message.guild; // if PM, write without mention
	
	if (flags.r) {
		// @User, there the text goes.
		message.reply(text);
	} else {
		// There the text goes.
		text = text.slice(0, 1).toUpperCase() + text.slice(1);
		message.channel.send(text);
	}
}

function checkReply(message, flags) {
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
		flags.r = false;
        return ['1 <', '< 1', '1 >', '>1<', '<1>'];
    }
	
	// Iron Door
	m = lc.match(/(>\|<|[zcsjh]h?|[жшхwx]+|[\|il]{3})[aeouiyаеёуыоияэю340]+й?([лl]|[\/j][li\|])+[aeouiyаеёуыоияэю340]+й?[zscзс3]+[нnh]+[aeouiyаеёуыоияэю340]+[a-zа-яё0-9]*?[\s,.\?!\\\/\*=+-]*[dtдт]+([wvbвуф]|[\|il]{3})+[aeouiyаеёуыоияэю340]+[rpр]+[a-zа-яё0-9]*/g);
	if (m) {
		for (let i = 0; i < m.length; i++) {
			if (!m[i].match(/^(Железн(ая|ую) Дверь|Железной Двер(и|ью))$/)) {
				return 'pray to the Iron Door.';
			}
		}
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
	if (lc.match(/ты кто[?!. ]*$/)) {
		return 'тролль в пальто.';
	}
	if (lc.match(/\/?hack[?!. ]*$/)) {
		return 'Eleite Haxxor 1337.';
	}
	
	// bad words end
    if (lc.match(/(^|[^а-яА-ЯёЁ])блять[?!.,]*$/)) {
        return 'нехорошо такие слова употреблять.';
    }
	
	// bad words
	if (lc.match(/((^|[^а-яА-ЯёЁ])((с|н[аеи]|[пд]?о)?ху[йеяюиё]|муд[аеияо]|сук[аиеу]|бля|п[ие]до|(у|[св]ъ|от|р[ао]з|(пр|[дзвпн])[аыоие])?[её]б|епт|о?п[иеёюй]зд|(вы|у)?си?ра|([усв]|от|р[ао]з|(пр|[дзвпн])[аыоие])?др[ао]ч)|(fu|di|su)ck)/)) {
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
        return ['он вам не Драгон.', '#онвамнедрагон'];
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
		if (chance(0.4) && (!message.guild || message.channel.id === '236835572692287488')) {
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
	if (!mentioned && lc.match(/(^|[^а-яА-ЯёЁ])(creep|крип)/)) {
		if (customReact(message, 'creeper')) {
			return;
		}
	}
	
	if (!mentioned) {
		return;
	}
	
	// eval = evil
	if (lc.match(/(^|[^а-яА-ЯёЁ])eval/)) {
		return [
			'eval равно evil равно на голову anvil.',
			'eval такой evil, хакер вирус натравил.',
			'за такой простой eval модер баны раздавал.',
			'очень простенький eval, комп три ночи остывал.',
			'за такой простой eval админ опку отзывал.',
			'сквозь один такой eval хакер деньги отмывал.',
			'как-то был один eval, кодер стены отмывал.',
			'милый добренький eval все процессы убивал.',
			'добрый миленький eval валит сервер наповал.',
			'запустил один eval, сервер лёг и не вставал.',
		];
	}
	
	// кто такой
    if (lc.match(/(^|[^а-яА-ЯёЁ])(знаешь|кто так(ой|ая))/)) {
		if (lc.match(/(^|[^а-яА-ЯёЁ])руль?т/)) {
			if (customReact(message, 'rult')) {
				return;
			}
		}
		if (lc.match(/(^|[^а-яА-ЯёЁ])нами/)) {
			return 'она не умеет строить. Не пишите ей по этому поводу. Она вам не поможет.';
		}
		if (lc.match(/(^|[^а-яА-ЯёЁ])камк/)) {
			return [
				'она любит, когда что-то горит.',
				'она горит, когда что-то любит.',
			];
		}
		if (lc.match(/(^|[^а-яА-ЯёЁ])олен/)) {
			return 'олень ' + pick([
				'был завезён человеком в Австралию и Новую Зеландию.',
				'олицетворяет благородство, величие, красоту, грацию, быстроту.',
			]);
		}
		if (lc.match(/(^|[^а-яА-ЯёЁ])гуго?л/)) {
			return 'не знаю, загугли.';
		}
		if (lc.match(/(^|[^а-яА-ЯёЁ])лайм[оа0]н/)) {
			return 'Лаймон - создатель Лаймстудии, ЛаймХрома и ЛаймОС, а также ЛаймМобиля, ЛаймШопа, ЛаймКоина и ЛаймСити.';
		}
		if (lc.match(/(^|[^а-яА-ЯёЁ])хайв[оа]н/)) {
			return 'Красный Олень.';
		}
		if (lc.match(/(^|[^а-яА-ЯёЁ])пл[еао]ер/)) {
			return 'Томми Версетти дворами пошёл. В глухом переулке базуку нашёл.';
		}
		if (lc.match(/(^|[^а-яА-ЯёЁ])(оранж|кастер)/)) {
			message.react('🍹');
			return;
		}
		return [
			'понятия не имею.',
			'крипер его знает.',
			'спроси у Гугла.',
			'не, не слышал.',
			'эмм.. что?',
			'эмм.. что? Не, не слышал.',
		];
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
		
		let flags = {
			r: true, // reply with mentioning
		};
		// крипера ответ
		capReply(message, checkReply(message, flags), flags);

    } catch(e) {
		console.error(e);
		//wrecked = true;
        //message.reply(e.name + ': ' + e.message);
    }
});

client.login('MzExMTYzODU5NTgwNzQ3Nzc4.C_Ijtg.32OP4QU9LYx2MKiJUhYy0RIZPmE');
