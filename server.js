// Дискорд-бот "Крипушка"


const Discord = require('discord.js');
const client = new Discord.Client();

let myToken = process.env.BOT_TOKEN;

// инициализация
let myId = '311163859580747778';
// floodless channels
let floodless = [
	'175956780398936065',
];
// user ids to ignore
let ignores = [
	myId,
];
let wrecked = false;
let hidden = false;
let timestamps = {
	norm: -Infinity,
	good: -Infinity,
}

// выдаёт true с указанным шансом
function chance(a) {
	return Math.random() < a;
}

// вытаскивание элемента из массива
Array.prototype.pick = function(rand) {
	if (typeof rand == 'undefined') {
		// тупо рандомно
		return this[Math.floor(this.length * Math.random())];
	} else {
		// по остатку
		return this[rand % this.length];
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

function setStatus() {
	if (hidden) {
		client.user.setStatus('invisible');
	} else {
		client.user.setStatus('online');
		client.user.setGame('Discord');
	}
}

// серверная оценка сообщения по её имени
function customReact(message, name) {
	if (!message.guild) {
		// private messaging
		return false;
	}
	let map = message.guild.emojis;
	for (let i of map) {
		if (i[1].name == name) {
			message.react(i[1]);
			return true;
		}
	}
	// 404
	return false;
}


// массив с базой данных того, на что бот реагирует
let responses = [
	
	// p: pattern
	// m: method (flags.r)
	// c: chance 0.0...1.0
	// d: direct {false (default) / true / 'indirect' (if mentioned or the phrase is clear)}
	// r: response (string or function)
	// t: timed cooldown ['timestamp_name', timeout]
	
	// creeper's response
	{
		p: /^ ?не([ат])$/i,
		r: (m) => 'крипера отве' + m[1] + '.',
	},
	// считалочка reversed
	{
		p: /^ ?> 1$/,
		m: 'say',
		r: ['1 <', '< 1', '1 >', '>1<', '<1>'],
	},
	// /hack
	{
		p: /^ ?\/?hack[?!. ]*$/i,
		r: 'Eleite Haxxor 1337.',
	},
	
	// Железная Дверь
	{
		p: /(>\|<|[zcsjh]h?|[жшхwx]+|[\|il]{3})[aeouiyаеёуыоияэю340]+й?([лl]|[\/j][li\|\\]\\?)+[aeouiyаеёуыоияэю340]+й?[zscзс3]+[нnh]+[aeouiyаеёуыоияэю340]+[a-zа-яё0-9]*?[\s,.\?!\\\/\*=+-]*[dtдт]+([wvbвуф]|[\|il]{3})+[aeouiyаеёуыоияэю340]+[rpр]+[a-zа-яё0-9]*/gi,
		r: (m) => {
			for (let i = 0; i < m.length; i++) {
				if (!m[i].match(/^(Железн(ая|ую) Дверь|Железной Двер(и|ью))$/)) {
					return 'pray to the Iron Door.';
				}
			}
		},
	},
	
	// конец фразы
	{
		p: /(^|[^а-яё])(да|ну) ладно[?!. ]*$/i,
		r: 'холодно-прохладно.',
	},
	{
		p: /(^|[^а-яё])да ну[?!. ]*$/i,
		r: 'ну да.',
	},
	{
		p: /(^|[^а-яё])ну да[?!. ]*$/i,
		r: 'да ну?',
	},
	{
		p: /(^|[^а-яё])и что[?!. ]*$/i,
		r: 'и то.',
	},
	{
		p: /(^|[^а-яё])ну и[?!. ]*$/i,
		r: 'ну и ну!',
	},
	{
		p: /creep[ @_-]creep[?!. ]*$/i,
		r: 'creeperize!',
	},
	{
		p: /(^|[^а-яё])[тв]ы кто[?!. ]*$/i,
		r: 'тролль в пальто.',
	},
	{
		p: /лох[?!.]*$/i,
		r: 'во дворе растёт горох.',
	},
	
	// bad words end
	{
		p: /(^|[^а-яё])[бм]лять[?!.,]*$/i,
		r: 'нехорошо такие слова употреблять.',
	},
	// nasty words
	{
		p: /((^|[^а-яё])(([саоув]|(пр|[дзвпн])[аеёиыяюе]|(р[ао]|в)[сз]|[оа]т)?(ху[йеяюиё]|п[иеёюй]з[жд]|др(оч|ач(?!л))|п[ие]д[ои](?!н)|[ьъ]?[её]б)|муд[аеёиыяюо]|[бм]л[яэ]|[её]пт)|([fs]u|di)ck)/i,
		r: 'please, be polite!',
	},
	// dirtey words
	{
		p: /(^|[^а-яё])((по|на|за|вы|у|про)?(си?ра[тлчкш]|сри(^|[^а-яё]|т))|д[еёи]рьм|г[оа]ве?н|ж[оеё]п|(на|за|вы|об|раз)?бл[её]в|shit|poo)/i,
		m: 'react',
		r: '🚽',
	},
	// bad words
	{
		p: /(^|[^а-яё])[тв]ы[^а-яё]*(д(ау|ове)н|кр[ие]тин|свол[ао]ч|ид[ие]от|мраз|ло[хш]|ублюд|дур[аоеё]|д[еи]б[еи]л|)/i,
		r: 'прости, но обзываться нехорошо.',
	},
	// dog words
	{
		p: /(^|[^а-яё])(сук[аиеу])/i,
		m: 'react',
		r: '🐶',
	},
	// asterixx
	{
		p: /(^|[а-яё -])\\?\*[а-яё]/i,
		m: 'react',
		r: '🐶',
	},
	
	// deprecated
	{
		p: /(Dragon2488|Archengius)/,
		r: (m) => '`' + m[0] + '` is deprecated. Use `AntiquiAvium` instead.',
	},
	
	// как так?
	{
		p: /(^|[^а-яё])как (же )?так[?!]*$/i,
		r: [
			'ну вот как-то так.',
			'вот как-то так-то так вот.',
			'вот как-то вот так-то вот так, вот как.',
			'как-то так-то как-то так.',
			'как-то так, да никак-то никак.',
			'как-то так, да вот как бы не так.',
			'так-то так, да как-то так как никак.',
		],
	},
	
	// спокойной ночи
	{
		p: /(^|[^а-яё])((добр|спокойн)ой ночи|(добры|хороши|приятны|сладки)х снов)[,.?! ]*/i,
		d: 'indirect',
		r: [
			'спокойной ночи!',
			'спокойной ночи.',
			'доброй ночи!',
			'доброй ночи.',
			'добрых снов!',
			'сладких снов!',
		],
	},
	
	// прощание
	{
		p: /(^|[^а-яё])(пока(?=([^а-яё]|$))|прощай|до (свидан[иь]я|скорой( встречи)?|встречи))[,.?! ]*/i,
		d: 'indirect',
		r: (m) => {
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
		},
	},
	
	// приветствие
	{
		p: /(^|[^а-яё])(привет(-привет|ствую (тебя|вас))?|здравствуй(те)?|доброе утро|добрый день|добрый вечер|ку-?ку)[,.?! ]*/i,
		d: 'indirect',
		r: (m) => {
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
		},
	},
	
	// norm
	{
		p: /(^|[^а-яё])нормально([^а-яё]|$)/i,
		r: 'нормально или хорошо?',
		t: ['norm', 10000],
	},
	// good
	{
		p: /(^|[^а-яё])хорошо([^а-яё]|$)/i,
		r: 'хорошо или замечательно?',
		c: 0.6,
		t: ['good', 10000],
	},
	
	// bug
	{
		p: /(^|[^а-яё])не( ?(совсем|очень) )?((правиль|коррект|вер|точ)но)? работа[еюи]т/i,
		m: 'react',
		r: '🐛',
	},
	// кукареку
	{
		p: /ку-?ка-?ре-?ку/i,
		m: 'react',
		r: '🐓',
	},
	
	// yeah, but ...
	{
		p: /^yeah, but/im,
		m: 'say',
		r: '> Yeah, but\nYabbits live in the woods.',
	},
	
	// решение примеров
	{
		p: /(^| )[ ()0-9.*\/+-]*[0-9][ ()0-9.*\/+-]*[*\/+-][ ()0-9.*\/+-]*[0-9][()0-9.*\/+-]*/g,
		r: (m) => {
			if (m.length == 1) {
				try {
					let result = eval(m[0]); // eval = evil
					if (typeof result === 'number') {
						if (floodey) {
							flags.r = 'dm';
						}
						return String(parseFloat(result.toPrecision(15)));
					}
				} catch(e) {}
			}
		},
	},
	
	// gimme
	{
		p: /(?:^|[^а-яё])(?:вы)?дай(?:те)?(?: мне)? +([0-9]*)(?: штуки? )? *([0-9а-яёa-z '"&-]*)/i,
		r: (m) => {
			let count = m[1] ? +m[1] : 64;
			let item = m[2].trim().toUpperCase();
			if (item.length <= 32 && item.length >= 2) {
				flags.r = 'say';
				return '*Выдано **' + count + '** штук **' + item + '** игроку **<@' + message.author.id + '>**.*';
			}
		},
	},
	
	
	// следующая часть - только при упоминании
	
	// он вам не Драгон
	{
		d: true,
		p: /(^|[^а-яё])драгон/i,
		r: ['он вам не Драгон.', '#онвамнедрагон'],
	},
	
	// короткие фразы
	{
		d: true,
		p: /^ *ч(т|ег)о[?!. ]*$/i,
		r: 'ничего (:',
	},
	{
		d: true,
		p: /^ *как[?!. ]*$/i,
		r: 'а вот так!',
	},
	{
		d: true,
		p: /^ *(test|тест)[?!. ]*$/i,
		r: 'go go test yourself!',
	},
	{
		d: true,
		p: /^ *(фа|голо)с([^а-яё]|$)/i,
		r: 'я тебе не пёс!',
	},
	{
		d: true,
		p: /(^|[^а-яё])да[?!. ]*$/i,
		r: 'на плите сковорода.',
	},
	
	// shutting up
	{
		d: true,
		p: /^ *(у|за)(молчи|ткнис)([^а-яё]|$)/i,
		m: 'react',
		r: '😋 😛 😝 🙃 😑 😷'.split(' '),
	},
	
	// getting out
	{
		d: true,
		p: /^ *(от((ста|вя)нь|вали)|вон|брысь|прочь|пош[ёе]л|у(й|х[оа])ди)([^а-яё]|$)/i,
		r: 'нет, не уйду, я наивный.',
	},
	
	// monster
	{
		d: true,
		p: /^ *((с|по)дохни|(с?го|(вы|по|у)м)ри|выпились|die|burn)/i,
		r: 'you are a monster.',
	},
	
	// you're bad (or good, it doesn't matter)
	{
		d: true,
		p: /^ *ты ([а-яё]+)/i,
		r: (m) => {
			if (!m[1].match(/наивный/i) && m[1].match(/([ыои]й|[ая]я|[ое][её])$/i)) {
				return 'нет, я наивный.';
			}
		},
	},
	
	// eval = evil
	{
		d: true,
		p: /(^|[^а-яё])eval/i,
		r: [
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
		],
	},
	
	// drop database
	{
		d: true,
		p: /drop\s+(database|table)/i,
		r: (m) => {
			flags.r = 'say';
			let obj = (m[1] == 'table' ? '┳━┳' : '[DATABASE]');
			let jbo = (m[1] == 'table' ? '┻━┻' : '[ꓱꓢꓯꓭꓯꓕꓯꓷ]');
			return [
				obj + ' ノ(˚-˚ノ)\n\n(╯°д°）╯︵ ' + jbo,
				'(㇏˚-˚)㇏ ' + obj + '\n\n' + jbo + '︵ ╰(°д°╰)',
				jbo + 'ミ㇏(ಠ益ಠ)ノ彡' + jbo,
			];
		},
	},
	
	// where are you now?
	{
		d: true,
		p: /(^|[^а-яё])(ты (где|куда|тут|здесь)|(где|куда) ты)/i,
		r: [
			'я тут.',
			'я здесь.',
			'привет, я тут.',
			'ку-ку.',
			'вот я где!',
			'да здесь я, здесь.',
			'да-да, я здесь.',
		],
	},
	
	// как настроение?
	{
		d: true,
		p: /(^|[^а-яё])как(ое)? (тво[её] |у тебя )?настроение/i,
		r: () => 'замечательно' + ['.', '!', ' :)', ' c:', ' (:'].pick(),
	},
	// что делаешь?
	{
		d: true,
		p: /(^|[^а-яё])(что (сейчас )?делаешь|чем (сейчас )?зан(ят|имаешься))[?]*$/i,
		r: 'отвечаю на твоё сообщение.',
	},
	// как дела?
	{
		d: true,
		p: /(^|[^а-яё])как (твои |у тебя )?дела/i,
		r: () => 'как сажа бела ' + [':)', '(:'].pick(),
	},
	
	// ты бот?
	{
		d: true,
		p: /(?:^|[^а-яё])[вт]ы,? (?:часом,? )?(?:не )?((?:ро)?бот|скрипт)/i,
		r: (m) => (m[1] == 'скрипт' ? 'да' : 'нет') + ', я скрипт.',
	},
	
	// любишь ...?
	{
		d: true,
		p: /^ *((ты )?любишь [а-яё]+|[а-яё]+ любишь[?! ]*$)/i,
		r: 'кориандр люблю.',
	},
	
	// почему?
	{
		d: true,
		p: /^ *(?:(?:не )?знаешь, )?почему ?([0-9а-яёa-z '",~:%<>*&#=+-]*)/i,
		r: (m) => {
			let h = hashie(m[1]);
			if (h < 100) {
				return 'потому что!';
			}
			return 'потому что ' + [
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
			].pick(h);
		},
	},
	
	// кто такой кто-то
	{
		d: true,
		p: /(^|[^а-яё])(знаешь|[чк]то (за|так(ой|ая|ое)))/i,
		r: (m, message) => {
			let known = {
				'(руль?т|rult)': () => {
					return customReact(message, 'rult');
				},
				'(нами|namiya)': 'Намия не умеет строить. Не пишите ей по этому поводу. Она вам не поможет.',
				'(камк|kamka)': 'Камка любит, когда что-то горит.',
				'(олен|deer)': () => {
					if (chance(0.5)) {
						flags.r = 'react';
						return '🦌';
					}
					return 'олень ' + [
						'был завезён человеком в Австралию и Новую Зеландию.',
						'олицетворяет благородство, величие, красоту, грацию, быстроту.',
					].pick();
				},
				'(google|гуго?л)': 'не знаю, загугли.',
				'(лайм[оа0]н|laim[o0]n)': 'Лаймон - создатель Лаймстудии, ЛаймХрома и ЛаймОС,\nа также ЛаймМобиля, ЛаймШопа, ЛаймКоина и ЛаймСити.',
				'(хайв[оа]н|haiv0n)': 'Красный Олень.',
				'(вася|vasya)': 'Вася - нынешний админ РандомКрафта.',
				'(дискорд|discord)': 'Дискорд - место, где мы обитаем.',
				'(рутс?чи|rutschi)': 'а, это тот, кто на совках тащит.',
				'(гетап|getup)': () => {
					if (chance(0.4) && customReact(message, 'orangeCaster')) {
						return;
					}
					return 'Гетап - каститизатор Земель Рандомских.';
				},
				'(оранж|кастер)': () => {
					flags.r = 'react';
					return '🍹';
				},
				'(кастит|castit)': 'CastIT - полузаброшенный сайт Гетапа, у которого, к тому же, выгорел домен.',
				'сметан': 'сметана вкусная.',
				'крип(ер|ак)': 'крипер - зелёный монстр из майнкрафта.',
				'(м(айн|ине)[кс]рафт|minecraft)': 'Minecraft - игра, без которой меня бы не было.',
				'лайкобск': () => {
					return 'Лайкобск - город, свободный от ' + ['курения', 'коробкофобов', 'овцемобилей', 'гриферства'].pick() + '.';
				},
				'(рандом ?крафт|random ?craft)': 'РандомКрафт - сервер, который некогда был тортом.',
				'rncr': 'RnCr - современная пародия на РандомКрафт.',
				'(lv|lucky|лаки)': 'LuckyVerse - один из основных конкурентов РандомКрафта.',
				'(javascript|js)': 'JavaScript - это язык, на котором я работаю.',
				'(питон|python)': 'Питон - это язык, на котором я не работаю.',
				'бан(?![ктндчя])': 'бан - неправильный, но популярный метод решения конфликтов.',
				'торт': 'тортик - враньё!',
				'любовь': 'The love is a lie. If you love you soon will cry.',
				'пл[еао]ер': 'Томми Версетти дворами пошёл. В глухом переулке ' + ['базуку', 'компьютер', 'алмазы'].pick() + ' нашёл.',
				'(ты|себя|крипушк)': 'откуда мне знать, кто я такой?',
				'(я|меня)': 'посмотри на себя в зеркало и увидишь.',
			};
			
			let lc = m.input.toLowerCase();
			for (let p in known) {
				if (lc.match('(^|[^а-яё])' + p)) {
					let result = (typeof known[p] == 'function' ? known[p]() : known[p]);
					if (result) {
						return result;
					}
				}
			}
			
			return [
				'понятия не имею.',
				'крипер его знает.',
				'спроси у Гугла.',
				'не, не слышал.',
				'неа, не знаю такого.',
				'что-то не припомню такого.',
				'эмм.. что? Не, не слышал.',
			];
		},
	},
	
	// го в лс
	{
		d: true,
		p: /(го|давай|иди|дуй|по(шли|йдём)|зайди) (лучше )?(ко мне )?в (лс|переписку)/i,
		m: 'dm',
		r: 'да-да, я тут.',
	},
	
	
	// третья часть - низкоприоритетные
	
	// :creeper:
	{
		p: /(^|[^а-яё])(creep|крип)/i,
		r: (m, message) => {
			if (customReact(message, 'creeper')) {
				return true;
			}
		},
	},
	
	// :banana:
	{
		p: /банан/i,
		m: 'react',
		r: '🍌',
	},
	
	// :saw:
	{
		p: /(за|вы|рас|от|на|с|пере)?пил[ие]/i,
		r: (m, message) => {
			if (customReact(message, 'saw')) {
				return true;
			}
		},
	},
	
	// the love is a lie, if you love you soon will cry.
	{
		p: /(^|[^е])(^|[^а-яё])люблю/i,
		m: 'react',
		r: '🤥',
	},
	
	// скройся/появись
	{
		d: true,
		p: /^ *(((ворот|верн|по(каж|яв))ись)|(с(кро|мо|ле)й|спрячь)ся)[,.?! ]*/i,
		r: (m) => {
			hidden = !m[2];
			setStatus();
			return true;
		},
	},
	
	
	// если просто призвали
	{
		d: true,
		p: /^/,
		r: (m, message, floodey) => {
			if (chance(0.4) && (!message.guild || !floodey)) {
				if (mentioned !== true) {
					// если не призывали, а написали в лс
					return;
				}
				return [
					'а?',
					'что?',
					'мм?',
					'зачем звал?',
					'ку-ку.',
					'привет.',
					'да ладно, можешь не призывать. Всё равно я ещё мало чего умею.',
				];
			} else {
				flags.r = 'react';
				return '👋 🖐 😑 😐 😁 🙃 🙄 😓 😪 😷 😶 🍌 📯 🎺 🏸'.split(' ');
			}
		},
	},
];

// капитализация и отправка
function capReply(message, text, flags) {
	if (Array.isArray(text)) {
		//if (Array.isArray(text[0])) {
		//	// set flag in array
		//	flags.r = text.shift()[0];
		//}
		text = text.pick();
	}
	
	if (!text || text === true) {
		return;
	}
	
	if (flags.r != 'react' && (flags.r != 'reply' || !message.guild)) {
		// Capitalizing
		text = text.slice(0, 1).toUpperCase() + text.slice(1);
	}
	
	switch (flags.r) {
		case 'reply': // reply w/ @mention
		return message.reply(text);
		case 'say': // just say
		return message.channel.send(text);
		case 'dm': // force private conversation
		return message.author.send(text);
		case 'react': // put a reaction instead
		return message.react(text);
		default: // error
		console.log('Unknown reply type:', flags.r);
	}
}

// чем отвечать будем
function checkReply(message, flags) {
	let mentioned = message.mentions.users.has(myId) || (!message.guild ? 'dm' : false);
	let lc = message.content.trim();
	let m = null;
	let now = Date.now();
	let floodey = message.guild && (floodless.indexOf(message.channel.id) != -1);
	
	cutOff = (m, lc) => (m.index ? (lc.slice(0, m.index) + ' ') : '') + lc.slice(m.index + m[0].length);
	
	// <@...> mentioning
	m = lc.match('<@' + myId + '>[,.?! ]*');
	if (m) {
		lc = cutOff(m);
	}
	
	// text name mentioning
	m = lc.match(/([,.?!] *|^)(крип(ушка|ак?|ер(аст)?)|creep(er|ah))([,.?!] *|$)/i);
	if (m) {
		mentioned = true;
		lc = cutOff(m);
	}
	
	// проверка по базе
	for (let item of responses) {
		// direct
		if (!mentioned && item.d === true) {
			continue;
		}
		// chance
		if (typeof item.c === 'number' && !chance(item.c)) {
			continue;
		}
		// check cooldown
		if (item.t && timestamps[item.t[0]] > now) {
			continue;
		}
		
		let m = lc.match(item.p);
		
		// indirect
		if (item.d === 'indirect' && !mentioned && m[0].length != lc.length) {
			continue;
		}
		
		let resp = item.r;
		
		// exec if function
		if (typeof resp === 'function') {
			resp = resp(found, message, floodey);
		}
		
		if (!resp) {
			continue;
		}
		
		// set cooldown
		if (item.t) {
			timestamps[item.t[0]] = now + item.t[1];
		}
		
		// method
		if (item.m) {
			flags.r = item.m;
		}
		
		return resp;
	}
}

function processMessage(message) {
	try {
		let flags = {
			r: 'reply', // reply with mentioning by default
		};
		// крипера ответ
		capReply(message, checkReply(message, flags), flags);

	} catch(e) {
		console.error(e);
		//wrecked = true;
		//message.reply(e.name + ': ' + e.message);
	}
}

// при сообщениях
client.on('message', message => {
	if (wrecked || message.system || message.author.bot || message.author.id == myId) {
		return;
	}
	
	try {
		
		if (typeof mus != 'undefined' && message.guild && mus[message.guild.id] && mus[message.guild.id].tid == message.channel.id) {
			//musicProcess(message);
			
			return;
		}
		
		// delay is necessary for correct message ordering
		// because sometimes bot is too fast
		setTimeout(processMessage, 80, message);
		
	} catch(e) {
		console.error(e);
		//wrecked = true;
		//message.reply(e.name + ': ' + e.message);
	}
});

// сразу, как зайдёт
client.on('ready', () => {
	console.log('I am ready!');
	setStatus();
});


client.login(myToken);


// Модуль для проигрывания музыки
// discord.js не смог, так что музыка через Discordie.

const Discordie = require('discordie');
var clientMusic = new Discordie({autoReconnect: true});
var debugMusic = true;

// данные о музыкальных каналах
let mus = {
	maxList: 20,
	'175951720990507008': {
		vid: '315439572710326284', // voice channel id
		tid: '315445827772481537', // text channel id
		vch: null, // voice channel object
		tch: null, // text channel object
		adding: false,
		list: [],
		skip: [],
		users: 0,
		c: null, // connection
		e: null, // encoder
		curr: null,
		stat: null,
	},
};

let musMsgLifespan = 5000;

const dl = require('youtube-dl');
const https = require('https');

clientMusic.connect({token: myToken});

clientMusic.Dispatcher.on("GATEWAY_READY", e => {
	clientMusic.User.setStatus('invisible');
	console.log('Discordie is ready!');
	//_f();
});

/*
function _f() {
	clientMusic.Channels.get("315439572710326284").join(false, false).then(c => {
		console.log('Connected.');
	}).catch(e => {
		console.log(e);
		_f();
	});
}
*/

clientMusic.Dispatcher.on("MESSAGE_CREATE", (e) => {
	const message = e.message;
	const content = message.content;
	const channel = message.channel;
	const guild = channel.guild;
	
	if (!guild) {
		return;
	}
	
	try {
		// бот должен игнорить себя
		if (ignores.indexOf(message.author.id) !== -1) {
			return;
		}
		
		if (!mus[guild.id] || mus[guild.id].tid != channel.id) {
			return;
		}
		
		let vch = guild.voiceChannels.find(c => c.id == mus[guild.id].vid);
		
		// debug test
		if (debugMusic && content == 'stop') {
			vch.leave();
			autoRemove(message);
			return;
		}
		
		if (debugMusic && content == 'join') {
			console.log('Started!!!');
			let vch = guild.voiceChannels.find(c => c.id == mus[guild.id].vid);
			vch.join(false, false).then((c) => {
				console.log('Joined!!!');
				var encoder = c.voiceConnection.createExternalEncoder({
					type: 'ffmpeg',
					format: 'mp3',
					source: 'https://saxifra.ga/123.mp3',
				});
				encoder.play();
				encoder.once('end', () => {
					console.log('Left!!!');
					vch.leave();
				});
			});
			autoRemove(message);
			return;
		}
		
		if (debugMusic && content == 'deaf') {
			console.log('Started!!!');
			let vch = guild.voiceChannels.find(c => c.id == mus[guild.id].vid);
			vch.join(false, true).then((c) => {
				console.log('Joined!!!');
				var encoder = c.voiceConnection.createExternalEncoder({
					type: 'ffmpeg',
					format: 'mp3',
					source: 'https://saxifra.ga/123.mp3',
				});
				encoder.play();
				encoder.once('end', () => {
					console.log('Left!!!');
					vch.leave();
				});
			});
			autoRemove(message);
			return;
		}
		
		if (debugMusic && content[0] == '$') {
			console.log('Started!!!');
			vch.join(false, false).then((c) => {
				try {
					console.log('Joined!');
					dl.getInfo(content.slice(1), ['--skip-download'], function (err, info) {
						if (err) {
							console.error(err);
						} else if (info) {
							console.log(info.url);
							var encoder = c.voiceConnection.createExternalEncoder({
								type: 'ffmpeg',
								format: 'pcm',
								source: info.url,
							});
							encoder.play();
							console.log('Now playing: "' + info.title + '"');
							channel.sendMessage('Крипер работает: "' + info.title + '"');
							encoder.once('end', () => {
								console.log('Left.');
								vch.leave();
							});
						}
					});
				} catch(e) {
					console.error(e);
					vch.leave();
				}
			});
			autoRemove(message);
			return;
		}
		
		// test
		if (message.content == '%%%') {
			debugMusic = false;
			autoRemove(message);
			return;
		}
		
		// обработка сообщения
		musicProcess(message);
	} catch(e) {
		console.log('Discordie Error!');
		console.error(e);
	}
});

// удаление сообщений через время
function autoRemove(message) {
	setTimeout(function() {
		message.delete();
	}, musMsgLifespan);
}

// ответ на запрос
function ret(cmus, result) {
	console.log('ret: ', result);
	result = String(result);
	if (!result) {
		return;
	}
	setTimeout(() => {
		cmus.tch.sendMessage(result).then(message => {
			autoRemove(message);
		});
	}, 150);
}

function encodeSearchQuery(q) {
	return encodeURIComponent(q).split('%20').join('+');
}

function decodeHTML(s) {
	return s.replace(/&#(\d{1,8});/g, function(a, b) {return String.fromCharCode(+b)});
}

function escMD(s) {
	return s.replace(/([`*~_\\])/g, '\\$1');
}

function musicProcess(message) {
	const channel = message.channel;
	const guild = channel.guild;
	
	const cmus = mus[message.guild.id];
	let uc = message.content.trim();
	let m;
	
	cmus.vch = guild.voiceChannels.find(c => c.id == cmus.vid);
	cmus.tch = channel;
	
	autoRemove(message);
	
	// play music
	//m = uc.match(/https?:\/\/[0-9a-zA-Z.\/?=%#_+-]+/);
	m = uc.match(/(youtu\.be\/|watch\?v=)([0-9a-zA-Z_-]+)/);
	if (m) {
		musicPut(message, m[2], -1);
		return;
	}
	
	// skip
	if (uc == '-') {
		//ret(cmus, 'Скип пока что ещё не готов, потом доделаю.');
		musicSkip(message);
		return;
	}
	
	// search
	m = uc.match(/^(?:\+([0-9]{0,2})|\?) +(.*)$/);
	if (m) {
		let pos = typeof m[1] == 'undefined' ? Math.floor(Math.random() * 25565) : +m[1];
		musicPut(message, m[2].trim(), pos);
		return;
	}
	
	// stop
	if (musicDebug && uc == 'kick') {
		musicStop(cmus);
		return;
	}
}

function musicSkip(message) {
	let cmus = mus[message.guild.id];
	
	if (!cmus.c || !cmus.curr) {
		return ret(cmus, 'Пропускать нечего, и так там ничего не играет.');
	}
	
	if (!cmus.vch.members.find(c => c.id == message.author.id)) {
		return ret(cmus, 'Эй, похоже, ты не слушаешь музыку. Зайди в голосовой канал `' + cmus.vch.name + '`.');
	}
	
	let already = cmus.skip.indexOf(message.author.id) != -1;
	if (!already) {
		cmus.skip.push(message.author.id);
	}
	
	cmus.users = cmus.vch.members.length;
	let need = Math.floor(cmus.users / 2);
	let len = cmus.skip.length;
	
	if (len >= need) {
		ret(cmus, 'Музыка скипнута.');
		if (cmus.e) {
			cmus.e.stop();
		}
		// event will be dispatched
	} else {
		if (already) {
			ret(cmus, 'Уже проголосовано. Попроси других пропустить (если они не против).');
		} else {
			ret(cmus, 'Голос учтён (' + len + ' / ' + need + ').');
		}
		musicUpdate(cmus);
	}
}

function musicPut(message, q, search) {
	let cmus = mus[message.guild.id];
	
	q = q.slice(0, 80);
	
	if (!q.length) {
		return;
	}
	
	console.log('"' + q + '", ' + search);
	
	cmus.users = cmus.vch.members.length;
	
	if (!cmus.vch.members.find(c => c.id == message.author.id)) {
		return ret(cmus, 'Эй, сначала зайди в голосовой канал `' + cmus.vch.name + '`, для кого я играть-то буду?');
	}
	
	if (cmus.list.length >= mus.maxList) {
		musicRejoin(cmus);
		return ret(cmus, 'Довольно добавлять, пусть сначала текущее доиграет.');
	}
	
	cmus.adding = true;
	
	message.guild.voiceChannels.find(c => c.id == cmus.vid).join(false, false).then((c) => {
		if (!cmus.adding && !cmus.c) {
			cmus.vch.leave();
		}
	}).catch(console.error);
	
	console.log('Continued...');
	
	if (search != -1) {
		// searching
		https.get('https://www.youtube.com/results?search_query=' + encodeSearchQuery(q), response => {
			console.log('Search results started...');
			let data = '';
			
			response.on('data', part => {
				data += part;
			});
			
			response.on('end', () => {
				cmus.adding = false;
				console.log('Search results ended...');
				if (+(response.statusCode) != 200) {
					return ret(cmus, 'Поиск провалился. Сервера ответ: ' + response.statusCode);
				}
				let pos = -1;
				if (search) {
					let arr = [];
					while ((pos = data.indexOf('context-item-id="', pos + 1)) != -1) {
						arr.push(pos);
					}
					if (arr.length) {
						pos = arr[search % arr.length];
					}
				} else {
					pos = data.indexOf('context-item-id="', 0);
				}
				if (pos == -1) {
					return ret(cmus, 'Ничего не нашлось по данному запросу.');
				}
				let piece = data.substr(pos, 9000);
				let link = piece.match(/"([^"]+)"/)[1];
				let title = decodeHTML(piece.match(/yt-uix-tile-link[^>]+>([^<]*)</)[1]);
				let author = decodeHTML(piece.match(/g-hovercard[^>]+>([^<]*)</)[1]);
				musicPush(cmus, link, message.author, title, author);
			});
			
			response.on('error', err => {
				cmus.adding = false;
				console.log('Can\'t load search results: ');
				console.error(err);
				return ret(cmus, 'Упс, во время поиска что-то оборвалось.');
			});
		});
	} else {
		// direct video url
		https.get('https://www.youtube.com/embed/' + q, response => {
			console.log('Request started...');
			let data = '';
			
			response.on('data', part => {
				data += part;
			});
			
			response.on('end', () => {
				cmus.adding = false;
				console.log('Request ended...');
				if (+(response.statusCode) != 200) {
					return ret(cmus, 'Запрос провалился. Сервера ответ: ' + response.statusCode);
				}
				let title = decodeHTML(data.match(/<title>([^<]*)</)[1]);
				//let author = decodeHTML(piece.match(/g-hovercard[^>]+>([^<]*)</)[1]);
				musicPush(cmus, q, message.author, title, "...");
			});
			
			response.on('error', err => {
				cmus.adding = false;
				console.log('Can\'t load search results: ');
				console.error(err);
				return ret(cmus, 'Упс, во время поиска что-то оборвалось.');
			});
		});
	}
}

function musicPush(cmus, url, user, title, author) {
	cmus.list.push({
		title: title,
		user: user,
		author: author,
		url: url,
	});
	
	ret(cmus, 'Добавлено в очередь: ' + title);
	
	musicRejoin(cmus);
	musicUpdate(cmus);
}

function musicRejoin(cmus) {
	if (!cmus.c) {
		console.log('Rejoining...');
		cmus.c = 'pending';
		
		// connection bugs or lags
		cmus.vch.join(false, false).then(c => {
			console.log('Rejoined.');
			cmus.c = c.voiceConnection;
			cmus.users = cmus.vch.members.length;
			try {
				musicPlay(cmus);
				console.log('Set to play.');
			} catch(e) {
				ret(cmus, 'Упс, не получилось поставить.');
				console.log('Failed to play the music.');
				console.error(e);
				musicPlay(cmus);
			}
		}).catch(e => {
			ret(cmus, 'Ауч, я споткнулся о ступеньку, когда заходил в канал.');
			console.log('Failed to join voice channel.');
			console.error(e);
			musicStop(cmus);
		});
	}
}

function musicPlay(cmus) {
	if (cmus.list.length == 0) {
		ret(cmus, 'Музыка закончилась, выхожу из канала.');
		musicStop(cmus);
		return;
	}
	
	cmus.curr = cmus.list.shift();
	cmus.skip = [];
	console.log('> [https://youtu.be/' + cmus.curr.url + ']');
	
	dl.getInfo('https://www.youtube.com/watch?v=' + cmus.curr.url, ['--skip-download'], function (err, info) {
		if (err || !info) {
			console.error(err);
			ret(cmus, 'Упс, не удалось получить стрим ' + cmus.curr.url);
			musicPlay(cmus);
		} else if (info) {
			musicConnect(cmus, info);
		}
	});
}

function musicConnect(cmus, info) {
	//console.log(info.url);
	if (cmus.e) {
		cmus.e.destroy();
	}
	var encoder = cmus.e = cmus.c.createExternalEncoder({
		type: 'ffmpeg',
		format: 'pcm',
		source: info.url,
	});
	encoder.play();
	console.log('Now playing: "' + info.title + '"');
	ret(cmus, 'Сейчас играет музыка "' + info.title + '"');
	encoder.once('end', () => {
		console.log('Music ended.');
		cmus.curr = null;
		musicPlay(cmus);
	});
	encoder.on('error', (e) => {
		console.log('Encoder error: ' + e);
		cmus.curr = null;
		musicPlay(cmus);
	});
}

function musicStr(item) {
	return escMD(item.title) + ',\n<https://youtu.be/' + item.url +
	'>,\nдобавлено пользователем ' + escMD(item.user.nick || item.user.username) + '.';
}

function musicUpdate(cmus) {
	if (!cmus.c) {
		return;
	}
	
	let ctext = 'Текущее: ' + (cmus.curr ? musicStr(cmus.curr) : '<пусто>') + '\n';
	
	cmus.users = cmus.vch.members.length;
	
	console.log(cmus.members);
	
	if (cmus.skip.length) {
		ctext += 'За пропуск проголосовали: ' + cmus.skip.length + ' из ' + Math.floor(cmus.users / 2) + '.\n'
	}
	
	ctext += '\n';
	
	ctext += 'Очередь: [' + cmus.list.length + ' / ' + mus.maxList + ']';
	if (cmus.list.length) {
		for (let i = 0; i < cmus.list.length; i++) {
			ctext += '\n' + (i + 1) + ') ' + musicStr(cmus.list[i]);
		}
	} else {
		//ctext += ' <пусто>';
	}
	
	ctext += '\n\nС командами всё просто:';
	ctext += '\n"**<ссылка на видео в YouTube>**" ― поставить музыку из видео.';
	ctext += '\n"**+ <название>**" ― ищет в YouTube, выбирает первое найденное.';
	ctext += '\n"**? <название>**" ― ищет в YouTube, рандомно с 1 страницы поиска.';
	ctext += '\n"**-**" ― проголосовать за пропуск того, что сейчас играет.';
	ctext += '\n"**@**" ― пробный заход бота в канал, just 4 test.';
	
	//ctext = '```\n' + ctext + '\n```';
	
	musicRetext(cmus, ctext);
}

function musicRetext(cmus, ctext) {
	if (cmus.stat && cmus.stat.then) {
		cmus.stat.then(message => {
			return cmus.stat.edit(ctext);
		}).catch(console.error);
		return;
	}
	
	if (cmus.stat) {
		return cmus.stat = cmus.stat.edit(ctext);
	} else {
		return cmus.stat = cmus.tch.sendMessage(ctext).then(message => {
			return cmus.stat = message;
		}).catch(console.error);
	}
}

function musicRemember(cmus) {
	
}

function musicStop(cmus) {
	try {
		if (cmus.c) {
			if (cmus.e) {
				cmus.e.stop();
				cmus.e.destroy();
				cmus.e = null;
			}
			cmus.c = null;
			cmus.curr = null;
			cmus.list = [];
			cmus.skip = [];
			cmus.vch.leave();
			musicUpdate(cmus);
		}
	} catch(e) {
		console.error(e);
	}
}
