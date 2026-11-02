import fs from 'fs';

let content = fs.readFileSync('src/components/teacher/ApplicationTab.vue', 'utf8');

// 1. Tailwind class
content = content.replace('bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50', 'bg-linear-to-r from-emerald-50 via-teal-50 to-blue-50');

// 2. loadAll() fallback
const targetAppCheck = `    if (round) {
      applications.value = await teacherGetApplications(round.id)
    }`;

const newAppCheck = `    if (round) {
      applications.value = await teacherGetApplications(round.id)
    }

    if (!round || !applications.value || applications.value.length === 0) {
      const kcueApp = buildTeacherApplicationsFromKcue(null, auth.classNo, auth.grade)
      if (!students.value || students.value.length === 0) {
        students.value = kcueApp.students
      }
      applications.value = kcueApp.applications
      isUsingKcueArchive.value = true
    } else {
      isUsingKcueArchive.value = false
    }`;

if (content.includes(targetAppCheck.replace(/\n/g, '\r\n'))) {
  content = content.replace(targetAppCheck.replace(/\n/g, '\r\n'), newAppCheck.replace(/\n/g, '\r\n'));
} else if (content.includes(targetAppCheck)) {
  content = content.replace(targetAppCheck, newAppCheck);
}

// 3. catch error fallback
const targetCatch = `  } catch (e) {
    loadError.value = e.message || '데이터를 불러오는 중 오류가 발생했습니다.'
  } finally {`;

const newCatch = `  } catch (e) {
    console.warn('교사 추천 신청 조회 실패, 2027 원장 아카이브로 폴백:', e)
    const kcueApp = buildTeacherApplicationsFromKcue(null, auth.classNo, auth.grade)
    if (!students.value || students.value.length === 0) {
      students.value = kcueApp.students
    }
    applications.value = kcueApp.applications
    isUsingKcueArchive.value = true
  } finally {`;

if (content.includes(targetCatch.replace(/\n/g, '\r\n'))) {
  content = content.replace(targetCatch.replace(/\n/g, '\r\n'), newCatch.replace(/\n/g, '\r\n'));
} else if (content.includes(targetCatch)) {
  content = content.replace(targetCatch, newCatch);
}

fs.writeFileSync('src/components/teacher/ApplicationTab.vue', content, 'utf8');
console.log('Successfully updated ApplicationTab.vue!');

