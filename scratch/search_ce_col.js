import fs from 'fs';

const lines = fs.readFileSync('C:/Users/user/.gemini/antigravity/brain/3e8fd8f6-1214-436a-9b6b-9deec8f72cce/.system_generated/logs/transcript_full.jsonl', 'utf8').trim().split('\n');

const matched = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('CE') && (line.includes('열') || line.includes('컬럼') || line.includes('매칭'))) {
    const obj = JSON.parse(line);
    matched.push({
      step: obj.step_index,
      source: obj.source,
      type: obj.type,
      text: (obj.content || obj.thinking || '').slice(0, 300).replace(/\n/g, ' ')
    });
  }
}

console.log('Matches found:', matched.length);
matched.forEach(m => console.log(`[Step ${m.step}] ${m.source}: ${m.text}`));

