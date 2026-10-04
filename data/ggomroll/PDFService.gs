/**
 * PDF 생성 전용 서비스 모듈
 */
const PDFService = {
  
  generate: function(ss, sheet, fileName, sigIds) {
    try {
      // 1. 서명 이미지 삽입
      if (sigIds) {
        try {
          this.insertSignatures(sheet, sigIds);
          SpreadsheetApp.flush(); // 이미지 삽입 후 레이아웃 동기화
          Utilities.sleep(1000); // 구글 서버가 이미지를 처리할 시간을 줍니다.
        } catch(e) {
          throw new Error("서명삽입단계 에러: " + e.message);
        }
      }
      
      // 2. PDF Blob 생성 (파일명 포함)
      let blob;
      try {
        blob = this.createBlob(ss, sheet, fileName);
      } catch(e) {
        throw new Error("Blob생성단계 에러: " + e.message);
      }
      
      // 3. 서명 이미지 삭제 (인쇄 시트 초기화)
      if (sigIds) {
        this.removeSignatures(sheet);
      }

            // 4. 지정된 폴더에 저장 (FOLDER_ID는 Code.gs 전역변수 참조, 부재 시 루트 폴더)
      let file, previewUrl;
      try {
        let folder;
        if (typeof FOLDER_ID !== "undefined" && FOLDER_ID) {
          try {
            folder = DriveApp.getFolderById(FOLDER_ID);
          } catch(fErr) {
            console.warn("지정된 FOLDER_ID 접근 실패로 루트 폴더에 저장합니다: " + fErr.message);
            folder = DriveApp.getRootFolder();
          }
        } else {
          folder = DriveApp.getRootFolder();
        }
        file = folder.createFile(blob);
      } catch(e) {
        throw new Error("파일저장(create) 에러: " + e.message);
      }
      
      const fileId = file.getId();
      previewUrl = "https://docs.google.com/file/d/" + fileId + "/preview";
      
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch(e) {
        console.warn("권한설정(sharing) 경고(무시됨): " + e.message);
        // 정책상 외부 공유가 막혀있어도, 파일 자체는 만들어졌으니 진행
      }
      
      return previewUrl;
    
    } catch (e) {
      console.error("PDF 생성 에러: " + e.toString());
      throw new Error(e.message);
    }
  },

  createBlob: function(ss, sheet, pdfName) {
    // [보안/권한] DriveApp을 한 번 실행하여 스크립트에 드라이브 권한이 확실히 부여되도록 합니다.
    DriveApp.getRootFolder(); 
    
    const ssId = ss.getId();
    const sheetId = sheet ? sheet.getSheetId() : null;
    
    // PDF 레이아웃 파라미터를 최소화하여 시도합니다. (500 에러 해결 시도)
    let url = "https://docs.google.com/spreadsheets/d/" + ssId + "/export?" +
                "format=pdf" +
                (sheetId !== null ? "&gid=" + sheetId : "") +
                "&size=A4&portrait=true&fitw=true" +
                "&top_margin=0.79&bottom_margin=0.70&left_margin=0.79&right_margin=0.79" +
                "&gridlines=false&printtitle=false&pagenumbers=false&attachment=false";
    
    if (sheetId !== null) {
      url += "&range=B6:Z55";
    }
      
    const params = { 
      method: "GET", 
      headers: { "Authorization": "Bearer " + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true
    };
    
    let response;
    let retries = 3;
    while (retries > 0) {
      response = UrlFetchApp.fetch(url, params);
      const code = response.getResponseCode();
      if (code === 200) break;
      
      const errorText = response.getContentText().substring(0, 200);
      console.warn(`PDF 내보내기 시도 실패 (Error: ${code}). 내용: ${errorText}. 남은 시도: ${retries - 1}`);
      
      Utilities.sleep(2000); 
      retries--;
    }
    
    if (!response || response.getResponseCode() !== 200) {
      const respCode = response ? response.getResponseCode() : "Unknown";
      // 500 에러가 계속될 경우, 다른 방식(DriveApp 직접 출력)으로 우회 시도
      try {
        console.warn("UrlFetch 방식 실패로 DriveApp.getAs 방식으로 우회합니다.");
        
        // [우회 방식 보강] 다른 시트들을 모두 숨겨서 '인쇄' 시트만 나오게 합니다.
        const allSheets = ss.getSheets();
        const sheetName = sheet.getName();
        
        allSheets.forEach(s => {
          if (s.getName() !== sheetName) s.hideSheet();
        });
        
        const blob = ss.getAs('application/pdf').setName(pdfName + ".pdf");
        
        // 숨겼던 시트들을 다시 보이게 복구합니다.
        allSheets.forEach(s => s.showSheet());
        
        return blob;
      } catch (e) {
        throw new Error(`PDF 생성 최종 실패 (API Error: ${respCode}, DriveApp Error: ${e.message})`);
      }
    }
    
    return response.getBlob().setName(pdfName + ".pdf");
  },

  insertSignatures: function(sheet, sigIds) {
    // 서명 위치 지정 (행 삭제로 인한 -1 시프트): 학생 Y22, 학부모 Y24
    
    if (sigIds.studentSigId) {
      try {
        const studentBlob = DriveApp.getFileById(sigIds.studentSigId).getBlob();
        // 학생 성함(V22) 옆 Y22 (25열, 22행) 에 서명 삽입
        sheet.insertImage(studentBlob, 25, 22).setHeight(30).setWidth(60); 
      } catch(e) {
        console.warn("학생 서명 이미지를 드라이브에서 불러올 수 없습니다: " + e.message);
      }
    }
    
    if (sigIds.parentSigId) {
      try {
        const parentBlob = DriveApp.getFileById(sigIds.parentSigId).getBlob();
        // 학부모 성함(V24) 옆 Y24 (25열, 24행) 에 서명 삽입
        sheet.insertImage(parentBlob, 25, 24).setHeight(30).setWidth(60);
      } catch(e) {
        console.warn("학부모 서명 이미지를 드라이브에서 불러올 수 없습니다: " + e.message);
      }
    }
  },

  removeSignatures: function(sheet) {
    const images = sheet.getImages();
    images.forEach(img => img.remove());
  }
};
