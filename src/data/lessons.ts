/**
 * Lessons and their order (P14; docs/design/04-curriculum.md, generated from §2–§3).
 * One lesson a day; every part comes before the combinations that use it
 * (src/data/lessons.test.ts). Pictures are placeholders until `images` are set.
 */

import type { Lesson } from '../domain/types';

export const LESSONS: Record<string, Lesson> = {
  'chin-tuck': {
    exerciseId: 'chin-tuck',
    parts: [],
    steps: [
      { text: 'Stand tall, eyes level.', views: ['side'] },
      { text: 'Slide your head straight back, as if making a double chin. Don’t tilt it down.', views: ['side'] },
      { text: 'Hold 3 s, then let it glide forward again.', views: ['side', 'front'] },
      { text: 'Try it 5 times, slowly.', views: ['side'] },
    ],
  },
  'jumping-jacks': {
    exerciseId: 'jumping-jacks',
    parts: [],
    steps: [
      { text: 'Stand tall, feet together, arms by your sides.', views: ['front'] },
      { text: 'Arms only: swing them out and up until the hands meet overhead, then back down.', views: ['front'] },
      { text: 'Feet only: hop them apart, a bit wider than your shoulders, then back together.', views: ['front'] },
      { text: 'Both at once: feet out as the arms go up, in as they come down.', views: ['front'] },
      { text: 'Try 10, landing softly on the balls of your feet.', views: ['front'] },
    ],
  },
  'door-bar-dead-hang': {
    exerciseId: 'door-bar-dead-hang',
    parts: [],
    steps: [
      { text: 'Grip the bar overhand, a bit wider than your shoulders.', views: ['front'] },
      { text: 'Lift your feet and let your body hang, arms straight.', views: ['side'] },
      { text: 'Shoulders active, chin tucked, breathe into your belly.', views: ['side'] },
      { text: 'Try a 10 s hang; step down whenever you need.', views: ['side'] },
    ],
  },
  'high-plank': {
    exerciseId: 'high-plank',
    parts: [],
    steps: [
      { text: 'Hands under shoulders, fingers spread.', views: ['top'] },
      { text: 'Step your feet back; body in one straight line from head to heels.', views: ['side'] },
      { text: 'Squeeze glutes and belly; don’t let the hips sag or spike.', views: ['side'] },
      { text: 'Try a 10 s hold.', views: ['side'] },
    ],
  },
  'rope-bounce': {
    exerciseId: 'rope-bounce',
    parts: [],
    steps: [
      { text: 'Handles at hip height, elbows close to your ribs.', views: ['front'] },
      { text: 'Turn the rope with your wrists, not your arms.', views: ['side'] },
      { text: 'Hop on the balls of both feet, 1–2 cm off the floor.', views: ['side'] },
      { text: 'Try 10 jumps. Tripping is normal: just restart.', views: ['side'] },
    ],
  },
  'cobra-lift': {
    exerciseId: 'cobra-lift',
    parts: [],
    steps: [
      { text: 'Lie face down, arms by your sides, palms down.', views: ['side'] },
      { text: 'Turn your thumbs up toward the ceiling.', views: ['front'] },
      { text: 'Lift your chest a few cm, eyes on the floor.', views: ['side'] },
      { text: 'Try 3 lifts with a 3 s hold.', views: ['side'] },
    ],
  },
  'chin-tuck-cobra-hold': {
    exerciseId: 'chin-tuck-cobra-hold',
    parts: ['cobra-lift', 'chin-tuck'],
    steps: [
      { text: 'Start the cobra lift: chest up, thumbs up.', views: ['side'] },
      { text: 'Add the chin tuck: slide your head back, eyes down.', views: ['side'] },
      { text: 'Hold both while breathing slowly.', views: ['side'] },
      { text: 'Try a 10 s hold.', views: ['side'] },
    ],
  },
  'high-knees': {
    exerciseId: 'high-knees',
    parts: [],
    steps: [
      { text: 'Stand tall.', views: ['side'] },
      { text: 'Run in place, lifting each knee to hip height.', views: ['side'] },
      { text: 'Land on the balls of your feet; arms swing naturally.', views: ['front'] },
      { text: 'Try 20 steps.', views: ['side'] },
    ],
  },
  'downward-dog': {
    exerciseId: 'downward-dog',
    parts: [],
    steps: [
      { text: 'Start on hands and knees.', views: ['side'] },
      { text: 'Tuck your toes and lift your knees off the floor.', views: ['side'] },
      { text: 'Push the floor away; hips go up and back, head hangs loose.', views: ['side', 'front'] },
      { text: 'Heels toward the floor (they needn’t touch). Try a 10 s hold.', views: ['side'] },
    ],
  },
  'door-bar-scapular-pull': {
    exerciseId: 'door-bar-scapular-pull',
    parts: ['door-bar-dead-hang'],
    steps: [
      { text: 'Start in a dead hang, arms straight.', views: ['front'] },
      { text: 'Pull your shoulder blades down and back; elbows stay straight.', views: ['side', 'front'] },
      { text: 'You rise a few cm. Hold 1 s, lower slowly.', views: ['side'] },
      { text: 'Try 5 pulls.', views: ['side'] },
    ],
  },
  'rope-boxer-skip-hiit': {
    exerciseId: 'rope-boxer-skip-hiit',
    parts: ['rope-bounce'],
    steps: [
      { text: 'Start bouncing on both feet.', views: ['front'] },
      { text: 'Shift your weight to one foot, then the other, like a boxer.', views: ['front'] },
      { text: 'One turn of the rope per shift; eyes forward.', views: ['front'] },
      { text: 'Try 20 turns.', views: ['front'] },
    ],
  },
  'squat': {
    exerciseId: 'squat',
    parts: [],
    steps: [
      { text: 'Feet shoulder-width, toes slightly out.', views: ['front'] },
      { text: 'Sit back and down, chest up, knees over toes.', views: ['side'] },
      { text: 'Stand up by pushing the floor away.', views: ['side'] },
      { text: 'Try 5 slow squats.', views: ['side'] },
    ],
  },
  'plank-to-downdog': {
    exerciseId: 'plank-to-downdog',
    parts: ['high-plank', 'downward-dog'],
    steps: [
      { text: 'Start in a high plank.', views: ['side'] },
      { text: 'Push your hips up and back into downward dog.', views: ['side'] },
      { text: 'Come forward again to the plank.', views: ['side'] },
      { text: 'Try 5 slow moves, 2 s each way.', views: ['side'] },
    ],
  },
  'sprawl': {
    exerciseId: 'sprawl',
    parts: ['squat', 'high-plank'],
    steps: [
      { text: 'Squat down and put your hands on the floor.', views: ['side'] },
      { text: 'Step (or hop) your feet back into a high plank.', views: ['side'] },
      { text: 'Bring your feet back to your hands and stand up.', views: ['side'] },
      { text: 'Try 3 slow sprawls.', views: ['side'] },
    ],
  },
  'mountain-climber-sprints': {
    exerciseId: 'mountain-climber-sprints',
    parts: ['high-plank'],
    steps: [
      { text: 'Start in a high plank.', views: ['side'] },
      { text: 'Bring one knee toward your chest, then return it.', views: ['side'] },
      { text: 'Switch legs; hips stay low and level.', views: ['side'] },
      { text: 'Try 10 slow switches, then speed up a little.', views: ['side'] },
    ],
  },
  'hollow-tuck': {
    exerciseId: 'hollow-tuck',
    parts: [],
    steps: [
      { text: 'Lie on your back, knees bent, feet on the floor.', views: ['side'] },
      { text: 'Press your lower back into the floor; no gap.', views: ['side'] },
      { text: 'Lift shoulders and feet; knees over hips, arms forward.', views: ['side'] },
      { text: 'Try a 10 s hold.', views: ['side'] },
    ],
  },
  'prone-y': {
    exerciseId: 'prone-y',
    parts: [],
    steps: [
      { text: 'Lie face down, forehead just off the floor, chin tucked.', views: ['side'] },
      { text: 'Arms overhead in a Y, thumbs up.', views: ['top'] },
      { text: 'Lift both arms a few cm; hold 2 s, lower.', views: ['side'] },
      { text: 'Try 5 lifts.', views: ['side'] },
    ],
  },
  'prone-t': {
    exerciseId: 'prone-t',
    parts: [],
    steps: [
      { text: 'Lie face down, chin tucked.', views: ['top'] },
      { text: 'Arms straight out to the sides in a T, thumbs up.', views: ['top'] },
      { text: 'Pinch your shoulder blades and lift the arms; hold 2 s.', views: ['top'] },
      { text: 'Try 5 lifts.', views: ['top'] },
    ],
  },
  'prone-w': {
    exerciseId: 'prone-w',
    parts: [],
    steps: [
      { text: 'Lie face down, chin tucked.', views: ['side'] },
      { text: 'Elbows bent and pulled toward your ribs, hands up: a W.', views: ['top'] },
      { text: 'Lift elbows and hands, squeeze shoulder blades; hold 2 s.', views: ['side'] },
      { text: 'Try 5 lifts.', views: ['top'] },
    ],
  },
  'prone-ytw-raises': {
    exerciseId: 'prone-ytw-raises',
    parts: ['prone-y', 'prone-t', 'prone-w'],
    steps: [
      { text: 'Do 3 Y lifts.', views: ['top'] },
      { text: 'Without resting, 3 T lifts.', views: ['top'] },
      { text: 'Then 3 W lifts; repeat the cycle.', views: ['top'] },
      { text: 'Try one full Y-T-W cycle.', views: ['top'] },
    ],
  },
  'rope-high-knees-burn': {
    exerciseId: 'rope-high-knees-burn',
    parts: ['high-knees', 'rope-bounce'],
    steps: [
      { text: 'Start a rope bounce.', views: ['side'] },
      { text: 'Switch to high knees: one turn per knee.', views: ['side'] },
      { text: 'Chest up; don’t hunch toward the knees.', views: ['side'] },
      { text: 'Try 20 turns.', views: ['side'] },
    ],
  },
  'door-bar-hanging-knees': {
    exerciseId: 'door-bar-hanging-knees',
    parts: ['door-bar-dead-hang'],
    steps: [
      { text: 'Start in a dead hang, shoulders active.', views: ['side'] },
      { text: 'Exhale and curl your knees toward your chest.', views: ['side'] },
      { text: 'Lower slowly; no swinging.', views: ['side'] },
      { text: 'Try 5 knee raises.', views: ['side'] },
    ],
  },
  'plank-downdog-toe-tap': {
    exerciseId: 'plank-downdog-toe-tap',
    parts: ['plank-to-downdog'],
    steps: [
      { text: 'Plank, then push back into downward dog.', views: ['side'] },
      { text: 'Reach one hand toward the opposite ankle.', views: ['front'] },
      { text: 'Back to plank; next time the other hand.', views: ['side'] },
      { text: 'Try 4 reaches, 2 per side.', views: ['side'] },
    ],
  },
  'hollow-hold': {
    exerciseId: 'hollow-hold',
    parts: ['hollow-tuck'],
    steps: [
      { text: 'Start in the hollow tuck, lower back flat.', views: ['side'] },
      { text: 'Straighten your legs, feet low, as long as the back stays flat.', views: ['side'] },
      { text: 'If the back lifts, tuck the knees again.', views: ['side'] },
      { text: 'Try a 10 s hold.', views: ['side'] },
    ],
  },
  'hollow-body-hold-tuck': {
    exerciseId: 'hollow-body-hold-tuck',
    parts: ['hollow-hold'],
    steps: [
      { text: 'Start in the hollow hold.', views: ['side'] },
      { text: 'Rock gently toward your head and back to your hips.', views: ['side'] },
      { text: 'Keep the banana shape the whole time.', views: ['side'] },
      { text: 'Try 5 rocks.', views: ['side'] },
    ],
  },
  'door-bar-isometric-lock': {
    exerciseId: 'door-bar-isometric-lock',
    parts: [],
    steps: [
      { text: 'Stand on a chair or jump to the bar.', views: ['side'] },
      { text: 'Hold your chin at bar height, elbows tight to your ribs.', views: ['front'] },
      { text: 'Lower slowly, over 3 s, when you tire.', views: ['side'] },
      { text: 'Try a 5 s hold.', views: ['side'] },
    ],
  },
  'sprawl-burpee-blast': {
    exerciseId: 'sprawl-burpee-blast',
    parts: ['sprawl'],
    steps: [
      { text: 'Do a sprawl.', views: ['side'] },
      { text: 'From the squat, jump up and clap overhead.', views: ['side'] },
      { text: 'Land soft and go straight into the next one.', views: ['side'] },
      { text: 'Try 3 burpees.', views: ['side'] },
    ],
  },
  'rope-speed-sprint-tabata': {
    exerciseId: 'rope-speed-sprint-tabata',
    parts: ['rope-boxer-skip-hiit'],
    steps: [
      { text: 'Start a boxer skip.', views: ['side'] },
      { text: 'Speed up the wrists; turn the rope as fast as you can.', views: ['side'] },
      { text: 'Shoulders down, core braced; land soft.', views: ['side'] },
      { text: 'Try 10 s fast, then slow down.', views: ['side'] },
    ],
  },
};

/** Lesson order: one per curriculum day. */
export const CURRICULUM: readonly string[] = [
  'chin-tuck',
  'jumping-jacks',
  'door-bar-dead-hang',
  'high-plank',
  'rope-bounce',
  'cobra-lift',
  'chin-tuck-cobra-hold',
  'high-knees',
  'downward-dog',
  'door-bar-scapular-pull',
  'rope-boxer-skip-hiit',
  'squat',
  'plank-to-downdog',
  'sprawl',
  'mountain-climber-sprints',
  'hollow-tuck',
  'prone-y',
  'prone-t',
  'prone-w',
  'prone-ytw-raises',
  'rope-high-knees-burn',
  'door-bar-hanging-knees',
  'plank-downdog-toe-tap',
  'hollow-hold',
  'hollow-body-hold-tuck',
  'door-bar-isometric-lock',
  'sprawl-burpee-blast',
  'rope-speed-sprint-tabata',
];
