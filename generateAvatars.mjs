import fs from 'fs';

const categories = [
  { name: 'Diverse', style: 'avataaars' },
  { name: 'Cute', style: 'lorelei' },
  { name: 'Sketch', style: 'notionists' },
  { name: 'Doodles', style: 'openPeeps' },
  { name: 'Minimal', style: 'personas' },
  { name: '8-Bit', style: 'pixelArt' },
  { name: 'Blocky', style: 'miniavs' },
];

let catalogGroups = [];

for (const cat of categories) {
  let items = [];
  
  if (cat.style === 'avataaars') {
    // Generate Diverse (Avataaars) specifically for cultural markers
    const tops = [
      { val: 'turban', tags: ['turban', 'sikh', 'punjabi', 'indian', 'man', 'boy', 'sardar'] },
      { val: 'hijab', tags: ['hijab', 'muslim', 'arab', 'woman', 'girl', 'modest', 'kashmiri'] },
      { val: 'dreads', tags: ['dreads', 'locs', 'rasta', 'man', 'boy'] },
      { val: 'fro', tags: ['fro', 'afro', 'curly', 'black', 'man', 'woman'] },
      { val: 'bob', tags: ['bob', 'shorthair', 'woman', 'girl', 'modern'] },
      { val: 'bun', tags: ['bun', 'traditional', 'woman', 'girl', 'aunty', 'desi'] }
    ];
    const beards = [
      { val: '', tags: [] },
      { val: 'beardMajestic', tags: ['beard', 'fullbeard', 'majestic', 'man', 'uncle', 'sardar'] },
      { val: 'moustacheMagnum', tags: ['moustache', 'mustache', 'man', 'uncle', 'rajput', 'south indian'] }
    ];
    const skins = [
      { val: 'f1c27d', tags: ['fair', 'asian', 'east asian'] },
      { val: 'e0ac69', tags: ['medium', 'north indian', 'punjabi', 'gujarati'] },
      { val: 'c68642', tags: ['brown', 'indian', 'south asian', 'arab', 'marathi'] },
      { val: '8d5524', tags: ['dark', 'black', 'african', 'south indian'] }
    ];

    for (let skin of skins) {
      for (let top of tops) {
        let isWoman = top.tags.includes('woman') || top.tags.includes('hijab') || top.tags.includes('bob') || top.tags.includes('bun');
        let possibleBeards = isWoman ? [beards[0]] : beards;
        for (let beard of possibleBeards) {
          let url = `https://api.dicebear.com/7.x/avataaars/png?skinColor=${skin.val}&top=${top.val}`;
          if (beard.val) url += `&facialHair=${beard.val}`;
          let allTags = [...skin.tags, ...top.tags, ...beard.tags];
          items.push({
            id: `avataaars_${skin.val}_${top.val}_${beard.val}`,
            url,
            tags: [...new Set(allTags)]
          });
        }
      }
    }
  } else {
    // For other CC0 styles, we generate 50 random variations with nice background colors
    const seeds = ['Felix', 'Aneka', 'Jack', 'Lily', 'Chloe', 'Bandit', 'Sasha', 'Max', 'Bella', 'Milo', 'Harley', 'Oliver', 'Luna', 'Stella', 'Leo', 'Cleo', 'Jasper', 'Abby', 'Toby', 'Rahul', 'Priya', 'Amit', 'Neha', 'Raj', 'Simran', 'Vikram', 'Pooja', 'Arjun', 'Anjali', 'Karan', 'Kavita', 'Sanjay', 'Divya', 'Rohan', 'Sneha', 'Aryan', 'Kiara', 'Yash', 'Riya', 'Kabir', 'Aisha', 'Aarav', 'Tara', 'Dev', 'Meera', 'Rishi', 'Zara', 'Aman', 'Naina', 'Zayn'];
    
    // Some general tags to map generic vibes
    const genericTags = ['casual', 'modern', 'cool', 'friendly', 'happy'];
    
    for (let i = 0; i < seeds.length; i++) {
      items.push({
        id: `${cat.style}_${seeds[i]}`,
        url: `https://api.dicebear.com/7.x/${cat.style}/png?seed=${seeds[i]}&backgroundColor=F4F4F5`,
        tags: [cat.name.toLowerCase(), ...genericTags, seeds[i].toLowerCase()]
      });
    }
  }

  catalogGroups.push({
    category: cat.name,
    items: items
  });
}

const fileContent = `// AUTO-GENERATED CATALOG
export interface AvatarOption {
  id: string;
  url: string;
  tags: string[];
}

export interface AvatarCategory {
  category: string;
  items: AvatarOption[];
}

export const AVATAR_CATALOG: AvatarCategory[] = ${JSON.stringify(catalogGroups, null, 2)};
`;

fs.writeFileSync('src/lib/avatarCatalog.ts', fileContent);
console.log('Generated tabbed CC0 avatar catalog.');
