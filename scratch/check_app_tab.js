import fs from 'fs';
const content = fs.readFileSync('src/components/teacher/ApplicationTab.vue', 'utf-8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('getCurrentRound') || l.includes('selectedRoundId') || l.includes('teacherGetApplications')) {
    console.log(`ApplicationTab.vue L${idx+1}: ${l.trim()}`);
  }
});

