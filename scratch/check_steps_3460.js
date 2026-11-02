import fs from 'fs';

const lines = fs.readFileSync('C:/Users/user/.gemini/antigravity/brain/3e8fd8f6-1214-436a-9b6b-9deec8f72cce/.system_generated/logs/transcript.jsonl', 'utf8').trim().split('\n');

for (let i = 0; i < lines.length; i++) {
  const obj = JSON.parse(lines[i]);
  if (obj.step_index >= 3460 && obj.step_index <= 3475) {
    console.log(`[Step ${obj.step_index}] ${obj.source} ${obj.type}:`);
    if (obj.content) console.log(obj.content.slice(0, 500));
    if (obj.thinking) console.log('Thinking:', obj.thinking.slice(0, 200));
  }
}

