import fs from 'fs';

const lines = fs.readFileSync('C:/Users/user/.gemini/antigravity/brain/3e8fd8f6-1214-436a-9b6b-9deec8f72cce/.system_generated/logs/transcript.jsonl', 'utf8').trim().split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('CE') && line.includes('DR')) {
    const obj = JSON.parse(line);
    console.log(`[Step ${obj.step_index}] ${obj.source}:`, (obj.content || '').slice(0, 300).replace(/\n/g, ' '));
  }
}

