/** Contextual tutorial tips: shown once, dismissible, never automate the solution. */
export const TUTORIAL_TIPS: Record<string, { title: string; body: string }> = {
  movement: { title: 'Moving the Party', body: 'Left-click the ground to walk there. Your companions follow the selected leader. Keys 1–4 select individual heroes, A selects everyone, and WASD or screen edges pan the camera (mouse wheel zooms).' },
  dialogue: { title: 'Conversation', body: 'Choices in brackets test a skill — the skill is shown, the difficulty usually is not. Failed checks don\'t end stories; they bend them. People remember how you treat them.' },
  combat: { title: 'Turn-Based Combat', body: 'Combat is turn-based: on a hero\'s turn, click a highlighted cell to move, click an enemy to attack, and use the action bar below. Every roll is honest — expand entries in the log to see the math. Space ends the turn.' },
  reactions: { title: 'Reactions', body: 'Some abilities trigger on other creatures\' turns — Opportunity Attacks, Shield, Warding Flare. When one is available you\'ll be asked; the gear icon on the prompt sets it to always, never, or smart use.' },
  stealth: { title: 'Sneaking', body: 'Press V to sneak: each hero rolls Stealth against enemy Perception. Undetected parties can scout, set up ambushes, or slip past entirely. Noisy armor makes it harder.' },
  rest: { title: 'Resting', body: 'Press R to rest. A Short Rest (needs Rations) lets you spend Hit Dice and recharge some abilities — twice per day at most. A Long Rest requires Camp Supplies at your camp, and restores everything.' },
  levelup: { title: 'Milestones', body: 'The party levels at story milestones, not XP. When a level is earned, open the Character Sheet (C) and choose your new features — or postpone until you\'re ready.' },
  traps: { title: 'Traps', body: 'Sharp-eyed heroes spot traps passively as they approach; press X to actively search. Spotted traps show on the ground — click them to attempt disarming with Thieves\' Tools (a bad failure springs them).' },
  concentration: { title: 'Concentration', body: 'Spells marked Concentration last only while their caster keeps focus: taking damage forces a Constitution save (DC 10 or half the damage, whichever is higher). One concentration spell per caster at a time.' },
  evidence: { title: 'Evidence', body: 'Clues you uncover are recorded in the Journal (J) and unlock new dialogue options. The right evidence, shown to the right person, can succeed where no dice roll would.' },
  cover: { title: 'Cover', body: 'Crates, low walls, and boulders grant Half Cover (+2 AC and DEX saves); heavier obstacles grant Three-Quarters (+5). Position matters more than raw numbers.' },
  inventory: { title: 'Inventory', body: 'The party shares one inventory (I). Weapons, armor, and trinkets are equipped per-hero. Compare items before equipping — the tooltip shows what would change.' },
  camp: { title: 'The Camp', body: 'Camp is where the party breathes: Long Rests, swapping party members, retraining choices, and conversations by the fire. Companions left at camp still level with you.' },
  darkness: { title: 'Light and Dark', body: 'In dim light and darkness, sight is short — Darkvision helps, torches and the Light cantrip help more (and are visible to enemies). Some things in the temple are worse in the dark.' },
};
