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