const db = require('../db/database');

async function backfill() {
  await db.init();
  const nameMap = {
    'Rice Ponni 5kg': 'பொன்னி அரிசி 5கிலோ',
    'Sugar 1kg': 'சர்க்கரை 1கிலோ',
    'Refined Cooking Oil 1L': 'சமையல் எண்ணெய் 1லி',
    'Aashirvaad Atta 5kg': 'ஆசீர்வாத் ஆட்டா 5கிலோ',
    'Premium Toor Dal 1kg': 'துவரம் பருப்பு 1கிலோ',
    'Filter Coffee Powder 200g': 'காபி தூள் 200கி',
    'Chakra Gold Tea 250g': 'சக்ரா கோல்ட் டீ 250கி',
    'Sandalwood Bath Soap 125g': 'சந்தன சோப்பு 125கி',
    'Tata Iodized Salt 1kg': 'டாடா உப்பு 1கிலோ',
    'Vim Dishwash Gel 500ml': 'விம் ஜெல் 500மி.லி',
    'sugar': 'சர்க்கரை',
    'Sugar': 'சர்க்கரை',
    'Ponni Boiled Rice 5kg': 'பொன்னி புழுங்கல் அரிசி 5கிலோ',
  };

  for (const [eng, tam] of Object.entries(nameMap)) {
    db.prepare('UPDATE bill_items SET product_name_tamil = ? WHERE product_name = ?').run(tam, eng);
    db.prepare('UPDATE products SET name_tamil = ? WHERE name = ?').run(tam, eng);
  }

  console.log('Successfully backfilled Tamil names for all bill items and products.');
}

backfill().catch(console.error);
