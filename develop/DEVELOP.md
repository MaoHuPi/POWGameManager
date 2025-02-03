# DEVELOP

## 2024/02/11 23:04 [MaoHuPi]

1. 將此後台從`Prison-of-Word`移出
2. 增加很多東西（不再此詳列）
3. 上傳至github
4. 新增`develop`資料夾
5. 新增`develop/DEVELOP.md`
6. 新增`develop/TODO.md`

## 2024/02/12 09:23 [MaoHuPi]

1. 完成`Popup.prompt()`
2. 將`FloatChartNode`的`center`改成`anchor`，並以`relativeAnchorPos`來控制其與實際繪製位置的相對關係

## 2024/02/12 23:14 [MaoHuPi]

1. `script/main.js`監聽按鈕事件
2. `Popup`支援按鈕決定

## 2024/02/13 16:48 [MaoHuPi]

1. 完成`Popup.search()`
2. 將`Popup.setEvent()`改為「主內容前後皆呼叫」，除了在其顯示時阻擋事件傳遞，也避免`Popup`開啟時的點擊事件重複作用於開啟後的元素上
3. `DialogNode`對話內容輸入功能
4. `DialogNode`背景圖片欄位
5. 將`tab`加入`FlowChartNode`的可拖曳範圍
6. 支援使用`shift`鍵加滾輪來進行橫向捲動
7. `CircumstanceNode`雛形
8. `FlowChart`節點連接
9. `FlowChart`與簡單物件之轉換
10. 刪除`Dialog`、`Circumstance`、`Case`等沒有用到的類別

## 2024/02/13 22:55 [MaoHuPi]

1. 側邊欄「圖卡背包」

## 2024/02/14 14:08 [MaoHuPi]

1. 將`NDArray`移至`script/basic.js`
2. 新增`script/flowChart.js`來存放`FlowChart`與其相關的類別宣告
3. 將`FlowChart`的拖曳中節點正確繪製在`tempCvs.nodeDragging`上
4. `tempCvs.nodeDragging`在流程圖圖框外進行半透明繪製
5. 修正`FlowChart`的匯入/出錯誤
6. 被連接節點的刪除
7. flowChart場景 > 空缺提示
8. `sheet`的`goto`改成點擊前往，不像原先那樣鎖定3秒
9. sheet場景 > 空缺提示

## 2024/02/14 18:44 [MaoHuPi]

1. 專案的新增、載入、下載、設定按鈕
2. 專案載入、下載功能（引入了`package/JSZip/jszip.js`、`script/fileIO.js`）

## 2024/02/14 23:37 [MaoHuPi]

1. 將空缺提示的重整機制提前執行，以便進行正確的畫面更新
2. 更改專案載入、下載函數之宣告位置，使其緊接於`project`後方
3. 專案載入、下載的圖像部分之修正，目前已能正確存讀圖片至`zip`
4. `Popup.search()`支援`imageData`類型
5. 對話節點背景圖片的新增、改名、刪除按鈕和功能
6. flowChart場景 > 圖片總覽
7. 錯字修正「總{攬=>覽}」

## 2024/02/15 12:47 [MaoHuPi]

1. 詞卡屬性編輯功能（位置拖曳與特性勾選）
2. 更改流程圖節點各新增按鈕之文字
3. 因為`and`、`or`邏輯皆可使用連接節點來實現，因此將單個判斷節點改為單一條件
3. 流程圖新增`AssignmentNode`操作節點（未實作）

## 2024/02/15 18:25 [MaoHuPi]

1. 改善`Popup.search()`選項操作流程與增加按鈕控制方式
2. 判斷節點內容選擇功能

## 2024/02/15 20:59 [MaoHuPi]

1. 判斷節點內容選擇 自訂變數部分（使用「取前三碼來當變數type的方式檢查型別」）
2. 操作節點內容選擇功能
3. `pos`型別改為4個元素（x、y、w、h）

## 2024/02/15 22:28 [MaoHuPi]

1. `projectSettings()`更名為`editProjectInit()`
2. project init 編輯與儲存功能
3. 判斷、操作節點內容選擇部分加上原始類型名稱前墜
4. 詞卡重新命名時一並更改init與所有cases中，判斷、操作節點內容的變數名稱

## 2024/02/15 22:42 [MaoHuPi]

1. 修正操作節點無法刪除之問題
2. 詞卡刪除時一並更改init與所有cases中，判斷、操作節點內容的變數名稱使其變成「str」類型

## 2024/02/17 22:54 [MaoHuPi]

1. `POWPlayer.js`專案載入
2. `POWPlayer.js`task基本處理

## 2024/02/18 10:35 [MaoHuPi]

1. 完成`POWPlayer.js`節點執行

## 2024/02/18 15:51 [MaoHuPi]

1. 新增`defaultCase`按鈕與切換功能
2. 使在`init`、`defaultCase`間切換時重新載入正確的`flowChart`
3. `POWPlayer.js`v1.0.0，已可正常調用來使用遊戲核心功能
4. 刪除測試用`project`
5. 新增`pos`類型的`goto`操作
5. 新增`num`類型的`%=`操作

## 2024/02/18 16:12 [MaoHuPi]

1. 修正刪除詞卡時的「找不到`oldName`」錯誤
2. 新增icon
3. 更改標題樣式
4. 新增 專案載入、專案儲存、側邊欄切換、`init`、`defaultCase`、新專案 的快捷鍵

## 2024/03/30 21:33 [MaoHuPi]

1. 在劇情總表上顯示各網格的各節點個數
2. 修正POWPlayer position goto的向量乘法方向錯誤

## 2024/03/30 22:23 [MaoHuPi]

1. 修正全域、區域變數選單中的重複項問題

## 2024/04/07 21:55 [MaoHuPi]

1. 新增FlowChart介面的框選框效果

## 2024/04/13 13:36 [MaoHuPi]

1. 新增節點拷貝/貼上系統
2. 選取機制改為框選即重選，按下Shift則做XOR
3. 新增全選功能
4. 支援多節點刪除

## 2024/04/13 14:12 [MaoHuPi]

1. 支援選取節點之「剪下」
2. 支援windows剪貼簿

## 2024/04/13 14:18 [MaoHuPi]

1. 修正popup的穿透複製/貼上問題

## 2024/04/20 08:11 [MaoHuPi]

1. 修正滑鼠滾輪縮放之捲動幅過大問題
2. 新增「[Ctrl] + [=]」、「[Ctrl] + [-]」、「[Ctrl] + [0]」等鍵盤縮放控制

## 2025/02/03 11:45 [MaoHuPi]

1. 修正backButton與FlowChart節點重疊時的點擊事件穿透問題

## 2025/02/03 14:03 [MaoHuPi]

1. POWPlayer新增getVariableValue之變數數值取用功能
2. 修正StartNode寬度問題
3. 修正DialogNode圖片和對話內容選擇欄位的穿透點擊問題
4. 修正FlowChartNode與其流程連接點的穿透拖曳問題
5. 修正FlowChartNode的放開拖曳對於其它節點的穿透點擊問題

## 2025/02/03 15:52 [MaoHuPi]

1. POWPlayer新增XMLHttpRequest未成功載入的reject機制