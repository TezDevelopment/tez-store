// =====================================================================
// YOUR SCRIPTS. Edit names, prices and text here.
// Prices are in dollars. The server always uses these prices, never the browser.
// To add a script: add an entry here, put the zip in /private/downloads/<slug>.zip and images in /public/img/<slug>/
// =====================================================================
export type Product = {
  slug: string;
  name: string;
  category: 'Everyday Scripts' | 'Gang Series' | 'Admin Tools';
  tagline: string;
  description: string;
  price: number;
  version: string;
  updated: string;
  frameworks: string[];
  requires: string[];
  features: { title: string; text: string }[];
  shots: string[];
  video: string;
  poster: string;
  demo: boolean;
  badge?: string;
  resource: string; // folder name inside the zip
  changelog: { v: string; date: string; notes: string[] }[];
};

export const PRODUCTS: Product[] = [
  {
    slug: 'blackbox-reports',
    name: 'Blackbox Reports',
    category: 'Admin Tools',
    tagline: 'A report system where every report comes with a server-side replay.',
    description:
      'Players file a report and the server has already saved the last minute around the scene. Staff watch it on a map, or replay it inside the real game world with see-through players and cars and a free camera. No more arguing about who said what.',
    price: 39.99,
    version: '1.0.0',
    updated: 'November 2026',
    badge: 'New',
    frameworks: ['ESX', 'QBCore', 'Qbox', 'Standalone'],
    requires: ['oxmysql', 'OneSync'],
    features: [
      { title: 'In-game ghost replay', text: 'Staff replay a VDM or RDM inside the real world. Cars and players move as see-through ghosts with a free or follow camera, scrub and slow motion.' },
      { title: 'Server-side flight recorder', text: 'The server records positions, speed, health and vehicles for the reporter, the accused and everyone nearby. Players cannot edit it.' },
      { title: 'Map replay', text: 'Scrub, speed up, follow either player, and see closest approach, jumps and on-foot speed hints plus shots, hits and deaths.' },
      { title: 'Death clips', text: 'When someone dies the server saves a clip right away, so a report filed minutes later still shows the hit.' },
      { title: 'Smart priority', text: 'Cases are ranked by category, reporter trust, pile-ons, repeat offenders and combat evidence. Staff see the reasons as bars.' },
      { title: 'Trust and strikes', text: 'Reporters earn or lose trust. Accused players collect strike points that decay and map to a punishment ladder.' },
      { title: 'Witness program', text: 'Nearby players are asked what they saw and paid for answering.' },
      { title: 'Panic key and death prompt', text: 'Hold a key to send an urgent report, or press Y after dying to report your killer in one tap.' },
      { title: 'Right to reply', text: 'The accused gets their own chat channel. Reporter, accused and staff chats stay separate.' },
      { title: 'Staff tools', text: 'Go to scene, bring, send back, spectate and live tracking, always with a way back.' },
      { title: 'Verdicts that run your commands', text: 'Warn, kick, jail or ban with your own command templates, with strike points added for you.' },
      { title: 'Live admin panel', text: 'Every setting, category, question and verdict is editable in game with validation and history.' },
    ],
    shots: ['01-report', '02-desk', '03-replay', '04-people', '05-insights', '06-admin'],
    video: '/video/blackbox.mp4',
    poster: '/video/blackbox.webp',
    demo: true,
    resource: 'blackbox_reports',
    changelog: [{ v: '1.0.0', date: 'November 2026', notes: ['First release.', 'Server-side recorder, map replay and in-game ghost replay.', 'Staff desk, priority scoring, trust and strikes, witness program.', 'Live admin panel with validation and history.'] }],
  },
  {
    slug: 'glam-hub',
    name: 'Glam Hub',
    category: 'Everyday Scripts',
    tagline: 'A beauty business and social app for your city.',
    description:
      'Players take a salon job, craft beauty products at a table they place themselves, sell to customers who walk up on the street, level a career, finish daily tasks and climb leaderboards. Chat, friends, group chats and a photo gallery are built in.',
    price: 34.99,
    version: '1.0.0',
    updated: 'November 2026',
    frameworks: ['ESX', 'QBCore', 'Qbox'],
    requires: ['oxmysql', 'ox_inventory, qb-inventory, qs-inventory or ESX inventory'],
    features: [
      { title: 'Salon jobs and careers', text: 'Different salon roles with levels, XP and a career page players want to climb.' },
      { title: 'Crafting', text: 'Players place their own craft table and make beauty products from ingredients.' },
      { title: 'Street customers', text: 'Customers walk up and buy, so the business feels alive without extra scripts.' },
      { title: 'Daily tasks and leaderboards', text: 'Daily goals, rewards and boards keep players coming back.' },
      { title: 'Social app', text: 'Chat, friends, group chats, profiles and a photo gallery.' },
      { title: 'Works with your inventory', text: 'ox_inventory, qb-inventory, qs-inventory or the ESX inventory.' },
      { title: 'In-game admin panel', text: 'Jobs, zones, items and prices are set up in game. No file editing.' },
    ],
    shots: ['01-home', '02-craft', '03-jobs', '04-career', '05-gallery', '06-chat'],
    video: '/video/glam-hub.mp4',
    poster: '/video/glam-hub.webp',
    demo: true,
    resource: 'glam_hub',
    changelog: [{ v: '1.0.0', date: 'November 2026', notes: ['First release.', 'Salon jobs, crafting, street customers, daily tasks and leaderboards.', 'Social app with chat, friends, group chats and gallery.', 'Support for ox, qb, qs and ESX inventories.'] }],
  },
  {
    slug: 'squads',
    name: 'Squads',
    category: 'Gang Series',
    tagline: 'Squads, KOS wars and bounties with a live squad HUD.',
    description:
      'Players team up under their own name, tag and colour and see their squadmates on the map with a HUD, nametags and a ping wheel. Then they go to war: KOS wars, bounties, a shared squad bank, abilities and leaderboards.',
    price: 24.99,
    version: '2.0.0',
    updated: 'November 2026',
    frameworks: ['ESX', 'QBCore', 'Qbox', 'Standalone'],
    requires: ['oxmysql'],
    features: [
      { title: 'Live squad HUD', text: 'Health, armor, talking and downed status for every teammate, plus nametags and a mini radar.' },
      { title: 'Ping wheel', text: 'Tap to ping, double tap for enemies, hold for seven ping types.' },
      { title: 'Custom ranks and permissions', text: 'Up to 8 ranks per squad with 11 permissions each.' },
      { title: 'Squad bank', text: 'Shared funds with a live balance chart and full history.' },
      { title: 'Abilities and orders', text: 'UAV scans, armor resupply, double XP and teamwork orders.' },
      { title: 'KOS wars and bounties', text: 'Challenge other squads, track the score live on the war bar, and put money on a player.' },
      { title: 'Leaderboards, levels and tasks', text: 'Kills, K/D, bounties and XP, plus six daily tasks with rewards.' },
      { title: 'Player settings and admin panel', text: 'Players move and resize the HUD and pick colours. Admins change everything live with no restart.' },
    ],
    shots: ['01', '02', '03', '04', '05', '06', '07', '08'],
    video: '/video/squads.mp4',
    poster: '/video/squads.webp',
    demo: false,
    resource: 'blue_squads',
    changelog: [{ v: '2.0.0', date: 'November 2026', notes: ['Rebuilt interface with a blue theme.', 'Live squad HUD, nametags and the ping wheel.', 'KOS wars, bounties, squad bank, abilities and leaderboards.', 'Live admin panel with no restarts.'] }],
  },
  {
    slug: "police-mdt",
    name: "Police MDT",
    category: "Everyday Scripts",
    tagline: "A full police MDT with warrants, reports, evidence and records, built for ESX Legacy.",
    description: "A full police MDT with warrants, reports, evidence and records, built for ESX Legacy.",
    price: 44.99,
    version: '1.0.0',
    updated: "November 2026",
    badge: 'New',
    frameworks: ['ESX'],
    requires: ['oxmysql'],
    features: [
      { title: "Warrant workflow", text: "request, approve and serve" },
      { title: "Reports with versions and comments", text: "" },
      { title: "Evidence with chain of custody", text: "" },
      { title: "Citizen and vehicle records", text: "" },
      { title: "Roles and permissions per rank", text: "" },
      { title: "Full audit log of every action", text: "" },
    ],
    shots: ['01'],
    video: "/video/police-mdt.mp4",
    poster: "/img/police-mdt/01.webp",
    demo: false,
    resource: "police_mdt",
    changelog: [{ v: '1.0.0', date: "November 2026", notes: ['First release.'] }],
  },
];

export const CATEGORIES = ['Everyday Scripts', 'Gang Series', 'Admin Tools'] as const;

export const bySlug = (slug: string) => PRODUCTS.find((p) => p.slug === slug);

// the live demos (the real interface running on sample data)
export const DEMOS: Record<string, { path: string; label: string; hint: string }> = {
  'blackbox-reports': { path: '/demos/blackbox/index.html', label: 'Blackbox Reports', hint: 'Open a case, press Replay, and try the staff desk.' },
  'glam-hub': { path: '/demos/glam-hub/index.html', label: 'Glam Hub', hint: 'Click around the jobs, crafting, career and social pages.' },
};
