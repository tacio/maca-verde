import { Exercise, WorkoutRoutine } from '../types/fitness';
import { ProvocationScenario } from '../types/mood';
import { EXERCISES } from './exercises';
import { WORKOUT_ROUTINES } from './routines';
import { EMOTIONAL_SCENARIOS } from './emotionalScenarios';
import { Language } from '../i18n/translations';

// Portuguese Exercise Overrides
const PT_EXERCISES: Record<string, Partial<Exercise>> = {
  'door-bar-dead-hang': {
    name: 'Descompressão na Barra Fixa (Dead Hang)',
    description: 'Suspensão passiva/semi-passiva na barra de porta. O padrão ouro para descomprimir as vértebras cervicais e torácicas, revertendo o esmagamento discal do "pescoço tech".',
    textNeckCue: 'Recolha suavemente o queixo ("queixo duplo" sutil). Deixe a gravidade abrir os ombros enquanto mantém o pescoço longo alinhado à coluna.',
    postureBenefit: 'Reverte a compressão torácica e cervical, alarga o espaço subacromial e desfaz horas curvado no celular ou notebook.',
    bellyBurnBenefit: 'Ativa o transverso abdominal e estabilizadores profundos para conter a hiperextensão lombar.',
    cardioBenefit: 'Exige respiração diafragmática sob tração, expandindo a caixa torácica.',
    formPoints: [
      'Segure na barra com pegada pronada na largura dos ombros ou ligeiramente além',
      'Relaxe o corpo na gravidade, mas não projete a cabeça para a frente',
      'Mantenha o queixo recolhido (coluna cervical neutra e longa)',
      'Respire fundo e lentamente inflando a barriga'
    ],
    cadenceTip: 'Foco no tempo sob tensão. Mire em respirações profundas e controladas.'
  },
  'door-bar-scapular-pull': {
    name: 'Retração Escapular na Barra Fixa',
    description: 'Pendurado com braços esticados, puxe as escápulas para baixo e para trás sem dobrar os cotovelos. Ativa diretamente o trapézio inferior para puxar os ombros caídos para trás.',
    textNeckCue: 'Pense em deslizar suas escápulas para dentro dos bolsos de trás da calça. Mantenha o queixo encaixado.',
    postureBenefit: 'Dispara os trapézios médio/inferior e romboides, os músculos exatos inibidos pelo vício de postura com a cabeça baixa.',
    bellyBurnBenefit: 'Exige ativação do core em formato "canoa" para evitar balanços.',
    cardioBenefit: 'Bomba muscular intensa que eleva o ritmo cardíaco em repetições seguidas.',
    formPoints: [
      'Inicie na suspensão com os braços totalmente estendidos',
      'Afaste os ombros das orelhas contraindo a musculatura das costas',
      'Segure o aperto no topo por 1 segundo completo',
      'Desça suavemente até a posição inicial com controle'
    ],
    cadenceTip: '1 segundo subindo, 1 segundo segurando a contração, 1 segundo descendo.'
  },
  'door-bar-hanging-knees': {
    name: 'Elevação de Joelhos na Barra Fixa',
    description: 'Pendurado na barra, puxe os joelhos ativamente em direção ao peito usando a contração do abdômen, sem balanço de quadril. Triturador de gordura abdominal inferior.',
    textNeckCue: 'Mantenha o olhar firme para frente; NÃO incline o pescoço para baixo para olhar seus joelhos.',
    postureBenefit: 'Força a retroversão pélvica, corrigindo a hiperlordose que projeta a barriga para frente.',
    bellyBurnBenefit: 'Ativa o reto abdominal e transverso com sobrecarga de peso corporal.',
    cardioBenefit: 'Demanda ritmo cardiovascular acelerado quando feito de forma contínua.',
    formPoints: [
      'Segure firme na barra, trave os ombros para baixo',
      'Expire forte ao subir os joelhos na direção do esterno',
      'Arredonde a pelve para cima no topo para espremer o abdômen',
      'Desça sem deixar o corpo balançar'
    ],
    cadenceTip: 'Solte o ar vigorosamente no topo de cada subida de joelhos.'
  },
  'door-bar-isometric-lock': {
    name: 'Isometria no Topo da Barra (Flexed Arm Hang)',
    description: 'Suba ou pule até a barra, segurando o queixo na altura ou acima dela com os cotovelos colados ao tronco. Ativação postural dorsal suprema.',
    textNeckCue: 'Aproxime o peito da barra, abrindo as clavículas. Mantenha o pescoço longo e não estique o queixo para cima.',
    postureBenefit: 'Fortalece romboides e trapézio médio em contração máxima, puxando os ombros para trás.',
    bellyBurnBenefit: 'Tensão isométrica de corpo inteiro que dispara a queima calórica.',
    cardioBenefit: 'Elevação imediata do pulso e da pressão muscular em 15 segundos.',
    formPoints: [
      'Pegada supinada ou neutra na barra',
      'Pule ou suba mantendo o queixo estável',
      'Esprema as escápulas uma contra a outra com vigor',
      'Ao fadigar, desça com uma negativa lenta de 3 segundos'
    ],
    cadenceTip: 'Isometria pura. Mantenha as escápulas coladas durante todo o tempo.'
  },
  'rope-boxer-skip-hiit': {
    name: 'Corda HIIT Boxer Skip (Passo de Boxeador)',
    description: 'Salto rítmico alternando o peso de um pé para o outro. Baixo impacto articular com máxima queima calórica e postura ereta.',
    textNeckCue: 'Olhar cravado para a frente na altura dos olhos! Evite olhar para os pés, o que causa tensão no pescoço.',
    postureBenefit: 'Exige alinhamento espinhal perfeitamente vertical e cotovelos colados às costelas.',
    bellyBurnBenefit: 'Queima de 14 a 20 kcal por minuto, mobilizando gordura visceral via catecolaminas.',
    cardioBenefit: 'Construtor excepcional de VO2 máx, volume de ejeção cardíaca e agilidade.',
    formPoints: [
      'Cotovelos rentes ao tronco, gire a corda apenas pelos pulsos',
      'Alterne o peso do pé esquerdo para o direito suavemente',
      'Pule apenas 1 a 2 cm do chão na ponta dos pés',
      'Mantenha a postura altiva e o peito aberto'
    ],
    cadenceTip: 'Busque 120 a 140 giros por minuto. Ritmo contínuo e suave.'
  },
  'rope-speed-sprint-tabata': {
    name: 'Tiro de Velocidade na Corda / Double-Under',
    description: 'Giro de corda em frequência máxima sem concessões. Intervalos na zona vermelha de batimentos cardíacos para acionar o efeito EPOC de queima prolongada.',
    textNeckCue: 'Mantenha os ombros relaxados e abaixados. Respire sem esticar o pescoço para frente.',
    postureBenefit: 'Desenvolve rigidez elástica de tendões e integridade espinhal sob esforço máximo.',
    bellyBurnBenefit: 'EPOC máximo: continua queimando gordura visceral por 12 a 24 horas após o treino.',
    cardioBenefit: 'Explosão anaeróbica que eleva o teto cardiovascular.',
    formPoints: [
      'Gire a corda com velocidade explosiva nos pulsos',
      'Trave o abdômen como se fosse receber um golpe',
      'Aterrisse suave e impulsione de imediato',
      'Entregue 90% a 100% de esforço durante todo o intervalo'
    ],
    cadenceTip: 'Esforço de sprint total! Mais de 150 giros por minuto.'
  },
  'rope-high-knees-burn': {
    name: 'Corda com Joelhos Altos (High Knees)',
    description: 'Corrida no lugar enquanto pula corda, elevando os joelhos na altura da cintura a cada giro. Esmaga gordura abdominal e dispara os batimentos.',
    textNeckCue: 'Peito alto e coluna ereta. Não curve as costas para encontrar os joelhos.',
    postureBenefit: 'Fortalece o psoas dinamicamente enquanto mantém a extensão torácica.',
    bellyBurnBenefit: 'Contração abdominal dinâmica a cada passada somada à demanda metabólica extrema.',
    cardioBenefit: 'Um dos maiores aceleradores de frequência cardíaca da preparação física.',
    formPoints: [
      'Alterne elevando o joelho esquerdo e direito até o quadril',
      'Sincronize 1 giro de corda para cada passada',
      'Mantenha-se leve na ponta dos pés',
      'Mantenha o tronco firme e o olhar para a frente'
    ],
    cadenceTip: 'Ritmo rápido de corrida! Eleve os joelhos com autoridade.'
  },
  'chin-tuck-cobra-hold': {
    name: 'Cobra no Solo & Retração Cervical (Chin Tuck)',
    description: 'Deitado de bruços, eleve o peito rodando os polegares para cima e deslizando o queixo para trás em retração cervical. O remédio primordial para o pescoço caído de tela.',
    textNeckCue: 'CRUCIAL: Faça um suave queixo duplo deslizando a cabeça para trás. Olhe para o chão, NUNCA para a parede à frente.',
    postureBenefit: 'Fortalece os flexores profundos do pescoço (longus colli) e trapézio inferior, alongando os peitorais encurtados.',
    bellyBurnBenefit: 'Exige ativação do abdômen e glúteos para estabilizar a lombar.',
    cardioBenefit: 'Treino de controle neuromuscular postural e desaceleração do pulso.',
    formPoints: [
      'Deite de bruços no colchonete ou chão',
      'Rode os polegares em direção ao teto (rotação externa de ombros)',
      'Recolha o queixo para trás, alongando a nuca',
      'Sustente a posição respirando pelo diafragma'
    ],
    cadenceTip: 'Sustente sem interrupções ou faça pulsos com pausas de 3 segundos no topo.'
  },
  'prone-ytw-raises': {
    name: 'Elevações Escapulares Y-T-W no Solo',
    description: 'Deitado de bruços, faça ciclos elevando os braços em formato de Y (trapézio inferior), T (romboides e deltóide posterior) e W (manguito rotador).',
    textNeckCue: 'Mantenha a testa a 2 cm do solo com queixo recolhido. Nunca incline a cabeça para trás.',
    postureBenefit: 'Restaura a musculatura estabilizadora das escápulas prejudicada por horas no teclado e celular.',
    bellyBurnBenefit: 'Engaja toda a cadeia posterior e estabilização de tronco.',
    cardioBenefit: 'Resistência muscular e queima localizada nos ombros posteriores.',
    formPoints: [
      'Y: Braços a 45 graus, polegares para cima, aperte o trapézio inferior',
      'T: Braços abertos lateralmente, esprema as escápulas',
      'W: Cotovelos puxados para as costelas, rode as mãos para cima',
      'Faça 3 repetições de cada letra sucessivamente'
    ],
    cadenceTip: '2 segundos de contração máxima no topo de cada letra.'
  },
  'hollow-body-hold-tuck': {
    name: 'Abdominal Canoa no Chão (Hollow Body Rock)',
    description: 'O padrão ouro da ginástica artística para achatamento do abdômen. Cola a lombar no chão e ativa o transverso abdominal sem puxar o pescoço.',
    textNeckCue: 'Queixo recolhido com espaço de uma maçã verde entre queixo e peito. Não puxe a cabeça com as mãos.',
    postureBenefit: 'Elimina a anteversão pélvica (que cria a impressão de barriga saliente mesmo magro).',
    bellyBurnBenefit: 'Recrutamento isométrico de toda a parede abdominal profunda.',
    cardioBenefit: 'Tensão de corpo inteiro que exige respiração compassada sob carga.',
    formPoints: [
      'Deite de costas e aperte a lombar com força contra o chão — vão zero!',
      'Eleve as escápulas e estenda os braços à frente ou acima da cabeça',
      'Tire as pernas 15 cm do chão ou dobre os joelhos se necessário',
      'Balance suavemente como uma canoa mantendo a forma rígida'
    ],
    cadenceTip: 'Se a lombar descolar do chão, dobre os joelhos na hora para recalibrar.'
  },
  'sprawl-burpee-blast': {
    name: 'Sprawl Burpee / Peito ao Chão Explosivo',
    description: 'Salto explosivo para prancha/chão e retorno rápido dos pés com salto para cima. A fornalha metabólica definitiva para queimar gordura visceral.',
    textNeckCue: 'Ao jogar os pés para trás na prancha, mantenha a cabeça alinhada com a coluna — sem olhar para os pés.',
    postureBenefit: 'Ensina estabilidade torácica sob carga pliométrica explosiva.',
    bellyBurnBenefit: 'Queima calórica massiva por minuto via via glicolítica.',
    cardioBenefit: 'Leva a frequência cardíaca direto para o limiar anaeróbico.',
    formPoints: [
      'Apoie as mãos fora dos pés e chute as pernas para trás',
      'Toque o peito no chão ou trave em prancha sólida',
      'Puxe os pés de volta por fora das mãos em agachamento ágil',
      'Salte estendendo o corpo e batendo palmas acima da cabeça'
    ],
    cadenceTip: 'Ritmo contínuo. Mire em 8 a 12 repetições por intervalo de trabalho.'
  },
  'mountain-climber-sprints': {
    name: 'Mountain Climbers Acelerados (Alpinista)',
    description: 'Em prancha rígida, puxe os joelhos rapidamente em direção ao peito em cadência de tiro. Queima gordura da barriga enquanto mantém os ombros travados.',
    textNeckCue: 'Empurre o chão com as palmas e olhe entre os polegares para proteger a cervical.',
    postureBenefit: 'Fortalece o serrátil anterior e os estabilizadores anti-rotação do tronco.',
    bellyBurnBenefit: 'Compressão abdominal alternada contínua sob alta demanda metabólica.',
    cardioBenefit: 'Aceleração contínua do coração sem impacto nas articulações.',
    formPoints: [
      'Mãos sob a linha dos ombros, dedos espalmados',
      'Costas retas — não deixe o quadril subir empinado',
      'Alterne puxando os joelhos em cadência ágil',
      'Mantenha o abdômen travado como uma prancha de ferro'
    ],
    cadenceTip: 'Cadência de sprint! Mantenha o quadril nivelado.'
  },
  'plank-downdog-toe-tap': {
    name: 'Prancha para Cachorro Olhando para Baixo',
    description: 'Da prancha, empurre o quadril para trás tocando a mão na canela oposta e retorne à prancha. Descompressão torácica e contração do core.',
    textNeckCue: 'No cachorro olhando para baixo, solte o peso da cabeça naturalmente, aliviando a tensão suboccipital.',
    postureBenefit: 'Alonga os dorsais encurtados, abre a coluna torácica e ativa o serrátil.',
    bellyBurnBenefit: 'Estabilização diagonal anti-rotacional do abdômen a cada toque.',
    cardioBenefit: 'Fluxo corporal dinâmico e ritmado.',
    formPoints: [
      'Inicie em prancha alta sólida',
      'Suba o quadril para trás empurrando o chão',
      'Alcance a mão direita na canela ou tornozelo esquerdo',
      'Retorne à prancha contraindo o glúteo e alterne o lado'
    ],
    cadenceTip: 'Movimento atlético controlado, 2 segundos por lado.'
  }
};

// Portuguese Routine Overrides
const PT_ROUTINES: Record<string, Partial<WorkoutRoutine>> = {
  'daily-adaptive-overload': {
    title: 'Sobrecarga HIIT Diária (Recomendado)',
    subtitle: 'A Regra do 1% Diário • Postura + Barriga Chapada + Cardio',
    description: 'Projetado para execução diária. Altera tiros de alta frequência na corda com descompressão na barra fixa e correções do pescoço tech. Calibrado para aumentar um pouco todo dia.'
  },
  'tabata-belly-shred': {
    title: 'Tabata Gordura Zero & Cardio Turbo',
    subtitle: 'Protocolo Científico 20s:10s • Queima Visceral Prolongada',
    description: 'Protocolo comprovado do Dr. Izumi Tabata: 20 segundos de esforço máximo, 10 segundos de descanso. Queima mais gordura visceral do que 60 minutos de corrida contínua.'
  },
  'posture-text-neck-antidote': {
    title: 'Antídoto do Pescoço Tech & Armadura Torácica',
    subtitle: 'Descompressão Espinhal • Tração Escapular & Queixo Encaixado',
    description: 'Reverte diretamente a postura de cabeça projetada, os ombros caídos e as vértebras cervicais comprimidas. Une tração gravitacional na barra com resistência dos flexores profundos.'
  },
  'emom-rope-door-bar-hybrid': {
    title: 'EMOM 15: Corda & Barra Fixa Condicionamento',
    subtitle: 'A Cada Minuto no Minuto • Domínio de Ritmo & Core',
    description: 'Execute as metas no início de cada minuto e descanse no restante. Constrói um motor cardiovascular de elite enquanto fortalece a pegada e o abdômen.'
  },
  'quick-5min-streak-saver': {
    title: 'Salva-Sequência de 5 Minutos',
    subtitle: 'Sem Desculpas • Intensidade Rápida de Alto Impacto',
    description: 'Pouco tempo hoje? Nunca quebre a corrente! Um circuito rápido e potente de 5 minutos que mantém sua sequência diária viva e reseta sua postura no meio do trabalho corrido.'
  }
};

// Portuguese Scenarios Overrides
const PT_SCENARIOS: Record<string, Partial<ProvocationScenario>> = {
  'tired-evening-chore': {
    situation: 'Você acabou de chegar de um dia exaustivo de trabalho. Entra na cozinha e alguém diz em tom seco: "Por que você não jogou o lixo fora ainda?"',
    somaticWarning: 'Mandíbula aperta, respiração fica curta, sensação de peso e injustiça nos ombros.',
    impulsiveReaction: '"Eu passei o dia inteiro trabalhando feito um condenado! Por que você mesma não faz isso de vez em quando?!"',
    prefrontalResponse: '"Estou completamente sem energia agora. Me dê 10 minutos para respirar e descomprimir, e em seguida eu resolvo isso tranquilamente."',
    mentalPauseTip: 'Lembre-se: O cansaço estreita a empatia. A vontade de explodir é exaustão física disfarçada de raiva.'
  },
  'hungry-lunch-delay': {
    situation: 'São 14:00, você ainda não almoçou e sua glicose está no chão. Um colega ou amigo desmarca um compromisso em cima da hora.',
    somaticWarning: 'Frio no estômago, onda de calor repentina no peito, batimento acelerado.',
    impulsiveReaction: 'Mandar mensagem ríspida: "Beleza. Tanto faz. Faz o que você quiser."',
    prefrontalResponse: 'Largar o celular. Comer um lanche ou refeição nutritiva. Depois enviar: "Entendido. Vamos remarcar para amanhã com calma."',
    mentalPauseTip: 'Regra H.A.L.T.: Nunca mande mensagem definitiva de estômago vazio. Alimente o cérebro primeiro.'
  },
  'upset-unfair-criticism': {
    situation: 'Alguém aponta um defeito em algo em que você se dedicou horas, usando um tom debochado ou arrogante.',
    somaticWarning: 'Nó na garganta, impulso instantâneo de falar por cima, sangue subindo à cabeça.',
    impulsiveReaction: 'Interromper na hora para se defender e desmerecer o argumento da pessoa.',
    prefrontalResponse: 'Puxar o ar audivelmente pelo nariz. Dizer com calma: "Entendi seu ponto. Vou refletir sobre isso e te respondo depois."',
    mentalPauseTip: 'O Poder da Pausa: O silêncio demonstra autocontrole absoluto. Quem fala primeiro por raiva perde a razão.'
  },
  'boundary-demand-under-stress': {
    situation: 'Você está no meio de uma tarefa com prazo apertado e alguém interrompe com uma demanda urgente que é emergência dela, não sua.',
    somaticWarning: 'Pico repentino no pulso, rigidez imediata na nuca e nos trapézios.',
    impulsiveReaction: 'Explodir: "Você não tá vendo que eu tô ocupado agora?! Para de me interromper!"',
    prefrontalResponse: 'Pausar por 3 segundos inteiros. Olhar nos olhos: "Estou focado em uma entrega crítica agora. Te dou atenção total às 16:30."',
    mentalPauseTip: 'Limites claros não precisam de agressividade. Uma recusa calma é 10x mais respeitada que uma explosão.'
  },
  'interrupted-speech': {
    situation: 'Você está explicando uma ideia importante e alguém fala por cima, cortando sua frase no meio.',
    somaticWarning: 'Vontade de aumentar o volume da voz, dentes cerrados, pescoço tensionando.',
    impulsiveReaction: 'Falar mais alto por cima: "DÁ LICENÇA, eu estava falando! Deixa eu terminar!"',
    prefrontalResponse: 'Parar de falar na hora. Olhar para a pessoa com serenidade. Esperar ela terminar, contar 3 segundos de silêncio e retomar: "Como eu ia dizendo..."',
    mentalPauseTip: 'O silêncio dramático escancara a falta de educação da interrupção muito melhor do que entrar no bate-boca.'
  }
};

export const getLocalizedExercises = (lang: Language): Record<string, Exercise> => {
  if (lang === 'en') return EXERCISES;

  const result: Record<string, Exercise> = {};
  for (const [id, base] of Object.entries(EXERCISES)) {
    const override = PT_EXERCISES[id];
    result[id] = override ? { ...base, ...override } : base;
  }
  return result;
};

export const getLocalizedRoutines = (lang: Language): WorkoutRoutine[] => {
  if (lang === 'en') return WORKOUT_ROUTINES;

  return WORKOUT_ROUTINES.map(base => {
    const override = PT_ROUTINES[base.id];
    return override ? { ...base, ...override } : base;
  });
};

export const getLocalizedScenarios = (lang: Language): ProvocationScenario[] => {
  if (lang === 'en') return EMOTIONAL_SCENARIOS;

  return EMOTIONAL_SCENARIOS.map(base => {
    const override = PT_SCENARIOS[base.id];
    return override ? { ...base, ...override } : base;
  });
};

export const getRandomLocalizedScenario = (lang: Language): ProvocationScenario => {
  const scenarios = getLocalizedScenarios(lang);
  return scenarios[Math.floor(Math.random() * scenarios.length)];
};
