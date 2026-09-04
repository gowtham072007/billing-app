/**
 * Smart Product Image Auto-Detector & Preset Library
 * Maps English & Tamil grocery/supermarket names to high-resolution, fast-loading images
 */

export interface ImagePreset {
  keywords: string[];
  tamilKeywords: string[];
  imageUrl: string;
  category: string;
  alt: string;
}

export const PRODUCT_IMAGE_PRESETS: ImagePreset[] = [
  // 1. Rice & Grains
  {
    keywords: ['rice', 'ponni', 'basmati', 'sona', 'raw rice', 'boiled rice', 'idli rice', 'paddy', 'grain'],
    tamilKeywords: ['அரிசி', 'பொன்னி', 'பாசுமதி', 'பச்சரிசி', 'புழுங்கல்', 'இட்லி அரிசி'],
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
    category: 'Grocery',
    alt: 'Rice Grains',
  },
  // 2. Atta / Wheat Flour / Maida / Rava
  {
    keywords: ['atta', 'flour', 'wheat', 'maida', 'rava', 'sooji', 'aashirvaad', 'chakki'],
    tamilKeywords: ['ஆட்டா', 'கோதுமை', 'மாவு', 'மைதா', 'ரவை'],
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
    category: 'Grocery',
    alt: 'Wheat Flour / Atta',
  },
  // 3. Sugar / Jaggery
  {
    keywords: ['sugar', 'white sugar', 'cane sugar', 'jaggery', 'brown sugar', 'country sugar', 'nattu sakkarai'],
    tamilKeywords: ['சர்க்கரை', 'சீனி', 'வெல்லம்', 'நாட்டு சர்க்கரை', 'கருப்பட்டி'],
    imageUrl: 'https://images.unsplash.com/photo-1610450949065-2f928e08d1f8?auto=format&fit=crop&w=400&q=80',
    category: 'Grocery',
    alt: 'Sugar / Jaggery',
  },
  // 4. Cooking Oil / Ghee
  {
    keywords: ['oil', 'sunflower oil', 'coconut oil', 'groundnut oil', 'gingelly oil', 'sesame oil', 'gold winner', 'fortune', 'refined oil', 'mustard oil'],
    tamilKeywords: ['எண்ணெய்', 'தேங்காய் எண்ணெய்', 'நல்லெண்ணெய்', 'கடலை எண்ணெய்', 'சூரியகாந்தி'],
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
    category: 'Grocery',
    alt: 'Cooking Oil',
  },
  {
    keywords: ['ghee', 'pure ghee', 'butter', 'cow ghee', 'amul ghee', 'grb'],
    tamilKeywords: ['நெய்', 'வெண்ணெய்', 'பசு நெய்'],
    imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=400&q=80',
    category: 'Dairy',
    alt: 'Ghee & Butter',
  },
  // 5. Dals & Pulses
  {
    keywords: ['dal', 'toor dal', 'moong dal', 'urad dal', 'chana dal', 'gram', 'pulses', 'lentil', 'rajma', 'peas', 'pappu'],
    tamilKeywords: ['பருப்பு', 'துவரம் பருப்பு', 'பாசிப் பருப்பு', 'உளுந்து', 'கடலைப் பருப்பு', 'பயறு'],
    imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&q=80',
    category: 'Grocery',
    alt: 'Lentils / Dal',
  },
  // 6. Milk & Dairy
  {
    keywords: ['milk', 'aavin', 'arokya', 'curd', 'yogurt', 'paneer', 'dairy', 'amul'],
    tamilKeywords: ['பால்', 'தயிர்', 'பன்னீர்', 'ஆவின்', 'ஆரோக்கியா'],
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
    category: 'Dairy',
    alt: 'Fresh Milk & Dairy',
  },
  // 7. Tea & Coffee
  {
    keywords: ['tea', 'chai', 'tata tea', 'red label', '3 roses', 'green tea', 'tea powder'],
    tamilKeywords: ['தேநீர்', 'டீ', 'டீ தூள்'],
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
    category: 'Beverages',
    alt: 'Tea Powder',
  },
  {
    keywords: ['coffee', 'bru', 'nescafe', 'filter coffee', 'coffee powder', 'cothas'],
    tamilKeywords: ['காபி', 'காபி தூள்'],
    imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=400&q=80',
    category: 'Beverages',
    alt: 'Coffee Powder',
  },
  // 8. Spices & Masala
  {
    keywords: ['turmeric', 'manjal', 'chilli powder', 'coriander powder', 'sambar powder', 'rasam powder', 'garam masala', 'cardamom', 'clove', 'cinnamon', 'mustard', 'pepper', 'jeera', 'cumin', 'fenugreek', 'curry powder'],
    tamilKeywords: ['மஞ்சள்', 'மஞ்சள் தூள்', 'மிளகாய் தூள்', 'மல்லி தூள்', 'சாம்பார் பொடி', 'கடுகு', 'சீரகம்', 'மிளகு', 'ஏலக்காய்', 'கிராம்பு', 'பட்டை'],
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80',
    category: 'Spices',
    alt: 'Spices & Masala',
  },
  {
    keywords: ['salt', 'tata salt', 'rock salt', 'crystal salt', 'iodized salt'],
    tamilKeywords: ['உப்பு', 'கல் உப்பு', 'தூள் உப்பு'],
    imageUrl: 'https://images.unsplash.com/photo-1626197031507-c17099753214?auto=format&fit=crop&w=400&q=80',
    category: 'Grocery',
    alt: 'Table Salt',
  },
  // 9. Biscuits & Snacks
  {
    keywords: ['biscuit', 'cookie', 'parle', 'marie', 'good day', 'bourbon', 'oreo', '50-50', 'monaco', 'rusk'],
    tamilKeywords: ['பிஸ்கட்', 'குக்கீஸ்', 'ரஸ்க்'],
    imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80',
    category: 'Snacks',
    alt: 'Biscuits & Cookies',
  },
  {
    keywords: ['chips', 'lays', 'kurkure', 'bingo', 'mixture', 'murukku', 'namkeen', 'snacks'],
    tamilKeywords: ['சிப்ஸ்', 'மிக்ஸர்', 'முறுக்கு', 'கார வகைகள்'],
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80',
    category: 'Snacks',
    alt: 'Chips & Snacks',
  },
  {
    keywords: ['noodles', 'maggi', 'yippee', 'pasta', 'vermicelli', 'semiya'],
    tamilKeywords: ['நூடுல்ஸ்', 'மேகி', 'சேமியா', 'பாஸ்தா'],
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
    category: 'Snacks',
    alt: 'Instant Noodles & Pasta',
  },
  // 10. Vegetables
  {
    keywords: ['tomato', 'thakkali'],
    tamilKeywords: ['தக்காளி'],
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=400&q=80',
    category: 'Vegetables',
    alt: 'Fresh Tomatoes',
  },
  {
    keywords: ['onion', 'vengayam', 'shallot', 'sambar onion'],
    tamilKeywords: ['வெங்காயம்', 'சின்ன வெங்காயம்', 'பெரிய வெங்காயம்'],
    imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=400&q=80',
    category: 'Vegetables',
    alt: 'Fresh Onions',
  },
  {
    keywords: ['potato', 'urulai', 'aloo'],
    tamilKeywords: ['உருளைக்கிழங்கு', 'உருளை'],
    imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&q=80',
    category: 'Vegetables',
    alt: 'Fresh Potatoes',
  },
  {
    keywords: ['vegetable', 'carrot', 'cabbage', 'beans', 'brinjal', 'ladies finger', 'chilli', 'green chilli', 'ginger', 'garlic', 'curry leaves', 'coriander leaves', 'lemon'],
    tamilKeywords: ['காய்கறிகள்', 'கேரட்', 'பீன்ஸ்', 'கத்திரிக்காய்', 'வெண்டைக்காய்', 'பச்சை மிளகாய்', 'இஞ்சி', 'பூண்டு', 'கொத்தமல்லி', 'எலுமிச்சை'],
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
    category: 'Vegetables',
    alt: 'Fresh Vegetables',
  },
  // 11. Fruits
  {
    keywords: ['apple', 'banana', 'orange', 'mango', 'grapes', 'pomegranate', 'fruit', 'papaya', 'guava', 'watermelon'],
    tamilKeywords: ['பழங்கள்', 'ஆப்பிள்', 'வாழைப்பழம்', 'ஆரஞ்சு', 'மாம்பழம்', 'திராட்சை', 'மாதுளை'],
    imageUrl: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=400&q=80',
    category: 'Fruits',
    alt: 'Fresh Fruits',
  },
  // 12. Soaps & Personal Care
  {
    keywords: ['soap', 'lifebuoy', 'dettol', 'lux', 'dove', 'hamam', 'cinthol', 'santoor', 'mysore sandal', 'body wash', 'bath soap'],
    tamilKeywords: ['சோப்', 'குளியல் சோப்', 'ஹமாம்', 'டெட்டால்'],
    imageUrl: 'https://images.unsplash.com/photo-1607006314644-88481ff24e2c?auto=format&fit=crop&w=400&q=80',
    category: 'Personal Care',
    alt: 'Bath Soap',
  },
  {
    keywords: ['shampoo', 'clinic plus', 'head & shoulders', 'sunsilk', 'dove shampoo', 'hair oil', 'vatika', 'parachute'],
    tamilKeywords: ['ஷாம்பு', 'தலைமுடி எண்ணெய்', 'தேங்காய் எண்ணெய்'],
    imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=400&q=80',
    category: 'Personal Care',
    alt: 'Shampoo & Hair Care',
  },
  {
    keywords: ['toothpaste', 'colgate', 'pepsodent', 'close up', 'sensodyne', 'dabur red', 'toothbrush'],
    tamilKeywords: ['டூத்பேஸ்ட்', 'பற்பசை', 'பிரஷ்'],
    imageUrl: 'https://images.unsplash.com/photo-1559591937-e109d3b384ff?auto=format&fit=crop&w=400&q=80',
    category: 'Personal Care',
    alt: 'Toothpaste & Dental',
  },
  // 13. Household & Detergents
  {
    keywords: ['detergent', 'surf excel', 'ariel', 'tide', 'rin', 'wheel', 'washing powder', 'liquid detergent', 'comfort', 'fabric conditioner', 'dishwash', 'vim', 'pril', 'harpic', 'lizol'],
    tamilKeywords: ['சலவை தூள்', 'துணி சோப்', 'பாத்திரம் கழுவும் லிக்விட்', 'டிடர்ஜென்ட்'],
    imageUrl: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=400&q=80',
    category: 'Household',
    alt: 'Cleaning & Detergents',
  },
  // 14. Eggs & Bakery
  {
    keywords: ['egg', 'eggs', 'nattu kozhi', 'white egg', 'farm egg'],
    tamilKeywords: ['முட்டை', 'நாட்டு முட்டை', 'கோழி முட்டை'],
    imageUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=400&q=80',
    category: 'Grocery',
    alt: 'Fresh Eggs',
  },
  {
    keywords: ['bread', 'bun', 'cake', 'bakery', 'pav', 'toast', 'rusk'],
    tamilKeywords: ['பிரெட்', 'பன்', 'கேக்'],
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
    category: 'Bakery',
    alt: 'Fresh Bread & Bakery',
  },
  // 15. Cold Drinks & Juices
  {
    keywords: ['juice', 'coke', 'pepsi', 'sprite', 'thums up', 'maaza', 'frooti', 'drink', 'beverage', 'bovonto', 'mineral water', 'water bottle'],
    tamilKeywords: ['ஜூஸ்', 'கூல் டிரிங்க்ஸ்', 'பானங்கள்', 'தண்ணீர் பாட்டில்'],
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
    category: 'Beverages',
    alt: 'Beverages & Soft Drinks',
  },
];

export const CATEGORY_FALLBACKS: Record<string, string> = {
  grocery: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
  dairy: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
  beverages: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
  snacks: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80',
  spices: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80',
  vegetables: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
  fruits: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=400&q=80',
  'personal care': 'https://images.unsplash.com/photo-1607006314644-88481ff24e2c?auto=format&fit=crop&w=400&q=80',
  household: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=400&q=80',
  bakery: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
};

export const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80';

/**
 * Automatically sets and returns the best matching product image URL
 * given an English name, Tamil name, or category.
 */
export function getAutoProductImage(
  name?: string,
  nameTamil?: string,
  category?: string
): string {
  const query = `${name || ''} ${nameTamil || ''}`.toLowerCase();
  if (!query.trim() && !category) {
    return DEFAULT_PRODUCT_IMAGE;
  }

  // 1. Check direct keyword match in presets
  for (const preset of PRODUCT_IMAGE_PRESETS) {
    for (const kw of preset.keywords) {
      if (query.includes(kw.toLowerCase())) {
        return preset.imageUrl;
      }
    }
    for (const tkw of preset.tamilKeywords) {
      if (query.includes(tkw)) {
        return preset.imageUrl;
      }
    }
  }

  // 2. Check category fallback
  if (category) {
    const catLower = category.toLowerCase().trim();
    if (CATEGORY_FALLBACKS[catLower]) {
      return CATEGORY_FALLBACKS[catLower];
    }
    for (const [k, url] of Object.entries(CATEGORY_FALLBACKS)) {
      if (catLower.includes(k) || k.includes(catLower)) {
        return url;
      }
    }
  }

  return DEFAULT_PRODUCT_IMAGE;
}

/**
 * Get multiple suggested images for the user to easily pick from
 */
export function getSuggestedImages(
  name?: string,
  nameTamil?: string,
  category?: string
): ImagePreset[] {
  const query = `${name || ''} ${nameTamil || ''}`.toLowerCase();
  const matched: ImagePreset[] = [];

  for (const preset of PRODUCT_IMAGE_PRESETS) {
    const hasKeyword =
      preset.keywords.some(kw => query.includes(kw.toLowerCase())) ||
      preset.tamilKeywords.some(tkw => query.includes(tkw));

    if (hasKeyword) {
      matched.push(preset);
    }
  }

  // If we don't have enough matches, add category related presets
  if (matched.length < 4) {
    const catLower = (category || 'Grocery').toLowerCase();
    for (const preset of PRODUCT_IMAGE_PRESETS) {
      if (!matched.includes(preset) && preset.category.toLowerCase().includes(catLower)) {
        matched.push(preset);
      }
    }
  }

  // If still less than 4, append general presets
  if (matched.length < 4) {
    for (const preset of PRODUCT_IMAGE_PRESETS.slice(0, 4)) {
      if (!matched.includes(preset)) {
        matched.push(preset);
      }
    }
  }

  return matched.slice(0, 6);
}
