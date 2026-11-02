import apps from '../src/stat/data/applications.json' with { type: 'json' };

const recApps = apps.filter(a => a.isRecommendation === true || a.isRecommendation === 'true' || a.is_recommendation === true);

const classCounts = {};
for (let c = 1; c <= 11; c++) classCounts[c] = { students: new Set(), cases: 0 };
let gradCount = { students: new Set(), cases: 0 };

recApps.forEach(a => {
  const c = a.classNum ? Number(a.classNum) : null;
  const sKey = String(a.name || '') + '_' + String(a.classNum || '') + '_' + String(a.studentNum || '');
  if (a.isGraduate) {
    gradCount.students.add(sKey);
    gradCount.cases++;
  } else if (c && classCounts[c]) {
    classCounts[c].students.add(sKey);
    classCounts[c].cases++;
  }
});

console.log('Class Breakdown:');
let totalStds = 0;
let totalCases = 0;
for (let c = 1; c <= 11; c++) {
  console.log('Class ' + c + ': ' + classCounts[c].students.size + ' students (' + classCounts[c].cases + ' cases)');
  totalStds += classCounts[c].students.size;
  totalCases += classCounts[c].cases;
}
console.log('Graduates: ' + gradCount.students.size + ' students (' + gradCount.cases + ' cases)');
totalStds += gradCount.students.size;
totalCases += gradCount.cases;
console.log('TOTAL:', totalStds, 'students,', totalCases, 'cases');

