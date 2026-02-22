import { Topic } from '../../types';

export const module3: Topic =   {
    id: 'module-3',
    title: 'A-U-A&I-A-O',
    description: 'A-U-A&I-A-O',
    icon: '3',
    color: 'bg-red-500',
    locked: false,
    videoUrl: 'https://play.boomstream.com/7pxDfCkR',
    dialog: {
      title: 'Die Wassermelonen-Affäre',
      text: `Am Sonntag haben mich Freunde eingeladen (einladen – lud ein – eingeladen), mit ihnen einen Ausflug zu machen. Wir fuhren (fahren – fuhr – gefahren) an einem großen Feld vorbei, auf dem riesige Wassermelonen wuchsen (wachsen – wuchs – gewachsen) – wirklich gigantisch!

Ich schlug eine Idee vor (vorschlagen – schlug vor – vorgeschlagen): Lasst uns die Wassermelonen zum Auto tragen (tragen – trug – getragen)! In nur zehn Minuten luden (laden – lud – geladen) wir den ganzen Kofferraum voll. Ein voller Erfolg!

Doch plötzlich kam ein Wachmann! Er schlug (schlagen – schlug – geschlagen) uns mit einem Stock.

Zur Strafe mussten wir seinen riesigen, schmutzigen Traktor waschen (waschen – wusch – gewaschen) und den ganzen Tag Kartoffeln für ihn graben (graben – grub – gegraben).

Am Ende fuhren (fahren – fuhr – gefahren) wir trotzdem mit einer Melone nach Hause – und wir haben viel über Kartoffeln erfahren (erfahren – erfuhr – erfahren) 😅`,
      translation: "",
      audioUrl: "/watermelon_story.mp3" 
    },
    words: [],
    lessons: [
      {
        title: 'Урок 3.1 Ряд A-U-A',
        videoUrl: 'https://play.boomstream.com/EFFGwcxJ',
        words: [
          { id: 'verb-forms-dict', de: 'fahren – fuhr – ist/hat gefahren\n(sein → ехать самому, haben → кого-то/что-то везти)', ru: 'fahren – fuhr – ist/hat gefahren\n(sein → ехать самому, haben → кого-то/что-то везти)', audioDe: '' },
          { id: 'verb-forms-dict-2', de: 'erfahren – erfuhr – hat erfahren\n(только haben, т.к. значение «узнать, испытать»)', ru: 'erfahren – erfuhr – hat erfahren\n(только haben, т.к. значение «узнать, испытать»)', audioDe: '' },
          { id: 'verb-forms-dict-3', de: 'laden – lud – hat geladen\n(haben → грузить; отдельно есть einladen – einlud – hat eingeladen = приглашать)', ru: 'laden – lud – hat geladen\n(haben → грузить; отдельно есть einladen – einlud – hat eingeladen = приглашать)', audioDe: '' },
          { id: 'verb-forms-dict-4', de: 'tragen – trug – hat getragen', ru: 'tragen – trug – hat getragen', audioDe: '' },
          { id: 'verb-forms-dict-5', de: 'eintragen – trug ein – hat eingetragen', ru: 'eintragen – trug ein – hat eingetragen', audioDe: '' },
          { id: 'verb-forms-dict-6', de: 'beitragen – trug bei – hat beigetragen', ru: 'beitragen – trug bei – hat beigetragen', audioDe: '' },
          { id: 'verb-forms-dict-7', de: 'schlagen – schlug – hat geschlagen', ru: 'schlagen – schlug – hat geschlagen', audioDe: '' },
          { id: 'verb-forms-dict-8', de: 'vorschlagen – schlug vor – hat vorgeschlagen', ru: 'vorschlagen – schlug vor – hat vorgeschlagen', audioDe: '' },
          { id: 'verb-forms-dict-9', de: 'waschen – wusch – hat gewaschen', ru: 'waschen – wusch – hat gewaschen', audioDe: '' },
          { id: 'verb-forms-dict-10', de: 'wachsen – wuchs – ist gewachsen\n(только sein, т.к. «расти» = процесс изменения состояния)', ru: 'wachsen – wuchs – ist gewachsen\n(только sein, т.к. «расти» = процесс изменения состояния)', audioDe: '' },
          { id: 'verb-forms-dict-11', de: 'graben – grub – hat gegraben', ru: 'graben – grub – hat gegraben', audioDe: '' }
        ]
      },
      {
        title: 'Урок 3.2 Ряд I-A-O',
        videoUrl: 'https://play.boomstream.com/kfgCw6nU',
        words: [
          { id: 'beginnen-dict', de: 'beginnen – begann – hat begonnen', ru: 'beginnen – begann – hat begonnen', audioDe: '' },
          { id: 'gewinnen-dict', de: 'gewinnen – gewann – hat gewonnen', ru: 'gewinnen – gewann – hat gewonnen', audioDe: '' },
          { id: 'schwimmen-dict', de: 'schwimmen – schwamm – ist geschwommen', ru: 'schwimmen – schwamm – ist geschwommen', audioDe: '' }
        ]
      }
    ],
    mantras: [
      // fahren
      { 
        id: 'fahren-1', 
        de: 'Ich fahre nach Hause.', 
        ru: 'Я еду домой.', 
        audioDe: '',
        praeteritum: 'Ich fuhr nach Hause.',
        ru_praeteritum: 'Я ехал домой.',
        partizip2: 'Ich bin nach Hause gefahren.',
        ru_partizip2: 'Я поехал домой.'
      },
      { 
        id: 'fahren-2', 
        de: 'Wir fahren in die Stadt.', 
        ru: 'Мы едем в город.', 
        audioDe: '',
        praeteritum: 'Wir fuhren in die Stadt.',
        ru_praeteritum: 'Мы ехали в город.',
        partizip2: 'Wir sind in die Stadt gefahren.',
        ru_partizip2: 'Мы поехали в город.'
      },
      // graben
      { 
        id: 'graben-1', 
        de: 'Du gräbst ein Loch.', 
        ru: 'Ты копаешь яму.', 
        audioDe: '',
        praeteritum: 'Du grubst ein Loch.',
        ru_praeteritum: 'Ты копал яму.',
        partizip2: 'Du hast ein Loch gegraben.',
        ru_partizip2: 'Ты выкопал яму.'
      },
      { 
        id: 'graben-2', 
        de: 'Sie graben den Garten.', 
        ru: 'Они копают сад.', 
        audioDe: '',
        praeteritum: 'Sie gruben den Garten.',
        ru_praeteritum: 'Они копали сад.',
        partizip2: 'Sie haben den Garten gegraben.',
        ru_partizip2: 'Они выкопали сад.'
      },
      // laden
      { 
        id: 'laden-1', 
        de: 'Ich lade das Auto.', 
        ru: 'Я загружаю машину.', 
        audioDe: '',
        praeteritum: 'Ich lud das Auto.',
        ru_praeteritum: 'Я загружал машину.',
        partizip2: 'Ich habe das Auto geladen.',
        ru_partizip2: 'Я загрузил машину.'
      },
      { 
        id: 'laden-2', 
        de: 'Ihr ladet die Kisten.', 
        ru: 'Вы загружаете ящики.', 
        audioDe: '',
        praeteritum: 'Ihr ludet die Kisten.',
        ru_praeteritum: 'Вы загружали ящики.',
        partizip2: 'Ihr habt die Kisten geladen.',
        ru_partizip2: 'Вы загрузили ящики.'
      },
      // schlagen
      { 
        id: 'schlagen-1', 
        de: 'Er schlägt den Ball.', 
        ru: 'Он бьёт мяч.', 
        audioDe: '',
        praeteritum: 'Er schlug den Ball.',
        ru_praeteritum: 'Он бил мяч.',
        partizip2: 'Er hat den Ball geschlagen.',
        ru_partizip2: 'Он ударил мяч.'
      },
      { 
        id: 'schlagen-2', 
        de: 'Wir schlagen an die Tür.', 
        ru: 'Мы бьём в дверь.', 
        audioDe: '',
        praeteritum: 'Wir schlugen an die Tür.',
        ru_praeteritum: 'Мы били в дверь.',
        partizip2: 'Wir haben an die Tür geschlagen.',
        ru_partizip2: 'Мы постучали в дверь.'
      },
      // tragen
      { 
        id: 'tragen-1', 
        de: 'Sie trägt die Tasche.', 
        ru: 'Она несёт сумку.', 
        audioDe: '',
        praeteritum: 'Sie trug die Tasche.',
        ru_praeteritum: 'Она несла сумку.',
        partizip2: 'Sie hat die Tasche getragen.',
        ru_partizip2: 'Она отнесла сумку.'
      },
      { 
        id: 'tragen-2', 
        de: 'Wir tragen die Bücher.', 
        ru: 'Мы несём книги.', 
        audioDe: '',
        praeteritum: 'Wir trugen die Bücher.',
        ru_praeteritum: 'Мы несли книги.',
        partizip2: 'Wir haben die Bücher getragen.',
        ru_partizip2: 'Мы отнесли книги.'
      },
      // wachsen
      { 
        id: 'wachsen-1', 
        de: 'Die Blume wächst schnell.', 
        ru: 'Цветок растёт быстро.', 
        audioDe: '',
        praeteritum: 'Die Blume wuchs schnell.',
        ru_praeteritum: 'Цветок рос быстро.',
        partizip2: 'Die Blume ist schnell gewachsen.',
        ru_partizip2: 'Цветок вырос быстро.'
      },
      { 
        id: 'wachsen-2', 
        de: 'Die Kinder wachsen schnell.', 
        ru: 'Дети растут быстро.', 
        audioDe: '',
        praeteritum: 'Die Kinder wuchsen schnell.',
        ru_praeteritum: 'Дети росли быстро.',
        partizip2: 'Die Kinder sind schnell gewachsen.',
        ru_partizip2: 'Дети выросли быстро.'
      },
      // waschen
      { 
        id: 'waschen-1', 
        de: 'Du wäschst die Hände.', 
        ru: 'Ты моешь руки.', 
        audioDe: '',
        praeteritum: 'Du wuschst die Hände.',
        ru_praeteritum: 'Ты мыл руки.',
        partizip2: 'Du hast die Hände gewaschen.',
        ru_partizip2: 'Ты помыл руки.'
      },
      { 
        id: 'waschen-2', 
        de: 'Wir waschen die Kleidung.', 
        ru: 'Мы моем одежду.', 
        audioDe: '',
        praeteritum: 'Wir wuschen die Kleidung.',
        ru_praeteritum: 'Мы мыли одежду.',
        partizip2: 'Wir haben die Kleidung gewaschen.',
        ru_partizip2: 'Мы помыли одежду.'
      },
      // einladen
      { 
        id: 'einladen-1', 
        de: 'Er lädt den Freund ein.', 
        ru: 'Он приглашает друга.', 
        audioDe: '',
        praeteritum: 'Er lud den Freund ein.',
        ru_praeteritum: 'Он приглашал друга.',
        partizip2: 'Er hat den Freund eingeladen.',
        ru_partizip2: 'Он пригласил друга.'
      },
      { 
        id: 'einladen-2', 
        de: 'Ich lade die Schwester ein.', 
        ru: 'Я приглашаю сестру.', 
        audioDe: '',
        praeteritum: 'Ich lud die Schwester ein.',
        ru_praeteritum: 'Я приглашал сестру.',
        partizip2: 'Ich habe die Schwester eingeladen.',
        ru_partizip2: 'Я пригласил сестру.'
      },
      // erfahren
      { 
        id: 'erfahren-1', 
        de: 'Sie erfährt die Wahrheit.', 
        ru: 'Она узнаёт правду.', 
        audioDe: '',
        praeteritum: 'Sie erfuhr die Wahrheit.',
        ru_praeteritum: 'Она узнавала правду.',
        partizip2: 'Sie hat die Wahrheit erfahren.',
        ru_partizip2: 'Она узнала правду.'
      },
      { 
        id: 'erfahren-2', 
        de: 'Wir erfahren die Nachrichten.', 
        ru: 'Мы узнаём новости.', 
        audioDe: '',
        praeteritum: 'Wir erfuhren die Nachrichten.',
        ru_praeteritum: 'Мы узнавали новости.',
        partizip2: 'Wir haben die Nachrichten erfahren.',
        ru_partizip2: 'Мы узнали новости.'
      },
      // vorschlagen
      { 
        id: 'vorschlagen-1', 
        de: 'Du schlägst einen Plan vor.', 
        ru: 'Ты предлагаешь план.', 
        audioDe: '',
        praeteritum: 'Du schlugst einen Plan vor.',
        ru_praeteritum: 'Ты предлагал план.',
        partizip2: 'Du hast einen Plan vorgeschlagen.',
        ru_partizip2: 'Ты предложил план.'
      },
      { 
        id: 'vorschlagen-2', 
        de: 'Sie schlagen eine Idee vor.', 
        ru: 'Они предлагают идею.', 
        audioDe: '',
        praeteritum: 'Sie schlugen eine Idee vor.',
        ru_praeteritum: 'Они предлагали идею.',
        partizip2: 'Sie haben eine Idee vorgeschlagen.',
        ru_partizip2: 'Они предложили идею.'
      },
      // beitragen
      { 
        id: 'beitragen-1', 
        de: 'Er trägt Geld bei.', 
        ru: 'Он вносит деньги.', 
        audioDe: '',
        praeteritum: 'Er trug Geld bei.',
        ru_praeteritum: 'Он вносил деньги.',
        partizip2: 'Er hat Geld beigetragen.',
        ru_partizip2: 'Он внёс деньги.'
      },
      { 
        id: 'beitragen-2', 
        de: 'Wir tragen viel bei.', 
        ru: 'Мы вносим вклад.', 
        audioDe: '',
        praeteritum: 'Wir trugen viel bei.',
        ru_praeteritum: 'Мы вносили вклад.',
        partizip2: 'Wir haben viel beigetragen.',
        ru_partizip2: 'Мы внесли вклад.'
      },
      // gewinnen
      { 
        id: 'gewinnen-1', 
        de: 'Sie gewinnt das Spiel.', 
        ru: 'Она выигрывает игру.', 
        audioDe: '',
        praeteritum: 'Sie gewann das Spiel.',
        ru_praeteritum: 'Она выигрывала игру.',
        partizip2: 'Sie hat das Spiel gewonnen.',
        ru_partizip2: 'Она выиграла игру.'
      },
      { 
        id: 'gewinnen-2', 
        de: 'Wir gewinnen den Wettbewerb.', 
        ru: 'Мы выигрываем конкурс.', 
        audioDe: '',
        praeteritum: 'Wir gewannen den Wettbewerb.',
        ru_praeteritum: 'Мы выигрывали конкурс.',
        partizip2: 'Wir haben den Wettbewerb gewonnen.',
        ru_partizip2: 'Мы выиграли конкурс.'
      },
      // schwimmen
      { 
        id: 'schwimmen-1', 
        de: 'Ich schwimme schnell.', 
        ru: 'Я плаваю быстро.', 
        audioDe: '',
        praeteritum: 'Ich schwamm schnell.',
        ru_praeteritum: 'Я плавал быстро.',
        partizip2: 'Ich bin schnell geschwommen.',
        ru_partizip2: 'Я поплавал быстро.'
      },
      { 
        id: 'schwimmen-2', 
        de: 'Sie schwimmen im Meer.', 
        ru: 'Они плавают в море.', 
        audioDe: '',
        praeteritum: 'Sie schwammen im Meer.',
        ru_praeteritum: 'Они плавали в море.',
        partizip2: 'Sie sind im Meer geschwommen.',
        ru_partizip2: 'Они поплавали в море.'
      },
      // beginnen
      { 
        id: 'beginnen-1', 
        de: 'Der Kurs beginnt heute.', 
        ru: 'Курс начинается сегодня.', 
        audioDe: '',
        praeteritum: 'Der Kurs begann heute.',
        ru_praeteritum: 'Курс начинался сегодня.',
        partizip2: 'Der Kurs hat heute begonnen.',
        ru_partizip2: 'Курс начался сегодня.'
      },
      { 
        id: 'beginnen-2', 
        de: 'Wir beginnen sofort.', 
        ru: 'Мы начинаем сразу.', 
        audioDe: '',
        praeteritum: 'Wir begannen sofort.',
        ru_praeteritum: 'Мы начинали сразу.',
        partizip2: 'Wir haben sofort begonnen.',
        ru_partizip2: 'Мы начали сразу.'
      }
    ],
    quiz: [
      {
        question: "Wohin fuhren die Freunde am Sonntag?",
        options: ["In die Stadt", "An einem Feld vorbei", "Zum Strand"],
        correctAnswer: "An einem Feld vorbei"
      },
      {
        question: "Was wuchs auf dem Feld?",
        options: ["Kartoffeln", "Riesige Wassermelonen", "Tomaten"],
        correctAnswer: "Riesige Wassermelonen"
      },
      {
        question: "Was schlug der Erzähler vor?",
        options: ["Die Wassermelonen zu kaufen", "Die Wassermelonen zum Auto zu tragen", "Nach Hause zu fahren"],
        correctAnswer: "Die Wassermelonen zum Auto zu tragen"
      },
      {
        question: "Wie lange dauerte es, den Kofferraum voll zu laden?",
        options: ["Fünf Minuten", "Zehn Minuten", "Eine Stunde"],
        correctAnswer: "Zehn Minuten"
      },
      {
        question: "Was machte der Wachmann?",
        options: ["Er rief die Polizei", "Er schlug sie mit einem Stock", "Er lachte"],
        correctAnswer: "Er schlug sie mit einem Stock"
      },
      {
        question: "Was mussten sie zur Strafe machen?",
        options: ["Den Traktor waschen und Kartoffeln graben", "Zurück ins Gefängnis gehen", "Geld bezahlen"],
        correctAnswer: "Den Traktor waschen und Kartoffeln graben"
      }
    ],
    exercises: [
      {
        sentence_ru: "Друзья пригласили меня на прогулку.",
        sentence: "Freunde haben mich zu einem Ausflug ____.",
        options: ["eingeladen", "einladen", "geladen", "gefahren"],
        explanation: "eingeladen - причастие глагола einladen (приглашать). Используется в перфекте с haben."
      },
      {
        sentence_ru: "Мы ехали мимо поля.",
        sentence: "Wir ____ an einem Feld vorbei.",
        options: ["fuhren", "fahren", "gefahren", "fuhr"],
        explanation: "fuhren - форма глагола fahren (ехать) в прошедшем времени (Präteritum), множественное число."
      },
      {
        sentence_ru: "На поле росли арбузы.",
        sentence: "Auf dem Feld ____ Wassermelonen.",
        options: ["wuchsen", "wachsen", "gewachsen", "wuchs"],
        explanation: "wuchsen - форма глагола wachsen (расти) в прошедшем времени (Präteritum), множественное число."
      },
      {
        sentence_ru: "Я предложил идею.",
        sentence: "Ich ____ eine Idee ____.",
        options: ["schlug vor", "schlagen vor", "vorgeschlagen", "schlage vor"],
        explanation: "schlug vor - форма глагола vorschlagen (предлагать) в прошедшем времени (Präteritum)."
      },
      {
        sentence_ru: "Давайте отнесём арбузы к машине.",
        sentence: "Lasst uns die Wassermelonen zum Auto ____.",
        options: ["tragen", "trugen", "getragen", "trägt"],
        explanation: "tragen - инфинитив глагола tragen (нести). После lassen используется инфинитив."
      },
      {
        sentence_ru: "Мы загрузили багажник.",
        sentence: "Wir ____ den Kofferraum voll.",
        options: ["luden", "laden", "geladen", "lud"],
        explanation: "luden - форма глагола laden (грузить) в прошедшем времени (Präteritum), множественное число."
      },
      {
        sentence_ru: "Охранник ударил нас.",
        sentence: "Der Wachmann ____ uns.",
        options: ["schlug", "schlagen", "geschlagen", "schlägt"],
        explanation: "schlug - форма глагола schlagen (бить) в прошедшем времени (Präteritum)."
      },
      {
        sentence_ru: "Мы должны были помыть трактор.",
        sentence: "Wir mussten den Traktor ____.",
        options: ["waschen", "wuschen", "gewaschen", "wäscht"],
        explanation: "waschen - инфинитив глагола waschen (мыть). После модального глагола используется инфинитив."
      },
      {
        sentence_ru: "Мы копали картошку весь день.",
        sentence: "Wir ____ den ganzen Tag Kartoffeln.",
        options: ["gruben", "graben", "gegraben", "grub"],
        explanation: "gruben - форма глагола graben (копать) в прошедшем времени (Präteritum), множественное число."
      },
      {
        sentence_ru: "Мы узнали много о картошке.",
        sentence: "Wir haben viel über Kartoffeln ____.",
        options: ["erfahren", "erfuhren", "erfährt", "erfahrt"],
        explanation: "erfahren - причастие глагола erfahren (узнавать). Используется в перфекте с haben."
      }
    ],
    textGapExercises: [
      {
        id: 'watermelon-part1',
        indicator: "Teil 1",
        intro: "Setze die passenden Verben ein.",
        html: `Am Sonntag haben mich Freunde <span class="dropzone" data-answer="eingeladen"></span>, mit ihnen einen Ausflug zu machen.<br>
Wir <span class="dropzone" data-answer="fuhren"></span> an einem großen Feld vorbei, auf dem riesige Wassermelonen <span class="dropzone" data-answer="wuchsen"></span> – wirklich gigantisch!<br>
Ich <span class="dropzone" data-answer="schlug vor"></span> eine Idee:<br>
Lasst uns die Wassermelonen zum Auto <span class="dropzone" data-answer="tragen"></span>!<br>
In nur zehn Minuten <span class="dropzone" data-answer="luden"></span> wir den ganzen Kofferraum voll.<br>
Ein voller Erfolg!`,
        words: ["eingeladen", "fuhren", "wuchsen", "schlug vor", "tragen", "luden"]
      },
      {
        id: 'watermelon-part2',
        indicator: "Teil 2",
        intro: "Setze die passenden Verben ein.",
        html: `Doch plötzlich kam ein Wachmann!<br>
Er <span class="dropzone" data-answer="schlug"></span> uns mit einem Stock.<br>
Zur Strafe mussten wir seinen riesigen, schmutzigen Traktor <span class="dropzone" data-answer="waschen"></span> und den ganzen Tag Kartoffeln für ihn <span class="dropzone" data-answer="graben"></span>.<br>
Am Ende <span class="dropzone" data-answer="fuhren"></span> wir trotzdem mit einer Melone nach Hause – und wir haben viel über Kartoffeln <span class="dropzone" data-answer="erfahren"></span>`,
        words: ["schlug", "waschen", "graben", "fuhren", "erfahren"]
      },
      {
        id: 'i-a-o-verbs',
        indicator: "gewinnen, beginnen, schwimmen",
        intro: "Setze die passenden Verben ein.",
        html: `Der Kurs <span class="dropzone" data-answer="beginnt"></span> heute.<br>
Sie <span class="dropzone" data-answer="gewinnt"></span> das Spiel.<br>
Ich <span class="dropzone" data-answer="schwimme"></span> schnell im Meer.<br>
Gestern <span class="dropzone" data-answer="begann"></span> der Wettbewerb.<br>
Wir haben den Preis <span class="dropzone" data-answer="gewonnen"></span>.<br>
Sie sind im See <span class="dropzone" data-answer="geschwommen"></span>.`,
        words: ["beginnt", "gewinnt", "schwimme", "begann", "gewonnen", "geschwommen"]
      }
    ],
    articleExercises: [
      {
        word: "Körper",
        translation: "тело",
        correctArticle: "der",
        explanation: "Körper - мужской род (der). Большинство слов, обозначающих части тела, имеют мужской род."
      },
      {
        word: "Magen",
        translation: "желудок",
        correctArticle: "der",
        explanation: "Magen - мужской род (der). Органы тела часто имеют мужской род."
      },
      {
        word: "Rücken",
        translation: "спина",
        correctArticle: "der",
        explanation: "Rücken - мужской род (der). Части тела часто имеют мужской род."
      },
      {
        word: "Schmerz",
        translation: "боль",
        correctArticle: "der",
        explanation: "Schmerz - мужской род (der). Слова, оканчивающиеся на -er, часто имеют мужской род."
      },
      {
        word: "Beschwerde",
        translation: "жалоба",
        correctArticle: "die",
        explanation: "Beschwerde - женский род (die). Слова, оканчивающиеся на -e, часто имеют женский род."
      },
      {
        word: "Gesundheit",
        translation: "здоровье",
        correctArticle: "die",
        explanation: "Gesundheit - женский род (die). Абстрактные существительные, оканчивающиеся на -heit, имеют женский род."
      },
      {
        word: "Ruhe",
        translation: "покой, тишина",
        correctArticle: "die",
        explanation: "Ruhe - женский род (die). Абстрактные существительные часто имеют женский род."
      },
      {
        word: "Sorge",
        translation: "забота, тревога",
        correctArticle: "die",
        explanation: "Sorge - женский род (die). Слова, оканчивающиеся на -e, часто имеют женский род."
      },
      {
        word: "Antibiotikum",
        translation: "антибиотик",
        correctArticle: "das",
        explanation: "Antibiotikum - средний род (das). Медицинские термины, оканчивающиеся на -um, имеют средний род."
      },
      {
        word: "Medikament",
        translation: "лекарство",
        correctArticle: "das",
        explanation: "Medikament - средний род (das). Лекарственные препараты часто имеют средний род."
      },
      {
        word: "Rezept",
        translation: "рецепт",
        correctArticle: "das",
        explanation: "Rezept - средний род (das). Медицинские документы часто имеют средний род."
      }
    ],
    mantraGapExercises: [
      {
        id: 'fahren-1',
        ru: 'Я еду домой.',
        sentence_praesens: 'Ich ____ nach Hause.',
        correct_praesens: 'fahre',
        options_praesens: ['fahre', 'fährst', 'fährt', 'fuhr'],
        sentence_praeteritum: 'Ich ____ nach Hause.',
        correct_praeteritum: 'fuhr',
        options_praeteritum: ['fuhr', 'fuhrt', 'fahre', 'gefahren'],
        sentence_partizip2: 'Ich bin nach Hause ____.',
        correct_partizip2: 'gefahren',
        options_partizip2: ['gefahren', 'fuhr', 'fahren', 'gefahrt']
      },
      {
        id: 'fahren-2',
        ru: 'Мы едем в город.',
        sentence_praesens: 'Wir ____ in die Stadt.',
        correct_praesens: 'fahren',
        options_praesens: ['fahren', 'fährt', 'fahre', 'fuhr'],
        sentence_praeteritum: 'Wir ____ schnell.',
        correct_praeteritum: 'fuhren',
        options_praeteritum: ['fuhren', 'fuhr', 'fahren', 'gefahren'],
        sentence_partizip2: 'Wir sind schnell ____.',
        correct_partizip2: 'gefahren',
        options_partizip2: ['gefahren', 'fuhren', 'fahren', 'gefahrt']
      },
      {
        id: 'graben-1',
        ru: 'Ты копаешь яму.',
        sentence_praesens: 'Du ____ ein Loch.',
        correct_praesens: 'gräbst',
        options_praesens: ['gräbst', 'grabe', 'gräbt', 'grub'],
        sentence_praeteritum: 'Du ____ ein Loch.',
        correct_praeteritum: 'grubst',
        options_praeteritum: ['grubst', 'grabt', 'gräbt', 'gegraben'],
        sentence_partizip2: 'Du hast ein Loch ____.',
        correct_partizip2: 'gegraben',
        options_partizip2: ['gegraben', 'grub', 'graben', 'gegrabt']
      },
      {
        id: 'graben-2',
        ru: 'Они копают сад.',
        sentence_praesens: 'Sie ____ den Garten.',
        correct_praesens: 'graben',
        options_praesens: ['graben', 'gräbt', 'grabe', 'grub'],
        sentence_praeteritum: 'Wir ____ den Garten.',
        correct_praeteritum: 'gruben',
        options_praeteritum: ['gruben', 'grub', 'graben', 'gegraben'],
        sentence_partizip2: 'Wir haben den Garten ____.',
        correct_partizip2: 'gegraben',
        options_partizip2: ['gegraben', 'gruben', 'graben', 'gegrabt']
      },
      {
        id: 'laden-1',
        ru: 'Я загружаю машину.',
        sentence_praesens: 'Ich ____ das Auto.',
        correct_praesens: 'lade',
        options_praesens: ['lade', 'lädst', 'lädt', 'lud'],
        sentence_praeteritum: 'Ich ____ das Auto.',
        correct_praeteritum: 'lud',
        options_praeteritum: ['lud', 'ludst', 'lade', 'geladen'],
        sentence_partizip2: 'Ich habe das Auto ____.',
        correct_partizip2: 'geladen',
        options_partizip2: ['geladen', 'lud', 'laden', 'geladet']
      },
      {
        id: 'laden-2',
        ru: 'Вы загружаете ящики.',
        sentence_praesens: 'Ihr ____ die Kisten.',
        correct_praesens: 'ladet',
        options_praesens: ['ladet', 'lade', 'lädt', 'lud'],
        sentence_praeteritum: 'Ihr ____ die Kisten.',
        correct_praeteritum: 'ludet',
        options_praeteritum: ['ludet', 'lud', 'ladet', 'geladen'],
        sentence_partizip2: 'Ihr habt die Kisten ____.',
        correct_partizip2: 'geladen',
        options_partizip2: ['geladen', 'lud', 'laden', 'geladet']
      },
      {
        id: 'schlagen-1',
        ru: 'Он бьёт мяч.',
        sentence_praesens: 'Er ____ den Ball.',
        correct_praesens: 'schlägt',
        options_praesens: ['schlägt', 'schlage', 'schlagt', 'schlug'],
        sentence_praeteritum: 'Er ____ den Ball.',
        correct_praeteritum: 'schlug',
        options_praeteritum: ['schlug', 'schlugt', 'schlägt', 'geschlagen'],
        sentence_partizip2: 'Er hat den Ball ____.',
        correct_partizip2: 'geschlagen',
        options_partizip2: ['geschlagen', 'schlug', 'schlagen', 'geschlagt']
      },
      {
        id: 'schlagen-2',
        ru: 'Мы бьём в дверь.',
        sentence_praesens: 'Wir ____ an die Tür.',
        correct_praesens: 'schlagen',
        options_praesens: ['schlagen', 'schlägt', 'schlage', 'schlug'],
        sentence_praeteritum: 'Wir ____ an die Tür.',
        correct_praeteritum: 'schlugen',
        options_praeteritum: ['schlugen', 'schlug', 'schlagen', 'geschlagen'],
        sentence_partizip2: 'Wir haben an die Tür ____.',
        correct_partizip2: 'geschlagen',
        options_partizip2: ['geschlagen', 'schlug', 'schlagen', 'geschlagt']
      },
      {
        id: 'tragen-1',
        ru: 'Она несёт сумку.',
        sentence_praesens: 'Sie ____ die Tasche.',
        correct_praesens: 'trägt',
        options_praesens: ['trägt', 'trage', 'tragt', 'trug'],
        sentence_praeteritum: 'Sie ____ die Tasche.',
        correct_praeteritum: 'trug',
        options_praeteritum: ['trug', 'trugt', 'trägt', 'getragen'],
        sentence_partizip2: 'Sie hat die Tasche ____.',
        correct_partizip2: 'getragen',
        options_partizip2: ['getragen', 'trug', 'tragen', 'getragt']
      },
      {
        id: 'tragen-2',
        ru: 'Мы несём книги.',
        sentence_praesens: 'Wir ____ die Bücher.',
        correct_praesens: 'tragen',
        options_praesens: ['tragen', 'trägt', 'trage', 'trug'],
        sentence_praeteritum: 'Wir ____ die Bücher.',
        correct_praeteritum: 'trugen',
        options_praeteritum: ['trugen', 'trug', 'tragen', 'getragen'],
        sentence_partizip2: 'Wir haben die Bücher ____.',
        correct_partizip2: 'getragen',
        options_partizip2: ['getragen', 'trugen', 'tragen', 'getragt']
      },
      {
        id: 'wachsen-1',
        ru: 'Цветок растёт быстро.',
        sentence_praesens: 'Die Blume ____ schnell.',
        correct_praesens: 'wächst',
        options_praesens: ['wächst', 'wachse', 'wachst', 'wuchs'],
        sentence_praeteritum: 'Die Blume ____ schnell.',
        correct_praeteritum: 'wuchs',
        options_praeteritum: ['wuchs', 'wuchst', 'wächst', 'gewachsen'],
        sentence_partizip2: 'Die Blume ist schnell ____.',
        correct_partizip2: 'gewachsen',
        options_partizip2: ['gewachsen', 'wuchs', 'wachsen', 'gewachst']
      },
      {
        id: 'wachsen-2',
        ru: 'Дети растут быстро.',
        sentence_praesens: 'Die Kinder ____ schnell.',
        correct_praesens: 'wachsen',
        options_praesens: ['wachsen', 'wächst', 'wachse', 'wuchs'],
        sentence_praeteritum: 'Die Kinder ____ schnell.',
        correct_praeteritum: 'wuchsen',
        options_praeteritum: ['wuchsen', 'wuchs', 'wachsen', 'gewachsen'],
        sentence_partizip2: 'Die Kinder sind schnell ____.',
        correct_partizip2: 'gewachsen',
        options_partizip2: ['gewachsen', 'wuchsen', 'wachsen', 'gewachst']
      },
      {
        id: 'waschen-1',
        ru: 'Ты моешь руки.',
        sentence_praesens: 'Du ____ die Hände.',
        correct_praesens: 'wäschst',
        options_praesens: ['wäschst', 'wasche', 'wäscht', 'wusch'],
        sentence_praeteritum: 'Du ____ die Hände.',
        correct_praeteritum: 'wuschst',
        options_praeteritum: ['wuschst', 'wusch', 'wäschst', 'gewaschen'],
        sentence_partizip2: 'Du hast die Hände ____.',
        correct_partizip2: 'gewaschen',
        options_partizip2: ['gewaschen', 'wusch', 'waschen', 'gewascht']
      },
      {
        id: 'waschen-2',
        ru: 'Мы моем одежду.',
        sentence_praesens: 'Wir ____ die Kleidung.',
        correct_praesens: 'waschen',
        options_praesens: ['waschen', 'wäscht', 'wasche', 'wusch'],
        sentence_praeteritum: 'Wir ____ die Kleidung.',
        correct_praeteritum: 'wuschen',
        options_praeteritum: ['wuschen', 'wusch', 'waschen', 'gewaschen'],
        sentence_partizip2: 'Wir haben die Kleidung ____.',
        correct_partizip2: 'gewaschen',
        options_partizip2: ['gewaschen', 'wusch', 'waschen', 'gewascht']
      },
      {
        id: 'einladen-1',
        ru: 'Он приглашает друга.',
        sentence_praesens: 'Er ____ den Freund ein.',
        correct_praesens: 'lädt',
        options_praesens: ['lädt', 'lade', 'lädst', 'lud'],
        sentence_praeteritum: 'Er ____ den Freund ein.',
        correct_praeteritum: 'lud',
        options_praeteritum: ['lud', 'ludst', 'lädt', 'eingeladen'],
        sentence_partizip2: 'Er hat den Freund ____.',
        correct_partizip2: 'eingeladen',
        options_partizip2: ['eingeladen', 'lud', 'einladen', 'eingeladet']
      },
      {
        id: 'einladen-2',
        ru: 'Я приглашаю сестру.',
        sentence_praesens: 'Ich ____ die Schwester ein.',
        correct_praesens: 'lade',
        options_praesens: ['lade', 'lädst', 'lädt', 'lud'],
        sentence_praeteritum: 'Ich ____ die Schwester ein.',
        correct_praeteritum: 'lud',
        options_praeteritum: ['lud', 'ludst', 'lade', 'eingeladen'],
        sentence_partizip2: 'Ich habe die Schwester ____.',
        correct_partizip2: 'eingeladen',
        options_partizip2: ['eingeladen', 'lud', 'einladen', 'eingeladet']
      },
      {
        id: 'erfahren-1',
        ru: 'Она узнаёт правду.',
        sentence_praesens: 'Sie ____ die Wahrheit.',
        correct_praesens: 'erfährt',
        options_praesens: ['erfährt', 'erfahre', 'erfährst', 'erfuhr'],
        sentence_praeteritum: 'Sie ____ die Wahrheit.',
        correct_praeteritum: 'erfuhr',
        options_praeteritum: ['erfuhr', 'erfuhrst', 'erfährt', 'erfahren'],
        sentence_partizip2: 'Sie hat die Wahrheit ____.',
        correct_partizip2: 'erfahren',
        options_partizip2: ['erfahren', 'erfuhr', 'erfährt', 'erfahrt']
      },
      {
        id: 'erfahren-2',
        ru: 'Мы узнаём новости.',
        sentence_praesens: 'Wir ____ die Nachrichten.',
        correct_praesens: 'erfahren',
        options_praesens: ['erfahren', 'erfährt', 'erfahre', 'erfuhr'],
        sentence_praeteritum: 'Wir ____ die Nachrichten.',
        correct_praeteritum: 'erfuhren',
        options_praeteritum: ['erfuhren', 'erfuhr', 'erfahren', 'erfährt'],
        sentence_partizip2: 'Wir haben die Nachrichten ____.',
        correct_partizip2: 'erfahren',
        options_partizip2: ['erfahren', 'erfuhr', 'erfahrt', 'erfährt']
      },
      {
        id: 'vorschlagen-1',
        ru: 'Ты предлагаешь план.',
        sentence_praesens: 'Du ____ einen Plan vor.',
        correct_praesens: 'schlägst',
        options_praesens: ['schlägst', 'schlage', 'schlägt', 'schlug'],
        sentence_praeteritum: 'Du ____ einen Plan vor.',
        correct_praeteritum: 'schlugst',
        options_praeteritum: ['schlugst', 'schlug', 'schlägst', 'vorgeschlagen'],
        sentence_partizip2: 'Du hast einen Plan ____.',
        correct_partizip2: 'vorgeschlagen',
        options_partizip2: ['vorgeschlagen', 'schlug', 'vorschlagen', 'vorgeschlagt']
      },
      {
        id: 'vorschlagen-2',
        ru: 'Они предлагают идею.',
        sentence_praesens: 'Sie ____ eine Idee vor.',
        correct_praesens: 'schlagen',
        options_praesens: ['schlagen', 'schlägt', 'schlage', 'schlug'],
        sentence_praeteritum: 'Sie ____ eine Idee vor.',
        correct_praeteritum: 'schlugen',
        options_praeteritum: ['schlugen', 'schlug', 'schlagen', 'vorgeschlagen'],
        sentence_partizip2: 'Sie haben eine Idee ____.',
        correct_partizip2: 'vorgeschlagen',
        options_partizip2: ['vorgeschlagen', 'schlug', 'vorschlagen', 'vorgeschlagt']
      },
      {
        id: 'beitragen-1',
        ru: 'Он вносит деньги.',
        sentence_praesens: 'Er ____ Geld bei.',
        correct_praesens: 'trägt',
        options_praesens: ['trägt', 'trage', 'trägst', 'trug'],
        sentence_praeteritum: 'Er ____ Geld bei.',
        correct_praeteritum: 'trug',
        options_praeteritum: ['trug', 'trugt', 'trägt', 'beigetragen'],
        sentence_partizip2: 'Er hat Geld ____.',
        correct_partizip2: 'beigetragen',
        options_partizip2: ['beigetragen', 'trug', 'beitragen', 'beigetragt']
      },
      {
        id: 'beitragen-2',
        ru: 'Мы вносим вклад.',
        sentence_praesens: 'Wir ____ viel bei.',
        correct_praesens: 'tragen',
        options_praesens: ['tragen', 'trägt', 'trage', 'trug'],
        sentence_praeteritum: 'Wir ____ dazu bei.',
        correct_praeteritum: 'trugen',
        options_praeteritum: ['trugen', 'trug', 'tragen', 'beigetragen'],
        sentence_partizip2: 'Wir haben dazu ____.',
        correct_partizip2: 'beigetragen',
        options_partizip2: ['beigetragen', 'trugen', 'beitragen', 'beigetragt']
      },
      {
        id: 'gewinnen-1',
        ru: 'Она выигрывает игру.',
        sentence_praesens: 'Sie ____ das Spiel.',
        correct_praesens: 'gewinnt',
        options_praesens: ['gewinnt', 'gewinne', 'gewinnst', 'gewann'],
        sentence_praeteritum: 'Sie ____ das Spiel.',
        correct_praeteritum: 'gewann',
        options_praeteritum: ['gewann', 'gewannen', 'gewinnt', 'gewonnen'],
        sentence_partizip2: 'Sie hat das Spiel ____.',
        correct_partizip2: 'gewonnen',
        options_partizip2: ['gewonnen', 'gewann', 'gewinnen', 'gewonnt']
      },
      {
        id: 'gewinnen-2',
        ru: 'Мы выигрываем конкурс.',
        sentence_praesens: 'Wir ____ den Wettbewerb.',
        correct_praesens: 'gewinnen',
        options_praesens: ['gewinnen', 'gewinnt', 'gewinne', 'gewann'],
        sentence_praeteritum: 'Wir ____ den Wettbewerb.',
        correct_praeteritum: 'gewannen',
        options_praeteritum: ['gewannen', 'gewann', 'gewinnen', 'gewonnen'],
        sentence_partizip2: 'Wir haben den Wettbewerb ____.',
        correct_partizip2: 'gewonnen',
        options_partizip2: ['gewonnen', 'gewannen', 'gewinnen', 'gewonnt']
      },
      {
        id: 'schwimmen-1',
        ru: 'Я плаваю быстро.',
        sentence_praesens: 'Ich ____ schnell.',
        correct_praesens: 'schwimme',
        options_praesens: ['schwimme', 'schwimmst', 'schwimmt', 'schwamm'],
        sentence_praeteritum: 'Ich ____ schnell.',
        correct_praeteritum: 'schwamm',
        options_praeteritum: ['schwamm', 'schwammen', 'schwimme', 'geschwommen'],
        sentence_partizip2: 'Ich bin schnell ____.',
        correct_partizip2: 'geschwommen',
        options_partizip2: ['geschwommen', 'schwamm', 'schwimmen', 'geschwommt']
      },
      {
        id: 'schwimmen-2',
        ru: 'Они плавают в море.',
        sentence_praesens: 'Sie ____ im Meer.',
        correct_praesens: 'schwimmen',
        options_praesens: ['schwimmen', 'schwimmt', 'schwimme', 'schwamm'],
        sentence_praeteritum: 'Sie ____ im Meer.',
        correct_praeteritum: 'schwammen',
        options_praeteritum: ['schwammen', 'schwamm', 'schwimmen', 'geschwommen'],
        sentence_partizip2: 'Sie sind im Meer ____.',
        correct_partizip2: 'geschwommen',
        options_partizip2: ['geschwommen', 'schwammen', 'schwimmen', 'geschwommt']
      },
      {
        id: 'beginnen-1',
        ru: 'Курс начинается сегодня.',
        sentence_praesens: 'Der Kurs ____ heute.',
        correct_praesens: 'beginnt',
        options_praesens: ['beginnt', 'beginne', 'beginnst', 'begann'],
        sentence_praeteritum: 'Der Kurs ____ heute.',
        correct_praeteritum: 'begann',
        options_praeteritum: ['begann', 'begannen', 'beginnt', 'begonnen'],
        sentence_partizip2: 'Der Kurs hat heute ____.',
        correct_partizip2: 'begonnen',
        options_partizip2: ['begonnen', 'begann', 'beginnen', 'begonnt']
      },
      {
        id: 'beginnen-2',
        ru: 'Мы начинаем сразу.',
        sentence_praesens: 'Wir ____ sofort.',
        correct_praesens: 'beginnen',
        options_praesens: ['beginnen', 'beginnt', 'beginne', 'begann'],
        sentence_praeteritum: 'Wir ____ sofort.',
        correct_praeteritum: 'begannen',
        options_praeteritum: ['begannen', 'begann', 'beginnen', 'begonnen'],
        sentence_partizip2: 'Wir haben sofort ____.',
        correct_partizip2: 'begonnen',
        options_partizip2: ['begonnen', 'begannen', 'beginnen', 'begonnt']
      },
      {
        id: 'schaffen-praesens',
        ru: 'Художник создаёт картину.',
        sentence_praesens: 'Der Künstler ____ ein Bild.',
        correct_praesens: 'schafft',
        options_praesens: ['schafft', 'schaffe', 'schaffst', 'schuf'],
        sentence_praeteritum: 'Der Künstler ____ ein Bild.',
        correct_praeteritum: 'schuf',
        options_praeteritum: ['schuf', 'schufst', 'schafft', 'geschaffen'],
        sentence_partizip2: 'Der Künstler hat ein Bild ____.',
        correct_partizip2: 'geschaffen',
        options_partizip2: ['geschaffen', 'schuf', 'schaffen', 'geschafft']
      },
      {
        id: 'sinnen-praesens',
        ru: 'Он размышляет о проблеме.',
        sentence_praesens: 'Er ____ über das Problem.',
        correct_praesens: 'sinnt',
        options_praesens: ['sinnt', 'sinne', 'sinnst', 'sann'],
        sentence_praeteritum: 'Er ____ über das Problem.',
        correct_praeteritum: 'sann',
        options_praeteritum: ['sann', 'sannst', 'sinnt', 'gesonnen'],
        sentence_partizip2: 'Er hat über das Problem ____.',
        correct_partizip2: 'gesonnen',
        options_partizip2: ['gesonnen', 'sann', 'sinnen', 'gesinnt']
      },
      {
        id: 'rinnen-praesens',
        ru: 'Вода течёт из трубы.',
        sentence_praesens: 'Das Wasser ____ aus dem Rohr.',
        correct_praesens: 'rinnt',
        options_praesens: ['rinnt', 'rinne', 'rinnst', 'rann'],
        sentence_praeteritum: 'Das Wasser ____ aus dem Rohr.',
        correct_praeteritum: 'rann',
        options_praeteritum: ['rann', 'rannst', 'rinnt', 'geronnen'],
        sentence_partizip2: 'Das Wasser ist aus dem Rohr ____.',
        correct_partizip2: 'geronnen',
        options_partizip2: ['geronnen', 'rann', 'rinnen', 'gerinnt']
      }
    ],
    verbFormExercises: [
      { id: 'fahren', ru: 'ехать', praesens: 'fahren', praeteritum: 'fuhr', auxillary: 'hat/ist', partizip2: 'gefahren' },
      { id: 'graben', ru: 'копать', praesens: 'graben', praeteritum: 'grub', auxillary: 'hat', partizip2: 'gegraben' },
      { id: 'laden', ru: 'грузить', praesens: 'laden', praeteritum: 'lud', auxillary: 'hat', partizip2: 'geladen' },
      { id: 'schlagen', ru: 'бить', praesens: 'schlagen', praeteritum: 'schlug', auxillary: 'hat', partizip2: 'geschlagen' },
      { id: 'tragen', ru: 'нести', praesens: 'tragen', praeteritum: 'trug', auxillary: 'hat', partizip2: 'getragen' },
      { id: 'wachsen', ru: 'расти', praesens: 'wachsen', praeteritum: 'wuchs', auxillary: 'ist', partizip2: 'gewachsen' },
      { id: 'waschen', ru: 'мыть', praesens: 'waschen', praeteritum: 'wusch', auxillary: 'hat', partizip2: 'gewaschen' },
      { id: 'einladen', ru: 'приглашать', praesens: 'einladen', praeteritum: 'lud ein', auxillary: 'hat', partizip2: 'eingeladen' },
      { id: 'erfahren', ru: 'узнавать', praesens: 'erfahren', praeteritum: 'erfuhr', auxillary: 'hat', partizip2: 'erfahren' },
      { id: 'vorschlagen', ru: 'предлагать', praesens: 'vorschlagen', praeteritum: 'schlug vor', auxillary: 'hat', partizip2: 'vorgeschlagen' },
      { id: 'beitragen', ru: 'вносить вклад', praesens: 'beitragen', praeteritum: 'trug bei', auxillary: 'hat', partizip2: 'beigetragen' },
      { id: 'gewinnen', ru: 'выигрывать', praesens: 'gewinnen', praeteritum: 'gewann', auxillary: 'hat', partizip2: 'gewonnen' },
      { id: 'schwimmen', ru: 'плавать', praesens: 'schwimmen', praeteritum: 'schwamm', auxillary: 'hat/ist', partizip2: 'geschwommen' },
      { id: 'beginnen', ru: 'начинать', praesens: 'beginnen', praeteritum: 'begann', auxillary: 'hat', partizip2: 'begonnen' },
      { id: 'schaffen', ru: 'творить, создавать', praesens: 'schaffen', praeteritum: 'schuf', auxillary: 'hat', partizip2: 'geschaffen' },
      { id: 'sinnen', ru: 'размышлять', praesens: 'sinnen', praeteritum: 'sann', auxillary: 'hat', partizip2: 'gesonnen' },
      { id: 'rinnen', ru: 'течь, струиться', praesens: 'rinnen', praeteritum: 'rann', auxillary: 'ist', partizip2: 'geronnen' }
    ],
    verbFormCards: [
      { id: 'fahren-card-forms', ru: 'ехать', praesens: 'fahren', praeteritum: 'fuhr', auxillary: 'ist', partizip2: 'gefahren' },
      { id: 'graben-card-forms', ru: 'копать', praesens: 'graben', praeteritum: 'grub', auxillary: 'hat', partizip2: 'gegraben' },
      { id: 'laden-card-forms', ru: 'грузить', praesens: 'laden', praeteritum: 'lud', auxillary: 'hat', partizip2: 'geladen' },
      { id: 'schlagen-card-forms', ru: 'бить', praesens: 'schlagen', praeteritum: 'schlug', auxillary: 'hat', partizip2: 'geschlagen' },
      { id: 'tragen-card-forms', ru: 'нести', praesens: 'tragen', praeteritum: 'trug', auxillary: 'hat', partizip2: 'getragen' },
      { id: 'wachsen-card-forms', ru: 'расти', praesens: 'wachsen', praeteritum: 'wuchs', auxillary: 'ist', partizip2: 'gewachsen' },
      { id: 'waschen-card-forms', ru: 'мыть', praesens: 'waschen', praeteritum: 'wusch', auxillary: 'hat', partizip2: 'gewaschen' },
      { id: 'einladen-card-forms', ru: 'приглашать', praesens: 'einladen', praeteritum: 'lud ein', auxillary: 'hat', partizip2: 'eingeladen' },
      { id: 'erfahren-card-forms', ru: 'узнавать', praesens: 'erfahren', praeteritum: 'erfuhr', auxillary: 'hat', partizip2: 'erfahren' },
      { id: 'vorschlagen-card-forms', ru: 'предлагать', praesens: 'vorschlagen', praeteritum: 'schlug vor', auxillary: 'hat', partizip2: 'vorgeschlagen' },
      { id: 'beitragen-card-forms', ru: 'вносить вклад', praesens: 'beitragen', praeteritum: 'trug bei', auxillary: 'hat', partizip2: 'beigetragen' },
      { id: 'gewinnen-card-forms', ru: 'выигрывать', praesens: 'gewinnen', praeteritum: 'gewann', auxillary: 'hat', partizip2: 'gewonnen' },
      { id: 'schwimmen-card-forms', ru: 'плавать', praesens: 'schwimmen', praeteritum: 'schwamm', auxillary: 'ist', partizip2: 'geschwommen' },
      { id: 'beginnen-card-forms', ru: 'начинать', praesens: 'beginnen', praeteritum: 'begann', auxillary: 'hat', partizip2: 'begonnen' },
      { id: 'schaffen-card-forms', ru: 'творить, создавать', praesens: 'schaffen', praeteritum: 'schuf', auxillary: 'hat', partizip2: 'geschaffen' },
      { id: 'sinnen-card-forms', ru: 'размышлять', praesens: 'sinnen', praeteritum: 'sann', auxillary: 'hat', partizip2: 'gesonnen' },
      { id: 'rinnen-card-forms', ru: 'течь, струиться', praesens: 'rinnen', praeteritum: 'rann', auxillary: 'ist', partizip2: 'geronnen' }
    ]
  };