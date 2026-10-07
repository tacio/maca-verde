import { Exercise } from '../types/fitness';

export const EXERCISES: Record<string, Exercise> = {
  // === DOOR PULL-UP BAR EXERCISES ===
  'door-bar-dead-hang': {
    id: 'door-bar-dead-hang',
    name: 'Door Bar Decompression Hang',
    targets: ['posture'],
    equipment: 'door_bar',
    difficulty: 2,
    description: 'Passive/semi-passive hang on the door pull-up bar. The gold standard for decompressing the cervical and thoracic spine, reversing text-neck vertebral compression.',
    textNeckCue: 'Gently tuck your chin as if making a subtle double chin. Let gravity open your shoulder joints while keeping your neck elongated.',
    postureBenefit: 'Reverses compressed thoracic discs, widens subacromial space, and counters hours of hunched desk sitting.',
    bellyBurnBenefit: 'Engages transverse abdominis and deep stabilizing core to prevent lumbar hyperextension.',
    cardioBenefit: 'Forces diaphragmatic breathing under tension, expanding rib cage mobility.',
    formPoints: [
      'Grip the bar slightly wider than shoulder-width with overhand grip',
      'Relax into the hang, but do not let your head collapse forward',
      'Keep chin retracted (neutral cervical spine)',
      'Breathe deeply into your lower belly'
    ],
    defaultWorkSeconds: 30,
    defaultRestSeconds: 15,
    cadenceTip: 'Focus on total time under tension. Aim for smooth, steady belly breaths.',
    targetMuscles: ['Cervical Extensors', 'Latissimus Dorsi', 'Upper Spine Ligaments', 'Forearms/Grip']
  },

  'door-bar-scapular-pull': {
    id: 'door-bar-scapular-pull',
    name: 'Door Bar Scapular Retractions',
    targets: ['posture'],
    equipment: 'door_bar',
    difficulty: 3,
    description: 'Hanging with straight arms, pull your shoulder blades down and back without bending elbows. Directly activates the lower traps to fix rounded shoulders.',
    textNeckCue: 'Think about sliding your shoulder blades into your back pockets. Keep your chin tucked back in line with your spine.',
    postureBenefit: 'Directly fires the lower and middle trapezius, the exact muscles inhibited by text-neck and forward shoulder slump.',
    bellyBurnBenefit: 'Requires hollow body abdominal engagement to prevent swinging.',
    cardioBenefit: 'Intense muscular pump that drives heart rate during high-cadence reps.',
    formPoints: [
      'Start in a dead hang with arms completely straight',
      'Depress your shoulders away from your ears by squeezing back muscles',
      'Hold the top squeeze for 1 full second',
      'Lower smoothly with control back to dead hang'
    ],
    defaultWorkSeconds: 30,
    defaultRestSeconds: 15,
    cadenceTip: '1 second up, 1 second pause, 1 second down.',
    targetMuscles: ['Lower Trapezius', 'Rhomboids', 'Serratus Anterior', 'Lats']
  },

  'door-bar-hanging-knees': {
    id: 'door-bar-hanging-knees',
    name: 'Door Bar Hanging Knee-to-Chest',
    targets: ['belly_fat', 'posture'],
    equipment: 'door_bar',
    difficulty: 3,
    description: 'Hanging from the bar, curl knees aggressively up to the chest using abdominal contraction, not hip swing. Ultimate lower-belly tightener.',
    textNeckCue: 'Keep head steady against the bar frame; do NOT crane your neck forward to watch your knees.',
    postureBenefit: 'Forces posterior pelvic tilt, reversing anterior pelvic tilt (belly push-out) caused by prolonged sitting.',
    bellyBurnBenefit: 'Directly targets rectus abdominis and transverse abdominis with progressive bodyweight resistance.',
    cardioBenefit: 'Demands intense cardiovascular pacing when executed continuously.',
    formPoints: [
      'Squeeze the bar firmly, lock shoulders down',
      'Exhale sharply as you curl your knees towards your sternum',
      'Tilt your pelvis up at the top of the movement to compress the abs',
      'Lower under control without swinging back and forth'
    ],
    defaultWorkSeconds: 30,
    defaultRestSeconds: 15,
    cadenceTip: 'Exhale hard at the top of every knee tuck.',
    targetMuscles: ['Rectus Abdominis', 'Transverse Abdominis', 'Obliques', 'Forearms']
  },

  'door-bar-isometric-lock': {
    id: 'door-bar-isometric-lock',
    name: 'Door Bar Top/Flexed Arm Hang',
    targets: ['posture', 'hybrid'],
    equipment: 'door_bar',
    difficulty: 4,
    description: 'Jump or pull up to holding your chin at or just below the bar, holding elbows locked into sides. Intense postural back engagement.',
    textNeckCue: 'Pull your chest toward the bar, opening your collarbones wide. Keep neck long, do not jut chin over bar.',
    postureBenefit: 'Strengthens rhomboids and mid-traps in full contraction, pulling forward-slumped shoulders backwards.',
    bellyBurnBenefit: 'Maximum total-body isometric tension that revs up metabolic demand.',
    cardioBenefit: 'Massive blood pressure and heart rate elevation within 15 seconds.',
    formPoints: [
      'Underhand or neutral grip on the door bar',
      'Step or jump up to top position',
      'Squeeze elbows tight into your ribs and squeeze shoulder blades',
      'Breathe through teeth; lower down with a 3-second negative when fatiguing'
    ],
    defaultWorkSeconds: 20,
    defaultRestSeconds: 20,
    cadenceTip: 'Pure isometric hold. Squeeze shoulder blades together continuously.',
    targetMuscles: ['Biceps', 'Rhomboids', 'Rear Deltoids', 'Core']
  },

  // === JUMP ROPE EXERCISES ===
  'rope-boxer-skip-hiit': {
    id: 'rope-boxer-skip-hiit',
    name: 'Jump Rope Boxer Skip HIIT',
    targets: ['cardio', 'belly_fat'],
    equipment: 'rope',
    difficulty: 2,
    description: 'Rhythmic, low-impact boxer shuffle skipping. Shifts weight foot-to-foot for prolonged metabolic burn with minimal joint strain.',
    textNeckCue: 'Keep eyes fixed straight ahead at eye level! Avoid looking down at your feet, which triggers text-neck strain.',
    postureBenefit: 'Requires tall vertical spinal alignment and active shoulder retraction with elbows pinned to ribs.',
    bellyBurnBenefit: 'Burns 14-20 kcal/min at high tempo, mobilizing visceral fat stores via catecholamine release.',
    cardioBenefit: 'Exceptional aerobic capacity builder, improves stroke volume and foot speed.',
    formPoints: [
      'Keep elbows close to your torso, turn rope only with wrist flicks',
      'Shift weight from left to right foot like a boxer in the ring',
      'Stay light on the balls of your feet, jumping barely 1-2 cm off floor',
      'Maintain an upright tall posture, gaze 5 meters forward'
    ],
    defaultWorkSeconds: 30,
    defaultRestSeconds: 15,
    cadenceTip: 'Aim for 120-140 turns per minute. Smooth, continuous rhythm.',
    targetMuscles: ['Calves', 'Cardiovascular System', 'Forearms', 'Core Stabilizers']
  },

  'rope-speed-sprint-tabata': {
    id: 'rope-speed-sprint-tabata',
    name: 'Jump Rope Speed Sprint / Double-Under Burst',
    targets: ['cardio', 'belly_fat'],
    equipment: 'rope',
    difficulty: 4,
    description: 'All-out maximum frequency jump rope sprint (or double-under practice). Red-line heart rate intervals designed for EPOC fat afterburn.',
    textNeckCue: 'Keep shoulders relaxed down away from ears. Breathe through your nose/mouth without craning your neck forward.',
    postureBenefit: 'Develops reactive tendon elasticity and reinforces upright spinal integrity under maximum exertion.',
    bellyBurnBenefit: 'Maximum EPOC (Excess Post-Exercise Oxygen Consumption)—keeps burning fat for 12-24 hours post-workout.',
    cardioBenefit: 'Drives VO2 max through ceiling with rapid anaerobic power spikes.',
    formPoints: [
      'Spin rope with rapid wrist velocity',
      'Keep core braced like taking a punch',
      'Land softly and immediately spring back up',
      'Sprint at 90-100% effort for the entire work interval'
    ],
    defaultWorkSeconds: 20,
    defaultRestSeconds: 10,
    cadenceTip: 'Sprint effort! 140-180+ RPM. Every turn counts towards your daily overload.',
    targetMuscles: ['Cardiovascular System', 'Full Body', 'Calves', 'Shoulders']
  },

  'rope-high-knees-burn': {
    id: 'rope-high-knees-burn',
    name: 'Jump Rope High Knees Sprint',
    targets: ['belly_fat', 'cardio'],
    equipment: 'rope',
    difficulty: 3,
    description: 'Running in place while jumping rope, driving knees upward toward hips on each turn. Crushes abdominal fat while spiking heart rate.',
    textNeckCue: 'Keep chest high and spine neutral. Do not round your upper back to meet your knees.',
    postureBenefit: 'Strengthens psoas and hip flexors dynamically while forcing thoracic extension.',
    bellyBurnBenefit: 'Dynamic abdominal crunch on every single step combined with maximum caloric expenditure.',
    cardioBenefit: 'One of the highest heart rate accelerators in fitness training.',
    formPoints: [
      'Alternate driving left and right knee up to hip level',
      'Coordinate 1 rope spin per knee drive',
      'Stay on the balls of the feet',
      'Pump arms cleanly from the wrists'
    ],
    defaultWorkSeconds: 25,
    defaultRestSeconds: 15,
    cadenceTip: 'High knees cadence! Drive knees up to waist height.',
    targetMuscles: ['Rectus Abdominis', 'Hip Flexors', 'Calves', 'Cardio']
  },

  // === BODYWEIGHT POSTURE & TEXT-NECK SPECIALS ===
  'chin-tuck-cobra-hold': {
    id: 'chin-tuck-cobra-hold',
    name: 'Prone Cobra & Cervical Retraction',
    targets: ['posture'],
    equipment: 'bodyweight',
    difficulty: 2,
    description: 'Lying prone on your stomach, lift chest while rotating thumbs up and pulling chin backward into cervical retraction. The ultimate cure for forward head posture.',
    textNeckCue: 'CRUCIAL: Imagine making a gentle double chin by sliding your head directly backward. Look straight down at the mat, NOT up at the wall.',
    postureBenefit: 'Strengthens the deep cervical flexors (longus colli/capitis) and mid/lower traps while stretching tight anterior pec muscles.',
    bellyBurnBenefit: 'Requires active abdominal bracing and glute contraction to protect lower spine.',
    cardioBenefit: 'Low cardio, high postural neuromuscular reset.',
    formPoints: [
      'Lie face down on the floor or mat, legs together',
      'Rotate thumbs upward toward ceiling (external shoulder rotation)',
      'Retract chin backward (double chin cue), lengthen back of neck',
      'Hold the contraction, breathing smoothly through the diaphragm'
    ],
    defaultWorkSeconds: 30,
    defaultRestSeconds: 15,
    cadenceTip: 'Hold continuously or pulse with 3-second holds at the peak.',
    targetMuscles: ['Deep Neck Flexors', 'Lower Traps', 'Rhomboids', 'Erector Spinae']
  },

  'prone-ytw-raises': {
    id: 'prone-ytw-raises',
    name: 'Prone Y-T-W Scapular Raises',
    targets: ['posture'],
    equipment: 'bodyweight',
    difficulty: 2,
    description: 'Lying face down, cycle through raising arms in Y shape (lower traps), T shape (rhomboids/rear delts), and W shape (rotator cuff).',
    textNeckCue: 'Keep forehead 1 inch off floor with chin tucked. Never tilt head backward.',
    postureBenefit: 'Directly restores the muscular balance of the scapular stabilizers compromised by keyboard and phone usage.',
    bellyBurnBenefit: 'Engages posterior chain and core stabilization.',
    cardioBenefit: 'Muscular endurance and localized lactic burn.',
    formPoints: [
      'Y: Arms 45 degrees overhead, thumbs up, squeeze lower traps',
      'T: Arms straight out to sides, thumbs up, pinch shoulder blades',
      'W: Elbows pulled down to ribs in a W shape, rotate hands upward',
      'Cycle 3 reps of each consecutively throughout work interval'
    ],
    defaultWorkSeconds: 35,
    defaultRestSeconds: 15,
    cadenceTip: '2 seconds hold at top of each letter.',
    targetMuscles: ['Rhomboids', 'Mid & Lower Traps', 'Infraspinatus', 'Rear Delts']
  },

  // === BODYWEIGHT FAT BURN & CORE SHRED ===
  'hollow-body-hold-tuck': {
    id: 'hollow-body-hold-tuck',
    name: 'Hollow Body Hold to Tuck Rock',
    targets: ['belly_fat', 'posture'],
    equipment: 'bodyweight',
    difficulty: 3,
    description: 'Gymnastics gold standard for abdominal flattening. Glues lower back to floor, engages transverse abdominis without straining the cervical neck.',
    textNeckCue: 'Keep chin tucked gently toward throat with space for an apple under chin. Do not pull on neck with hands.',
    postureBenefit: 'Eliminates anterior pelvic tilt (which creates the illusion of a belly pouch even at low body fat).',
    bellyBurnBenefit: 'Maximum isometric recruitment of entire abdominal wall, crushing deep belly flab.',
    cardioBenefit: 'Sustained full-body muscular recruitment drives rapid breathing.',
    formPoints: [
      'Lie on back, press lumbar spine flat against the ground—zero gap!',
      'Lift shoulder blades off floor and reach hands forward or overhead',
      'Lift legs 6 inches off ground with toes pointed (or tuck knees to modify)',
      'Rock gently forward and back while maintaining solid banana shape'
    ],
    defaultWorkSeconds: 30,
    defaultRestSeconds: 15,
    cadenceTip: 'If lower back arches off floor, bend knees into chest immediately to reset.',
    targetMuscles: ['Transverse Abdominis', 'Rectus Abdominis', 'Hip Flexors']
  },

  'sprawl-burpee-blast': {
    id: 'sprawl-burpee-blast',
    name: 'Sprawl Burpee / Chest-to-Floor Blast',
    targets: ['cardio', 'belly_fat'],
    equipment: 'bodyweight',
    difficulty: 4,
    description: 'Explosive jump back into a plank/push-up and snap feet back forward, jumping up. The quintessential full-body metabolic fat furnace.',
    textNeckCue: 'When snapping feet back into plank, keep head in line with spine—resist looking down at your toes or forward at the wall.',
    postureBenefit: 'Teaches thoracic stability under explosive plyometric load.',
    bellyBurnBenefit: 'Massive caloric expenditure per minute, activates full-body glycolytic pathway.',
    cardioBenefit: 'Pushes heart rate toward peak anaerobic threshold.',
    formPoints: [
      'Drop hands to floor outside feet, kick legs back explosively',
      'Brief chest tap to floor or solid plank lockout',
      'Snap feet back to outside of hands in an athletic squat',
      'Explode upward, clapping hands overhead'
    ],
    defaultWorkSeconds: 25,
    defaultRestSeconds: 15,
    cadenceTip: 'Smooth continuous flow. Aim for 8-12 reps per work interval.',
    targetMuscles: ['Full Body', 'Cardio', 'Chest', 'Core', 'Quads']
  },

  'mountain-climber-sprints': {
    id: 'mountain-climber-sprints',
    name: 'High-Cadence Mountain Climbers',
    targets: ['belly_fat', 'cardio'],
    equipment: 'bodyweight',
    difficulty: 3,
    description: 'In a rigid push-up plank, drive knees rapidly toward chest in sprint cadence. Burns belly fat while keeping shoulders and scapulae locked in posture.',
    textNeckCue: 'Push floor away with palms (protracting scapula slightly) and look directly between thumbs to protect cervical spine.',
    postureBenefit: 'Strengthens serratus anterior and anti-rotation core stabilizers.',
    bellyBurnBenefit: 'Continuous alternating abdominal compression under high metabolic load.',
    cardioBenefit: 'Sustained heart rate acceleration without high joint impact.',
    formPoints: [
      'Hands directly under shoulders, fingers spread wide',
      'Maintain flat back—hips do not spike up into the air',
      'Drive knees forward toward chest in rapid alternating cadence',
      'Keep core braced like iron'
    ],
    defaultWorkSeconds: 30,
    defaultRestSeconds: 15,
    cadenceTip: 'Rapid sprint tempo! Keep hips low and level.',
    targetMuscles: ['Rectus Abdominis', 'Serratus Anterior', 'Shoulders', 'Cardio']
  },

  'plank-downdog-toe-tap': {
    id: 'plank-downdog-toe-tap',
    name: 'Plank to Downward Dog & Scapular Push',
    targets: ['posture', 'belly_fat'],
    equipment: 'bodyweight',
    difficulty: 2,
    description: 'From a plank, push back into Downward Dog reaching hand to opposite ankle, then return to solid plank. Thoracic spine stretch + core compression.',
    textNeckCue: 'In downward dog, let head hang naturally relaxed between arms, releasing tight suboccipital neck tension.',
    postureBenefit: 'Stretches tight lats, opens thoracic spine, and activates serratus anterior.',
    bellyBurnBenefit: 'Diagonal anti-rotational core stabilization on every reach.',
    cardioBenefit: 'Dynamic full-body flow.',
    formPoints: [
      'Start in strong high plank',
      'Hinge hips high and back into Downward Dog',
      'Reach right hand toward left shin or ankle',
      'Return to high plank with squeeze, then alternate to left hand'
    ],
    defaultWorkSeconds: 30,
    defaultRestSeconds: 15,
    cadenceTip: 'Controlled athletic flow, 2 seconds per side.',
    targetMuscles: ['Thoracic Spine', 'Serratus Anterior', 'Obliques', 'Hamstrings']
  }
};

export const EXERCISE_LIST = Object.values(EXERCISES);
