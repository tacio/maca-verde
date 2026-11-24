# 01 — UX Principles

Status: approved · day 14359
Inputs: [00-brief.md](00-brief.md)

Thirteen principles, each with the evidence behind it, what it means for this app, and a **check** an agent can verify on a screenshot or in code. Evidence strength is rated:

- **●●●** meta-analysis or large field experiment
- **●●○** peer-reviewed experiments, replicated or consistent
- **●○○** single study, company-reported data, or established practitioner guidance

Where a study was read only through secondary sources, it is marked *(secondary)*.

---

## A. Commitment and the day

### P1 — The day is the unit; show its completion first
The home screen is today's plan as a short checklist with one completion indicator (0–100%). Nothing competes with it.

- **Evidence.** Monitoring progress toward a goal improves attainment, d = 0.40 across 138 RCTs, N = 19,951; effects are larger when progress is **recorded** rather than kept in mind (Harkin et al. 2016) ●●●. A single, closable daily goal is the design core of Apple's Activity rings ●○○. People speed up as a goal nears completion (goal-gradient: Kivetz et al. 2006; endowed progress: Nunes & Drèze 2006, *secondary*) ●●○.
- **Apply.** Today = day number + checklist + progress ring/bar. Each item shows target and, once logged, actual. Cycle view shows 10 day-dots (done / failed / today / planned).
- **Check.** On a 412×915 viewport, today's completion indicator and the full checklist are visible without scrolling. Every plan item has a binary done state derived from data, never a manual toggle without a value.

### P2 — Plan ahead, then commit: editable until the day starts, locked after
- **Evidence.** If-then plans increase goal attainment; the 2006 meta-analysis reported d = 0.65 (94 tests), but a 2024 bias-corrected update of 642 tests puts it near d = 0.15–0.35 (Gollwitzer & Sheeran 2006; Sheeran et al. 2024, *secondary*) ●●● — real but modest. Self-imposed deadlines reduce procrastination (Ariely & Wertenbroch 2002) — **recent replications failed**, so treat as ●○○.
- **Apply.** Locking is the commitment device the brief already chose; the UI makes the lock legible: future days show "editable until 360.0000"; today shows a lock icon and no edit affordance. Planning is framed as *when/after what* + *how much* ("after waking: Tabata, 12 rounds").
- **Check.** No code path mutates the plan of a day whose start ≤ now. Today's screen has no edit control on plan items. Each workout item can carry an anchor cue (P4).

### P3 — Calibrate targets from evidence, not hope
- **Evidence.** People underestimate effort for their own tasks; the bias **disappears** when they are made to connect past performance to the new prediction (Buehler, Griffin & Ross 1994, Study 4) ●●○. Under a strict 100% rule, over-ambitious plans are the main path to failure.
- **Apply.** Every target input shows the last achieved value and the engine's suggestion side by side ("last: 38 s · suggested: 40 s"). Downward recalibration is a normal, unshamed action in the plan editor.
- **Check.** Every numeric target field displays the most recent actual for that metric (or "no data yet") adjacent to it.

### P4 — Anchor to an existing routine; don't rely on reminders
- **Evidence.** In a 4-week study, reminders increased repetition but **hindered automaticity**; event-based cues increased it (Stawarz, Cox & Blandford, CHI 2015) ●●○. Habit automaticity takes a median ~66 days (range 18–254) and a single missed repetition barely affects it (Lally et al. 2010, *secondary*) ●●○. A static PWA can't push reliably anyway.
- **Apply.** Onboarding asks for the anchor event ("After I ___"), shown on the morning workout item. No in-app reminder system.
- **Check.** Onboarding has an anchor field; the morning item renders it.

### P5 — Fresh start at every cycle boundary
- **Evidence.** Aspirational behavior (gym visits, goal commitments) rises after temporal landmarks — new week, month, semester (Dai, Milkman & Riis 2014) ●●○.
- **Apply.** The 10-day cycle is the landmark (the brief already removes weeks). Approving a new cycle is a small ritual: short look-back at the last 10 days (done count, justifications), then the template pre-fill, adjust, approve.
- **Check.** Cycle approval screen shows the previous cycle's result before the editor; approval is a single explicit action.

## B. Failure without spiral

### P6 — Strict streak, but never shown alone
- **Evidence.** After violating a goal, people often abandon it for the period ("what-the-hell" effect; Polivy & Herman; Fishbach et al. 2004 found goal violation can leave people worse than having no goal) ●●○ — though one field study found no effect in everyday dieting (Tomiyama, *secondary*). Intact streaks drive more engagement than broken ones, and the drop is **amplified when people attribute the break to themselves** (Silverman & Barasch 2023) ●●○. Goals with a little costly slack sustain persistence after failure (Sharif & Shu 2017) ●●○. Duolingo reports retention gains from streak protection (company A/B data) ●○○.
- **Resolution.** The brief originally chose a strict streak with no repair. Following this evidence it now uses **earned reserves** (see [00-brief](00-brief.md) → Reserves): slack that costs something, capped at 2, never covering two misses in a row. The day record and the 100-day average stay honest — reserves protect only the streak.
- **Apply.** Streak and 100-day average always appear together. Protection (reserves) is shown only on Progress and after a miss — never on Today, never as a forecast for an active day — so it can't license skipping (moral licensing; see brief → "Against might as well spend it"). A protected day reads as "missed · streak kept", never as done. Clean cycles (10/10, none protected) are celebrated. After a broken streak, the hero metric is the average ("72 of last 100"), not "0".
- **Check.** No screen shows the streak without the 100-day average in the same component. Today never renders `data-reserves`. A protected day is never rendered with the done style. The streak logic has unit tests for: reserve use, cap of 2, no reserve on consecutive misses, reserve only on on-time cycle approval.

### P7 — Don't miss twice
- **Evidence.** In a megastudy of 54 interventions with 61,000+ gym members, the top performer rewarded **returning after a missed workout** — targeting runs of misses rather than single misses (Milkman et al. 2021, *Nature*) ●●●.
- **Apply.** The day after a failed day is a recovery day: its card says so (and, if a reserve was just used, that the next miss would break the streak), and its completion gets a distinct celebration ("Back on track"). Reserves deliberately can't cover a second consecutive miss.
- **Check.** A day following a failed day renders the recovery framing and its completion triggers the recovery celebration.

### P8 — Justification asks about the plan, not about me
- **Evidence.** People learn less from their own failures than from successes because failure threatens the ego; the gap vanishes when attention moves off the self (Eskreis-Winkler & Fishbach 2019) ●●○ (a 2025 commentary disputes the mechanism). Self-attribution amplifies the cost of a broken streak (P6). Putting feelings into words dampens limbic response (Lieberman et al. 2007) ●●○.
- **Apply.** The required justification prompt is task-focused: "What got in the way?" with quick chips (plan too big / time / energy / pain / other) plus one sentence, then "Adjust the next days?" linking straight to the plan editor. Neutral tone; no red, no "failed" headline.
- **Check.** Justification copy contains no second-person blame words ("you failed", "you missed"); the flow ends with an offer to edit upcoming unlocked days.

## C. Interaction and attention

### P9 — One primary action per screen
- **Evidence.** Choice time grows with the number of options (Hick–Hyman law, 1952–53) ●●●. Choice overload is real when options are complex and preferences uncertain (Chernev et al. 2015 meta-analysis; Scheibehenne et al. 2010 found ~zero average effect without moderators) ●●○. Calm technology: informs without demanding focus (Weiser & Brown 1996; Case 2015) ●○○. The brief's "Asana, not Jira".
- **Apply.** Home's primary action is the next undone item ("Start Tabata · 12 min"). Navigation reduced to the minimum the workflows need (defined in phase 2). Routine choice happens at planning time, not at workout time.
- **Check.** Each screen has exactly one filled accent button. Bottom navigation ≤ 4 destinations.

### P10 — Explanations on demand
- **Evidence.** Progressive disclosure defers secondary information to reduce errors and learning cost (Nielsen/NN/g) ●○○ — evidence base is thin but it directly addresses the brief's top pain point (clutter, explanations everywhere).
- **Apply.** Science, benefits and form notes move behind a single "Why?" / "How?" disclosure. Default text per card ≤ 2 lines.
- **Check.** No visible paragraph exceeds 2 lines at 412 px width outside an expanded disclosure.

### P11 — Logging under 15 seconds
- **Evidence.** Tracking burden ("a hassle") is a leading reason people abandon self-tracking (Epstein et al. 2015, 2016) ●●○. Compliance in experience-sampling studies averages 79% and stays similar from 3 to 12 prompts/day when each is short (Wrzus & Neubauer 2023) ●●●.
- **Apply.** Mood check: one screen, default path ≤ 3 taps (valence, HALT chips, save); free text optional. Post-workout log pre-filled from the timer; only RPE and neck need input: one tap each on a 0–1 strip, never preselected (a default anchors the answer).
- **Check.** Default mood-check path ≤ 3 taps; post-workout log ≤ 3 required inputs.

### P12 — Audio first, glance second, hands free during workouts
- **Evidence.** HCI studies of runners find audio guidance effective and less distracting than visual elements; cognitive load depends on how complex simultaneous sounds are (multiple small studies, e.g. Keep the Beat; SportsHCI 2025) ●○○. Touch error rates level off at ~9.2–9.6 mm targets for thumb use (Parhi et al. 2006) ●●○; Android guidance: ≥ 48 dp (~9 mm) ●○○. Legible size scales with distance: fluent reading spans ~0.2–2° of visual angle (Legge & Bigelow 2011) ●●○.
- **Apply.** Every state change is spoken (exercise name, cue, 3-2-1, rest, next). One sound at a time. The screen shows **only** the current exercise, the remaining seconds, and a progress strip. At ~3 m, 0.5° ≈ 26 mm ≈ 165 CSS px on a Pixel 8 (≈ 6.4 CSS px/mm), so the countdown shows bare seconds ("20"), not "0:20". The only mid-workout control is **Pause**, full-width at the bottom (its sheet: Resume, End workout). **No skipping**: work and rest intervals always run their full time — skipping is bargaining with an approved plan.
- **Check.** HUD countdown digit cap height ≥ 160 CSS px at 412 px width; HUD has exactly 1 control (Pause), ≥ 72 CSS px tall; no skip control in any timed flow; each phase change triggers a speech call; all other tap targets ≥ 48 CSS px.

## D. Feeling

### P13 — Celebrate competence, briefly; one calm visual system
- **Evidence.** Gamified physical-activity interventions show a small-to-medium effect (g = 0.42, 16 RCTs; Mazéas et al. 2022) ●●●. Tangible, expected, contingent rewards undermine intrinsic motivation; informational feedback on competence doesn't (Deci, Koestner & Ryan 1999 meta-analysis; contested by Cameron & Pierce) ●●○. Competence and autonomy predict sustained play (Ryan, Rigby & Przybylski 2006) ●●○. Experiences are remembered by their peak and end (Kahneman et al. 1993) ●●○. Asana celebrations appear **randomly**, not on every completion ●○○. Interfaces perceived as beautiful are perceived as more usable (Kurosu & Kashimura 1995; Tractinsky 2000) ●○○.
- **Apply.** Gamification = competence feedback only: day done, cycle done, records beaten, recovery day. Day-complete is the peak moment (full-screen, ≤ 2 s, skippable); item completion is a small inline tick. Occasional variable delight (e.g. a rare variant on day-done). No points currency, shop, levels for their own sake, or leaderboards. Visual system: neutral palette, **one** accent color, one typeface, tokens only, WCAG AA contrast, light/dark follow the system.
- **Check.** Celebration components exist only for the listed events. CSS uses only design tokens (no raw hex/Tailwind palette colors outside the token file). Text contrast ≥ 4.5:1 in both themes.

---

## Coverage of the brief

| Brief item | Principles |
|---|---|
| Streak + 100-day average | P1, P6, P7 |
| 10-day cycles, approval, template helper | P2, P3, P5 |
| Lock at day start | P2 |
| Written justification | P8 |
| Mood checks / drills as counts | P1, P11 |
| Earphones, phone meters away | P12 |
| Clutter, explanations, too much at once | P9, P10, P13 |
| "Asana, not Jira", gamification | P9, P13 |

## Evidence caveats

- Effect sizes for implementation intentions shrink a lot after bias correction; self-imposed deadline results failed recent replications. They justify cheap design choices, not core bets.
- Streak research is mostly consumer-behavior lab work plus company A/B tests; no peer-reviewed Duolingo data exists.
- Several figures (Lally missed-day effect, Nunes & Drèze card rates, Kivetz) were read through secondary summaries.

## Sources

- Harkin et al. 2016, *Psychological Bulletin* — [White Rose eprint](https://eprints.whiterose.ac.uk/91437/)
- Lally et al. 2010 — [BPS Research Digest](https://bps.org.uk/research-digest/how-form-habit)
- Gollwitzer & Sheeran 2006 / Sheeran et al. 2024 — [Gollwitzer & Oettingen review](https://www.socmot.uni-konstanz.de/sites/default/files/Gollwitzer_Oettingen_11_Planning_Goal_Striving.pdf), [summary of 2024 update](https://idtips.substack.com/p/implementation-intentions-the-science)
- Ariely & Wertenbroch 2002 and replications — [Duke](https://scholars.duke.edu/publication/810365), [replication](https://bpb-us-e1.wpmucdn.com/wp.nyu.edu/dist/c/16384/files/2025/09/Ariely_Replication-1.pdf)
- Buehler, Griffin & Ross 1994 — [PDF](https://bear.warrington.ufl.edu/brenner/mar7588/Papers/buehler-et-al-1994.pdf)
- Stawarz, Cox & Blandford 2015 — [UCL Discovery](https://discovery.ucl.ac.uk/id/eprint/1468224/)
- Dai, Milkman & Riis 2014 — [PDF](https://faculty.wharton.upenn.edu/wp-content/uploads/2014/06/Dai_Fresh_Start_2014_Mgmt_Sci.pdf)
- Fishbach et al. 2004 — [JCR PDF](https://www-2.rotman.utoronto.ca/facbios/file/goals.pdf); what-the-hell effect — [overview](https://becisions.com/dictionary/terms/what-the-hell-effect)
- Silverman & Barasch 2023 — [ResearchGate](https://www.researchgate.net/publication/361658509_On_or_Off_Track_How_Broken_Streaks_Affect_Consumer_Decisions)
- Sharif & Shu 2017 — [UCLA Anderson Review](https://anderson-review.ucla.edu/emergency-reserves/)
- Duolingo streak data — [Trophy case study](https://trophy.so/blog/duolingo-gamification-case-study), [critical analysis](https://hosdocumentary.com/articles/duolingo-streak)
- Milkman et al. 2021, *Nature* megastudy — [Caltech record](https://authors.library.caltech.edu/records/mys88-cc756), [WEF summary](https://www.weforum.org/stories/health-and-healthcare-systems/science-fitness-goal-motivation/)
- Eskreis-Winkler & Fishbach 2019 — [Chicago Booth Review](https://www.chicagobooth.edu/review/2019/december/learn-failing-not-so-easy)
- Lieberman et al. 2007 — [PDF](https://sites.lifesci.ucla.edu/psych-sanlab/wp-content/uploads/sites/31/2016/03/Lieberman_2007_PsychScience.pdf)
- Chernev et al. 2015 — [Kellogg](https://www.kellogg.northwestern.edu/faculty/research/detail/2015/when-product-assortment-leads-to-choice-overload-a-conceptual); Scheibehenne et al. reply — [PDF](https://abcwest.cogs.indiana.edu/pmwiki/pdf/scheibehenne.reply.2011.pdf)
- Weiser & Brown; Case — [Calm technology](https://en.wikipedia.org/wiki/Calm_technology), [Principles](https://caseorganic.com/post/principles-of-calm-technology/)
- Progressive disclosure — [NN/g](https://www.nngroup.com/videos/progressive-disclosure/)
- Epstein et al. 2015 / 2016 — [Lived informatics](https://library.selfresearch.org/research/a-lived-informatics-model-of-personal-informatics/), [Beyond abandonment](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5428074/)
- Wrzus & Neubauer 2023 — [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9999286)
- Runner audio feedback — [Keep the Beat](https://dl.ifip.org/hal-01647721v1), [sonification thesis](https://core.ac.uk/outputs/738337382), [SportsHCI 2025](https://www-live.dfki.de/fileadmin/user_upload/import/16526_3749385.3749419.pdf)
- Parhi, Karlson & Bederson 2006 — [Microsoft Research](https://www.microsoft.com/en-us/research/?p=155150); [Android touch target size](https://support.google.com/accessibility/android/answer/7101858)
- Legge & Bigelow 2011 — [PDF](https://legge.dl8.umn.edu/sites/legge.psych.umn.edu/files/2020-08/Legge%20Bigelow%202011%20Does%20size%20matter%20for%20reading%3F%20A%20review%20of%20findings%20from%20vision%20science%20and%20typography.pdf)
- Mazéas et al. 2022 — [PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8767479/)
- Deci, Koestner & Ryan 1999 — [PDF](https://depts.washington.edu/techdocs/papers/deciExtrinsicRewardsAndIntrinsicMotivation99.pdf); Ryan, Rigby & Przybylski 2006 — [PDF](https://www.rochester.edu/warner/lida/wp-content/uploads/2022/11/02bfe513dd59366750000000.pdf)
- Asana celebrations — [Asana blog](https://asana.com/inside-asana/new-celebrations), [Zapier](https://zapier.com/blog/asana-celebrations/); Apple rings — [Macworld](https://www.macworld.com/article/3183369/ring-toss-why-the-apple-watch-activity-goals-need-an-update.html)
