/**
 * MovingRollbookView - 이동수업 출석부 렌더링 뷰
 * 선택교과 교실별 학생 명단을 교시별 열(Column) 형태로 렌더링합니다.
 *
 * 지원 기능:
 * - 교실별 학생 명단 학번순 정렬 (최대 35명)
 * - 재적, 출석, 결석 인원 실시간 계산
 * - 행사/휴일 및 단축수업(취소) 상태 표시
 * - 교과명 및 담당교사 정보 표시
 * - 학생별 비고란(특이사항) 표시
 * - 출결 상태(병, 생, 체, 경, 전, 미, 기) 50% 진한 음영 표시
 * - 출결 순환: [빈값] -> 병 -> 인(생리) -> 인(체험) -> 인(경조사) -> 인(전염병) -> 미 -> 기 -> [빈값]
 */

import { RollbookModel, AcademicConfig, escapeHtml } from '../models.js';

export const MovingRollbookView = {

  render(allStudents, holidaysMap, selectedRooms, targetDays, options = {}) {
    if (!selectedRooms || selectedRooms.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">🏃</div>
          <div class="empty-title">선택된 교실이 없습니다.</div>
          <div class="empty-desc">상단 교실 필터에서 조회할 교실을 선택해주세요.</div>
        </div>
      `;
    }

    if (!targetDays || targetDays.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <div class="empty-title">선택된 날짜가 없습니다.</div>
        </div>
      `;
    }

    return selectedRooms.map(roomName => {
      return this._renderRoomSheet(roomName, allStudents, holidaysMap, targetDays, options);
    }).join('\n');
  },

  _renderRoomSheet(roomName, allStudents, holidaysMap, targetDays, options = {}) {
    // Collect all period columns for this room across all target days
    const columnsHtml = targetDays.map(dayInfo => {
      const dayOfWeek = dayInfo.dayOfWeek;
      const periods = AcademicConfig.getPeriodsForDay(dayOfWeek);

      return periods.map(periodNum => {
        const roster = RollbookModel.getRoomPeriodRoster(
          allStudents,
          roomName,
          dayInfo.dateStr,
          dayOfWeek,
          periodNum,
          holidaysMap,
          options.overridesMap || null
        );

        return this._renderPeriodColumn(roster, dayInfo, options);
      }).join('\n');
    }).join('\n');

    // Calculate total expected attendance across rendered columns
    let totalAssigned = 0;
    let sampleSubj = '';
    let sampleTeacher = '';

    for (const dayInfo of targetDays) {
      const periods = AcademicConfig.getPeriodsForDay(dayInfo.dayOfWeek);
      for (const p of periods) {
        const roster = RollbookModel.getRoomPeriodRoster(
          allStudents,
          roomName,
          dayInfo.dateStr,
          dayInfo.dayOfWeek,
          p,
          holidaysMap,
          options.overridesMap || null
        );
        if (roster.status === 'normal' && roster.students.length > 0) {
          totalAssigned = roster.students.length;
          sampleSubj = roster.subject;
          sampleTeacher = roster.teacher;
          break;
        }
      }
      if (totalAssigned > 0) break;
    }

    const dateRangeStr = targetDays.length === 1
      ? `${targetDays[0].label} (${targetDays[0].dayOfWeek})`
      : `${targetDays[0].label} ~ ${targetDays[targetDays.length - 1].label}`;

    return `
      <div class="rollbook-sheet" data-room="${escapeHtml(roomName)}">
        <div class="sheet-header">
          <div class="sheet-title-group">
            <h2 class="sheet-title">${escapeHtml(roomName)} 이동수업 출석부</h2>
            <div class="sheet-subtitle">
              <span class="sheet-badge">${escapeHtml(sampleSubj || '-')}</span>
              <span class="sheet-teacher">담당: <strong>${escapeHtml(sampleTeacher || '-')}</strong></span>
              <span class="sheet-period-info">${dateRangeStr}</span>
            </div>
          </div>
          <div class="sheet-meta">
            <span class="meta-item">재적: <strong>${totalAssigned}명</strong></span>
            <span class="meta-item print-timestamp" data-timestamp=""></span>
          </div>
        </div>

        <div class="columns-container">
          ${columnsHtml}
        </div>
      </div>
    `;
  },

  _renderPeriodColumn(roster, dayInfo, options = {}) {
    const showSpecialStudents = !!options.showSpecialStudents;

    // Period Column Header
    const periodLabel = `${roster.periodNum}교시`;
    const dayLabel = `${dayInfo.label}(${dayInfo.dayOfWeek})`;
    const isSwapBadge = roster.isSwap ? `<span class="badge-swap" title="${roster.scheduleKey} 수업">${roster.scheduleKey}</span>` : '';

    if (roster.status === 'holiday') {
      return `
        <div class="period-column column-holiday" data-date="${escapeHtml(dayInfo.dateStr)}" data-period="${roster.periodNum}" data-room="${escapeHtml(roster.room || '')}">
          <div class="period-col-header">
            <div class="col-header-day">${dayLabel} ${periodLabel}</div>
            <div class="col-header-subj">${escapeHtml(roster.title)}</div>
          </div>
          <div class="column-special-message">
            <div class="special-icon">🏖️</div>
            <div class="special-title">${escapeHtml(roster.title)}</div>
            <div class="special-desc">전일 행사 / 공휴일</div>
          </div>
        </div>
      `;
    }

    if (roster.status === 'cancelled') {
      return `
        <div class="period-column column-cancelled" data-date="${escapeHtml(dayInfo.dateStr)}" data-period="${roster.periodNum}" data-room="${escapeHtml(roster.room || '')}">
          <div class="period-col-header">
            <div class="col-header-day">${dayLabel} ${periodLabel}</div>
            <div class="col-header-subj">${escapeHtml(roster.title)}</div>
          </div>
          <div class="column-special-message">
            <div class="special-icon">⏱️</div>
            <div class="special-title">${escapeHtml(roster.title)}</div>
            <div class="special-desc">단축 수업으로 진행되지 않음</div>
          </div>
        </div>
      `;
    }

    if (roster.status === 'activity') {
      return `
        <div class="period-column column-activity" data-date="${escapeHtml(dayInfo.dateStr)}" data-period="${roster.periodNum}" data-room="${escapeHtml(roster.room || '')}">
          <div class="period-col-header">
            <div class="col-header-day">${dayLabel} ${periodLabel}</div>
            <div class="col-header-subj">${escapeHtml(roster.title)}</div>
          </div>
          <div class="column-special-message">
            <div class="special-icon">📌</div>
            <div class="special-title">${escapeHtml(roster.title)}</div>
            <div class="special-desc">특별 활동 시간</div>
          </div>
        </div>
      `;
    }

    // Render student table rows (up to 35 rows)
    const students = roster.students || [];
    const overridesMap = options.overridesMap || null;
    const registryMap = options.registryMap || null;

    const rowsHtml = students.map((st, idx) => {
      const origStatus = RollbookModel.getStudentPeriodStatus(st, dayInfo.dayOfWeek, roster.periodNum, dayInfo.dateStr, showSpecialStudents);
      const status = RollbookModel.getEffectiveStudentPeriodStatus(st, dayInfo.dayOfWeek, roster.periodNum, dayInfo.dateStr, showSpecialStudents, overridesMap, registryMap);

      const is50Dark = status.is50Dark ? 'row-dark-50' : '';
      const is10Tint = (!status.is50Dark && status.isShaded) ? 'cell-tint-10' : '';
      const isOverriddenClass = status.isOverridden ? `cell-overridden status-${status.category}` : '';
      const isDocSubmitted = status.docSubmitted ? 'doc-submitted' : '';
      const baseRemark = RollbookModel.getDisplayRemark(st.pRemark, dayInfo.dateStr, showSpecialStudents);
      const periodStatusRemark = RollbookModel.getStatusRemarkText(status.rawStatus);
      const displayRemark = (baseRemark && periodStatusRemark) ? `${baseRemark}, ${periodStatusRemark}` : (periodStatusRemark || baseRemark);

      const currentStatusText = status.text || '';
      const rawStatusValue = status.rawStatus || currentStatusText;
      const originalStatusText = origStatus.text || '';

      const cellBadge = status.hasConflict
        ? `<span class="cell-conflict-badge" title="상충: 현장기록(${escapeHtml(status.conflictOverrideStatus || '')})">⚡</span>`
        : (status.isRegistryPriority ? `<span class="cell-registry-badge" title="대장 공식 결석계 승인">📑</span>` : '');

      const cellTitle = status.hasConflict
        ? `[공식 결석계 우선 적용: ${status.fullStatus || currentStatusText}] 현장 기록(${status.conflictOverrideStatus})과 상충 | 클릭 시 변경 확인`
        : (status.isRegistryPriority
            ? `[공식 결석계 승인: ${status.fullStatus || currentStatusText}] 증빙서류 확인 완료 | 클릭 시 변경 확인`
            : '좌클릭: 출결 순환 | Shift+클릭: 역순환 | 우클릭: 직접 선택/전교시 일괄');

      return `
        <tr class="student-row ${is50Dark}">
          <td class="col-seq">${idx + 1}</td>
          <td class="col-id">${escapeHtml(st.studentId)}</td>
          <td class="col-name">${escapeHtml(st.name)}</td>
          <td class="col-check interactive-cell ${is10Tint} ${isOverriddenClass} ${isDocSubmitted} ${status.isRegistryPriority ? 'is-registry-approved' : ''} ${status.hasConflict ? 'has-conflict' : ''}"
              data-action="attendance-cell"
              data-student-id="${escapeHtml(st.studentId)}"
              data-date="${escapeHtml(dayInfo.dateStr)}"
              data-period="${roster.periodNum}"
              data-ban="${escapeHtml(st.ban)}"
              data-num="${escapeHtml(st.num)}"
              data-name="${escapeHtml(st.name)}"
              data-room="${escapeHtml(roster.room || '')}"
              data-original-status="${escapeHtml(originalStatusText)}"
              data-current-status="${escapeHtml(rawStatusValue)}"
              data-is-registry="${status.isRegistryPriority ? '1' : '0'}"
              data-has-conflict="${status.hasConflict ? '1' : '0'}"
              data-conflict-override="${escapeHtml(status.conflictOverrideStatus || '')}"
              title="${cellTitle}">
            ${escapeHtml(status.text) || '<span class="check-box"></span>'}${cellBadge}
          </td>
          <td class="col-remark" data-student-id="${escapeHtml(st.studentId)}" data-base-remark="${escapeHtml(baseRemark)}">${escapeHtml(displayRemark)}</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="period-column" data-date="${escapeHtml(dayInfo.dateStr)}" data-period="${roster.periodNum}" data-room="${escapeHtml(roster.room || '')}">
        <div class="period-col-header">
          <div class="col-header-day">${dayLabel} ${periodLabel} ${isSwapBadge}</div>
          <div class="col-header-subj">${escapeHtml(roster.subject || '-')}</div>
          <div class="col-header-teacher">${escapeHtml(roster.teacher || '-')}</div>
        </div>

        <div class="period-col-stats">
          <div class="stat-badge stat-present">
            출석: <strong>${roster.expectedAttendance}</strong>/${roster.totalAssigned}
          </div>
          ${this._renderAbsenceBadges(roster.stats)}
        </div>

        <div class="table-container">
          <table class="rollbook-table">
            <thead>
              <tr>
                <th class="col-seq">No</th>
                <th class="col-id">학번</th>
                <th class="col-name">성명</th>
                <th class="col-check">출결</th>
                <th class="col-remark">비고</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  _renderAbsenceBadges(stats) {
    if (!stats) return '';
    const badges = [];

    if (stats.jilbyeong > 0) badges.push(`<span class="badge-mini badge-ill">병:${stats.jilbyeong}</span>`);
    if (stats.saenggyeol > 0) badges.push(`<span class="badge-mini badge-rec">생:${stats.saenggyeol}</span>`);
    if (stats.cheheom > 0) badges.push(`<span class="badge-mini badge-rec">체:${stats.cheheom}</span>`);
    if (stats.gyeongjosa > 0) badges.push(`<span class="badge-mini badge-rec">경:${stats.gyeongjosa}</span>`);
    if (stats.jeonyeom > 0) badges.push(`<span class="badge-mini badge-rec">전:${stats.jeonyeom}</span>`);
    if (stats.miinjeong > 0) badges.push(`<span class="badge-mini badge-unrec">미:${stats.miinjeong}</span>`);
    if (stats.gita > 0) badges.push(`<span class="badge-mini badge-etc">기:${stats.gita}</span>`);

    return badges.join(' ');
  }
};
