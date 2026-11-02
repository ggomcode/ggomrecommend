import { getKcueRecommendationApps } from '../src/utils/recommendationKcueAdapter.js';

function testOverview() {
  const apps = getKcueRecommendationApps();
  console.log('Total recommendation apps:', apps.length);

  // Group by class (1 to 11)
  const classMap = {};
  for (let c = 1; c <= 11; c++) {
    classMap[c] = {
      grade: 3,
      class_no: c,
      teacher_name: c + '반 담임',
      submitted: 0,
      count: 0,
      cases: 0,
      confirmed: true,
      students: []
    };
  }

  const studentSetByClass = {};
  for (let c = 1; c <= 11; c++) studentSetByClass[c] = new Set();
  const allStudentsSet = new Set();

  apps.forEach(a => {
    const c = a.class_no;
    allStudentsSet.add(a.student_id);
    if (c && classMap[c]) {
      studentSetByClass[c].add(a.student_id);
      classMap[c].cases++;
      classMap[c].students.push(a);
    }
  });

  for (let c = 1; c <= 11; c++) {
    classMap[c].submitted = studentSetByClass[c].size;
    classMap[c].count = studentSetByClass[c].size;
  }

  const classes = Object.values(classMap);
  const totalApplicants = classes.reduce((s, c) => s + c.submitted, 0);
  const totalCases = classes.reduce((s, c) => s + c.cases, 0);

  console.log('Total students:', allStudentsSet.size);
  console.log('Total class submitted sum:', totalApplicants);
  console.log('Total cases:', totalCases);
}

testOverview();
