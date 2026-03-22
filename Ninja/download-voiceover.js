#!/usr/bin/env node
/**
 * Downloads voiceover MP3s from ElevenLabs for the Ninja encyclopedia.
 * Run: node download-voiceover.js [lang]
 * Examples:
 *   node download-voiceover.js        # all languages
 *   node download-voiceover.js pt      # only Portuguese
 *   node download-voiceover.js es      # only Spanish
 *
 * File types:
 * - 7 exercise voiceovers (exercise-{0-6}-*.mp3)
 * - 7 topic title voiceovers (topic-{0-6}.mp3)
 * - 1 "read more" prompt (read-more.mp3)
 * - 10 quiz question voiceovers (quiz-q{0-9}.mp3)
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

const texts = {
  cs: [
    // Exercises (existing)
    { file: 'exercise-0-plamenak.mp3', text: 'Plameňák. Opravdoví ninjové dokázali stát na jedné noze celé minuty na úzkém okraji střechy. Zkus to taky! Za prvé: Postav se rovně a zvedni jednu nohu do vzduchu. Za druhé: Roztáhni ruce do stran, pomůže ti to udržet rovnováhu. Za třetí: Zkus vydržet 10 sekund. Zvládneš to se zavřenýma očima? Za čtvrté: Pak vyměň nohu a zkus znovu. Která noha je lepší?' },
    { file: 'exercise-1-tichy-presun.mp3', text: 'Tichý přesun. Ninjové trénovali tichý pohyb každý den. Museli projít kolem stráží a nesměli vydat ani hlásku. Za prvé: Sundej si boty, jdi naboso nebo v ponožkách. Za druhé: Našlápni nejdřív na špičku a pak pomalu polož celé chodidlo. Za třetí: Zkus přejít celý pokoj tak, aby tě nikdo neslyšel. Za čtvrté: Požádej někoho, ať zavře oči a zkusí poznat, kde jsi. Uslyší tě?' },
    { file: 'exercise-2-ninja-kotouly.mp3', text: 'Ninja kotouly. Ninjové se uměli kutálet, aby se vyhnuli útokům a rychle vstali na nohy. Kotoul je základ ninja obratnosti! Za prvé: Najdi měkkou podložku nebo koberec. Za druhé: Dřepni si, dej bradu na hrudník a ruce před sebe. Za třetí: Pomalu se převal dopředu přes záda. Za čtvrté: Zkus vstát rovnou na nohy! Ninja vždy skončí připravený.' },
    { file: 'exercise-3-ninja-pamet.mp3', text: 'Ninja paměť. Ninjové museli mít fotografickou paměť. Podívali se na mapu jen jednou a zapamatovali si každý detail. Za prvé: Polož na stůl 10 různých věcí, třeba tužku, lžíci, kostku. Za druhé: Dívej se na ně přesně 30 sekund, snaž se zapamatovat všechno. Za třetí: Přikryj je ručníkem a řekni nahlas, co tam bylo. Za čtvrté: Kolik jsi jich dal? 7 a víc znamená ninja paměť! Příště přidej víc věcí.' },
    { file: 'exercise-4-socha.mp3', text: 'Socha. Ninjové museli být úplně nehybní, když se schovali ve tmě a čekali na správný okamžik. Někdy i celé hodiny! Za prvé: Postav se nebo sedni do pohodlné pozice. Za druhé: Nastav si minutu na hodinkách nebo požádej někoho, aby měřil. Za třetí: Nehýbej se! Ani mrknutí, ani škrábání, ani úsměv. Za čtvrté: Je to těžší, než vypadá! Zkus příště 2 minuty.' },
    { file: 'exercise-5-hod-na-cil.mp3', text: 'Hod na cíl. Takhle ninjové trénovali přesnost se šurikeny! Ty použiješ ponožky, je to bezpečnější a stejně zábavné. Za prvé: Polož na zem talíř, noviny nebo list papíru, to je tvůj cíl. Za druhé: Sroluj ponožku do kuličky. Za třetí: Postav se 2 metry daleko a hoď! Za čtvrté: Trefil ses? Zkus 3 metry! A pak se otoč zády a hoď přes rameno.' },
    { file: 'exercise-6-kocici-krok.mp3', text: 'Kočičí krok. Ninjové trénovali přesné kroky, aby v noci nešlápli na větev nebo skřípající prkno. Kočky jsou v tomhle mistři! Za prvé: Rozlož po chodbě papíry nebo boty v řadě za sebou. Za druhé: Šlapej přesně jen na ně, nesmíš se dotknout podlahy! Za třetí: Jdi tam a zpátky. Spadl jsi? Začni znovu! Za čtvrté: Pro ninja mistry, zkus to po tmě nebo se zavřenýma očima!' },

    // Topic titles
    { file: 'topic-0.mp3', text: 'Kdo byli ninjové?' },
    { file: 'topic-1.mp3', text: 'Ninja oblečení' },
    { file: 'topic-2.mp3', text: 'Ninja nástroje' },
    { file: 'topic-3.mp3', text: 'Ninja dovednosti' },
    { file: 'topic-4.mp3', text: 'Ninja trénink' },
    { file: 'topic-5.mp3', text: 'Slavní ninjové' },
    { file: 'topic-6.mp3', text: 'Ninja trénink na doma' },

    // Read more prompt
    { file: 'read-more.mp3', text: 'Přečti si více!' },

    // Quiz questions
    { file: 'quiz-q0.mp3', text: 'Jak se správně říká ninjům?' },
    { file: 'quiz-q1.mp3', text: 'Jakou barvu mělo ninja oblečení?' },
    { file: 'quiz-q2.mp3', text: 'K čemu hlavně sloužil kunai?' },
    { file: 'quiz-q3.mp3', text: 'Jak se jmenovala slavná žena ninja?' },
    { file: 'quiz-q4.mp3', text: 'Co používali ninjové, aby rychle zmizeli?' },
    { file: 'quiz-q5.mp3', text: 'Jak se jmenoval slavný ninja, který chránil budoucího vládce Japonska?' },
    { file: 'quiz-q6.mp3', text: 'Jak se říkalo masce, kterou ninja nosil na hlavě?' },
    { file: 'quiz-q7.mp3', text: 'Co trénovali ninjové od dětství?' },
    { file: 'quiz-q8.mp3', text: 'Které dva nejznámější ninja klany znáš?' },
    { file: 'quiz-q9.mp3', text: 'Proč se ninjové učili o přírodě?' }
  ],

  pt: [
    // Exercises
    { file: 'exercise-0-plamenak.mp3', text: 'Flamingo. Os verdadeiros ninjas conseguiam ficar numa perna só durante minutos inteiros na borda de um telhado. Experimenta tu também! Primeiro: Fica de pé, direito, e levanta uma perna no ar. Segundo: Abre os braços para os lados, ajuda a manter o equilíbrio. Terceiro: Tenta aguentar 10 segundos. Consegues de olhos fechados? Quarto: Depois troca de perna e tenta de novo. Qual é a melhor perna?' },
    { file: 'exercise-1-tichy-presun.mp3', text: 'Deslocação silenciosa. Os ninjas treinavam o movimento silencioso todos os dias. Tinham de passar pelos guardas sem fazer um único som. Primeiro: Tira os sapatos, anda descalço ou de meias. Segundo: Pisa primeiro com a ponta do pé e depois pousa lentamente todo o pé. Terceiro: Tenta atravessar a sala toda sem que ninguém te oiça. Quarto: Pede a alguém para fechar os olhos e adivinhar onde estás. Consegue ouvir-te?' },
    { file: 'exercise-2-ninja-kotouly.mp3', text: 'Cambalhotas ninja. Os ninjas sabiam rebolar para se esquivarem de ataques e levantarem-se rapidamente. A cambalhota é a base da agilidade ninja! Primeiro: Encontra um tapete ou colchão macio. Segundo: Agacha-te, encosta o queixo ao peito e põe as mãos à frente. Terceiro: Rola lentamente para a frente sobre as costas. Quarto: Tenta levantar-te logo de pé! Um ninja acaba sempre preparado.' },
    { file: 'exercise-3-ninja-pamet.mp3', text: 'Memória ninja. Os ninjas precisavam de ter memória fotográfica. Olhavam para um mapa uma única vez e memorizavam cada detalhe. Primeiro: Põe 10 objetos diferentes numa mesa, como um lápis, colher, dado. Segundo: Olha para eles durante exatamente 30 segundos, tenta memorizar tudo. Terceiro: Cobre-os com uma toalha e diz em voz alta o que estava lá. Quarto: Quantos acertaste? 7 ou mais significa memória ninja! Da próxima vez, acrescenta mais.' },
    { file: 'exercise-4-socha.mp3', text: 'Estátua. Os ninjas tinham de ficar completamente imóveis quando se escondiam na escuridão à espera do momento certo. Às vezes durante horas! Primeiro: Fica de pé ou senta-te numa posição confortável. Segundo: Define um minuto no relógio ou pede a alguém para cronometrar. Terceiro: Não te mexas! Nem pestanejar, nem coçar, nem sorrir. Quarto: É mais difícil do que parece! Da próxima vez, tenta 2 minutos.' },
    { file: 'exercise-5-hod-na-cil.mp3', text: 'Lançamento ao alvo. Era assim que os ninjas treinavam a pontaria com shurikens! Tu vais usar meias, é mais seguro e igualmente divertido. Primeiro: Põe um prato, jornal ou folha de papel no chão, é o teu alvo. Segundo: Enrola uma meia numa bola. Terceiro: Fica a 2 metros de distância e lança! Quarto: Acertaste? Tenta a 3 metros! E depois vira-te de costas e lança por cima do ombro.' },
    { file: 'exercise-6-kocici-krok.mp3', text: 'Passo de gato. Os ninjas treinavam passos precisos para não pisarem um ramo ou uma tábua que rangesse à noite. Os gatos são mestres nisso! Primeiro: Espalha papéis ou sapatos em fila pelo corredor. Segundo: Pisa exatamente só neles, não podes tocar no chão! Terceiro: Vai e volta. Caíste? Recomeça! Quarto: Para mestres ninja, tenta no escuro ou de olhos fechados!' },

    // Topic titles
    { file: 'topic-0.mp3', text: 'Quem eram os ninjas?' },
    { file: 'topic-1.mp3', text: 'Roupa ninja' },
    { file: 'topic-2.mp3', text: 'Ferramentas ninja' },
    { file: 'topic-3.mp3', text: 'Habilidades ninja' },
    { file: 'topic-4.mp3', text: 'Treino ninja' },
    { file: 'topic-5.mp3', text: 'Ninjas famosos' },
    { file: 'topic-6.mp3', text: 'Treino ninja em casa' },

    // Read more prompt
    { file: 'read-more.mp3', text: 'Lê mais!' },

    // Quiz questions
    { file: 'quiz-q0.mp3', text: 'Qual é o nome correto dos ninjas?' },
    { file: 'quiz-q1.mp3', text: 'De que cor era a roupa ninja?' },
    { file: 'quiz-q2.mp3', text: 'Para que servia principalmente o kunai?' },
    { file: 'quiz-q3.mp3', text: 'Como se chamava a famosa mulher ninja?' },
    { file: 'quiz-q4.mp3', text: 'O que usavam os ninjas para desaparecer rapidamente?' },
    { file: 'quiz-q5.mp3', text: 'Como se chamava o ninja famoso que protegia o futuro governante do Japão?' },
    { file: 'quiz-q6.mp3', text: 'Como se chamava a máscara que o ninja usava na cabeça?' },
    { file: 'quiz-q7.mp3', text: 'O que treinavam os ninjas desde a infância?' },
    { file: 'quiz-q8.mp3', text: 'Quais são os dois clãs ninja mais famosos?' },
    { file: 'quiz-q9.mp3', text: 'Porque é que os ninjas aprendiam sobre a natureza?' }
  ],

  es: [
    // Exercises
    { file: 'exercise-0-plamenak.mp3', text: 'Flamenco. Los verdaderos ninjas podían estar en una pierna durante minutos enteros en el borde de un tejado. ¡Inténtalo tú también! Primero: Ponte de pie recto y levanta una pierna en el aire. Segundo: Extiende los brazos a los lados, te ayudará a mantener el equilibrio. Tercero: ¿Puedes aguantar 10 segundos? ¿Y con los ojos cerrados? Cuarto: Después cambia de pierna e inténtalo de nuevo. ¿Cuál es mejor?' },
    { file: 'exercise-1-tichy-presun.mp3', text: 'Desplazamiento silencioso. Los ninjas entrenaban el movimiento silencioso todos los días. Tenían que pasar junto a los guardias sin hacer ni un sonido. Primero: Quítate los zapatos, camina descalzo o con calcetines. Segundo: Pisa primero con la punta del pie y luego apoya lentamente todo el pie. Tercero: Intenta cruzar toda la habitación sin que nadie te oiga. Cuarto: Pide a alguien que cierre los ojos y adivine dónde estás. ¿Te oye?' },
    { file: 'exercise-2-ninja-kotouly.mp3', text: 'Volteretas ninja. Los ninjas sabían rodar para esquivar ataques y ponerse de pie rápidamente. ¡La voltereta es la base de la agilidad ninja! Primero: Busca una colchoneta o alfombra suave. Segundo: Agáchate, pega la barbilla al pecho y pon las manos delante. Tercero: Rueda lentamente hacia delante sobre la espalda. Cuarto: ¡Intenta ponerte de pie de un salto! Un ninja siempre termina preparado.' },
    { file: 'exercise-3-ninja-pamet.mp3', text: 'Memoria ninja. Los ninjas necesitaban memoria fotográfica. Miraban un mapa una sola vez y memorizaban cada detalle. Primero: Pon 10 objetos diferentes en una mesa, como un lápiz, cuchara, dado. Segundo: Míralos durante exactamente 30 segundos, intenta memorizar todo. Tercero: Cúbrelos con una toalla y di en voz alta lo que había. Cuarto: ¿Cuántos acertaste? 7 o más significa memoria ninja. ¡La próxima vez, añade más!' },
    { file: 'exercise-4-socha.mp3', text: 'Estatua. Los ninjas tenían que quedarse completamente inmóviles cuando se escondían en la oscuridad esperando el momento justo. ¡A veces durante horas! Primero: Ponte de pie o siéntate en una posición cómoda. Segundo: Pon un minuto en el reloj o pide a alguien que cronometre. Tercero: ¡No te muevas! Ni pestañear, ni rascarte, ni sonreír. Cuarto: ¡Es más difícil de lo que parece! La próxima vez, intenta 2 minutos.' },
    { file: 'exercise-5-hod-na-cil.mp3', text: 'Lanzamiento al blanco. ¡Así entrenaban los ninjas la puntería con shurikens! Tú usarás calcetines, es más seguro e igual de divertido. Primero: Pon un plato, periódico o papel en el suelo, es tu objetivo. Segundo: Enrolla un calcetín en forma de bola. Tercero: ¡Ponte a 2 metros y lanza! Cuarto: ¿Acertaste? ¡Prueba a 3 metros! Y después date la vuelta y lanza por encima del hombro.' },
    { file: 'exercise-6-kocici-krok.mp3', text: 'Paso de gato. Los ninjas entrenaban pasos precisos para no pisar una rama o una tabla que crujiera por la noche. ¡Los gatos son maestros en esto! Primero: Reparte papeles o zapatos en fila por el pasillo. Segundo: Pisa exactamente solo en ellos, ¡no puedes tocar el suelo! Tercero: Ve y vuelve. ¿Te caíste? ¡Empieza de nuevo! Cuarto: Para maestros ninja, ¡inténtalo a oscuras o con los ojos cerrados!' },

    // Topic titles
    { file: 'topic-0.mp3', text: '¿Quiénes eran los ninjas?' },
    { file: 'topic-1.mp3', text: 'Ropa ninja' },
    { file: 'topic-2.mp3', text: 'Herramientas ninja' },
    { file: 'topic-3.mp3', text: 'Habilidades ninja' },
    { file: 'topic-4.mp3', text: 'Entrenamiento ninja' },
    { file: 'topic-5.mp3', text: 'Ninjas famosos' },
    { file: 'topic-6.mp3', text: 'Entrenamiento ninja en casa' },

    // Read more prompt
    { file: 'read-more.mp3', text: '¡Lee más!' },

    // Quiz questions
    { file: 'quiz-q0.mp3', text: '¿Cuál es el nombre correcto de los ninjas?' },
    { file: 'quiz-q1.mp3', text: '¿De qué color era la ropa ninja?' },
    { file: 'quiz-q2.mp3', text: '¿Para qué servía principalmente el kunai?' },
    { file: 'quiz-q3.mp3', text: '¿Cómo se llamaba la famosa mujer ninja?' },
    { file: 'quiz-q4.mp3', text: '¿Qué usaban los ninjas para desaparecer rápidamente?' },
    { file: 'quiz-q5.mp3', text: '¿Cómo se llamaba el ninja famoso que protegía al futuro gobernante de Japón?' },
    { file: 'quiz-q6.mp3', text: '¿Cómo se llamaba la máscara que el ninja llevaba en la cabeza?' },
    { file: 'quiz-q7.mp3', text: '¿Qué entrenaban los ninjas desde la infancia?' },
    { file: 'quiz-q8.mp3', text: '¿Cuáles son los dos clanes ninja más famosos?' },
    { file: 'quiz-q9.mp3', text: '¿Por qué los ninjas aprendían sobre la naturaleza?' }
  ]
};

function ttsRequest(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.75,
        similarity_boost: 0.75,
        style: 0.4,
        use_speaker_boost: true
      }
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

async function downloadLang(lang) {
  const langFiles = texts[lang];
  const dir = lang === 'cs'
    ? path.join(__dirname, 'audio')
    : path.join(__dirname, 'audio', lang);

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  console.log(`\n=== ${lang.toUpperCase()} — ${langFiles.length} files → ${dir} ===\n`);

  for (let i = 0; i < langFiles.length; i++) {
    const { file, text } = langFiles[i];
    const filepath = path.join(dir, file);

    if (fs.existsSync(filepath)) {
      console.log(`[${i + 1}/${langFiles.length}] SKIP ${file} (already exists)`);
      continue;
    }

    console.log(`[${i + 1}/${langFiles.length}] Generating ${file}...`);
    try {
      const audioBuffer = await ttsRequest(text);
      fs.writeFileSync(filepath, audioBuffer);
      console.log(`  ✓ Saved (${(audioBuffer.length / 1024).toFixed(0)} KB)`);
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`);
    }

    if (i < langFiles.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
}

async function main() {
  const requestedLang = process.argv[2];
  const langsToDownload = requestedLang
    ? [requestedLang]
    : Object.keys(texts);

  for (const lang of langsToDownload) {
    if (!texts[lang]) {
      console.error(`Unknown language: ${lang}. Available: ${Object.keys(texts).join(', ')}`);
      continue;
    }
    await downloadLang(lang);
  }

  console.log('\nDone!');
}

main();
