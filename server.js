// Дискорд-бот "Крипушка"

const Discord = require('discord.js');
const client = new Discord.Client();

// инициализация
let myId = '311163859580747778';
let ignores = [
    myId,
];
let wrecked = false;


// выдаёт true с указанным шансом
function chance(a) {
	return Math.random() < a;
}

// вытаскивание элемента из массива
function pick(arr, rand) {
	if (typeof rand == 'undefined') {
		// тупо рандомно
		return arr[Math.floor(arr.length * Math.random())];
	} else {
		// по остатку
		return arr[rand % arr.length];
	}
}

// хеш от букв строки.
// чем длиннее строка, тем примерно больше число.
function hashie(str) {
	if (typeof str != 'string') {
		return 0;
	}
	let sum = 0;
	let pos = 0;
	for (let i = 0; i < str.length; i++) {
		if (str[i].match(/[0-9a-zа-яё]/)) {
			let n = str.charCodeAt(i);
			// hashing machine
			sum += 13 + (((n % 29) ^ (n % 31) ^ (n % 43) ^ (pos++ % 7)) % 17);
		}
	}
	return sum;
}

// серверная оценка сообщения по её имени
function customReact(message, name) {
	if (!message.guild) {
		// private messaging
		return false;
	}
	let arr = message.guild.emojis.array();
	for (let i = 0; i < arr.length; i++) {
		if (arr[i].name == name) {
			message.react(arr[i]);
			return true;
		}
	}
	// 404
	return false;
}

// капитализация и отправка
function capReply(message, text, flags) {
	if (!text) {
		return;
	}
	
	if (Array.isArray(text)) {
		text = pick(text);
	}
	
	flags.r = flags.r && !!message.guild; // if PM, write without mention
	
	if (flags.r) {
		// @User, there the text goes.
		message.reply(text);
	} else {
		// There the text goes.
		text = text.slice(0, 1).toUpperCase() + text.slice(1);
		message.channel.send(text);
	}
}

// чем отвечать будем
function checkReply(message, flags) {
	let mentioned = message.mentions.users.has(myId) || (!message.guild ? 'dm' : false);
    let uc = message.content.trim();
    let lc = uc.toLowerCase();
	let m = null;
    
	function cutOff(m) {
		if (m.index) {
			lc = (lc.slice(0, m.index) + ' ' + lc.slice(m.index + m[0].length)).trim();
			uc = (uc.slice(0, m.index) + ' ' + uc.slice(m.index + m[0].length)).trim();
		} else {
			lc = lc.slice(m.index + m[0].length);
			uc = uc.slice(m.index + m[0].length);
		}
	}
	
	
	// <@...> mentioning
	m = lc.match(new RegExp('<@' + myId + '>[,.?! ]*'));
	if (m) {
		cutOff(m);
	}
	
	// text name mentioning
	m = lc.match(/([,.?!] ?|^)(крип(ушка|ак?|ер(аст)?)|creep(er|ah))([,.?!] ?|$)/);
	if (m) {
		mentioned = true;
		cutOff(m);
	}
	
	
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
	if (lc.match(/^\/?hack[?!. ]*$/)) {
		return 'Eleite Haxxor 1337.';
	}
	
	// Iron Door check
	m = uc.match(/(>\|<|[zcsjh]h?|[жшхwx]+|[\|il]{3})[aeouiyаеёуыоияэю340]+й?([лl]|[\/j][li\|\\]\\?)+[aeouiyаеёуыоияэю340]+й?[zscзс3]+[нnh]+[aeouiyаеёуыоияэю340]+[a-zа-яё0-9]*?[\s,.\?!\\\/\*=+-]*[dtдт]+([wvbвуф]|[\|il]{3})+[aeouiyаеёуыоияэю340]+[rpр]+[a-zа-яё0-9]*/gi);
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
	if (lc.match(/и что[?!. ]*$/)) {
		return 'и то.';
	}
	if (lc.match(/ну и[?!. ]*$/)) {
		return 'ну и ну!';
	}
    if (lc.match(/creep[ @_-]creep[?!. ]*$/)) {
        return 'creeperize!';
    }
	if (lc.match(/ты кто[?!. ]*$/)) {
		return 'тролль в пальто.';
	}
	if (lc.match(/лох[?!.]*$/)) {
		return 'во дворе растёт горох.';
	}
	
	// bad words end
    if (lc.match(/(^|[^а-яё])блять[?!.,]*$/)) {
        return 'нехорошо такие слова употреблять.';
    }
	
	// bad words
	if (lc.match(/((^|[^а-яё])((с|н[аеи]|[пд]?о)?ху[йеяюиё]|муд[аеияо]|сук[аиеу]|бля|п[ие]до|(у|[св]ъ|от|р[ао]з|(пр|[дзвпн])[аыоие])?[её]б|епт|о?п[иеёюй]зд|(вы|у)?си?ра|([усв]|от|р[ао]з|(пр|[дзвпн])[аыоие])?др[ао]ч)|(fu|di|su)ck)/)) {
		return 'please, be polite!';
	}
	// bad words 2
	if (lc.match(/(^|[^а-яё])(д(ау|ове)н|кр[ие]тин|свол[ао]ч|ид[ие]от|мраз)/)) {
		return 'обзываться нехорошо.';
	}
	
	// ники Драгона
	m = uc.match(/(Dragon2488|Archengius)/);
    if (m) {
        return '`' + m[0] + '` is deprecated. Use `AntiquiAvium` instead.';
    }
    if (lc.match(/(^|[^а-яё])драгон/)) {
        return ['он вам не Драгон.', '#онвамнедрагон'];
    }
	
	// как так?
    if (lc.match(/(^|[^а-яё])как (же )?так[?!]*$/)) {
        return [
            'ну вот как-то так.',
            'как-то так, да вот как бы не так.',
            'вот как-то так-то так вот.',
            'как-то так, да никак-то никак.',
            'так-то так, да как-то так как никак.',
        ];
    }
	
	// прощание
	m = lc.match(/(^|[^а-яё])(пока|до скорой|прощай|до свидан[иь]я)/);
	if (m && (mentioned || m[0].length == lc.length)) {
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
	m = lc.match(/(привет(-привет)?|здравствуй|доброе утро|добрый день|добрый вечер|ку-?ку)[,.?! ]*/);
	if (m && (mentioned || m[0].length == lc.length)) {
		if (m[1].endsWith('вет') && chance(0.1)) {
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
	if (lc.match(/(^|[^а-яё])нормально/)) {
		return 'нормально или хорошо?';
	}
	if (lc.match(/(^|[^а-яё])хорошо/) && chance(0.4)) {
		return 'хорошо или замечательно?';
	}
	// bug
	if (lc.match(/(^|[^а-яё])не((правиль|коррект|вер)но)? работает/)) {
		message.react('🐛');
		return;
	}
	// кукареку
	if (lc.match(/ку-?ка-?ре-?ку/)) {
		message.react('🐓');
		return;
	}
	
	// yeah, but ...
	if (lc.match(/^yeah, but/m)) {
		flags.r = false;
		return '> Yeah, but\nYabbits live in the woods.';
	}
	
	// решение примеров
	m = lc.match(/(^| )[ ()0-9.*\/+-]*[0-9][ ()0-9.*\/+-]*[*\/+-][ ()0-9.*\/+-]*[0-9][()0-9.*\/+-]*/g);
	if (m && m.length == 1) {
		try {
			let result = eval(m[0]);
			if (typeof result === 'number') {
				return String(parseFloat(result.toPrecision(15)));
			}
		} catch(e) {}
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
	if (lc.match(/(^|[^а-яё])eval/)) {
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
	
	// drop database
	m = lc.match(/drop\s+(database|table)/);
	if (m) {
		let obj = (m[1] == 'table' ? '┻━┻' : '[DATABASE]')
		return ['(╯°д°）╯︵ ' + obj, obj + ' ︵╰(°д°╰）'];
	}
	
	// ты тут?
	if (lc.match(/(^|[^а-яё])(ты (где|тут|куда)|(где|куда) ты)/)) {
		return [
			'я тут.',
			'я здесь.',
			'привет, я тут.',
			'ку-ку.',
			'вот я где!',
			'да здесь я, здесь.',
			'да-да, я здесь.',
		];
	}
	
	// как настроение?
	if (lc.match(/(^|[^а-яё])как(ое)? (тво[её] |у тебя )?настроение/)) {
		return 'замечательно' + pick(['.', '!', ' :)', ' c:', ' (:']);
	}
	
	// что делаешь?
	if (lc.match(/(^|[^а-яё])(что (сейчас )?делаешь|чем (сейчас )?зан(ят|имаешься))[?]*$/)) {
		return [
			'играю в Дискорд.',
			'пишу в чат.',
			'пишу тебе сообщение.',
			'отвечаю на твоё сообщение.',
		];
	}
	
	// как дела?
	if (lc.match(/(^|[^а-яё])как (твои |у тебя )?дела/)) {
		return 'как сажа бела ' + pick([':)', '(:']);
	}
	
	// do you like
	if (lc.match(/(^ *(ты )?любишь [а-яё]+|(^|[^а-яё])+ любишь[?! ]*$)/)) {
		return 'кориандр люблю.';
	}
	
	// почему
	m = lc.match(/^ *(?:(?:не )?знаешь, )?почему ?([0-9а-яёa-z '",~:%<>*&#=+-]*)/);
	if (m) {
		let h = hashie(m[1]);
		if (h < 100) {
			return 'потому что!';
		}
		return 'потому что ' + pick([
			'все так думают.',
			'так задумано.',
			'криперы зелёные.',
			'небо голубое.',
			'майнкрафт уже не торт.',
			'все так считают.',
			'так надо.',
			'ты так думаешь.',
			'тебе так кажется.',
			'мир несовершенен.',
			'рандом нерандомен.',
		], h);
	}
	
	// кто такой кто-то
    if (lc.match(/(^|[^а-яё])(знаешь|[чк]то так(ой|ая|ое))/)) {
		if (lc.match(/(^|[^а-яё])руль?т/)) {
			if (customReact(message, 'rult')) {
				return;
			}
		}
		if (lc.match(/(^|[^а-яё])нами/)) {
			return 'Намия не умеет строить. Не пишите ей по этому поводу. Она вам не поможет.';
		}
		if (lc.match(/(^|[^а-яё])камк/)) {
			return [
				'она любит, когда что-то горит.',
				'она горит, когда что-то любит.',
			];
		}
		if (lc.match(/(^|[^а-яё])олен/)) {
			if (chance(0.5)) {
				message.react('🦌');
				return;
			}
			return 'олень ' + pick([
				'был завезён человеком в Австралию и Новую Зеландию.',
				'олицетворяет благородство, величие, красоту, грацию, быстроту.',
			]);
		}
		if (lc.match(/(^|[^а-яё])(google|гуго?л)/)) {
			return 'не знаю, загугли.';
		}
		if (lc.match(/(^|[^а-яё])лайм[оа0]н/)) {
			return 'Лаймон - создатель Лаймстудии, ЛаймХрома и ЛаймОС, а также ЛаймМобиля, ЛаймШопа, ЛаймКоина и ЛаймСити.';
		}
		if (lc.match(/(^|[^а-яё])хайв[оа]н/)) {
			return 'Красный Олень.';
		}
		if (lc.match(/(^|[^а-яё])рутс?чи/)) {
			return 'это тот, кто на совках тащит.';
		}
		if (lc.match(/(^|[^а-яё])(гетап|getup)/)) {
			if (chance(0.5) && customReact(message, 'orangeCaster')) {
				return;
			}
			return 'Гетап - каститизатор Земель Рандомских.';
		}
		if (lc.match(/(^|[^а-яё])сметан/)) {
			return 'сметана вкусная.';
		}
		if (lc.match(/(^|[^а-яё])крип(ер|ак)/)) {
			return 'крипер - зелёный монстр из майнкрафта.';
		}
		if (lc.match(/(^|[^а-яё])лайкобск/)) {
			return 'Лайкобск - город, свободный от ' + pick(['курения', 'коробкофобов', 'овцемобилей', 'гриферства']) + '.';
		}
		if (lc.match(/(^|[^а-яё])(рандом ?крафт|random ?craft)/)) {
			return 'РандомКрафт - сервер, который некогда был тортом.';
		}
		if (lc.match(/(^|[^а-яё])(lv|lucky|лаки)/)) {
			return 'Стилкрафт крутой, ЛакиВёрс - отстой.';
		}
		if (lc.match(/(^|[^а-яё])(javascript|js)/)) {
			return 'это язык, на котором я работаю.';
		}
		if (lc.match(/(^|[^а-яё])бан(?![ктндчя])/)) {
			return 'бан - неправильный, но популярный метод решения конфликтов.';
		}
		if (lc.match(/(^|[^а-яё])(ты|себя|крипушк)/)) {
			return 'откуда мне знать, кто я такой?';
		}
		if (lc.match(/(^|[^а-яё])пл[еао]ер/)) {
			return 'Томми Версетти дворами пошёл.\nВ глухом переулке базуку нашёл.';
		}
		if (lc.match(/(^|[^а-яё])(оранж|кастер)/)) {
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
	
	// го в лс
	if (message.guild && lc.match(/(го|давай|иди|дуй|пошли) (лучше )?(ко мне )?в лс/)) {
		message.author.send('Да-да, я тут.');
		return;
	}
	
	// банан
	if (lc.match(/банан/)) {
		message.react('🍌');
		return;
	}
	
	// если просто призвали
	if (chance(0.4) && (!message.guild || message.channel.id === '236835572692287488')) {
		if (mentioned !== true) {
			// если не призывали, а написали в лс
			return;
		}
		return [
			'а?',
			'что?',
			'зачем звал?',
			'ку-ку.',
			'привет.',
			'да ладно, перестань. Всё равно я ещё мало чего умею.',
		];
	} else {
		message.react(pick('👋 🖐 😑 😐 😁 🙃 🙄 😓 😪 🍌 📯 🎺 🏸'.split(' ')));
		return;
	}
	
}

// при сообщениях
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

// сразу, как зайдёт
client.on('ready', () => {
    console.log('I am ready!');
	client.user.setGame('Discord');
});


client.login('MzExMTYzODU5NTgwNzQ3Nzc4.C_Ijtg.32OP4QU9LYx2MKiJUhYy0RIZPmE');
