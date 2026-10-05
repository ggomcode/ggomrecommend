/**
 * HomeroomRollbookView - 원적학급(담임용) 주간 출석부 렌더링 뷰
 * 담임교사가 자신의 학급 학생 전체의 주간 출결(조례~종례)을 한눈에 조회·수정합니다.
 *
 * 지원 기능:
 * - 조례('조'), 1~7교시, 종례('종') 세션 지원
 * - 수요일 5~6교시 창체('창') 시간 자동 음영 처리
 * - 이동수업 교과(1~4, 7교시)는 학생별 배정 교실 시간표 연동
 * - 출결 상태(병, 생, 체, 경, 전, 미, 기) 50% 진한 음영 표시
 * - 출결 순환: [빈값] -> 병 -> 인(생리) -> 인(체험) -> 인(경조사) -> 인(전염병) -> 미 -> 기 -> [빈값]
 * - 하단 일별 출석/결석 집계 행 제공
 */

import { RollbookModel, AcademicConfig, escapeHtml } from '../models.js';

export const HomeroomRollbookView = {

  render(allStudents, holidaysMap, selectedBans, weekObj, options = {}) {
    if (!selectedBans || selectedBans.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">🏫</div>
          <div class="empty-title">선택된 학급이 없습니다.</div>
          <div class="empty-desc">상단 학급 필터에서 조회할 학급을 선택해주세요.</div>
        </div>
      `;
    }

    if (!weekObj || !weekObj.days || weekObj.days.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <div class="empty-title">선택된 주차 정보가 없습니다.</div>
        </div>
      `;
    }

    return selectedBans.map(ban => {
      const students = (allStudents || []).filter(s => s.ban === ban);
      students.sort((a, b) => a.num - b.num);

      return this._renderClassSheet(ban, students, holidaysMap, weekObj, options);
    }).join('\n');
  },

  _renderClassSheet(ban, students, holidaysMap, weekObj, options = {}) {
    const days = weekObj.days; // [{ dateStr, dayOfWeek, label }, ...]

    // Build day/session columns header
    // Each day has: 조례('조'), 1..maxPeriod, 종례('종')
    let colGroupHtml = `
      <col class="col-seq" style="width: 30px;">
      <col class="col-num" style="width: 32px;">
      <col class="col-id" style="width: 44px;">
      <col class="col-name" style="width: 48px;">
      <col class="col-remark" style="width: 38px;">
    `;

    let headerTopRow = `
      <th rowspan="2" class="col-seq">No</th>
      <th rowspan="2" class="col-num">번호</th>
      <th rowspan="2" class="col-id">학번</th>
      <th rowspan="2" class="col-name">성명</th>
      <th rowspan="2" class="col-remark">비고</th>
    `;

    let headerBottomRow = '';

    const daySpecs = days.map(d => {
      const maxP = AcademicConfig.periodsPerDay[d.dayOfWeek] || 6;
      const periods = ['조'];
      for (let p = 1; p <= maxP; p++) periods.push(p);
      periods.push('종');

      return {
        day: d.dayOfWeek,
        dateStr: d.dateStr,
        label: d.displayDate || d.label || (d.dateStr ? d.dateStr.slice(5) : ''),
        periods
      };
    });

    daySpecs.forEach((spec, dIdx) => {
      const isLastDay = (dIdx === daySpecs.length - 1);
      const dayEndClass = isLastDay ? 'col-day-end' : '';

      headerTopRow += `
        <th colspan="${spec.periods.length}" class="col-day-header ${dayEndClass}">
          ${spec.label} (${spec.day})
        </th>
      `;

      spec.periods.forEach((p, pIdx) => {
        const isDayEnd = (pIdx === spec.periods.length - 1);
        const pClass = isDayEnd ? 'col-day-end col-period-header' : 'col-period-header';
        headerBottomRow += `<th class="${pClass}">${p}</th>`;
        colGroupHtml += `<col class="col-period" style="width: 26px;">`;
      });
    });

    // Student rows
    const showSpecialStudents = !!options.showSpecialStudents;
    const overridesMap = options.overridesMap || null;
    const registryMap = options.registryMap || null;

    const rowsHtml = students.map((st, idx) => {
      const isDarkRow = (st.pRemark.includes('자퇴') || st.pRemark.includes('위탁') || st.pRemark.includes('전출'));
      const darkClass = isDarkRow ? 'row-dark-50' : '';

      let cellsHtml = '';

      daySpecs.forEach((spec, dIdx) => {
        const dayInfo = days[dIdx];
        const isHoliday = holidaysMap && holidaysMap.fullDayEvents && holidaysMap.fullDayEvents[dayInfo.dateStr];

        spec.periods.forEach((p, pIdx) => {
          let cellText = '';
          let isTint = false;
          let isOverridden = false;
          let overrideCat = '';
          let origStatusText = '';
          let currentStatusText = '';
          let rawStatusValue = '';
          let isDocSubmitted = '';

          const periodKey = p; // '조', 1..7, '종'
          const overrideKey = `${dayInfo.dateStr}_${periodKey}_${st.studentId}`;

          let status = null;

          if (isHoliday) {
            cellText = '-';
          } else if (p === '조' || p === '종') {
            const origStatus = RollbookModel.getStudentPeriodStatus(st, spec.day, p, dayInfo.dateStr, showSpecialStudents);
            origStatusText = origStatus.text || '';

            status = RollbookModel.getEffectiveStudentPeriodStatus(st, spec.day, p, dayInfo.dateStr, showSpecialStudents, overridesMap, registryMap);
            cellText = status.text;
            rawStatusValue = status.rawStatus || cellText;
            isTint = status.isShaded && !isDarkRow;
            isOverridden = status.isOverridden;
            overrideCat = status.category || '';
            if (status.docSubmitted) isDocSubmitted = 'doc-submitted';
          } else if (spec.day === '수' && (p === 5 || p === 6)) {
            const origStatus = RollbookModel.getStudentPeriodStatus(st, spec.day, p, dayInfo.dateStr, showSpecialStudents);
            status = RollbookModel.getEffectiveStudentPeriodStatus(st, spec.day, p, dayInfo.dateStr, showSpecialStudents, overridesMap, registryMap);

            if (origStatus.is50Dark || !origStatus.isPresent || (status && status.isRegistryPriority)) {
              origStatusText = origStatus.text || '';
              cellText = status.text;
              rawStatusValue = status.rawStatus || cellText;
              isTint = status.isShaded && !isDarkRow;
              isOverridden = status.isOverridden;
              overrideCat = status.category || '';
              if (status.docSubmitted) isDocSubmitted = 'doc-submitted';
            } else if (overridesMap && overridesMap.has(overrideKey)) {
              const rec = overridesMap.get(overrideKey);
              rawStatusValue = (rec.status || '').trim();
              if (rawStatusValue === '출석') rawStatusValue = '';
              cellText = RollbookModel.getStatusDisplayText(rawStatusValue);
              isTint = !!rawStatusValue && !isDarkRow;
              isOverridden = true;
              overrideCat = RollbookModel.getCategoryFromRawStatus(rawStatusValue);
              if (rec.docSubmitted) isDocSubmitted = 'doc-submitted';
            } else {
              origStatusText = '창';
              cellText = '창';
              rawStatusValue = '창';
              isTint = true;
            }
          } else {
            const pNum = (typeof p === 'number') ? p : 0;
            const origStatus = RollbookModel.getStudentPeriodStatus(st, spec.day, pNum, dayInfo.dateStr, showSpecialStudents);
            origStatusText = origStatus.text || '';

            status = RollbookModel.getEffectiveStudentPeriodStatus(st, spec.day, pNum, dayInfo.dateStr, showSpecialStudents, overridesMap, registryMap);
            cellText = status.text;
            rawStatusValue = status.rawStatus || cellText;
            isTint = status.isShaded && !isDarkRow;
            isOverridden = status.isOverridden;
            overrideCat = status.category || '';
            if (status.docSubmitted) isDocSubmitted = 'doc-submitted';
          }

          const tintClass = isTint ? 'cell-tint-10' : '';
          const isDayEnd = (pIdx === spec.periods.length - 1);
          const dayEndClass = isDayEnd ? 'col-day-end' : '';
          const overriddenClass = isOverridden ? `cell-overridden status-${overrideCat}` : '';

          let cellBadge = '';
          let cellTitle = '좌클릭: 출결 순환 | Shift+클릭: 역순환 | 우클릭: 직접 선택/전교시 일괄';
          let conflictClass = '';
          let registryClass = '';

          if (status && status.hasConflict) {
            conflictClass = 'has-conflict';
            cellBadge = `<span class="cell-conflict-badge" title="[대장 우선 적용] 공식: ${escapeHtml(status.fullStatus || cellText)} | 현장 수업기록: ${escapeHtml(status.conflictOverrideStatus)} (상충)">⚡</span>`;
            cellTitle = `[공식 결석계 우선 적용: ${status.fullStatus || cellText}] 현장 기록(${status.conflictOverrideStatus})과 상충 | 클릭 시 변경 확인`;
          } else if (status && status.isRegistryPriority) {
            registryClass = 'is-registry-approved';
            cellBadge = `<span class="cell-registry-badge" title="[대장 결석계 승인] ${escapeHtml(status.fullStatus || cellText)}">📑</span>`;
            cellTitle = `[공식 결석계 승인: ${status.fullStatus || cellText}] 증빙서류 확인 완료 | 클릭 시 변경 확인`;
          }

          cellsHtml += `
            <td class="period-cell interactive-cell ${tintClass} ${dayEndClass} ${overriddenClass} ${isDocSubmitted} ${registryClass} ${conflictClass}"
                data-action="attendance-cell"
                data-student-id="${escapeHtml(st.studentId)}"
                data-date="${escapeHtml(dayInfo.dateStr)}"
                data-period="${p}"
                data-ban="${escapeHtml(st.ban)}"
                data-num="${escapeHtml(st.num)}"
                data-name="${escapeHtml(st.name)}"
                data-room="${st.ban}반"
                data-original-status="${escapeHtml(origStatusText)}"
                data-current-status="${escapeHtml(rawStatusValue)}"
                data-is-registry="${status && status.isRegistryPriority ? '1' : '0'}"
                data-has-conflict="${status && status.hasConflict ? '1' : '0'}"
                data-conflict-override="${escapeHtml((status && status.conflictOverrideStatus) || '')}"
                title="${cellTitle}">
              ${escapeHtml(cellText) || '<span class="check-box-sm"></span>'}${cellBadge}
            </td>`;
        });
      });

      const displayRemark = RollbookModel.getEffectiveDisplayRemark(st.pRemark, st.studentId, days, overridesMap, showSpecialStudents, st, registryMap);
      const baseRemark = RollbookModel.getDisplayRemark(st.pRemark, days, showSpecialStudents);

      return `
        <tr class="homeroom-student-row ${darkClass}">
          <td class="col-seq">${idx + 1}</td>
          <td class="col-num">${st.num}</td>
          <td class="col-id">${escapeHtml(st.studentId)}</td>
          <td class="col-name">${escapeHtml(st.name)}</td>
          <td class="col-remark" data-student-id="${escapeHtml(st.studentId)}" data-base-remark="${escapeHtml(baseRemark)}">${escapeHtml(displayRemark)}</td>
          ${cellsHtml}
        </tr>
      `;
    }).join('');

    // Daily summary tfoot rows
    const presenceRowHtml = daySpecs.map((spec, dIdx) => {
      const stats = this._calcDailyStats(students, spec.day, days[dIdx].dateStr, overridesMap, showSpecialStudents, registryMap);
      return `<td colspan="${spec.periods.length}" class="col-day-end stat-presence-cell" data-date="${days[dIdx].dateStr}">
        <span class="stat-main-num">${stats.present}명</span> <span class="stat-sub">/ ${students.length}명</span>
      </td>`;
    }).join('');

    const absenceRowHtml = daySpecs.map((spec, dIdx) => {
      const stats = this._calcDailyStats(students, spec.day, days[dIdx].dateStr, overridesMap, showSpecialStudents, registryMap);
      const text = `결석 ${stats.absence} · 지각 ${stats.late} · 조퇴 ${stats.earlyLeave} · 결과 ${stats.classSkipped}`;
      const hasAny = (stats.absence + stats.late + stats.earlyLeave + stats.classSkipped) > 0;
      return `<td colspan="${spec.periods.length}" class="col-day-end stat-absence-cell ${hasAny ? 'has-absence' : ''}" data-date="${days[dIdx].dateStr}">
        ${text}
      </td>`;
    }).join('');

    const weekTitle = (weekObj && weekObj.title) || (weekObj && weekObj.weekNum ? `2학기 ${weekObj.weekNum}주차` : (weekObj && weekObj.label) || '');
    const rangeText = (weekObj && weekObj.rangeStr) || (days && days.length > 0 ? `${days[0].displayDate || days[0].label} ~ ${days[days.length - 1].displayDate || days[days.length - 1].label}` : '');
    const periodDisplay = rangeText ? `${weekTitle} (${rangeText})` : weekTitle;

    return `
      <div class="rollbook-sheet homeroom-sheet" data-ban="${ban}">
        <div class="sheet-header">
          <div class="sheet-title-group">
            <h2 class="sheet-title">제 3 학년 ${ban} 반 주간 출석부</h2>
            <div class="sheet-subtitle">
              <span class="sheet-badge homeroom-badge">담임용</span>
              <span class="sheet-period-info">${periodDisplay}</span>
            </div>
          </div>
          <div class="sheet-meta">
            <span class="meta-item">재적: <strong>${students.length}명</strong></span>
            <span class="meta-item print-timestamp" data-timestamp=""></span>
          </div>
        </div>

        <div class="table-container">
          <table class="rollbook-table homeroom-table">
            <colgroup>
              ${colGroupHtml}
            </colgroup>
            <thead>
              <tr class="header-row-top">
                ${headerTopRow}
              </tr>
              <tr class="header-row-bottom">
                ${headerBottomRow}
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
            <tfoot>
              <tr class="stat-row stat-presence-row">
                <td colspan="5" class="stat-label">출석 인원</td>
                ${presenceRowHtml}
              </tr>
              <tr class="stat-row stat-absence-row">
                <td colspan="5" class="stat-label">결석·지각·조퇴·결과</td>
                ${absenceRowHtml}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;
  },

  /**
   * Calculate daily attendance statistics for a homeroom class on a specific date
   */
  _calcDailyStats(students, dayOfWeek, dateStr, overridesMap, showSpecialStudents, registryMap = null) {
    let present = 0;
    let absence = 0;
    let late = 0;
    let earlyLeave = 0;
    let classSkipped = 0;

    (students || []).forEach(st => {
      const analysis = RollbookModel.analyzeDailyAttendance(st, dayOfWeek, dateStr, overridesMap, showSpecialStudents, registryMap);
      if (analysis.isNormal) {
        present++;
      } else {
        if (analysis.isAbsence) absence++;
        if (analysis.isLate) late++;
        if (analysis.isEarlyLeave) earlyLeave++;
        if (analysis.isClassSkipped) classSkipped++;
      }
    });

    return { present, absence, late, earlyLeave, classSkipped };
  }
};
