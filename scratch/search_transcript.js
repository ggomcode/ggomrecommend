import fs from 'fs';

const lines = fs.readFileSync('C:/Users/user/.gemini/antigravity/brain/3e8fd8f6-1214-436a-9b6b-9deec8f72cce/.system_generated/logs/transcript.jsonl', 'utf8').trim().split('\n');
console.log('Total transcript lines:', lines.length);

const results = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('CE:DR') || line.includes('매칭') || line.includes('1hk') || line.includes('2027수시') || line.includes('전문대')) {
    const obj = JSON.parse(line);
    results.push({
      step: obj.step_index,
      source: obj.source,
      type: obj.type,
      text: (obj.content || '').slice(0, 150).replace(/\n/g, ' ')
    });
  }
}
console.log('Matches found:', results.length);
results.slice(-20).forEach(r => console.log(`[Step ${r.step}] ${r.source}: ${r.text}`));

