import sys
import os
import pandas as pd

sys.path.append('D:/Cloud/git/ggomcode/ggomrate')
from matcher import match_kcue_with_crawl

# 1. 현재 구글 시트에서 최신 1400건 로드
import requests
import io

sheet_id = '1hkgi-WKdbh_cIK1Ctzv3BBxqKLe50DCKAT8cmT9wbWg'
url = f'https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet=2027%EC%88%98%EC%8B%9C'
res = requests.get(url)
kcue_df = pd.read_csv(io.StringIO(res.text))
print("Current sheet shape:", kcue_df.shape)

# CE열부터 끝까지 기존 빈 컬럼 제거 (매칭 새로 붙이기 위해)
ce_idx = None
for i, col in enumerate(kcue_df.columns):
    if '대학구분' in str(col):
        ce_idx = i
        break
if ce_idx is not None:
    kcue_df = kcue_df.iloc[:, :ce_idx]
    print(f"Trimmed to before CE (cols: {kcue_df.shape[1]})")

# 2. 크롤링 데이터 및 3개년 비교 데이터 로드
crawl_file = 'D:/Cloud/git/ggomcode/ggomrate/2027_수시경쟁률_전수조사.xlsx'
comp_file = 'D:/Cloud/git/ggomcode/ggomrate/3개년_수시경쟁률_비교분석.xlsx'

crawl_df = pd.read_excel(crawl_file)
comp_3y_df = pd.read_excel(comp_file, sheet_name=0)

print(f"Crawl DF: {crawl_df.shape}, Comp DF: {comp_3y_df.shape}")

# 3. 매칭 실행!
result_df = match_kcue_with_crawl(kcue_df, crawl_df, comp_3y_df=comp_3y_df)
print("Matching complete! Result shape:", result_df.shape)

# 4. 저장
out_xlsx = 'd:/Cloud/git/ggomcode/ggomrecommend/scratch/2027수시_전체_1400건_매칭완료.xlsx'
result_df.to_excel(out_xlsx, index=False)
print(f"Saved: {out_xlsx}")

# CE:DR 40개 컬럼만 따로 추출하여 TSV(붙여넣기용)로 저장
ce_start = None
for i, col in enumerate(result_df.columns):
    if '대학구분' in str(col):
        ce_start = i
        break

if ce_start is not None:
    ce_dr_df = result_df.iloc[:, ce_start:ce_start+40]
    tsv_out = 'd:/Cloud/git/ggomcode/ggomrecommend/scratch/2027수시_CE_DR_클립보드붙여넣기.txt'
    ce_dr_df.to_csv(tsv_out, sep='\t', index=False, header=False, encoding='utf-8-sig')
    print(f"Saved CE:DR TSV (shape: {ce_dr_df.shape}): {tsv_out}")

