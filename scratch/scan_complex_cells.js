const fs = require('fs');
const rows = JSON.parse(fs.readFileSync('scratch/raw_rows.json', 'utf-8'));

console.log('--- Checking all cells for complex / numbered / sub-department patterns ---');

const results = [];

for (let r = 1; r < rows.length; r++) {
  const row = rows[r];
  const univ = String(row[2] || '').trim();
  for (let c = 3; c <= 9; c++) {
    const val = String(row[c] || '').trim();
    if (!val || val === 'Ⅹ' || val === 'X' || val === 'x' || val === '-') continue;

    // Pattern 1: Numbered list like 1) 2) or 1. 2.
    const hasNumList = /[1-9]\s*[\).]/i.test(val);
    
    // Pattern 2: [학과]숫자 or [학과]:숫자 or 숫자: [학과]
    const hasBracketNumber = /\[[^\]]+\]\s*:?\s*\d+/i.test(val) || /\d+\s*:\s*\[[^\]]+\]/i.test(val);

    // Pattern 3: Multiple colons
    const colonCount = (val.match(/:/g) || []).length;

    // Pattern 4: Multiple bracket blocks
    const bracketCount = (val.match(/\[[^\]]+\]/g) || []).length;

    if (hasNumList || (hasBracketNumber && bracketCount >= 3) || colonCount >= 4) {
      results.push({
        r: r + 1,
        c,
        univ,
        hasNumList,
        hasBracketNumber,
        colonCount,
        bracketCount,
        val
      });
    }
  }
}

console.log('Total complex cells found:', results.length);
results.forEach(res => {
  console.log(`[R${res.r} C${res.c}] ${res.univ} (numList:${res.hasNumList}, bracketNum:${res.hasBracketNumber}, colons:${res.colonCount}, brackets:${res.bracketCount})`);
  console.log(res.val);
  console.log('==================================================');
});
