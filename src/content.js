// Everything on the boards comes straight from Dylan's CV.
export const ME = {
  name: 'DYLAN JONKER',
  email: 'dylanjonker723@gmail.com',
  whatsapp: 'https://wa.me/27761356576',
  whatsappLabel: '+27 76 135 6576',
  linkedin: 'https://linkedin.com/in/dylan-jonker',
  linkedinLabel: 'linkedin.com/in/dylan-jonker',
};

// y = ledge height. side = which side the ledge sits (boards go on the other side).
export const STATIONS = [
  { id: 'base', short: 'BASE CAMP', y: 0, x: 0, ground: true,
    boards: [
      { cx: -8.8, cy: 6.4, w: 12.6, h: 7.9, kicker: 'BASE CAMP · PRETORIA, SOUTH AFRICA', title: 'DYLAN JONKER', sub: 'TECHNICAL OPERATOR', accent: '#ff6a2b',
        lines: [['5 YEARS', 'Data, web and e-commerce'], ['NOW', 'Runs tech and ops for a premium wellness brand'], ['OFF DUTY', 'Climbs rocks. Rolls on mats. Chases flights.']] },
      { cx: 8.8, cy: 6.4, w: 12.6, h: 7.9, kicker: 'HOW TO CLIMB', title: 'READ THE ROUTE', sub: 'EVERY PITCH IS A CHAPTER OF THE CV', accent: '#2ec4b6',
        lines: [['WASD / ARROWS', 'Reach for the next hold'], ['F', 'Dyno to a far hold (costs chalk)'], ['C', 'Chalk up. It also scares birds off'], ['R', 'Roll (on the mat ledge)'], ['ROUTE MAP', 'Tap a pitch on the left to rope up']] },
    ] },
  { id: 'bui', short: 'BUI', y: 30, x: 6, num: 1,
    boards: [
      { dx: -12.5, dy: 5.4, w: 12.6, h: 7.9, kicker: 'PITCH 1 · OCT 2021 TO APR 2023', title: 'BUI', title2: 'JUNIOR DATA ENGINEER', accent: '#ff6a2b',
        lines: [['BUILT', 'Scalable data architectures on Microsoft Azure'], ['TEAMWORK', 'ETL pipelines for business intelligence with cross-functional teams'], ['START', 'Data engineer assistant intern, Jun to Oct 2021']] },
    ],
    gear: ['Microsoft Azure', 'ETL pipelines', 'Data architecture'] },
  { id: 'fw', short: 'FINAL WORDS', y: 62, x: -6, num: 2,
    boards: [
      { dx: 12.5, dy: 5.4, w: 12.6, h: 7.9, kicker: 'PITCH 2 · APR 2023 TO JUL 2024', title: 'FINAL WORDS', title2: 'DRAUGHTSMAN (FREELANCE)', accent: '#ff6a2b',
        lines: [['DELIVERED', 'Accurate technical plans and drawings'], ['TOOLS', 'Autodesk Fusion 360 and Inventor']] },
      { dx: 12.5, dy: 14.0, w: 12.6, h: 7.9, kicker: 'ALONGSIDE THE CLIMB', title: 'EDUCATION', sub: 'LEARNING THE FUNDAMENTALS', accent: '#2ec4b6',
        lines: [['GOLDSMITHS', 'BSc Computer Science (not completed), 2022 to 2023'], ['RESULTS', 'Computational Mathematics 87%, Intro to Programming 70%'], ['N5 DRAUGHTING', 'Academic Institute of Excellence, 2023 to 2024']] },
    ],
    gear: ['Technical drawing', 'Fusion 360', 'Inventor'] },
  { id: 'salt', short: 'SALTTECH', y: 90, x: 6, num: 3,
    boards: [
      { dx: -12.5, dy: 5.4, w: 12.6, h: 7.9, kicker: 'PITCH 3 · JUL 2024 TO MAR 2025', title: 'SALTTECH SA', title2: 'JUNIOR DATABASE ADMIN', accent: '#ff6a2b',
        lines: [['RAN', 'Server administration'], ['WORKED', 'SQL database work day to day']] },
    ],
    gear: ['SQL', 'Server administration'] },
  { id: 'yireh', short: 'YIREH', y: 118, x: -6, num: 4,
    boards: [
      { dx: 12.5, dy: 5.4, w: 12.6, h: 7.9, kicker: 'PITCH 4 · MAR TO DEC 2025', title: 'YIREH', title2: 'WEB DEVELOPER (CONTRACT)', accent: '#ff6a2b',
        lines: [['BUILT', 'Responsive WordPress sites for startups'], ['FULL STACK', 'Front end and back end'], ['CLIENTS', 'Turned requirements into finished sites']] },
    ],
    gear: ['WordPress', 'Front end and back end'] },
  { id: 'vellvii', short: 'VELLVII', y: 150, x: 6, num: 5,
    boards: [
      { dx: -12.5, dy: 5.4, w: 12.6, h: 7.9, kicker: 'PITCH 5 · JAN 2026 TO PRESENT', title: 'VELLVII', title2: 'CTO AND COO (FOUNDING TEAM)', accent: '#ff6a2b',
        lines: [['RUNS', 'All tech, e-commerce and ops as the brand launches in the U.S.'], ['BUILT', 'Shopify store, customer journey and integrations'], ['SHIPPED', 'Website on React, Vercel and Cloudflare CDN'], ['OWNS', 'SEO, analytics, Google Ads and AI automation']] },
      { dx: -12.5, dy: 14.0, w: 12.6, h: 7.9, kicker: 'INSIDE THE SETUP', title: 'THE FULL RACK', sub: 'PREMIUM WELLNESS BRAND · REMOTE', accent: '#2ec4b6',
        lines: [['EMAIL', 'SPF, DKIM, DMARC and BIMI on a 5 user Google Workspace'], ['SHIPPING', 'Six global regions, plus U.S. fulfilment on ShipBob'], ['AI', 'Automation for operations and social monitoring']] },
    ],
    gear: ['Shopify', 'React on Vercel', 'Cloudflare and DNS', 'Email authentication', 'SEO and Google Ads', 'AI automation', 'Shipping and fulfilment'] },
  { id: 'mat', short: 'THE MAT', y: 184, x: -6, num: 6, mat: true,
    boards: [
      { dx: 12.5, dy: 5.4, w: 12.6, h: 7.9, kicker: 'OFF THE CLOCK', title: 'ROCKS, MATS, AIRPORTS', accent: '#2ec4b6',
        lines: [['CLIMBING', 'Reading routes and trusting the gear'], ['BJJ', 'Rolling on the mat. Tap early, tap often.'], ['TRAVEL', 'Next stop Tbilisi, January 2027'], ['LANGUAGES', 'Afrikaans native, English fluent, German, French and Dutch beginner']] },
    ] },
  { id: 'summit', short: 'SUMMIT', y: 204, x: 0, num: 7, summit: true,
    boards: [
      { dx: -8.0, dy: 5.4, w: 12.6, h: 7.9, kicker: 'SUMMIT · TBILISI, GEORGIA FROM JANUARY 2027', title: 'NEXT PITCH', title2: 'LET US TALK', accent: '#ff6a2b',
        lines: [['STATUS', 'Looking for flexible part-time remote work'], ['HOURS', 'Remote, on UK and European hours'], ['STYLE', 'Clear written English, quick to learn, reliable on deadlines']] },
      { dx: 8.0, dy: 5.4, w: 12.6, h: 7.9, kicker: 'GET IN TOUCH', title: 'CONTACT', accent: '#2ec4b6',
        lines: [['EMAIL', 'dylanjonker723@gmail.com'], ['WHATSAPP', '+27 76 135 6576'], ['LINKEDIN', 'linkedin.com/in/dylan-jonker']] },
    ] },
];

export const SUMMARY = 'Technical operator with 5 years across data engineering, database administration, web development and e-commerce. Currently runs the technology and operations of a premium wellness brand, from the Shopify store and website to email, analytics and ad infrastructure. Clear written English, quick to learn new tools and reliable on deadlines. Looking for flexible part-time remote work.';

export const CV = [
  { h: 'CTO and COO (founding team), Vellvii', d: 'Jan 2026 to present · Remote', b: ['Run all technology, e-commerce and operations as the brand launches into the U.S. market', 'Architected and manage the Shopify store, customer journey and third-party integrations', 'Built and maintain the company website (React on Vercel with Cloudflare CDN)', 'Set up DNS and email authentication (SPF, DKIM, DMARC, BIMI) on Cloudflare for a 5-user Google Workspace', 'Own SEO, analytics and Google Ads, and built AI-powered automation for operations and social media monitoring', 'Coordinated shipping across six global regions and onboarded U.S. fulfilment with ShipBob'] },
  { h: 'Web Developer (contract), Yireh Business Solutions', d: 'Mar 2025 to Dec 2025', b: ['Designed and built responsive WordPress websites for startups, front end and back end', 'Worked directly with clients to turn their requirements into finished sites'] },
  { h: 'Junior Database Administrator, SaltTech SA', d: 'Jul 2024 to Mar 2025', b: ['Server administration and SQL database work'] },
  { h: 'Draughtsman (freelance), Final Words', d: 'Apr 2023 to Jul 2024', b: ['Produced accurate technical plans and drawings'] },
  { h: 'Junior Data Engineer, BUI', d: 'Oct 2021 to Apr 2023 (data engineer assistant intern, Jun to Oct 2021)', b: ['Designed and implemented scalable data architectures on Microsoft Azure', 'Worked with cross-functional teams on ETL pipelines for business intelligence'] },
];
export const SKILLS = [
  ['E-commerce', 'Shopify, customer journey, fulfilment and international shipping'],
  ['Web', 'React, WordPress, Vercel, Cloudflare, DNS and email authentication'],
  ['Marketing and analytics', 'SEO, Google Ads, analytics, Google Workspace'],
  ['Data', 'SQL, ETL, Microsoft Azure, server administration'],
  ['Automation and AI', 'AI-powered workflows for operations and monitoring'],
  ['Other', 'Technical drawing (Autodesk Fusion 360 and Inventor)'],
];
export const EDU = [
  'Computer Science (BSc, not completed), Goldsmiths, University of London · 2022 to 2023. Computational Mathematics 87%, Introduction to Programming 70%',
  'N5 Draughting, Academic Institute of Excellence · May 2023 to Feb 2024',
  'Languages: Afrikaans (native), English (fluent), German, French and Dutch (beginner)',
];
