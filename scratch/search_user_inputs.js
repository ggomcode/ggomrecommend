import fs from 'fs';

const lines = fs.readFileSync('C:/Users/user/.gemini/antigravity/brain/3e8fd8f6-1214-436a-9b6b-9deec8f72cce/.system_generated/logs/transcript_full.jsonl', 'utf8').trim().split('\n');
console.log('Total full lines:', lines.length);

const matchedSteps = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('2027수시') || line.includes('CE:DR') || line.includes('1hk') || line.includes('매칭')) {
    const obj = JSON.parse(line);
    if (obj.type === 'USER_INPUT' || obj.source === 'USER_EXPLICIT') {
      matchedSteps.push({
        step: obj.step_index,
        content: obj.content
      });
    }
  }
}

console.log('User inputs matching:', matchedSteps.length);
matchedSteps.forEach(m => {
  console.log(`=== Step ${m.step} ===`);
  console.log(m.content.slice(0, 300));
});

