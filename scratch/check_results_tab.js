import fs from 'fs';
const content = fs.readFileSync('src/components/teacher/ResultsTab.vue', 'utf-8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('getResults') || l.includes('teacherGetResults') || l.includes('selectedRound') || l.includes('round')) {
    console.log(`ResultsTab.vue L${idx+1}: ${l.trim()}`);
  }
});

