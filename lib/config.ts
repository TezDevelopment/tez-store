// =====================================================================
// EDIT THIS FILE to make the store yours: name, links, text, prices live in lib/products.ts
// Accent colour: top of app/globals.css (--accent and --accent-rgb)
// =====================================================================
export const SITE = {
  name: 'Tez Development',
  short: 'Tez',
  tagline: 'FiveM scripts that run light and look sharp',
  logo: '/logo.svg',
  discord: 'https://discord.gg/nTtUHT6FrC',
  supportEmail: '', // optional: put your support email here, for example 'support@yourdomain.com'. Leave empty to hide it.
  currency: 'usd',

  heroTitle: 'Scripts that make your server feel finished.',
  heroText:
    'Report systems, squads, social apps and more, made by us. Every screen on this site comes from the scripts themselves, and the live demos run in your browser.',

  // Buy this many scripts or more and the discount applies automatically
  bundle: { min: 3, percent: 15, label: 'Full pack discount' },

  worksWith: ['ESX', 'QBCore', 'Qbox', 'ox_lib', 'oxmysql', 'OneSync'],

  features: [
    { icon: 'code', title: 'Optimized code', text: 'Light on resmon, with server-side checks on every action.' },
    { icon: 'grid', title: 'Clean interfaces', text: 'Simple screens your players and staff understand at once.' },
    { icon: 'gear', title: 'Everything in game', text: 'Change settings live in an admin panel. No file editing, no restarts.' },
    { icon: 'headset', title: 'Support in Discord', text: 'Open a ticket and we help you install and set it up.' },
  ],

  faq: [
    { q: 'How do I get the script after paying?', a: 'You are taken to your order page straight away with a download button for each script. We also email you the same link if email is turned on.' },
    { q: 'Which frameworks work?', a: 'Each script page lists exactly what it supports. Most work with ESX, QBCore, Qbox and standalone.' },
    { q: 'Is the code open?', a: 'Yes. You get the full resource with readable Lua and a config file. Only the licence stops you reselling or sharing it.' },
    { q: 'Can I use it on more than one server?', a: 'A purchase covers one live server and one test server. Need more? Message us on Discord for a multi-server licence.' },
    { q: 'Do you offer refunds?', a: 'Scripts are digital downloads, so refunds are limited. Read the refund policy before you buy, and talk to us first if something does not work.' },
    { q: 'Can you build something custom?', a: 'Yes. Open a ticket on Discord and tell us what you need.' },
  ],
};
