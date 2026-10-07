import { ProvocationScenario } from '../types/mood';

export const EMOTIONAL_SCENARIOS: ProvocationScenario[] = [
  {
    id: 'tired-evening-chore',
    category: 'tired',
    situation: 'You just finished an exhausting work day. You walk into the kitchen exhausted, and someone asks bluntly: "Why didn\'t you take out the trash?"',
    somaticWarning: 'Jaw clenches, shallow breath, feeling of unfair burden in your shoulders.',
    impulsiveReaction: '"I\'ve been working all day! Why can\'t you do it yourself for once?!"',
    prefrontalResponse: '"I am completely running on fumes right now. Give me 10 minutes to decompress, and then I\'ll handle it or we can figure it out."',
    mentalPauseTip: 'Remember: Fatigue narrows empathy. The urge to snap is physical exhaustion masquerading as anger.'
  },
  {
    id: 'hungry-lunch-delay',
    category: 'hungry',
    situation: 'It is 2:00 PM, you haven\'t eaten lunch, and your blood sugar is bottomed out. A colleague or friend cancels plans last minute or changes the meeting time.',
    somaticWarning: 'Tight stomach, sudden flash of heat in chest, rapid heartbeat.',
    impulsiveReaction: 'Sending a sharp, passive-aggressive text: "Fine. Whatever. Do what you want."',
    prefrontalResponse: 'Put down the phone. Eat a protein snack. Then text: "Understood. Let\'s reschedule for tomorrow morning when we have time."',
    mentalPauseTip: 'HALT Rule: Never send a message or make a permanent statement on an empty stomach. Feed your brain glucose first.'
  },
  {
    id: 'upset-unfair-criticism',
    category: 'upset',
    situation: 'Someone points out a flaw in something you worked hard on, using dismissive or sarcastic wording.',
    somaticWarning: 'Lump in throat, urge to talk over them, blood rushing to head.',
    impulsiveReaction: 'Interrupting immediately to defend yourself and attack their credibility.',
    prefrontalResponse: 'Take a slow, audible breath through your nose. Say: "I hear your feedback. Let me reflect on that and get back to you with my thoughts."',
    mentalPauseTip: 'The Power of the Pause: Silence conveys supreme self-command. He who speaks first out of anger loses the frame.'
  },
  {
    id: 'boundary-demand-under-stress',
    category: 'boundary',
    situation: 'You are in the middle of a high-pressure task, and someone interrupts with an urgent request that is clearly their emergency, not yours.',
    somaticWarning: 'Sudden spike in pulse, tension in the back of the neck and traps.',
    impulsiveReaction: 'Snapping: "Can\'t you see I\'m busy right now?! Stop interrupting me!"',
    prefrontalResponse: 'Pause for 3 full seconds. "I am locked in on a hard deadline right now. I can give you my full attention at 4:30 PM."',
    mentalPauseTip: 'Clear boundaries don\'t need aggression. A calm refusal is 10x more respected than an irritated outburst.'
  },
  {
    id: 'interrupted-speech',
    category: 'upset',
    situation: 'You are explaining an important point, and someone talks right over you, cutting your sentence in half.',
    somaticWarning: 'Urge to raise voice volume, teeth grinding, text-neck tensing up.',
    impulsiveReaction: 'Raising voice louder: "EXCUSE ME, I was talking! Let me finish!"',
    prefrontalResponse: 'Stop speaking immediately. Look at them calmly. Wait until they finish, count 3 seconds in silence, then smoothly resume: "As I was saying..."',
    mentalPauseTip: 'The dramatic silence highlights their interruption far more elegantly than matching their frantic energy.'
  }
];

export const getRandomScenario = (): ProvocationScenario => {
  return EMOTIONAL_SCENARIOS[Math.floor(Math.random() * EMOTIONAL_SCENARIOS.length)];
};
