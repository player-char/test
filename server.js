// Дискорд-бот "Крипушка"

(function() {
var Discord = require('discord.js');
var client = new Discord.Client();

var https = require('https');
var http = require('http');

var myToken = process.env.BOT_TOKEN;

// инициализация
var myId = '311163859580747778';
// floodless channels
var floodless = [
	'175956780398936065',
];
// user ids to ignore
var ignores = [
	myId,
];
var wrecked = false;
var hidden = false;
var timestamps = {
	norm: -Infinity,
	good: -Infinity,
};

var floodeys = {}; // объект для запоминания
var floodrate = 5; // штрафных секунд за сообщение
var floodmax = 20; // штрафных секунд для получения игнора
var floodchills = 2; // сколько чиллаутов писать перед игнором

var since = Date.now();
var statLaunches = +!!statLaunches + 1;
var stat = {
	readCount: 0,
	replyCount: 0,
	readCountDM: 0,
	replyCountDM: 0,
	chillCount: 0,
	mentionCount: 0,
	errorCount: 0,
	timeSum: 0,
	timeMax: 0,
	timeLast: 0,
	waitMax: 0,
	waitLast: since,
};

// выдаёт true с указанным шансом
function chance(a) {
	return Math.random() < a;
}

// вытаскивание элемента из массива
Object.defineProperty(Array.prototype, 'pick', {value: function(rand) {
	if (typeof rand == 'undefined') {
		// тупо рандомно
		return this[Math.floor(this.length * Math.random())];
	} else {
		// по остатку
		return this[rand % this.length];
	}
}});

// формы множественного числа
function pluralize(n, arr) {
	let k = n % 10;
	return arr[(n - k) / 10 % 10 != 1 ? (k != 1 ? ([2, 3, 4].includes(k) ? 1 : 2) : 0) : 2];
}

var months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

// приблизительное время создания снежинки
function sfTime(s) {
    return new Date(1420070400000 + s / 4194304);
}

var timezoneOffset = 3;
var timezoneSuffix = ' МСК';

// читабельное числовое время в текущей таймзоне
function dateStr(d) {
	if (!d.toJSON) {
		d = new Date(d);
	}
	d.setHours(d.getHours() + timezoneOffset);
	return d.toJSON().split(".")[0].replace(/T/, ' ') + timezoneSuffix;
}

// словесное описание дня
function dateDay(d) {
	return d.getDate() + '-го ' + months[d.getMonth()] + ' ' + d.getFullYear() + ' года';
}

// разница между таймстемпами словами
function dateDiff(diff, plain) {
	// предполагается, что промежуток должен быть > 0
	//let diff = d2 - d1;
	
	let tarr = [1000, 60, 60, 24, Infinity];
	for (let i in tarr) {
		let x = tarr[i];
		tarr[i] = diff % x;
		diff = (diff - tarr[i]) / x;
	}
	
	tarr.shift(); // убираем миллисекунды
	
	let warr = plain ? [
		['секунда', 'секунды', 'секунд'],
		['минута', 'минуты', 'минут'],
		['час', 'часа', 'часов'],
		['сутки', 'суток', 'суток'],
	] : [
		['секунду', 'секунды', 'секунд'],
		['минуту', 'минуты', 'минут'],
		['час', 'часа', 'часов'],
		['сутки', 'суток', 'суток'],
	];
	let sarr = [];
	
	for (let i = 3; i >= 0; i--) {
		if (!tarr[i]) {
			continue;
		}
		sarr.push(tarr[i] + ' ' + pluralize(tarr[i], warr[i]));
	}
	
	return sarr.join(', ');
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
	console.log(Date() + '| Hidden:', hidden);
	if (hidden) {
		client.user.setGame(null);
		client.user.setStatus('invisible');
	} else {
		client.user.setStatus('online');
		//client.user.setGame('Discord');
		client.user.setPresence({game: {name: 'Discord', type: 0}});
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
var responses = [
	
	// p: pattern
	// m: method (flags.r)
	// c: chance 0.0...1.0
	// d: direct {false (default) / true / 'indirect' (if mentioned or the phrase is clear)}
	// r: response (string or function)
	// t: timed cooldown ['timestamp_name', timeout]
	
	// creeper's response
	{
		p: /^ ?не([ат])$/i,
		r: (m) => 'крипера отве' + m[1].toLowerCase() + '.',
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
		p: /(^|[^а-яё])(а|и) что[?!. ]*$/i,
		r: (m) => m[2].toLowerCase() + ' то.',
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
	
	// nastey words end
	{
		p: /(^|[^а-яё])[бм]лять[?!.,]*$/i,
		r: 'нехорошо такие слова употреблять.',
	},
	// nastey words
	{
		p: /((^|[^а-яё])(([саоув]|(пр|[дзвпн])[аеёиыяюе]|(р[ао]|в)[сз]|[оа]т)?(ху[йеяюиё]|п[иеёюй]з[жд]|др(оч|ач(?!л))|п[ие]д[ои](?!н))|([её]|йо)б|муд[аеёиыяюо]|[бм]л(я|э(?![кс]))|([её]|йо)пт)|[ьъоаеёу]([её]|йо)б|(fu|di)ck)/i,
		r: 'please, be polite!',
	},
	// dirtey words
	{
		p: /(^|[^а-яё])((по|на|за|вы|у|про)?(си?ра[тлчкш]|сри(^|[^а-яё]|т))|д[еёи]рьм|г[оа]ве?н|ж[оеё]п|(на|за|вы|об|раз)?бл[её]в|shit)/i,
		m: 'react',
		r: '🚽',
	},
	// bad words
	{
		p: /(^|[^а-яё"'`])[тв]ы[^а-яё]*(д(ау|ове)н|кр[ие]тин|свол[ао]ч|ид[ие]от|мраз|ло[хш]|ублюд|дур[аоеё]|д[еи]б[еи]л)/i,
		r: 'прости, но обзываться нехорошо.',
	},
	// dog words
	{
		p: /(^|[^а-яё])сук[аиеу]/i,
		m: 'react',
		r: '🐕',
	},
	{
		p: /(^|[^а-яё])щено?к/i,
		m: 'react',
		r: '🐶',
	},
	// baby bottle
	{
		p: /(^|[^а-яё])([зн]а|о[тб]|вы?|по)с[оа]с(?!иск)[иау]|suck/i,
		m: 'react',
		r: '🍼',
	},
	// aster*xx
	{
		p: /(^|[а-яёa-z0-9 -?@`\[-\]^_{-~])\\?\*[а-яёa-z]|[а-яёa-z]\\?\*([а-яёa-z0-9 -?@`\[-\]^_{-~]|$)/i,
		m: 'dm',
		r: (m) => {
			let t = m.input;
			t = t.replace(/(^|[^\\])\*\*(?=\S)(.*?\S)\*\*/ig, '$1$2');
			t = t.replace(/(^|[^\\])\*(?=\S)(.*?\S)\*/ig, '$1$2');
			t = t.replace(/^\\?\*|\\?\*$/ig, '');
			//console.log(m.input, '->', t);
			if (t.match(/(^|[а-яёa-z0-9 -?@`\[-\]^_{-~])\\?\*[а-яёa-z]|[а-яёa-z]\\?\*([а-яёa-z0-9 -?@`\[-\]^_{-~]|$)/i)) {
				return '```\nЗакрывать мат звёздочкой всё равно что отсасывать на красной площади, прикрываясь ладонью.\n(c) Godzii```';
			}
		},
	},
	
	// ((скобки))
	{
		p: /^([^(]*(^|[^(:;x-])\)+(0|н[оу]ль)*|[^)]*(^|[^):;x-])\(+(9|девять)*)$/i,
		r: 'ты нарушаешь баланс скобок, остановись!',
	},
	
	// вообще в общем
	{
		p: /вообщем/i,
		r: 'нет слова "вообщем", есть только слова "в общем" и "вообще".\nА за написание "вообщем" на старом РандомКрафте модераторы давали кик.',
	},
	
	// dank words
	{
		p: /(^|[^а-яё])(сми[щш]но|дратут|пр[еюяё]й?ве[тд]|узбаг|ниасил)/i,
		m: 'react',
		r: '💉',
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
		p: /(^|[^а-яё])(всем )?((добр|спокойн)ой ночи|(добры|хороши|приятны|сладки)х снов)( всем)?[,.?! ]*/i,
		d: 'indirect',
		r: [
			'спокойной ночи!',
			'спокойной ночи.',
			'доброй ночи!',
			'доброй ночи.',
			'добрых снов!',
		],
	},
	
	// прощание
	{
		p: /(^|[^а-яё])(всем )?(пока(?=([^а-яё]|$))|прощай|до (свидан[иь]я|скорой( встречи)?|встречи))( всем)?[,.?! ]*/i,
		d: 'indirect',
		r: () => {
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
		p: /(^|[^а-яё])((всем )?(привет((-привет)+|ствую( (тебя|вас))?)?|здравствуй(те)?|добр(ое утро|ый день|ый вечер)|ку-?ку)( всем)?)[,.?! ]*/i,
		d: 'indirect',
		r: (m) => {
			if (m[2].toLowerCase().endsWith('вет') && chance(0.12)) {
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
	
	// аппетит
	{
		p: /(^|[^а-яё])(я|мы) ([а-яёa-z -]+ )?(е(ди)?м|(куш|завтрак|обед|ужин)а(ю|ем)|в (столовой|ресторане|кафе|закусочной))/i,
		r: 'приятного аппетита!',
	},
	
	// norm
	{
		p: /(^|[^а-яё])нормально([^а-яё]|$)/i,
		r: 'нормально или хорошо?',
		t: ['norm', 75000],
	},
	// good
	{
		p: /(^|[^а-яё])хорошо([^а-яё]|$)/i,
		r: 'хорошо или замечательно?',
		c: 0.6,
		t: ['good', 75000],
	},
	
	// bug
	{
		p: /(^|[^а-яё])не( ?(совсем|очень) )?( ?((правиль|коррект|вер|точ)но|так))? ?работа[еюи]т/i,
		m: 'react',
		r: '🐛',
	},
	
	// кукареку
	{
		p: /ку-?ка-?ре-?ку|(^|[^а-яё])п[еи]ту([хч]([иае]|ей|ов)?|ш([оеё]к|к[иау]))([^а-яё]|$)/i,
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
		p: /(^|(?:реши(?: выражение| пример)|сколько(?: будет)?|(?:вы|[пс]о)считай|вычисли) `{0,3})([ ()0-9.*\/^+-]*[0-9][ ()0-9.*\/^+-]*[*\/^+-][ ()0-9.*\/^+-]*[0-9][()0-9.*\/^+-]*)/i,
		r: (m, flags, floodey) => {
			let expression = m[2].trim().replace(/\^/g, '**');
			if (!m[1] && expression.match(/^[0-9]+([\/-][0-9]+){1,2}\.?$/)) {
				// 1-2, 24/7, 2017-08-18 решать не надо
				return false;
			}
			try {
				let result = eval(expression); // eval = evil
				if (typeof result === 'number') {
					if (floodey) {
						flags.r = 'dm';
					}
					return String(parseFloat(result.toPrecision(15)));
				}
			} catch(e) {}
		},
	},
	
	// gimme
	{
		p: /(?:^|[^а-яё])(?:вы)?дай(?:те)?(?: мне)? +([0-9]*)(?: штук[иу]? )? *([0-9а-яёa-z '"&-]*)/i,
		r: (m, flags, floodey, message) => {
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
		r: ['он вам не Драгон.', '#ОнВамНеДрагон'],
	},
	
	// /help
	{
		d: true,
		p: /^ ?(\/help|(покажи )?(список команд|команды)( в студию)?)[?!. ]*$/i,
		r: 'списка команд нет. Но если хочешь, то вот:\n'
		+ '\n`Крипер, голос!` - проиграть звук крипака в рандомном канале.'
		+ '\n`Крипер, фас <username>` - забанить юзера к криперам зелёным.'
		+ '\n`Крипер, ку-ка-ре-ку!` - рандомный забавный факт о петухах.'
		+ '\n`Крипер, дай список команд` - даровать список команд по боту.'
		+ '\n`Крипер, eval <statement>` - неклассическая игра в змейку.'
		+ '\n`Крипер, ты кто?` - показать версию и имя автора.',
	},
	
	// короткие фразы
	{
		d: true,
		p: /^ *([тв]ы )?ч((т|ег)?о|[её])[?!. ]*$/i,
		r: (m) => (m[1] ? 'я ' : '') + 'нич' + (!m[2].match(/то/) ? m[2].toLowerCase() : 'его') + ' (:',
	},
	
	{
		d: true,
		p: /^ *как[?!. ]*$/i,
		r: 'а вот так!',
	},
	{
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
		r: '😋 😛 😝 😑 😷'.split(' '),
	},
	
	// иди в/на
	{
		d: true,
		p: /^ *(иди|п[оа]ш[ёео]л|проваливай|вали|шагай|топай|давай|дуй|) (в|на|к) ?[а-яёa-z]+/i,
		r: 'считай, что я там уже побывал.',
	},
	// getting out
	{
		d: true,
		p: /^ *(от((ста|вя)нь|вали)|вон|проваливай|брысь|прочь|п[оа]ш[ёео]л|у(й|х[оа])ди)([^а-яё]|$)/i,
		r: 'нет, не уйду, я наивный.',
	},
	
	// halting down
	{
		d: true,
		p: /^ *(перестань|остановись|прекрати|хватит|не (н(ад|ужн)о|стоит)|нет смысла|бессмысленно)([^а-яё]|$)/i,
		r: (m) => m[1].toLowerCase() + ' писать "' + m[1].toLowerCase() + '".',
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
			if (m[1].match(/([ыои]й|[ая]я|[ое][её])$/i)) {
				return (m[1] == 'наивный' ? 'да' : 'нет') + ', я наивный.';
			}
		},
	},
	
	// совсем уже вообще того что ли?
	{
		d: true,
		p: /^ *([тв]ы )?((совсем|в(о[оа]?б|а)ще|того) ?)+/i,
		r: 'нет, я в порядке, тебе померещилось.',
	},
	
	// видно - обидно
	{
		d: true,
		p: /(^|[^а-яё])там видно будет/i,
		r: 'видно-то сейчас видно, а там промажешь — будет обидно!',
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
		m: 'say',
		r: (m) => {
			let obj = (m[1] == 'table' ? '┳━┳' : '[DATABASE]');
			let jbo = (m[1] == 'table' ? '┻━┻' : '[ꓱꓢꓯꓭꓯꓕꓯꓷ]');
			return [
				obj + ' ノ(˚-˚ノ)\n\n(╯°д°）╯︵ ' + jbo,
				'(㇏˚-˚)㇏ ' + obj + '\n\n' + jbo + '︵ ╰(°д°╰)',
				jbo + 'ミ㇏(ಠ益ಠ)ノ彡' + jbo,
			];
		},
	},
	
	// скинь фотку
	{
		d: true,
		p: /(^|[^а-яё])(с?кинь|(дай|можно|изволь) (посмотреть|увидеть|глянуть)) ([ст]во[юеё] )?фот(о|ку|ографию)( крип(ер|ак)а)?/i,
		m: 'dm',
		r: {text: 'держи:', files: [{attachment: 'http://i.imgur.com/MnncBu7.jpg', name: 'creeper.png'}]},
	},
	// скинь скрин
	{
		d: true,
		p: /(^|[^а-яё])(с?кинь|(дай|можно|изволь) (посмотреть|увидеть|глянуть)) скрин(шот)?( в лс)?[!.]+$/i,
		m: 'dm',
		r: {text: 'держи:', files: [{attachment: 'http://i.imgur.com/xVUZdmX.jpg'}]},
	},
	// скинь имг
	{
		d: true,
		p: /(^|[^а-яё])(с?кинь|(дай|можно|изволь) (посмотреть|увидеть|глянуть)) имг([^а-яё]|$)/i,
		m: 'dm',
		r: {text: 'держи:', files: [{attachment: 'http://i.imgur.com/EtYNSfz.png'}]},
	},
	
	// как настроение?
	{
		d: true,
		p: /(^|[^а-яё])как(ое)? (тво[еёя] |у тебя )?(настроение|жизнь)/i,
		r: () => 'замечательно' + ['.', '!', ' :)', ' c:', ' (:'].pick(),
	},
	// что делаешь?
	{
		d: true,
		p: /(^|[^а-яё])(что (ты )?(сейчас )?делаешь|чем (ты )?(сейчас )?зан(ят|имаешься))[?! ]*$/i,
		r: 'отвечаю на твоё сообщение.',
	},
	// как дела?
	{
		d: true,
		p: /(^|[^а-яё])как (твои |у тебя )?дела[?! ]*$/i,
		r: () => 'как сажа бела ' + [':)', '(:'].pick(),
	},
	// что не так?
	{
		d: true,
		p: /(^|[^а-яё])что (с тобой |у тебя )?не так[?! ]*$/i,
		r: 'всё так.',
	},
	// что с тобой?
	{
		d: true,
		p: /(^|[^а-яё])что с тобой[?! ]*$/i,
		r: 'со мной всё в порядке.',
	},
	// где пропадал?
	{
		d: true,
		p: /(^|[^а-яё])где (ты )?(((поза)?вчера|до этого|раньше|утром|днём) )?пропадал[?! ]*$/i,
		r: 'там-то я и пропадал, где Гетап Кастит продал.',
	},
	// кто ты?
	{
		d: true,
		p: /(^|[^а-яё])(кто [вт]ы|[вт]ы кто)( вообще)?( такой( вообще)?)?[?!. ]*$/i,
		r: 'неужели ты ещё не знаешь?',
	},
	// ты ж крипер
	{
		d: true,
		p: /^ *((#)?((ну ?)?(да ?)?ты ?(же? ?)?(и ?)?крип((ер|ак)(аст)?|(уш|онь)ка)))[?!. ]*$/i,
		r: (m) => m[1].toLowerCase().replace('ты', 'я') + (m[2] ? '' : '!'),
	},
	// когда др?
	{
		d: true,
		p: /(^|[^а-яё])(когда|какого числа) ((у тебя|тво[йёе]) )?(день рожден[иь]я|днюха|др)[?!. ]*$/i,
		r: () => dateDay(sfTime(myId)) + '.',
	},
	// когда я зарегался?
	{
		d: true,
		p: /(^|[^а-яё])(когда|какого числа) я( (тут|здесь|в (дискорде|discord('е)?)))? (была? )?зарег(истриров)?а(на?|л(ся|ась))( (тут|здесь|в (дискорде|discord('е)?)))?[?!. ]*$/i,
		r: (m, flags, floodey, message) => '**`' + dateStr(sfTime(message.author.id)) + '`**',
	},
	// когда зарегано?
	{
		d: true,
		p: /(^|[^а-яё])(когда|какого числа) (был[ао]? |ты )?((зарег(истриров)?|созд|сдел)а(н[ао]?|л(и|ся|[аои]сь)))( (пользователь|юзер|канал|снежинка|id))?\s+(\\?<?\\?(@[!&]?|#|:[^:]+:)?(\d{1,20})>?)?[?!. ]*$/i,
		r: (m, flags, floodey) => {
			let id = m[13];
			if (!id || id == myId) {
				return 'когда мне в майн играть надоело.';
			}
			let t = sfTime(id);
			if (floodey) {
				flags.r = 'dm';
			}
			if (!(t.getHours() >= 0)) {
				return 'упс, что-то цифры обкурились немножко.';
			}
			return '**`' + dateStr(t) + '`**';
		},
	},
	// го играть?
	{
		d: true,
		p: /(^|[^а-яё])(давай|по(йд[ёе]м|шли)|го|иди) ((по)?и|сы)гра(й|ть|ем) (в|на) (?!(дискорд|discord))[a-яёa-z0-9]+/i,
		r: 'погоди немного, сейчас в Дискорд доиграю.',
	},
	// игра?
	{
		d: true,
		p: /(^|[^а-яё])(в какую игру|во что) (ты )?(сейчас )?играешь[?! ]*$/i,
		r: () => 'в ' + [
			'Дискорд',
			'зафлуживание этого канала',
		].pick() + '.',
	},
	// что умеешь?
	{
		d: true,
		p: /(^|[^а-яё])(что (ты )?умеешь[?! ]*$|(ты )?умеешь [а-яё]+)/i,
		r: 'откуда мне знать, что я умею? Я же не могу увидеть смысл своих действий.',
	},
	// что знаешь?
	{
		d: true,
		p: /(^|[^а-яё])(что|сколько|как много|много ли) (ты )?(не )?знаешь[?! ]*$/i,
		r: 'откуда мне знать, что я знаю?',
	},
	// на чём работаешь?
	{
		d: true,
		p: /(^|[^а-яё])на (чём|како(й энергии|м топливе)) (ты )?(сейчас )?работаешь[?! ]*$/i,
		r: 'на энергии, которую ты тратишь, набирая свои сообщения.',
	},
	// язык?
	{
		d: true,
		p: /(^|[^а-яё])на каком языке (программирования )?(ты )?(работаешь|написан)[?! ]*$/i,
		r: 'на JavaScript.',
	},
	
	// адрес?
	{
		d: true,
		p: /(^|[^а-яё])где (ты )?(сейчас )?(((обит|пр?ожив)ае|живё)шь|находишься)[?! ]*$/i,
		r: 'на сервере.',
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
	
	// девушка?
	{
		d: true,
		p: /(^|[^а-яё])(у тебя есть|есть ли у тебя|кто твоя) (девушк|жен|подружк)[аиы][?! ]*$/i,
		r: 'как вы себе представляете повседневную жизнь с девушкой-сервером?',
	},
	
	// профессия?
	{
		d: true,
		p: /(^|[^а-яё])(кем (ты )?работаешь|какая (у тебя )?(профессия|работа|должность))[?! ]*$/i,
		r: 'Floodey bot.',
	},
	// зарплата?
	{
		d: true,
		p: /(^|[^а-яё])(сколько (тебе )?платят( тебе)?|какая (у тебя )?зарплата)( на (твоей )?работе)?[?! ]*$/i,
		r: 'мне не нужна зарплата, чтобы писать всякий бред.',
	},
	
	// еда?
	{
		d: true,
		p: /(^|[^а-яё])((что|какую (еду|пищу)) ты (у?потребля)?ешь|чем ты питаешься)[?! ]*$/i,
		r: 'я питаюсь копиями твоих сообщений, так что не пиши бред, ладно?',
	},
	
	// создатель?
	{
		d: true,
		p: /(^|[^а-яё])кто( такой)? (тебя с(озда(ва)?|дела)л|созда(ва)?л тебя|тво[йи] создател[ьи])[?! ]*$/i,
		r: 'меня создал сервер в виде абстрактной модели в виртуальной памяти.',
	},
	// написан?
	{
		d: true,
		p: /(^|[^а-яё])(тебя написал|написал тебя|ты написан)([^а-яё]|$)/i,
		r: 'я тебе не школьное сочинение, не надо тут обсуждать моё написание!',
	},
	
	// сдайся
	{
		d: true,
		p: /(^|[^а-яё])сда(ва)?й(ся| себя)/i,
		r: 'я тебе не школьное сочинение, я тебе дам меня сдавать!',
	},
	
	// смысл жизни
	{
		d: true,
		p: /(^|[^а-яё])(в чём|како[вй]) смысл( у)? ж[иы]зни[?! ]*$/i,
		r: '¯\\\_(ツ)\_/¯',
	},
	
	// взорвись
	{
		d: true,
		p: /(^|[^а-яё])((вз|под|над)орви(сь)?|(бомба|бабах)ни)([^а-яё]|$)/i,
		r: 'я тебе не террорист-криперрист.',
	},
	
	// отдохни
	{
		d: true,
		p: /(^|[^а-яё])(отдохни|расслабься|поспи|(иди|давай|п[оа]ш[ёео]л) спать)([^а-яё]|$)/i,
		r: 'только работа 24/7, только хардкор!',
	},
	
	// скажи "кастит"
	{
		d: true,
		p: /^ *скажи ['"`]?([а-яёa-z0-9 ]+)/i,
		r: (m) => (m[1].toLowerCase() != 'не хочу') ? 'не хочу.' : 'не буду.',
	},
	
	// не о чем разговаривать
	{
		p: /(^|[^а-яё])(мне|нам)( с тобой)?( (больш|уж)е)? не(чего| ?о ?чем) (разговарива|говори)ть([^а-яё]|$)/i,
		r: 'разве так сложно придумать тему для разговора?',
	},
	
	// ты бот?
	{
		d: true,
		p: /(?:^|[^а-яё])[вт]ы,? (?:часом,? )?(?:не )?(((?:ро)?бот|скрипт)[а-яё]*)/i,
		r: (m) => (m[1] == 'скрипт' ? 'да' : 'нет') + ', я скрипт.',
	},
	
	// футгол
	{
		d: true,
		p: /(^|[^а-яё])(гол|болеешь|забей)([^а-яё]|$)/i,
		r: 'извини, травмоопасными видами спорта не увлекаюсь.',
	},
	
	// че сказал?
	{
		d: true,
		p: /(^|[^а-яё])ч(то|[оеё]) (ты )?(мелешь|с?молол|несёшь|сказал|говори(шь|л))[?! ]*$/i,
		r: (m) => {
			let verb = m[4].toLowerCase();
			if (verb.match(/м[ео]л/i)) {
				return 'если бы я был мельницей, я бы определённо молол зерно.';
			}
			if (verb == 'несёшь') {
				return [
					'двойку в портфеле я несу.',
					'службу я несу.',
				];
			}
			return 'ничего (:';
		},
	},
	
	// как долго онлайн
	{
		d: true,
		p: /(^|[^а-яё])(как д(авн|олг)о|сколько( времени)?)( уже)? (ты( уже)? )?(онлайн|работаешь|запущен)( уже)?[?! ]*$/i,
		r: () => {
			let now = new Date();
			return 'я онлайн уже ' + dateDiff(+now - since) + '.\n'
			+ 'Время на моих часах при запуске:\n`' + dateStr(since) + '`.\n'
			+ 'Время на моих часах сейчас:\n`' + dateStr(now) + '`.';
		},
	},
	
	// любишь ...?
	{
		d: true,
		p: /^ *((ты )?любишь [а-яё]+|[а-яё]+ любишь[?! ]*$)/i,
		r: 'кориандр люблю.',
	},
	
	// анекдот
	{
		d: true,
		p: /(^|[^а-яё])(расскажи(-ка)?|с?кинь) (нам |мне )?анекдот/i,
		r: 'увы, по-настоящему смешных анекдотов пока не наблюдал.',
	},
	
	// почему?
	{
		d: true,
		p: /^ *(?:(?:не )?знаешь, )?почему ?([0-9а-яёa-z '",~:%<>*&#=+-]*)/i,
		r: (m) => {
			let h = hashie(m[1].toLowerCase());
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
		r: (m, flags, floodey, message) => {
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
				'(лайм[оа0]н|laim[o0]n)': 'Лаймон — создатель Лаймстудии, ЛаймХрома и ЛаймОС, а также ЛаймМобиля, ЛаймШопа, ЛаймКоина и ЛаймСити.',
				'(хайв[оа]н|haiv[o0]n)': 'Красный Олень.',
				'(вас[яю]|vasya)': 'Вася — нынешний админ РандомКрафта.',
				'([ксз][оа]лум[бп]|c[o0]lumb)': 'Колумб — некогда бывший администратор РандомКрафта, похищенный эндерменом.',
				'(бума(г|жк)а|paper)': 'Бумага — средство для хранения аналоговой информации посредством нанесённых на неё цветных веществ.',
				'(авиум|avium)': '🐦🌄.',
				'(rainbolt ?dash|danetnavern0|eggman|эгг?ман)': 'это кодер, на котором держится весь РандомКрафт.',
				'(дискорд|discord)': 'Дискорд — место, где мы обитаем.',
				'(рутс?чи|rutschi)': 'а, это тот, кто на совках тащит.',
				'(ревкти|rewqty)': 'Ревкти — специалист по осознанным сновидениям.',
				'(гетап|getup)': () => {
					if (chance(0.4) && customReact(message, 'orangeCaster')) {
						return true;
					}
					return 'Гетап — каститизатор Земель Рандомских.';
				},
				'(оранж|кастер)': () => {
					flags.r = 'react';
					return '🍹';
				},
				'(кастит|castit)': 'CastIT — полузаброшенный сайт Гетапа, на котором пылятся его недоделанные проекты.',
				'(рандомия|randomia)': 'Рандомия — игра Гетапа, которая что-то вот никак не выйдет.',
				'сметан': 'сметана вкусная.',
				'(кролик|bunny|rabbit)': 'кролик — зверь, потребляющий морковку, капусту, а также прочие ресурсы фермеров.',
				'(саку[яюи]|идзаёи)': 'Сакуя Идзаёи — горничная в поместье Алой Дьяволицы.',
				'(крип(ер|ак)|creeper)': 'крипер — зелёный монстр из майнкрафта.',
				'(монстр|monster)': 'монстр — мистическое существо с ужасающими особенностями внешности и/или поведения.',
				'(м(айн|ине)[кс]рафт|minecraft)': 'Minecraft — игра, без которой меня бы не было.',
				'(л(ай|и)кобск|likobsk)': () => 'Лайкобск — город, свободный от ' + ['курения', 'коробкофобов', 'овцемобилей', 'гриферства'].pick() + '.',
				'(л(ай|и)коб|lik0oob)': 'Лайкоб — основатель города Лайкобск и глава АЦСГ.',
				'(ацсг|acsg)': 'ACSG — недоразвалившаяся группировка по борьбе уже непонятно с чем.',
				'околорандом': 'Околорандомье — миры, окружающие РандомКрафт и его сообщество.',
				'(хаос ?крафт|chaos ?craft)': () => 'ХаосКрафт — сервер, ' + [
					'телепортировавшийся из майнкрафта в Дискорд',
					'которому не нужна реклама',
					'существующий в Околорандомье',
					'где все правила негласные',
					'образовавшийся из хаоса',
				].pick() + '.',
				'(рандом ?крафт|random ?craft)': 'РандомКрафт — сервер, который некогда был тортом.',
				'(рнкр|rncr)': 'RnCr — современная пародия на неповторимый РандомКрафт.',
				'(лв|лаки|lv|lucky)': 'LuckyVerse — один из основных конкурентов РандомКрафта.',
				'(javascript|js|джаваскрипт)': 'JavaScript — это язык, на котором я работаю.',
				'(питон|python)': 'Питон — это язык, на котором я не работаю.',
				'пету[хч]': () => {
					flags.r = 'react';
					return '🐓';
				},
				'(рандом|random)': 'рандом — это такая не совсем случайная случайность.',
				'бан(?![ктндчя])': 'бан — неправильный, но популярный метод решения конфликтов.',
				'скрипт': 'скрипт — программа для интерпретатора, написанная на коленке.',
				'торт': 'тортик — враньё!',
				'лень': true,
				//'лень': 'лень — вроде помню, что это такое, но чёт вспоминать лень.',
				'utf-?8': 'UTF-8 вЂ” СЃРѕРІСЂРµРјРµРЅРЅС‹Р№ С„РѕСЂРјР°С‚ РґР»СЏ РїРµСЂРµРґР°С‡Рё Р®РЅРёРєРѕРґР°, РєРѕРґРёСЂСѓСЋС‰РёР№ СЃРёРјРІРѕР»С‹ СЂР°Р·РЅС‹Рј С‡РёСЃР»РѕРј Р±Р°Р№С‚.',
				'(фич|feature)': 'фича — полезная функция программы.',
				'(баг|bug)': 'баг — ошибка в коде программы, допущенная программистом.',
				'(глюк|glitch)': 'глюк — верный симптом бага.',
				'(кодинг|программи)': 'программирование — деятельность, приводящая к увеличению количества фич и багов в программе.',
				'ошибк': 'ошибка — хаотично возникающая аномалия, делающая наш мир более неожиданным.',
				'хаос': 'Хаос — непредсказуемый беспорядок.',
				'(любовь|love)': 'The love is a lie. If you love you soon will cry.',
				'(томми|версетт?и)': () => 'Томми Версетти дворами пошёл. В глухом переулке ' + ['базуку', 'компьютер', 'алмазы'].pick() + ' нашёл.',
				'пл[еао]ер': 'плеер — портативное устройство для воспроизведения музыки.',
				'player': 'player — игрок.',
				'игрок': 'игрок — тот, кто играет в какую-нибудь игру.',
				'(чар|char)': 'char — то, из чего состоят текстовые строки в программировании.',
				'(себя|крипушк)': 'откуда мне знать, кто я такой?',
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
				'хмм, не, не слышал.',
			];
		},
	},
	
	// зачем
	{
		d: true,
		p: /^ *зачем([^а-яё]|$)/i,
		r: 'зачем — самый бестолковый вопрос в мироздании.',
	},
	
	// представьте себе, драконы радиоактивны
	{
		d: true,
		p: /(^|[^а-яё])представ(ляе(шь|те)|ь(те)?( себе)?)([^а-яё]|$)/i,
		r: 'ой, не представляю!',
	},
	
	// го в лс
	{
		d: true,
		p: /(^|[^а-яё])(го|давай|иди|дуй|по(шли|йдём)|зайди) (лучше )?(ко мне )?в (лс|переписку)/i,
		m: 'dm',
		r: 'да-да, я тут.',
	},
	
	
	// третья часть - низкоприоритетные
	
	// кастит
	{
		d: true,
		p: /(^|[^а-яё])кастит([^а-яё]|$)/i,
		m: 'dm',
		r: [
			'Кастит, конечно, последовательно.',
			'Кастит на месте не стоит.',
			'вулкан Кастита, а значит смерть.',
			'Драгон является следствием.',
		],
	},
	
	// bad creeper
	{
		p: /(^|[^а-яё])((?:крип[а-яё]+|[тв]ы) )?(?:[-‒–—―] )?(?:(?:туп|пл[ао]х|не ?хорош)[а-яё]*|б[яа]к[аи])( крип[а-яё]+)?$/i,
		m: 'react',
		r: (m) => (m[2] || m[3] ? '😭' : false),
	},
	
	// :ясно:
	{
		p: /(^|[^а-яё])ясно([^а-яё]|$)/i,
		m: 'react',
		r: '🌞',
	},
	
	// :banana:
	{
		p: /банан/i,
		m: 'react',
		r: '🍌',
	},
	
	// :бомб:
	{
		p: /бомб/i,
		m: 'react',
		r: '💣',
	},
	
	// :пингвин:
	{
		p: /пингви/i,
		m: 'react',
		r: '🐧',
	},
	
	// :пинг:
	{
		p: /(п[ио]нг|p[io]ng)/i,
		m: 'react',
		r: '🏓',
	},
	
	// ignored
	{
		d: true,
		p: /(^|[^а-яё])(игнор|чс|ну тебя)/i,
		m: 'react',
		r: '😑',
	},
	
	// :saw:
	{
		p: /(^|[^а-яё])(за|вы|рас|от|на|с|пере)?пил(и(м|ла?|ть?)?|ю|ен[аоы]?)([^а-яё]|$)/i,
		r: (m, flags, floodey, message) => {
			if (customReact(message, 'saw')) {
				return true;
			}
		},
	},
	
	// рожок
	{
		p: /(^|[^а-яё])р[оа]ж[оеё]к/i,
		m: 'react',
		r: '🥐',
	},
	
	// ленточка
	{
		p: /(^|[^а-яё])(на|по|за)вя[жз]/i,
		m: 'react',
		r: '🎗',
	},
	
	// win
	{
		p: /(^|[^а-яё])(я|мы) (победи|выигра|затащи|сдела|успе)л/i,
		m: 'react',
		r: '🏅 🏅 🏅 🏆 🍌 🐩 📯 🎺'.split(' '),
	},
	
	// dropical trink
	{
		p: /(^|[^а-яё])(кастер|сок|juic)/i,
		c: 0.5,
		m: 'react',
		r: '🍹',
	},
	
	// :apple:
	{
		p: /apple/i,
		m: 'react',
		r: '🍏 🍏 🍎'.split(' '),
	},
	
	// screams
	{
		p: /а{10,}[1! ]*/i,
		m: 'react',
		r: '🙀',
	},
	
	// honeywasp
	{
		p: /(^|[^а-яёa-z])((у|за|по|из)?жал(ь|ко)|осу|osu)([^а-яёa-z]|$)/i,
		m: 'react',
		r: '🐝',
	},
	
	// :creeper:
	{
		p: /(^|[^а-яё])(creep|крип)/i,
		c: 0.75,
		r: (m, flags, floodey, message) => {
			if (customReact(message, 'creeper')) {
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
	
	// phisching
	{
		d: true,
		p: /хочешь|давай/i,
		c: 0.8,
		m: 'react',
		r: '🎣',
	},
	
	// точно
	{
		p: /^ *точно([!.]+|$)/i,
		m: 'react',
		r: '🎯',
	},
	
	// скройся/появись
	{
		d: true,
		p: /^ *(((ворот|верн|по(каж|яв))ись)|с(((кро|мо|ле)й|прячь)ся|гинь))[,.?! ]*/i,
		r: (m) => {
			hidden = !m[2];
			setStatus();
			return true;
		},
	},
	
	// debug info
	{
		d: true,
		p: /^ *((слей|с?кинь|покажи) (инфу|показатели|метрики|данные)|дебаг)( в лс)?[!. ]*$/i,
		m: 'dm',
		r: (m) => {
			let now = new Date();
			return [
				'слив инфы о работе (за данный сеанс):',
				'',
				'Я онлайн уже **`' + dateDiff(+now - since) + '`**.',
				'Время на моих часах при запуске:\n**`' + dateStr(since) + '`**.',
				'Время на моих часах сейчас:\n**`' + dateStr(now) + '`**.',
				'',
				'Ответов/запросов всего: **`' + stat.replyCount + '/' + stat.readCount + '`**.',
				'Ответов/запросов из лс: **`' + stat.replyCountDM + '/' + stat.readCountDM + '`**.',
				'Чиллаутов выдано: **`' + stat.chillCount + '`**.',
				'Призываний: **`' + stat.mentionCount + '`**.',
				'',
				'Последнее время сверки: **`' + stat.timeLast + ' мс`**.',
				'Среднее время сверки: **`' + (stat.timeSum / stat.readCount).toFixed(2) + ' мс`**.',
				'Наибольшее время сверки: **`' + stat.timeMax + ' мс`**.',
				'Наибольшее время простоя:\n**`' + dateDiff(stat.waitMax, true) + '`**.',
				'',
				'Шишек набито при запросе: **`' + stat.errorCount + '`**.',
				'Запусков в этой сессии: **`' + statLaunches + '`**.',
			].join('\n');
		},
	},
	
	// Discord bot
	{
		d: true,
		p: /бот/i,
		c: 0.05,
		r: 'Бип Буп БУп БИп.',
	},
	
	// если просто призвали
	{
		d: true,
		p: /^/,
		r: (m, flags, floodey, message, mentioned) => {
			if (chance(0.4) && (!message.guild || !floodey)) {
				if (mentioned !== true) {
					// если не призывали, а написали в лс
					return false;
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
	let attach;
	if (text.files && typeof text.text == 'string') {
		attach = text.files;
		text = text.text;
	}
	
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
	
	let opt;
	if (attach) {
		opt = {files: attach};
	}
	
	let f = {
		'reply': () => message.reply(text, opt), // reply w/ @mention
		'say': () => message.channel.send(text, opt), // just say
		'dm': () => message.author.send(text, opt), // force private conversation
		'react': () => message.react(text, opt), // put a reaction instead
	};
	
	if (!f[flags.r]) {
		console.log('Unknown reply type:', flags.r);
		return;
	}
	
	f[flags.r]();
}

// чем отвечать будем
function checkReply(message, flags) {
	let now = Date.now();
	let uid = message.author.id;
	
	// антифлуд-система
	if (!floodeys[uid]) {
		floodeys[uid] = {
			time: now,
			chills: 0,
		};
	}
	
	let fdata = floodeys[uid];
	let score = fdata.time - now;
	if (score < 0) {
		fdata.chills = 0;
		score = 0;
	}
	score += floodrate * 1000;
	fdata.time = now + score;
	if (fdata.chills >= floodchills) {
		// игнорим месседж
		return false;
	}
	if (score > floodmax * 1000) {
		// выдаём предупреждение
		fdata.chills++;
		let resp = [
			'достаточно набивать сообщения!',
			'you are being rate limited!',
			'время флуда окончено, давай иди отдыхай.',
			'эй, не так быстро!',
			'охлади отправку сообщений, я не успеваю читать.',
		];
		capReply(message, resp, flags);
		return 'chillout';
	}
	
	// первичная обработка сообщения
	let mentioned = message.mentions.users.has(myId) || (!message.guild ? 'dm' : false);
	let lc = message.content.trim();
	let m = null;
	let floodey = message.guild && (floodless.indexOf(message.channel.id) != -1);
	
	cutOff = (m, lc) => (m.index ? (lc.slice(0, m.index) + ' ') : '') + lc.slice(m.index + m[0].length);
	
	// <@...> mentioning
	m = lc.match('<@' + myId + '>[,.?! ]*');
	if (m) {
		lc = cutOff(m, lc);
	}
	
	// parsing & removing discord's markdown to creepers green away from here.
	let parsed = parseMd(lc);
	// code blocks are ignored by default
	lc = plainText(parsed, 'c');
	
	// text name mentioning
	m = lc.match(/([,.?!] *|^)(крип((уш|онь)ка|ак?|ер(аст)?)|creep(e[ry]|ah|ie))([,.?!] *|$)/i);
	if (m) {
		mentioned = true;
		lc = cutOff(m, lc);
	}
	
	// проверка по базе
	for (let item of responses) {
		// direct
		if (item.d === true && !mentioned) {
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
		
		if (!m) {
			continue;
		}
		
		// indirect
		if (item.d === 'indirect' && !mentioned && m[0].length != lc.length) {
			continue;
		}
		
		let resp = item.r;
		
		// exec if function
		if (typeof resp === 'function') {
			resp = resp(m, flags, floodey, message, mentioned);
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
		
		if (typeof resp.then == 'function') {
			resp.then((resp) => capReply(message, resp, flags));
		} else {
			capReply(message, resp, flags);
		}
		return true;
	}
	return false;
}

function processMessage(message) {
	try {
		let flags = {
			r: 'reply', // reply with mentioning by default
		};
		
		// stats before
		let start = Date.now();
		
		let waited = start - stat.waitLast;
		if (stat.waitMax < waited) {
			stat.waitMax = waited;
		}
		stat.waitLast = start;
		
		// крипера ответ
		let replied = checkReply(message, flags);
		
		// stats after
		let end = Date.now();
		
		stat.readCount++;
		stat.readCountDM += +!message.guild;
		if (replied) {
			if (replied === 'chillout') {
				stat.chillCount++;
			}
			stat.replyCount++;
			stat.replyCountDM += +!message.guild;
		}
		
		stat.mentionCount += +message.mentions.users.has(myId);
		
		stat.waitLast = end;
		
		stat.timeLast = end - start;
		stat.timeSum += stat.timeLast;
		if (stat.timeMax < stat.timeLast) {
			stat.timeMax = stat.timeLast;
			console.log('Max time achieved: ' + stat.timeLast + ' ms on phrase', message.content);
		}
		
	} catch(e) {
		console.log('Error got on phrase', message.content);
		console.error(e);
		stat.errorCount++;
	}
}

// при сообщениях
client.on('message', message => {
	if (wrecked || message.system || message.author.bot || message.author.id == myId) {
		return;
	}
	
	try {
		
		/*
		if (typeof mus != 'undefined' && message.guild && mus[message.guild.id] && mus[message.guild.id].tid == message.channel.id) {
			//musicProcess(message);
			
			return;
		}
		*/
		
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





// Discord's markdown parser implementation

// WARNING!!!! Don't dive into this code.
// Code is awful because Discord's markdown behavior is chaotic.

// Seriously, there are a lot of tiny irrational cases and exceptions
// which are better be not known.

var mdChars = {
	'`': 'mmc',
	'*': 'ibt',
	'_': 'iu',
	'~': '-s',
};

// just a part of a parser
function detectMd(s, i, tag, c) {
	
	//console.log(s,';',i,';',tag);
	// checking formatting type
	let type = mdChars[tag[0]][tag.length - 1];
	//console.log(tag,type,c);
	
	if (!type || !(type.charCodeAt(0) > 64) || (tag == '*' && !c.trim())) {
		return null;
	}
	
	// searching the second tag
	//console.log('!1');
	let pos = i;
	while (true) {
		//console.log(s[pos + tag.length] == tag[0], tag.length < 3, tag != '~~');
		while (s.substr(pos, tag.length) == tag && s[pos + tag.length] == tag[0] && tag.length < 3 && tag != '~~') {
			//console.log('skip');
			pos++;
		}
		pos++;
		if (pos == -1) {
			return null;
		}
		pos = s.indexOf(tag, pos);
		//console.log('indice: ',pos);
		if (pos == -1) {
			return null;
		}
		if (s[pos + tag.length] != tag[0] || tag.length >= 3 || tag == '~~') {
			break;
		}
	}
	
	//console.log('!2');
	
	if (tag == '*' && !s.charAt(pos - 1).trim()) {
		return null;
	}
	
	// formatting found
	
	let inner = s.slice(i, pos);
	if (tag[0] == '`' && !inner.trim() && (tag.length < 3 || !inner.match(/[^\n]/))) {
		// surprisingly, these formatting types don't like emptiness, so one more try
		let newpos = s.indexOf(tag, pos + 1);
		if (newpos != -1) {
			pos = newpos;
		}
	}
	
	return [pos, type];
}

// parser
function parseMd(s, style) {
	let o = {
		type: style,
		contents: [],
	};
	// don't parse in code blocks
	if ('mc'.indexOf(style) != -1) {
		o.contents.push(s);
		return o;
	}
	let i = 0;
	let last = '';
	let passed = '';
	while (i < s.length) {
		let c = s[i];
		if (last[0] == c && last.length < 3) {
			if (last == '\\') {
				passed += last;
				last = '';
			} else {
				last += c;
			}
		} else {
			// first tag found
			if (mdChars[last[0]]) {
				let pos = null;
				for (let j = 0; j < last.length; j++) {
					//if (j && i - j == 1 && last[0] == '*') {
					//	continue;
					//}
					pos = detectMd(s, i - j, last.slice(0, last.length - j), c);
					if (pos) {
						let inner = parseMd(s.slice(i - j, pos[0]), pos[1]);
						o.contents.push(passed, inner);
						s = s.slice(pos[0] + last.length - j);
						passed = '';
						last = '';
						i = 0;
						break;
					}
				}
				if (pos) {
					continue;
				}
			}
			
			if (last == '\\') {
				last += c;
				c = '';
			}
			passed += last;
			last = c;
		}
		i++;
	}
	o.contents.push(passed + last);
	return o;
}

// stringifier
function plainText(o, ignored) {
	// "ignored" is a string of chars of styles, their content will be ignored
	let s = [];
	let c = o.contents;
	for (let i = 0; i < c.length; i++) {
		let t = c[i];
		if (typeof t != 'string') {
			if (ignored.indexOf(c[i].type) != -1) {
				continue;
			}
			t = plainText(t, ignored);
			if (c[i].type == 'c') {
				t = '\n' + t + '\n';
			}
		}
		s += t;
	}
	return s;
}

})();
