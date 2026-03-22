#!/usr/bin/env node
/**
 * Downloads voiceover MP3s from ElevenLabs for the Dinosaur encyclopedia.
 * Run: node download-voiceover.js [--lang cs|pt|es|all]
 *
 * Generates ~52 MP3 files per language:
 * - 1 welcome message
 * - 7 topic names
 * - 21 lesson paragraphs (7 lessons x 3 paragraphs)
 * - 7 fun facts
 * - 10 quiz questions (with options)
 * - 6 exercise/activity descriptions
 *
 * Output directories:
 * - CS: audio/
 * - PT: audio/pt/
 * - ES: audio/es/
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error('Missing ELEVENLABS_API_KEY in .env');
  process.exit(1);
}

const VOICE_ID = 'ErXwobaYiN019PkySvjV'; // Antoni — multilingual

// === TEXTS PER LANGUAGE ===

const texts = {
  cs: [
    // Welcome
    { file: 'home-welcome.mp3', text: 'Ahoj! Vítej ve Světě Dinosaurů! Tady se dozvíš všechno o obrovských zvířatech, která žila dávno dávno. Pojď objevovat!' },

    // Topic names
    { file: 'topic-0.mp3', text: 'Co jsou dinosauři?' },
    { file: 'topic-1.mp3', text: 'Velcí masožravci' },
    { file: 'topic-2.mp3', text: 'Hodní býložravci' },
    { file: 'topic-3.mp3', text: 'Brnění a rohy' },
    { file: 'topic-4.mp3', text: 'Létající a vodní' },
    { file: 'topic-5.mp3', text: 'Jak dinosauři žili' },
    { file: 'topic-6.mp3', text: 'Velký třesk' },

    // Lesson 0
    { file: 'lesson-0-p0.mp3', text: 'Dinosauři byli obrovská zvířata. Žili dávno dávno, když ještě nebyli žádní lidé.' },
    { file: 'lesson-0-p1.mp3', text: 'Někteří byli velcí jako dům! Jiní byli maličcí, jako slepička.' },
    { file: 'lesson-0-p2.mp3', text: 'Dinosauři žili na celé Zemi. Byli všude — v lesích, u řek i na horách.' },
    { file: 'lesson-0-fun.mp3', text: 'Věděl jsi, že slovo dinosaurus znamená „hrozný ještěr"? Ale někteří byli hodně hodně hodní!' },

    // Lesson 1
    { file: 'lesson-1-p0.mp3', text: 'Tyrannosaurus Rex byl král dinosaurů! Měl obrovskou tlamu plnou ostrých zubů.' },
    { file: 'lesson-1-p1.mp3', text: 'Masožravci jedli maso, protože to bylo plné energie. Museli být rychlí a silní.' },
    { file: 'lesson-1-p2.mp3', text: 'Spinosaurus měl na zádech obrovskou plachtu. Byl ještě větší než T-Rex!' },
    { file: 'lesson-1-fun.mp3', text: 'Věděl jsi, že T-Rex měl zuby velké jako banán? Ale jeho ručičky byly úplně maličké!' },

    // Lesson 2
    { file: 'lesson-2-p0.mp3', text: 'Brachiosaurus měl dlouhatánský krk. Dosáhl i na nejvyšší stromy!' },
    { file: 'lesson-2-p1.mp3', text: 'Býložravci jedli rostliny, listy a kapradiny. Jedli celý den, protože rostliny nemají tolik energie.' },
    { file: 'lesson-2-p2.mp3', text: 'Diplodocus měl ocas dlouhý jako autobus! Práskem s ním odháněl nebezpečné masožravce.' },
    { file: 'lesson-2-fun.mp3', text: 'Věděl jsi, že Brachiosaurus snědl každý den tolik rostlin, jako kdybys snědl 400 talířů salátu?' },

    // Lesson 3
    { file: 'lesson-3-p0.mp3', text: 'Triceratops měl tři velké rohy a obrovský štít na hlavě. Chránil se tak před masožravci!' },
    { file: 'lesson-3-p1.mp3', text: 'Ankylosaurus měl celou krunýř jako želvička. A na konci ocasu měl těžký palcát!' },
    { file: 'lesson-3-p2.mp3', text: 'Stegosaurus měl na zádech velké kostěné desky. A na ocasu měl ostny — to bolelo!' },
    { file: 'lesson-3-fun.mp3', text: 'Věděl jsi, že štít Triceratopse byl široký jako vana? Žádný masožravec se mu nechtěl postavit!' },

    // Lesson 4
    { file: 'lesson-4-p0.mp3', text: 'Pteranodon létal po obloze jako obrovské letadlo! Měl křídla široká jako auto.' },
    { file: 'lesson-4-p1.mp3', text: 'Pteranodon vlastně nebyl dinosaurus, ale byl to jejich kamarád. Žil ve stejné době.' },
    { file: 'lesson-4-p2.mp3', text: 'Ve vodě žil Plesiosaurus. Měl dlouhý krk a plaval jako obrovská labuť.' },
    { file: 'lesson-4-fun.mp3', text: 'Věděl jsi, že Quetzalcoatlus měl křídla široká 10 metrů? To je širší než tvůj pokoj!' },

    // Lesson 5
    { file: 'lesson-5-p0.mp3', text: 'Dinosauři se líhli z vajíček! Maminka dinosauřice stavěla hnízdo a strážila svá miminka.' },
    { file: 'lesson-5-p1.mp3', text: 'Někteří dinosauři žili ve stádu, jako krávy. Společně se bránili před masožravci.' },
    { file: 'lesson-5-p2.mp3', text: 'Dinosauří miminka byla maličká a roztomilá. Rychle rostla a naučila se chodit hned po vylíhnutí.' },
    { file: 'lesson-5-fun.mp3', text: 'Věděl jsi, že dinosauří vajíčka byla velká jako malý míč? A některá byla úplně kulatá!' },

    // Lesson 6
    { file: 'lesson-6-p0.mp3', text: 'Před 66 miliony let spadl z nebe obrovský kámen z vesmíru — meteorit! BUM!' },
    { file: 'lesson-6-p1.mp3', text: 'Byl velký jako celá Praha! Narazil do Země a udělal obrovský prach a požáry.' },
    { file: 'lesson-6-p2.mp3', text: 'Prach zakryl Slunce a bylo tma a zima. Dinosauři to nevydrželi. Ale malá zvířátka přežila!' },
    { file: 'lesson-6-fun.mp3', text: 'Věděl jsi, že ptáčci jsou vlastně dinosauři? Když vidíš vrabečka, koukáš se na maličkého dinosaura!' },

    // Quiz
    { file: 'quiz-q0.mp3', text: 'Kolik rohů měl Triceratops? Jeden? Tři? Nebo deset?' },
    { file: 'quiz-q1.mp3', text: 'Co jedl T-Rex? Trávu a kytičky? Maso? Nebo čokoládu?' },
    { file: 'quiz-q2.mp3', text: 'Co spadlo z nebe a dinosauři vymřeli? Déšť? Meteorit? Nebo letadlo?' },
    { file: 'quiz-q3.mp3', text: 'Kdo měl dlouhý krk a jedl listy ze stromů? T-Rex? Brachiosaurus? Nebo Ankylosaurus?' },
    { file: 'quiz-q4.mp3', text: 'Co měl Ankylosaurus na konci ocasu? Květinu? Palcát? Nebo křídla?' },
    { file: 'quiz-q5.mp3', text: 'Z čeho se líhli dinosauři? Z vajíček? Z vody? Nebo ze stromů?' },
    { file: 'quiz-q6.mp3', text: 'Co je vlastně dinosaurus? Vrabček? Auto? Nebo kytka?' },
    { file: 'quiz-q7.mp3', text: 'Kdo uměl létat v době dinosaurů? T-Rex? Pteranodon? Nebo Triceratops?' },
    { file: 'quiz-q8.mp3', text: 'Proč měl Stegosaurus desky na zádech? Aby byl hezký? Na obranu? Nebo na létání?' },
    { file: 'quiz-q9.mp3', text: 'Jak velký byl meteorit, který zabil dinosaury? Jako míč? Jako auto? Nebo jako celé město?' },

    // Exercises
    { file: 'exercise-0.mp3', text: 'Zařvi jako T-Rex! T-Rex měl nejhlasitější řev ze všech dinosaurů. Zkus to taky! Za prvé: Postav se rovně a narovnej se co nejvíc. Za druhé: Nadechni se hodně hodně hluboko. Za třetí: Otevři pusu co nejvíc dokážeš. Za čtvrté: Zařvi ze všech sil! RRRAAAAA! Za páté: Ukaž zuby jako pravý T-Rex!' },
    { file: 'exercise-1.mp3', text: 'Dupej jako Brachiosaurus! Brachiosaurus byl tak těžký, že se při chůzi třásla zem! Za prvé: Rozkroč se co nejšíř. Za druhé: Zvedni jednu nohu vysoko. Za třetí: Dupni co nejhlasitěji! Za čtvrté: Teď druhou nohu! DUP DUP DUP! Za páté: Projdi celý pokoj jako obrovský dinosaurus!' },
    { file: 'exercise-2.mp3', text: 'Leť jako Pteranodon! Pteranodon létal nad hlavami dinosaurů na obrovských křídlech! Za prvé: Roztáhni ruce co nejšíř — to jsou tvá křídla! Za druhé: Mávej rukama nahoru a dolů. Za třetí: Běhej po pokoji a lítej! Za čtvrté: Dělej zvuky větru — FŠŠŠ! Za páté: Přistaň opatrně na zem!' },
    { file: 'exercise-3.mp3', text: 'Schovej se jako Ankylosaurus! Ankylosaurus se sbalil do klubíčka, když na něj útočil masožravec! Za prvé: Sedni si na zem. Za druhé: Sbal se do kuličky jako Ankylosaurus! Za třetí: Schovej hlavu mezi kolena. Za čtvrté: Teď jsi v bezpečí — máš brnění! Za páté: Nikdo ti nemůže ublížit!' },
    { file: 'exercise-4.mp3', text: 'Vylíhni se z vajíčka! Dinosauří mláďata se musela prodrat ven ze skořápky! Za prvé: Sbal se na zem do malého klubíčka. Za druhé: Jsi uvnitř dinosauřího vajíčka! Za třetí: Začni se hýbat a vrtět. Za čtvrté: Tlač rukama ven — PRASK! Skořápka praská! Za páté: Vstaň a podívej se kolem — jsi na světě!' },
    { file: 'exercise-5.mp3', text: 'Dinosauří tanec! Dinosauři sice netancovali, ale ty můžeš tancovat jako oni! Za prvé: Dupej nohama jako velký dinosaurus! Za druhé: Mávej rukama jako Pteranodon! Za třetí: Otáčej se dokola a vrť ocasem! Za čtvrté: Zařvi při tom — RRRR! Za páté: Jsi nejlepší tancující dinosaurus!' }
  ],

  pt: [
    // Welcome
    { file: 'home-welcome.mp3', text: 'Olá! Bem-vindo ao Mundo dos Dinossauros! Aqui vais descobrir tudo sobre animais enormes que viveram há muito muito tempo. Vem explorar!' },

    // Topic names
    { file: 'topic-0.mp3', text: 'O que são dinossauros?' },
    { file: 'topic-1.mp3', text: 'Grandes carnívoros' },
    { file: 'topic-2.mp3', text: 'Herbívoros simpáticos' },
    { file: 'topic-3.mp3', text: 'Armaduras e cornos' },
    { file: 'topic-4.mp3', text: 'Voadores e aquáticos' },
    { file: 'topic-5.mp3', text: 'Como viviam os dinossauros' },
    { file: 'topic-6.mp3', text: 'O grande impacto' },

    // Lesson 0
    { file: 'lesson-0-p0.mp3', text: 'Os dinossauros eram animais enormes. Viveram há muito muito tempo, quando ainda não havia pessoas.' },
    { file: 'lesson-0-p1.mp3', text: 'Alguns eram grandes como uma casa! Outros eram pequeninos, como uma galinha.' },
    { file: 'lesson-0-p2.mp3', text: 'Os dinossauros viviam em toda a Terra. Estavam em todo o lado — nas florestas, junto aos rios e nas montanhas.' },
    { file: 'lesson-0-fun.mp3', text: 'Sabias que a palavra dinossauro significa "lagarto terrível"? Mas alguns eram muito muito simpáticos!' },

    // Lesson 1
    { file: 'lesson-1-p0.mp3', text: 'O Tyrannosaurus Rex era o rei dos dinossauros! Tinha uma boca enorme cheia de dentes afiados.' },
    { file: 'lesson-1-p1.mp3', text: 'Os carnívoros comiam carne porque era cheia de energia. Tinham de ser rápidos e fortes.' },
    { file: 'lesson-1-p2.mp3', text: 'O Spinosaurus tinha uma vela enorme nas costas. Era ainda maior que o T-Rex!' },
    { file: 'lesson-1-fun.mp3', text: 'Sabias que o T-Rex tinha dentes do tamanho de uma banana? Mas os seus bracinhos eram muito pequeninos!' },

    // Lesson 2
    { file: 'lesson-2-p0.mp3', text: 'O Brachiosaurus tinha um pescoço muito muito comprido. Alcançava até as árvores mais altas!' },
    { file: 'lesson-2-p1.mp3', text: 'Os herbívoros comiam plantas, folhas e fetos. Comiam o dia todo porque as plantas não têm tanta energia.' },
    { file: 'lesson-2-p2.mp3', text: 'O Diplodocus tinha uma cauda tão comprida como um autocarro! Usava-a para afastar os carnívoros perigosos.' },
    { file: 'lesson-2-fun.mp3', text: 'Sabias que o Brachiosaurus comia tantas plantas por dia como se tu comesses 400 pratos de salada?' },

    // Lesson 3
    { file: 'lesson-3-p0.mp3', text: 'O Triceratops tinha três grandes cornos e um escudo enorme na cabeça. Assim protegia-se dos carnívoros!' },
    { file: 'lesson-3-p1.mp3', text: 'O Ankylosaurus tinha uma armadura inteira como uma tartaruga. E na ponta da cauda tinha uma clava pesada!' },
    { file: 'lesson-3-p2.mp3', text: 'O Stegosaurus tinha grandes placas de osso nas costas. E na cauda tinha espigões — isso doía!' },
    { file: 'lesson-3-fun.mp3', text: 'Sabias que o escudo do Triceratops era largo como uma banheira? Nenhum carnívoro queria enfrentá-lo!' },

    // Lesson 4
    { file: 'lesson-4-p0.mp3', text: 'O Pteranodon voava pelo céu como um avião enorme! Tinha asas tão largas como um carro.' },
    { file: 'lesson-4-p1.mp3', text: 'O Pteranodon na verdade não era um dinossauro, mas era amigo deles. Viveu na mesma época.' },
    { file: 'lesson-4-p2.mp3', text: 'Na água vivia o Plesiosaurus. Tinha um pescoço comprido e nadava como um cisne gigante.' },
    { file: 'lesson-4-fun.mp3', text: 'Sabias que o Quetzalcoatlus tinha asas com 10 metros de largura? É mais largo que o teu quarto!' },

    // Lesson 5
    { file: 'lesson-5-p0.mp3', text: 'Os dinossauros nasciam de ovos! A mamã dinossaura construía um ninho e vigiava os seus bebés.' },
    { file: 'lesson-5-p1.mp3', text: 'Alguns dinossauros viviam em manadas, como as vacas. Juntos defendiam-se dos carnívoros.' },
    { file: 'lesson-5-p2.mp3', text: 'Os bebés dinossauros eram pequeninos e fofos. Cresciam depressa e aprendiam a andar logo depois de nascer.' },
    { file: 'lesson-5-fun.mp3', text: 'Sabias que os ovos de dinossauro eram grandes como uma bola pequena? E alguns eram completamente redondos!' },

    // Lesson 6
    { file: 'lesson-6-p0.mp3', text: 'Há 66 milhões de anos caiu do céu uma pedra enorme do espaço — um meteorito! BUM!' },
    { file: 'lesson-6-p1.mp3', text: 'Era grande como Lisboa inteira! Atingiu a Terra e fez uma poeira e fogos enormes.' },
    { file: 'lesson-6-p2.mp3', text: 'A poeira tapou o Sol e ficou escuro e frio. Os dinossauros não aguentaram. Mas os animais pequenos sobreviveram!' },
    { file: 'lesson-6-fun.mp3', text: 'Sabias que os pássaros são na verdade dinossauros? Quando vês um pardal, estás a olhar para um dinossauro pequenino!' },

    // Quiz
    { file: 'quiz-q0.mp3', text: 'Quantos cornos tinha o Triceratops? Um? Três? Ou dez?' },
    { file: 'quiz-q1.mp3', text: 'O que comia o T-Rex? Erva e flores? Carne? Ou chocolate?' },
    { file: 'quiz-q2.mp3', text: 'O que caiu do céu e os dinossauros desapareceram? Chuva? Meteorito? Ou avião?' },
    { file: 'quiz-q3.mp3', text: 'Quem tinha pescoço comprido e comia folhas das árvores? T-Rex? Brachiosaurus? Ou Ankylosaurus?' },
    { file: 'quiz-q4.mp3', text: 'O que tinha o Ankylosaurus na ponta da cauda? Uma flor? Uma clava? Ou asas?' },
    { file: 'quiz-q5.mp3', text: 'De que nasciam os dinossauros? De ovos? Da água? Ou das árvores?' },
    { file: 'quiz-q6.mp3', text: 'O que é na verdade um dinossauro? Um pardal? Um carro? Ou uma flor?' },
    { file: 'quiz-q7.mp3', text: 'Quem sabia voar no tempo dos dinossauros? T-Rex? Pteranodon? Ou Triceratops?' },
    { file: 'quiz-q8.mp3', text: 'Porque tinha o Stegosaurus placas nas costas? Para ser bonito? Para defesa? Ou para voar?' },
    { file: 'quiz-q9.mp3', text: 'Qual era o tamanho do meteorito que matou os dinossauros? Como uma bola? Como um carro? Ou como uma cidade inteira?' },

    // Exercises
    { file: 'exercise-0.mp3', text: 'Ruge como o T-Rex! O T-Rex tinha o rugido mais alto de todos os dinossauros. Experimenta tu também! Primeiro: Fica de pé e estica-te o máximo que conseguires. Segundo: Inspira muito muito fundo. Terceiro: Abre a boca o máximo que conseguires. Quarto: RUGE com toda a força! RRRAAAAA! Quinto: Mostra os dentes como um verdadeiro T-Rex!' },
    { file: 'exercise-1.mp3', text: 'Pisa como o Brachiosaurus! O Brachiosaurus era tão pesado que o chão tremia quando andava! Primeiro: Abre bem as pernas. Segundo: Levanta um pé bem alto. Terceiro: PISA com toda a força! Quarto: Agora o outro pé! TUM TUM TUM! Quinto: Atravessa a sala como um dinossauro enorme!' },
    { file: 'exercise-2.mp3', text: 'Voa como o Pteranodon! O Pteranodon voava sobre as cabeças dos dinossauros com asas enormes! Primeiro: Estica os braços o máximo — são as tuas asas! Segundo: Bate os braços para cima e para baixo. Terceiro: Corre pela sala a voar! Quarto: Faz sons de vento — FSSSHH! Quinto: Aterra com cuidado no chão!' },
    { file: 'exercise-3.mp3', text: 'Esconde-te como o Ankylosaurus! O Ankylosaurus enrolava-se quando um carnívoro o atacava! Primeiro: Senta-te no chão. Segundo: Enrola-te como uma bola! Terceiro: Esconde a cabeça entre os joelhos. Quarto: Agora estás seguro — tens armadura! Quinto: Ninguém te pode fazer mal!' },
    { file: 'exercise-4.mp3', text: 'Nasce de um ovo! Os bebés dinossauros tinham de sair de dentro da casca! Primeiro: Enrola-te no chão bem pequenino. Segundo: Estás dentro de um ovo de dinossauro! Terceiro: Começa a mexer-te e a abanar. Quarto: Empurra com os braços — CRACK! A casca parte! Quinto: Levanta-te e olha à volta — nasceste!' },
    { file: 'exercise-5.mp3', text: 'Dança dos dinossauros! Os dinossauros não dançavam, mas tu podes dançar como eles! Primeiro: Pisa forte como um dinossauro grande! Segundo: Bate os braços como o Pteranodon! Terceiro: Roda e abana a cauda! Quarto: Ruge enquanto danças — RRRR! Quinto: És o melhor dinossauro dançarino!' }
  ],

  es: [
    // Welcome
    { file: 'home-welcome.mp3', text: '¡Hola! ¡Bienvenido al Mundo de los Dinosaurios! Aquí descubrirás todo sobre animales enormes que vivieron hace mucho mucho tiempo. ¡Ven a explorar!' },

    // Topic names
    { file: 'topic-0.mp3', text: '¿Qué son los dinosaurios?' },
    { file: 'topic-1.mp3', text: 'Grandes carnívoros' },
    { file: 'topic-2.mp3', text: 'Herbívoros amables' },
    { file: 'topic-3.mp3', text: 'Armaduras y cuernos' },
    { file: 'topic-4.mp3', text: 'Voladores y acuáticos' },
    { file: 'topic-5.mp3', text: 'Cómo vivían los dinosaurios' },
    { file: 'topic-6.mp3', text: 'El gran impacto' },

    // Lesson 0
    { file: 'lesson-0-p0.mp3', text: 'Los dinosaurios eran animales enormes. Vivieron hace mucho mucho tiempo, cuando no había personas.' },
    { file: 'lesson-0-p1.mp3', text: '¡Algunos eran grandes como una casa! Otros eran pequeñitos, como una gallina.' },
    { file: 'lesson-0-p2.mp3', text: 'Los dinosaurios vivían en toda la Tierra. Estaban en todas partes — en bosques, junto a ríos y en montañas.' },
    { file: 'lesson-0-fun.mp3', text: '¿Sabías que la palabra dinosaurio significa "lagarto terrible"? ¡Pero algunos eran muy muy buenos!' },

    // Lesson 1
    { file: 'lesson-1-p0.mp3', text: '¡Tyrannosaurus Rex era el rey de los dinosaurios! Tenía una boca enorme llena de dientes afilados.' },
    { file: 'lesson-1-p1.mp3', text: 'Los carnívoros comían carne porque estaba llena de energía. Tenían que ser rápidos y fuertes.' },
    { file: 'lesson-1-p2.mp3', text: '¡El Spinosaurus tenía una vela enorme en la espalda. Era aún más grande que el T-Rex!' },
    { file: 'lesson-1-fun.mp3', text: '¿Sabías que el T-Rex tenía dientes del tamaño de un plátano? ¡Pero sus bracitos eran muy pequeñitos!' },

    // Lesson 2
    { file: 'lesson-2-p0.mp3', text: '¡El Brachiosaurus tenía un cuello muy muy largo. Alcanzaba los árboles más altos!' },
    { file: 'lesson-2-p1.mp3', text: 'Los herbívoros comían plantas, hojas y helechos. Comían todo el día porque las plantas no tienen tanta energía.' },
    { file: 'lesson-2-p2.mp3', text: '¡El Diplodocus tenía una cola tan larga como un autobús! La usaba para alejar a los carnívoros peligrosos.' },
    { file: 'lesson-2-fun.mp3', text: '¿Sabías que el Brachiosaurus comía tantas plantas al día como si tú comieras 400 platos de ensalada?' },

    // Lesson 3
    { file: 'lesson-3-p0.mp3', text: '¡El Triceratops tenía tres grandes cuernos y un escudo enorme en la cabeza. Así se protegía de los carnívoros!' },
    { file: 'lesson-3-p1.mp3', text: '¡El Ankylosaurus tenía una armadura entera como una tortuga. Y en la punta de la cola tenía una maza pesada!' },
    { file: 'lesson-3-p2.mp3', text: '¡El Stegosaurus tenía grandes placas de hueso en la espalda. Y en la cola tenía púas — eso dolía!' },
    { file: 'lesson-3-fun.mp3', text: '¿Sabías que el escudo del Triceratops era ancho como una bañera? ¡Ningún carnívoro quería enfrentarlo!' },

    // Lesson 4
    { file: 'lesson-4-p0.mp3', text: '¡El Pteranodon volaba por el cielo como un avión enorme! Tenía alas tan anchas como un coche.' },
    { file: 'lesson-4-p1.mp3', text: 'El Pteranodon en realidad no era un dinosaurio, pero era su amigo. Vivió en la misma época.' },
    { file: 'lesson-4-p2.mp3', text: 'En el agua vivía el Plesiosaurus. Tenía un cuello largo y nadaba como un cisne gigante.' },
    { file: 'lesson-4-fun.mp3', text: '¿Sabías que el Quetzalcoatlus tenía alas de 10 metros de ancho? ¡Es más ancho que tu habitación!' },

    // Lesson 5
    { file: 'lesson-5-p0.mp3', text: '¡Los dinosaurios nacían de huevos! La mamá dinosauria construía un nido y vigilaba a sus bebés.' },
    { file: 'lesson-5-p1.mp3', text: 'Algunos dinosaurios vivían en manadas, como las vacas. Juntos se defendían de los carnívoros.' },
    { file: 'lesson-5-p2.mp3', text: 'Los bebés dinosaurios eran pequeñitos y adorables. Crecían rápido y aprendían a caminar justo después de nacer.' },
    { file: 'lesson-5-fun.mp3', text: '¿Sabías que los huevos de dinosaurio eran grandes como una pelota pequeña? ¡Y algunos eran completamente redondos!' },

    // Lesson 6
    { file: 'lesson-6-p0.mp3', text: '¡Hace 66 millones de años cayó del cielo una piedra enorme del espacio — un meteorito! ¡BUM!' },
    { file: 'lesson-6-p1.mp3', text: '¡Era grande como toda Madrid! Golpeó la Tierra e hizo polvo y fuegos enormes.' },
    { file: 'lesson-6-p2.mp3', text: 'El polvo tapó el Sol y quedó oscuro y frío. Los dinosaurios no aguantaron. ¡Pero los animales pequeños sobrevivieron!' },
    { file: 'lesson-6-fun.mp3', text: '¿Sabías que los pájaros son en realidad dinosaurios? ¡Cuando ves un gorrión, estás mirando a un dinosaurio pequeñito!' },

    // Quiz
    { file: 'quiz-q0.mp3', text: '¿Cuántos cuernos tenía el Triceratops? ¿Uno? ¿Tres? ¿O diez?' },
    { file: 'quiz-q1.mp3', text: '¿Qué comía el T-Rex? ¿Hierba y flores? ¿Carne? ¿O chocolate?' },
    { file: 'quiz-q2.mp3', text: '¿Qué cayó del cielo y los dinosaurios desaparecieron? ¿Lluvia? ¿Meteorito? ¿O avión?' },
    { file: 'quiz-q3.mp3', text: '¿Quién tenía cuello largo y comía hojas de los árboles? ¿T-Rex? ¿Brachiosaurus? ¿O Ankylosaurus?' },
    { file: 'quiz-q4.mp3', text: '¿Qué tenía el Ankylosaurus en la punta de la cola? ¿Una flor? ¿Una maza? ¿O alas?' },
    { file: 'quiz-q5.mp3', text: '¿De qué nacían los dinosaurios? ¿De huevos? ¿Del agua? ¿O de los árboles?' },
    { file: 'quiz-q6.mp3', text: '¿Qué es en realidad un dinosaurio? ¿Un gorrión? ¿Un coche? ¿O una flor?' },
    { file: 'quiz-q7.mp3', text: '¿Quién sabía volar en la época de los dinosaurios? ¿T-Rex? ¿Pteranodon? ¿O Triceratops?' },
    { file: 'quiz-q8.mp3', text: '¿Por qué tenía el Stegosaurus placas en la espalda? ¿Para ser guapo? ¿Para defensa? ¿O para volar?' },
    { file: 'quiz-q9.mp3', text: '¿Cómo de grande era el meteorito que mató a los dinosaurios? ¿Como una pelota? ¿Como un coche? ¿O como toda una ciudad?' },

    // Exercises
    { file: 'exercise-0.mp3', text: '¡Ruge como el T-Rex! ¡El T-Rex tenía el rugido más fuerte de todos los dinosaurios. Inténtalo tú también! Primero: Ponte de pie y estírate todo lo que puedas. Segundo: Respira muy muy profundo. Tercero: Abre la boca todo lo que puedas. Cuarto: ¡RUGE con todas tus fuerzas! ¡RRRAAAAA! Quinto: ¡Enseña los dientes como un verdadero T-Rex!' },
    { file: 'exercise-1.mp3', text: '¡Pisa como el Brachiosaurus! ¡El Brachiosaurus era tan pesado que el suelo temblaba cuando caminaba! Primero: Abre bien las piernas. Segundo: Levanta un pie bien alto. Tercero: ¡PISA con toda la fuerza! Cuarto: ¡Ahora el otro pie! ¡PUM PUM PUM! Quinto: ¡Cruza la sala como un dinosaurio enorme!' },
    { file: 'exercise-2.mp3', text: '¡Vuela como el Pteranodon! ¡El Pteranodon volaba sobre las cabezas de los dinosaurios con alas enormes! Primero: Estira los brazos al máximo — ¡son tus alas! Segundo: Mueve los brazos arriba y abajo. Tercero: ¡Corre por la sala y vuela! Cuarto: ¡Haz sonidos de viento — FSSHH! Quinto: ¡Aterriza con cuidado en el suelo!' },
    { file: 'exercise-3.mp3', text: '¡Escóndete como el Ankylosaurus! ¡El Ankylosaurus se hacía una bola cuando lo atacaba un carnívoro! Primero: Siéntate en el suelo. Segundo: ¡Hazte una bola como el Ankylosaurus! Tercero: Esconde la cabeza entre las rodillas. Cuarto: ¡Ahora estás a salvo — tienes armadura! Quinto: ¡Nadie puede hacerte daño!' },
    { file: 'exercise-4.mp3', text: '¡Nace de un huevo! ¡Los bebés dinosaurios tenían que salir de dentro de la cáscara! Primero: Enróllate en el suelo bien pequeñito. Segundo: ¡Estás dentro de un huevo de dinosaurio! Tercero: Empieza a moverte y a temblar. Cuarto: ¡Empuja con los brazos — CRACK! ¡La cáscara se rompe! Quinto: ¡Levántate y mira a tu alrededor — has nacido!' },
    { file: 'exercise-5.mp3', text: '¡Baile de dinosaurios! ¡Los dinosaurios no bailaban, pero tú puedes bailar como ellos! Primero: ¡Pisa fuerte como un dinosaurio grande! Segundo: ¡Mueve los brazos como el Pteranodon! Tercero: ¡Gira y menea la cola! Cuarto: ¡Ruge mientras bailas — RRRR! Quinto: ¡Eres el mejor dinosaurio bailarín!' }
  ]
};

function ttsRequest(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.55,
        similarity_boost: 0.75,
        style: 0.6,
        use_speaker_boost: true
      },
      speed: 0.85
    });

    const options = {
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${VOICE_ID}`,
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let errData = '';
        res.on('data', d => errData += d);
        res.on('end', () => reject(new Error(`HTTP ${res.statusCode}: ${errData}`)));
        return;
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  // Parse --lang argument
  const langArg = process.argv.find(a => a.startsWith('--lang='));
  const requestedLang = langArg ? langArg.split('=')[1] : 'all';
  const langs = requestedLang === 'all' ? ['cs', 'pt', 'es'] : [requestedLang];

  if (langs.some(l => !texts[l])) {
    console.error(`Unknown language. Available: cs, pt, es, all`);
    process.exit(1);
  }

  for (const lang of langs) {
    const audioDir = lang === 'cs'
      ? path.join(__dirname, 'audio')
      : path.join(__dirname, 'audio', lang);

    if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

    const files = texts[lang];
    console.log(`\n=== ${lang.toUpperCase()} — ${files.length} voiceover files → ${audioDir} ===\n`);

    for (let i = 0; i < files.length; i++) {
      const { file, text } = files[i];
      const filepath = path.join(audioDir, file);

      if (fs.existsSync(filepath)) {
        console.log(`[${i + 1}/${files.length}] SKIP ${file} (already exists)`);
        continue;
      }

      console.log(`[${i + 1}/${files.length}] Generating ${file}...`);
      try {
        const audioBuffer = await ttsRequest(text);
        fs.writeFileSync(filepath, audioBuffer);
        console.log(`  ✓ Saved (${(audioBuffer.length / 1024).toFixed(0)} KB)`);
      } catch (err) {
        console.error(`  ✗ Error: ${err.message}`);
      }

      // Small delay between requests to respect rate limits
      if (i < files.length - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }

  console.log('\nDone!');
}

main();
