const fs = require('fs');
let rest = fs.readFileSync('src/components/teacher/ResultsTab.vue', 'utf8');
const norm = rest.replace(/\r\n/g, '\n');
const target = `            <span class="px-2 py-0.5 rounded-full text-[11px] bg-blue-100 text-blue-900 border border-blue-200 font-bold">
              대입 학년도 종료일(2027.02.28)까지 상시 조회·인쇄 지원
            </span>
          </h4>
          <p class="text-xs text-emerald-900 m-0 mt-1 leading-relaxed">
            현재 2027 학교장 추천 선발은 모두 종료되었으나, 이번 대입 학년도가 종료될 때까지 교사가 우리 반 학생들의 추천 결과를 상시 확인하고 결과 보고서를 출력할 수 있도록 확정 원장 데이터를 제공합니다.
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <span class="text-xs font-bold text-emerald-800 bg-white/80 px-3 py-1.5 rounded-lg border border-emerald-200">
          2027 대입 원장 연동
        </span>
      </div>`;

const rep = `          </h4>
        </div>
      </div>`;

if (norm.includes(target)) {
  const updated = norm.replace(target, rep);
  fs.writeFileSync('src/components/teacher/ResultsTab.vue', updated.replace(/\n/g, '\r\n'), 'utf8');
  console.log('ResultsTab.vue banner cleaned');
} else {
  console.log('target not found in ResultsTab.vue');
}

