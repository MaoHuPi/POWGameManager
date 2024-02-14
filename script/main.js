/* global varible declare and initialize */
const cvs = document.querySelector('#viewCanvas'),
	ctx = cvs.getContext('2d');
[cvs.width, cvs.height] = [window.innerWidth, window.innerHeight];
const tempCvs = {}, tempCtx = {};
['gridTitle', 'gridValue', 'nounList', 'verbList'].forEach(key => {
	tempCvs[key] = document.createElement('canvas');
	tempCtx[key] = tempCvs[key].getContext('2d');
	[tempCvs[key].width, tempCvs[key].height] = [window.innerWidth, window.innerHeight];
});
Object.entries({ 'chart': 'gridValue', 'nodeDragging': 'gridTitle' }).forEach(KVPair => {
	tempCvs[KVPair[0]] = tempCvs[KVPair[1]];
	tempCtx[KVPair[0]] = tempCtx[KVPair[1]];
});
window.addEventListener('resize', () => {
	[cvs, ...Object.values(tempCvs)].forEach(cvs => {
		[cvs.width, cvs.height] = [window.innerWidth, window.innerHeight];
	})
});

let CW, CH;
let currentTime;
const sceneVar = {};
sceneVar.global = {};

const popup = new Popup(ctx);

const imageDict = {};
const data = {};
// data.partOfSpeech = {
// 	n: [],
// 	v: []
// };
// data.cases = [];
data.partOfSpeech = {
	n: ['我', '門', '電腦', '紙條', '寶箱', '電話', '鍵盤', '手錶', '蠟燭', '屎', '筆', '墨水', '衛生紙'],
	v: ['走向', '檢查', '打開']
};
data.cases = NDArray([data.partOfSpeech.v.length, data.partOfSpeech.n.length, data.partOfSpeech.n.length], ([i1, i2, i3]) => i2 != i3 ? FlowChart.exportEmpty() : undefined);

const color = {
	buttonHover: 'white',
	// buttonDefault: '#6585ad',
	buttonDefault: '#b5986a',
	buttonDisabled: 'gray',
	buttonBgc: '#00000055',
	wordBoxSAndO: '#ffc107',
	wordBoxV: '#ff5722',
	buttonWarning: '#03a9f4'
};

let currentScene = () => { };
let lastScene = currentScene;
let sceneChange = false;
currentScene = scene_sheet;

/* mouse event */
const mouse = {
	x: 0, y: 0,
	click: false, DBlClick: false,
	up: false, down: false,
	over: false, leave: false,
	deltaX: 0, deltaY: 0, deltaZ: 0, deltaZoom: 0,
	screenshot: false
};
let lastEventData = JSON.stringify(mouse);
function updateMousePosition(event) {
	[mouse.x, mouse.y] = [event.pageX, event.pageY];
}
cvs.addEventListener('mousemove', event => {
	updateMousePosition(event);
});
cvs.addEventListener('click', event => {
	updateMousePosition(event);
	mouse.click = true;
});
cvs.addEventListener('dblclick', event => {
	updateMousePosition(event);
	mouse.DBlClick = true;
});
cvs.addEventListener('contextmenu', event => {
	event.preventDefault();
	updateMousePosition(event);
	mouse.contextMenu = true;
});
cvs.addEventListener('mousedown', event => {
	updateMousePosition(event);
	mouse.down = true;
});
cvs.addEventListener('mouseup', event => {
	updateMousePosition(event);
	mouse.up = true;
});
cvs.addEventListener('wheel', event => {
	updateMousePosition(event);
	event.preventDefault();
	if (event.ctrlKey) {
		mouse.deltaZoom += event.deltaY;
	} else if (event.shiftKey) {
		mouse.deltaX += event.deltaY;
	} else {
		mouse.deltaX += event.deltaX;
		mouse.deltaY += event.deltaY;
		mouse.deltaZ += event.deltaZ;
	}
});
const keyboard = {};
window.addEventListener('keydown', event => {
	keyboard[event.key] = true;
	keyboard.Control = event.ctrlKey;
	keyboard.Shift = event.shiftKey;
	keyboard.Alt = event.altKey;
});
window.addEventListener('keyup', event => {
	keyboard[event.key] = false;
	keyboard.Control = event.ctrlKey;
	keyboard.Shift = event.shiftKey;
	keyboard.Alt = event.altKey;
});

/* draw element method */
// move to basic.js to share with popup.js

/* data control method */
function wordExist(word) {
	return data.partOfSpeech.n.includes(word) || data.partOfSpeech.v.includes(word);
}
function wordAdd({ POS }) {
	popup.prompt({ text: '請輸入新字卡的名稱：' }, newWord => {
		if (newWord === null) return;
		if (wordExist(newWord)) {
			popup.alert('您輸入的名稱已存在，字卡新增失敗。');
		} else {
			let oldNLength = data.partOfSpeech.n.length;
			data.partOfSpeech[POS].push(newWord);
			if (POS == 'v') {
				data.cases.push(NDArray([oldNLength, oldNLength], ([i1, i2]) => i1 != i2 ? FlowChart.exportEmpty() : undefined));
			} else {
				data.cases.forEach(vList => {
					vList.map(sList => sList.push(FlowChart.exportEmpty()));
					let newArray = NDArray([oldNLength], () => FlowChart.exportEmpty());
					newArray.push(undefined);
					vList.push(newArray);
				});
			}
		}
	});
}
function wordRename({ POS, index }) {
	let oldName = data.partOfSpeech[POS][index]
	popup.prompt({ text: `請輸入「${oldName}」的新名稱：` }, newName => {
		if (newName === null) return;
		if (wordExist(newName)) {
			if (newName == oldName) {
				popup.alert('新、舊名稱相同。');
			} else {
				popup.alert('您輸入的名稱已存在，名稱更改失敗。');
			}
		} else {
			data.partOfSpeech[POS].splice(index, 1, newName);
		}
	});
}
function wordDelete({ POS, index, listName }) {
	popup.confirm(`確定刪除「${data.partOfSpeech[POS][index]}」？`, res => {
		if (res) {
			data.partOfSpeech[POS].splice(index, 1);
			sceneVar.sheet[listName + 'Selected'] = false;
			if (POS == 'v') {
				data.cases.splice(index, 1);
			} else {
				data.cases.forEach(vList => {
					vList.splice(index, 1);
					vList.forEach(sList => sList.splice(index, 1));
				});
			}
		}
	});
}
function wordAttribute() {
	popup.alert('字卡屬性設定與編輯功能尚未完成，敬請期待！');
}
function gotoS({ POS, index }) {
	if (POS !== 'n') return;
	sceneVar.global.gotoType = 's';
	sceneVar.global.gotoIndex = index;
	sceneVar.global.goto = true;
}
function gotoV({ POS, index }) {
	if (POS !== 'v') return;
	sceneVar.global.gotoType = 'v';
	sceneVar.global.gotoIndex = index;
	sceneVar.global.goto = true;
}
function gotoO({ POS, index }) {
	if (POS !== 'n') return;
	sceneVar.global.gotoType = 'o';
	sceneVar.global.gotoIndex = index;
	sceneVar.global.goto = true;
}

/* render scene */
function scene_sheet() {
	/* init */
	if (!('sheet' in sceneVar)) {
		sceneVar.sheet = {};
		sceneVar.sheet.scale = 1;
		sceneVar.sheet.gridX = 0;
		sceneVar.sheet.gridY = 0;
		sceneVar.sheet.vIndex = 0;
		sceneVar.sheet.hoveredCell = [false, false];
		sceneVar.sheet.rowHighlight = false;
		sceneVar.sheet.columnHighlight = false;
		sceneVar.sheet.asidePage = 0;
		sceneVar.sheet.nounListY = 0;
		sceneVar.sheet.verbListY = 0;
		sceneVar.sheet.nounListSelected = false;
		sceneVar.sheet.verbListSelected = false;
		sceneVar.sheet.emptyWarningY = 0;
	}

	/* draw */
	drawBox(ctx, {
		pos: [0, 0, CW, CH],
		bgc: '#1c1c1c'
	});

	let header = [0, 0, CW, 70];
	let aside = [CW - 400, header[3], 400, CH - header[3]];

	let grid = [0, header[3], aside[0], CH - header[3]];
	let gridHovered = isHover(mouse, grid);
	if (gridHovered) {
		let lastScale = sceneVar.sheet.scale;
		sceneVar.sheet.scale -= mouse.deltaZoom * Math.abs(mouse.deltaZoom) / 1e4;
		sceneVar.sheet.scale = Math.min(Math.max(sceneVar.sheet.scale, 0.2), 1.5);
		sceneVar.sheet.gridX = sceneVar.sheet.gridX / lastScale * sceneVar.sheet.scale;
		sceneVar.sheet.gridY = sceneVar.sheet.gridY / lastScale * sceneVar.sheet.scale;
		sceneVar.sheet.gridX += mouse.x - mouse.x / lastScale * sceneVar.sheet.scale;
		sceneVar.sheet.gridY += (mouse.y - header[3]) - (mouse.y - header[3]) / lastScale * sceneVar.sheet.scale;
		sceneVar.sheet.gridX -= mouse.deltaX / 2 * 3;
		sceneVar.sheet.gridY -= mouse.deltaY / 2;
	}
	let [cellWidth, cellHeight] = [180, 60].map(n => n * sceneVar.sheet.scale);
	let gridSize = data.partOfSpeech.n.length + 1;
	let cellGap = 5;
	let cellBorderWidth = 2;

	let s = -1, v = -1, o = -1;
	if (sceneVar.global.goto && sceneVar.global.gotoType !== undefined && sceneVar.global.gotoIndex !== undefined) {
		if (sceneVar.global.gotoType == 's') s = sceneVar.global.gotoIndex;
		else if (sceneVar.global.gotoType == 'v') v = sceneVar.global.gotoIndex;
		else if (sceneVar.global.gotoType == 'o') o = sceneVar.global.gotoIndex;
		sceneVar.global.goto = false;
	}
	if (sceneVar.sheet.gotoEmptyWarningSelected) {
		s = sceneVar.sheet.emptyWarningSelectedDot.s;
		v = sceneVar.sheet.emptyWarningSelectedDot.v;
		o = sceneVar.sheet.emptyWarningSelectedDot.o;
		sceneVar.sheet.gotoEmptyWarningSelected = false;
	}
	if (s !== -1) sceneVar.sheet.gridY -= (sceneVar.sheet.gridY + (cellHeight + cellGap) * s + cellHeight / 2) - (grid[1] + grid[3] / 2);
	if (v !== -1) sceneVar.sheet.vIndex = v;
	if (o !== -1) sceneVar.sheet.gridX -= (sceneVar.sheet.gridX + (cellWidth + cellGap) * o + cellHeight / 2) - (grid[0] + grid[2] / 2);

	sceneVar.sheet.gridX = Math.min(Math.max(sceneVar.sheet.gridX, -(((cellWidth + cellGap) * (gridSize - 1)) - (grid[2] - cellWidth))), 0);
	sceneVar.sheet.gridY = Math.min(Math.max(sceneVar.sheet.gridY, -(((cellHeight + cellGap) * (gridSize - 1)) - (grid[3] - cellHeight))), 0);

	tempCtx.gridTitle.clearRect(0, 0, CW, CH);
	tempCtx.gridValue.clearRect(0, 0, CW, CH);
	let gridValuePos = [cellWidth + cellBorderWidth, header[3] + cellHeight + cellBorderWidth, 0, 0];
	gridValuePos[2] = grid[0] + grid[2] - gridValuePos[0];
	gridValuePos[3] = grid[1] + grid[3] - gridValuePos[1];
	let gridTitlePosList = [
		[0, gridValuePos[1], cellWidth + cellBorderWidth, gridValuePos[3]],
		[gridValuePos[0], header[3], gridValuePos[2], cellHeight + cellBorderWidth]
	];
	if (!gridHovered) {
		sceneVar.sheet.hoveredCell = [false, false];
	}
	for (let r = 0; r < Math.ceil(grid[3] / cellHeight) + 1; r++)
		for (let c = 0; c < Math.ceil(grid[2] / cellWidth) + 1; c++) {
			// 多畫一層，讓項目標題與內容產生至少一個的重疊
			let targetCtx = ctx;
			let cell = [0 + (cellWidth + cellGap) * c, header[3] + (cellHeight + cellGap) * r, cellWidth, cellHeight];
			let glow = false;
			let option = {
				pos: cell,
				bgc: color.buttonBgc,
				border: color.buttonDisabled,
				borderWidth: cellBorderWidth,
				fgc: 'white',
				text: '',
				size: 30 * sceneVar.sheet.scale
			};
			let dR = sceneVar.sheet.gridY / (cellHeight + cellGap),
				dC = sceneVar.sheet.gridX / (cellWidth + cellGap),
				rR = r - Math.ceil(dR),
				rC = c - Math.ceil(dC),
				dY = (dR % 1) * (cellHeight + cellGap),
				dX = (dC % 1) * (cellWidth + cellGap),
				i = Math.max(r, c),
				rI = i == r ? rR : rC;
			if (r == c && r == 0) {
				option.border = color.wordBoxV;
				option.text = data.partOfSpeech.v[sceneVar.sheet.vIndex];
				if (sceneVar.global.gotoType == 'v') {
					option.bgc = option.border;
					option.fgc = 'black';
				}
			} else if (r == 0 || c == 0) {
				targetCtx = tempCtx.gridTitle;
				if (i == r) {
					option.pos[1] += dY;
				} else {
					option.pos[0] += dX;
				}
				let cellHovered = gridHovered && isHover(mouse, cell);
				option.text = data.partOfSpeech.n[rI - 1];
				option.border = color.wordBoxSAndO;
				if (cellHovered) {
					sceneVar.sheet.hoveredCell = [rC - 1, rR - 1];
				}
				if (sceneVar.sheet.hoveredCell[i == r ? 1 : 0] === rI - 1) {
					glow = true;
				}
				if (sceneVar.global.gotoIndex == rI - 1 && sceneVar.global.gotoType !== undefined) {
					if (
						(sceneVar.global.gotoType == 's' && i == r) ||
						(sceneVar.global.gotoType == 'o' && i == c)
					) {
						option.bgc = option.border;
						option.fgc = 'black';
					}
				}
				if (rI - 1 < 0 || rI > data.partOfSpeech.n.length) {
					if (cellHovered) sceneVar.sheet.hoveredCell = [false, false];
					continue;
				};
			} else {
				targetCtx = tempCtx.gridValue;
				option.pos[1] += dY;
				option.pos[0] += dX;
				let cellHovered = isHover(mouse, gridValuePos) && isHover(mouse, cell);
				if (rR == rC) {
					option.bgc = '#313131';
				}
				if (cellHovered) {
					sceneVar.sheet.hoveredCell = [rC - 1, rR - 1];
					glow = true;
					option.border = 'white';
					if (rR == rC) {
						option.text = 'x';
					} else if (mouse.DBlClick) {
						sceneVar.sheet.cellEditing = [sceneVar.sheet.vIndex, rR - 1, rC - 1];
						currentScene = scene_flowChart;
					}
				}
				if (
					sceneVar.sheet.emptyWarningSelectedDot &&
					sceneVar.sheet.vIndex === sceneVar.sheet.emptyWarningSelectedDot.v &&
					rR - 1 === sceneVar.sheet.emptyWarningSelectedDot.s &&
					rC - 1 === sceneVar.sheet.emptyWarningSelectedDot.o
				) {
					option.border = color.buttonWarning;
				}
				if (Math.min(rR, rC) - 1 < 0 || Math.max(rR, rC) > data.partOfSpeech.n.length) {
					if (cellHovered) sceneVar.sheet.hoveredCell = [false, false];
					continue;
				}
			}
			targetCtx.save();
			if (glow) {
				glowEffect(targetCtx, option.border, 10);
			}
			drawBox(targetCtx, option);
			targetCtx.restore();
		}
	ctx.drawImage(tempCvs.gridValue, ...gridValuePos, ...gridValuePos);
	ctx.drawImage(tempCvs.gridTitle, ...gridTitlePosList[0], ...gridTitlePosList[0]);
	ctx.drawImage(tempCvs.gridTitle, ...gridTitlePosList[1], ...gridTitlePosList[1]);

	drawBox(ctx, {
		pos: aside,
		bgc: '#1e1e1e'
	});
	drawPoliigon(ctx, {
		points: [[aside[0] + 5 / 2, aside[1]], [aside[0] + 5 / 2, aside[1] + aside[3]]],
		lineWidth: 2,
		stroke: 'white'
	});
	let pageButtonHeight = 50;
	[
		{
			pos: [aside[0], aside[1], aside[2] / 2, pageButtonHeight],
			text: '詞卡總攬',
		},
		{
			pos: [aside[0] + aside[2] / 2, aside[1], aside[2] / 2, pageButtonHeight],
			text: '空缺提示',
		}
	].map((pageButton, i) => {
		pageButton.size = 20;
		pageButton.pos[0] += 5;
		pageButton.pos[1] += 5;
		pageButton.pos[2] -= 10;
		pageButton.pos[3] -= 10;
		if (i == sceneVar.sheet.asidePage) {
			pageButton.fgc = 'white';
			pageButton.bgc = 'transparent';
		} else {
			pageButton.fgc = 'gray';
			pageButton.bgc = '#3e3e3e';
		}
		if (isHover(mouse, pageButton.pos) && mouse.click) {
			sceneVar.sheet.asidePage = i;
		}
		drawBox(ctx, pageButton);
	});
	let asidePadding = 20;
	let wordHeight = 30, wordGap = 5;
	if (sceneVar.sheet.asidePage == 0) {
		drawPoliigon(ctx, {
			points: [[aside[0] + 5, aside[1] + pageButtonHeight + (aside[3] - pageButtonHeight) / 2], [aside[0] + aside[2] - 5, aside[1] + pageButtonHeight + (aside[3] - pageButtonHeight) / 2]],
			lineWidth: 2,
			stroke: 'white'
		});
		let nounList = [aside[0] + asidePadding, aside[1] + pageButtonHeight + asidePadding, aside[2] - asidePadding * 2, (aside[3] - pageButtonHeight) / 2 - (wordHeight * 2 + wordGap) - asidePadding * 3];
		let verbList = [...nounList];
		verbList[1] += (aside[3] - pageButtonHeight) / 2;
		[
			{ list: nounList, listName: 'nounList', listPOS: 'n', theOtherName: 'verbList' },
			{ list: verbList, listName: 'verbList', listPOS: 'v', theOtherName: 'nounList' }
		].forEach(({ list, listName, listPOS, theOtherName }) => {
			drawBox(ctx, {
				pos: list,
				bgc: color.buttonBgc,
				border: 'white',
				borderWidth: 1
			});
			drawList({
				targetCvs: tempCvs[listName],
				targetCtx: tempCtx[listName],
				list: list,
				getSetScrollY: value => { return value !== undefined ? (sceneVar.sheet[listName + 'Y'] = value) : sceneVar.sheet[listName + 'Y'] },
				itemList: data.partOfSpeech[listPOS],
				itemBgc: listPOS == 'v' ? color.wordBoxV : color.wordBoxSAndO,
				itemTextFormat: ({ item }) => item,
				itemClickListener: ({ index }) => {
					sceneVar.sheet[listName + 'Selected'] = index;
					sceneVar.sheet[theOtherName + 'Selected'] = false;
				},
				itemSelected: ({ index }) => index === sceneVar.sheet[listName + 'Selected'],
				listPadding: 10, itemHeight: 30, itemGap: 5,
			});

			let buttonBox = [list[0], list[1] + list[3] + asidePadding, list[2], wordHeight * 2 + wordGap];
			let buttonWidth = (buttonBox[2] - wordGap * 2) / 3;
			let buttonList = [
				{ pos: [buttonBox[0], buttonBox[1], buttonWidth, wordHeight], label: '新增', selectFirst: false, method: wordAdd },
				{ pos: [buttonBox[0] + (buttonWidth + wordGap), buttonBox[1], buttonWidth, wordHeight], label: '改名', selectFirst: true, method: wordRename },
				{ pos: [buttonBox[0] + (buttonWidth + wordGap) * 2, buttonBox[1], buttonWidth, wordHeight], label: '刪除', selectFirst: true, method: wordDelete }
			];
			let attributeButtonX = 0;
			if (listPOS == 'v') {
				buttonWidth = (buttonBox[2] - wordGap) / 2;
				buttonList.push({ pos: [buttonBox[0], buttonBox[1] + (wordHeight + wordGap), buttonWidth, wordHeight], label: '動詞', selectFirst: true, method: gotoV });
				attributeButtonX = buttonBox[0] + (buttonWidth + wordGap);
			} else {
				buttonWidth = (buttonBox[2] - wordGap * 2) / 3;
				buttonList.push({ pos: [buttonBox[0], buttonBox[1] + (wordHeight + wordGap), buttonWidth, wordHeight], label: '主詞', selectFirst: true, method: gotoS });
				buttonList.push({ pos: [buttonBox[0] + (buttonWidth + wordGap), buttonBox[1] + (wordHeight + wordGap), buttonWidth, wordHeight], label: '受詞', selectFirst: true, method: gotoO });
				attributeButtonX = buttonBox[0] + (buttonWidth + wordGap) * 2;
			}
			buttonList.push({ pos: [attributeButtonX, buttonBox[1] + (wordHeight + wordGap), buttonWidth, wordHeight], label: '屬性', selectFirst: true, method: wordAttribute });
			buttonList.forEach(button => {
				ctx.save();
				let option = {
					pos: button.pos,
					bgc: color.buttonBgc,
					fgc: 'white',
					text: button.label,
					size: 20,
					border: 'white',
					borderWidth: 1
				};
				if (isHover(mouse, option.pos)) {
					glowEffect(ctx, option.border, 10);
					if (mouse.click) {
						selectedWord = sceneVar.sheet[listName + 'Selected'];
						if (button.selectFirst && selectedWord === false) {
							popup.alert(`請先選擇${listPOS == 'v' ? '動詞' : '名詞'}字卡！`);
						} else {
							button.method({ POS: listPOS, index: selectedWord, listName });
						}
					}
				}
				drawBox(ctx, option);
				ctx.restore();
			});
		});
	} else if (sceneVar.sheet.asidePage == 1) {
		let list = [aside[0] + asidePadding, aside[1] + pageButtonHeight + asidePadding, aside[2] - asidePadding * 2, (aside[3] - pageButtonHeight) - asidePadding * 2];
		drawBox(ctx, {
			pos: list,
			bgc: color.buttonBgc,
			border: 'white',
			borderWidth: 1
		});
		let emptyCaseList = [];
		for (let vI = 0; vI < data.cases.length; vI++)
			for (let sI = 0; sI < data.cases[vI].length; sI++)
				for (let oI = 0; oI < data.cases[vI][sI].length; oI++) {
					if (data.cases[vI][sI][oI] && data.cases[vI][sI][oI].start === undefined) {
						emptyCaseList.push({
							text: `${data.partOfSpeech.n[sI]} - ${data.partOfSpeech.v[vI]} - ${data.partOfSpeech.n[oI]}`,
							s: sI, v: vI, o: oI
						});
					}
				}
		// let currentAndLastSelected = [loneDots[sceneVar.flowChart.emptyWarningSelected], sceneVar.flowChart.emptyWarningSelectedDot];
		// if (
		// 	!currentAndLastSelected[0] ||
		// 	!currentAndLastSelected[1] ||
		// 	currentAndLastSelected[0].node !== currentAndLastSelected[1].node ||
		// 	currentAndLastSelected[0].dotIndex != currentAndLastSelected[1].dotIndex
		// ) {
		// 	sceneVar.flowChart.emptyWarningSelected = undefined;
		// 	sceneVar.flowChart.emptyWarningSelectedDot = undefined;
		// }
		drawList({
			targetCvs: tempCvs.nounList,
			targetCtx: tempCtx.nounList,
			list: list,
			getSetScrollY: value => { return value !== undefined ? (sceneVar.sheet.emptyWarningY = value) : sceneVar.sheet.emptyWarningY },
			itemList: emptyCaseList,
			itemBgc: color.buttonWarning,
			itemTextFormat: ({ item }) => item.text,
			itemClickListener: ({ index, item }) => {
				sceneVar.sheet.emptyWarningSelected = index;
				sceneVar.sheet.emptyWarningSelectedDot = item;
				sceneVar.sheet.gotoEmptyWarningSelected = true;
			},
			itemSelected: ({ index }) => index === sceneVar.sheet.emptyWarningSelected,
			listPadding: 10, itemHeight: 30, itemGap: 5,
		});
	}

	drawBox(ctx, {
		pos: header,
		bgc: '#313131',
		fgc: 'white',
		text: '< POW Game Manager >',
		size: 30
	});
	drawPoliigon(ctx, {
		points: [[header[0], header[1] + header[3] - 5 / 2], [header[0] + header[2], header[1] + header[3] - 5 / 2]],
		lineWidth: 2,
		stroke: 'white'
	});
}
async function scene_flowChart() {
	/* init */
	if (!('flowChart' in sceneVar)) {
		sceneVar.flowChart = {};
		sceneVar.flowChart.scale = 1;
		sceneVar.flowChart.chartX = 0;
		sceneVar.flowChart.chartY = 0;
		sceneVar.flowChart.asidePage = 0;
		sceneVar.flowChart.shapeListY = 0;
		sceneVar.flowChart.title = '';
		sceneVar.flowChart.connections = [];
		sceneVar.flowChart.nodesDots = new Map();
		sceneVar.flowChart.emptyWarningY = 0;
	}
	if (sceneChange) {
		let cellEditing = sceneVar.sheet.cellEditing;
		sceneVar.flowChart.title = [
			data.partOfSpeech.n[cellEditing[1]],
			data.partOfSpeech.v[cellEditing[0]],
			data.partOfSpeech.n[cellEditing[2]]
		].join(' - ');
		sceneVar.flowChart.flowChart = new FlowChart({
			title: sceneVar.flowChart.title,
			...data.cases[cellEditing[0]][cellEditing[1]][cellEditing[2]]
		});
	}

	/* draw */
	drawBox(ctx, {
		pos: [0, 0, CW, CH],
		bgc: '#1c1c1c'
	});

	let header = [0, 0, CW, 70];
	let aside = [CW - 400, header[3], 400, CH - header[3]];

	let chart = [0, header[3], aside[0], CH - header[3]];
	if (isHover(mouse, chart)) {
		let lastScale = sceneVar.flowChart.scale;
		sceneVar.flowChart.scale -= mouse.deltaZoom * Math.abs(mouse.deltaZoom) / 1e4;
		sceneVar.flowChart.scale = Math.min(Math.max(sceneVar.flowChart.scale, 0.2), 1.5);
		let relativeMouse = [
			mouse.x - (chart[0] + chart[2] / 2) - (sceneVar.flowChart.chartX),
			mouse.y - (chart[1] + chart[3] / 2) - (sceneVar.flowChart.chartY)
		];
		sceneVar.flowChart.chartX += relativeMouse[0] - relativeMouse[0] / lastScale * sceneVar.flowChart.scale;
		sceneVar.flowChart.chartY += relativeMouse[1] - relativeMouse[1] / lastScale * sceneVar.flowChart.scale;
		sceneVar.flowChart.chartX -= mouse.deltaX / 2;
		sceneVar.flowChart.chartY -= mouse.deltaY / 2;
	}

	drawBox(ctx, {
		pos: aside,
		bgc: '#1e1e1e'
	});
	drawPoliigon(ctx, {
		points: [[aside[0] + 5 / 2, aside[1]], [aside[0] + 5 / 2, aside[1] + aside[3]]],
		lineWidth: 2,
		stroke: 'white'
	});
	let pageButtonHeight = 50;
	[
		{
			pos: [aside[0], aside[1], aside[2] / 2, pageButtonHeight],
			text: '圖卡背包',
		},
		{
			pos: [aside[0] + aside[2] / 2, aside[1], aside[2] / 2, pageButtonHeight],
			text: '空缺提示',
		}
	].map((pageButton, i) => {
		pageButton.size = 20;
		pageButton.pos[0] += 5;
		pageButton.pos[1] += 5;
		pageButton.pos[2] -= 10;
		pageButton.pos[3] -= 10;
		if (i == sceneVar.flowChart.asidePage) {
			pageButton.fgc = 'white';
			pageButton.bgc = 'transparent';
		} else {
			pageButton.fgc = 'gray';
			pageButton.bgc = '#3e3e3e';
		}
		if (isHover(mouse, pageButton.pos) && mouse.click) {
			sceneVar.flowChart.asidePage = i;
		}
		drawBox(ctx, pageButton);
	});
	let asidePadding = 20;
	if (sceneVar.flowChart.asidePage == 0) {
		let list = [aside[0] + asidePadding, aside[1] + pageButtonHeight + asidePadding, aside[2] - asidePadding * 2, (aside[3] - pageButtonHeight) - asidePadding * 2];
		drawBox(ctx, {
			pos: list,
			bgc: color.buttonBgc,
			border: 'white',
			borderWidth: 1
		});
		for (let option of [
			{
				pos: [list[0], list[1], list[2], list[3] / 3],
				text: '判斷節點',
				bgiCut: [0, 0, 16, 16],
				mouseListener: {
					type: 'down',
					func: () => {
						sceneVar.flowChart.nodePosBeforeDrag = [mouse.x - (chart[0] + chart[2] / 2) - sceneVar.flowChart.chartX, mouse.y - (chart[1] + chart[3] / 2) - sceneVar.flowChart.chartY].map(n => n / sceneVar.flowChart.scale);
						let node = new CircumstanceNode({ anchor: sceneVar.flowChart.nodePosBeforeDrag });
						sceneVar.flowChart.draggingNode = node;
						sceneVar.flowChart.dragStartPos = [mouse.x, mouse.y];
						sceneVar.flowChart.flowChart.circumstanceNodeList.push(node);
					}
				}
			},
			{
				pos: [list[0], list[1] + list[3] / 3, list[2], list[3] / 3],
				text: '對話節點',
				bgiCut: [16, 0, 16, 16],
				mouseListener: {
					type: 'down',
					func: () => {
						sceneVar.flowChart.nodePosBeforeDrag = [mouse.x - (chart[0] + chart[2] / 2) - sceneVar.flowChart.chartX, mouse.y - (chart[1] + chart[3] / 2) - sceneVar.flowChart.chartY].map(n => n / sceneVar.flowChart.scale);
						let node = new DialogNode({ anchor: sceneVar.flowChart.nodePosBeforeDrag });
						sceneVar.flowChart.draggingNode = node;
						sceneVar.flowChart.dragStartPos = [mouse.x, mouse.y];
						sceneVar.flowChart.flowChart.dialogNodeList.push(node);
					}
				}
			},
			{
				pos: [list[0], list[1] + list[3] / 3 * 2, list[2], list[3] / 3],
				text: '節點刪除',
				bgiCut: [16 * 2, 0, 16, 16],
				mouseListener: {
					type: 'up',
					func: () => {
						if (sceneVar.flowChart.draggingNode) {
							[sceneVar.flowChart.flowChart.circumstanceNodeList, sceneVar.flowChart.flowChart.dialogNodeList].forEach(nodeList => {
								if (nodeList.includes(sceneVar.flowChart.draggingNode)) {
									nodeList.splice(nodeList.indexOf(sceneVar.flowChart.draggingNode), 1);
								}
							});
						}
					}
				}
			}
		]) {
			ctx.save();
			let bgiPos = [0, 0, 0, 0];
			bgiPos[2] = bgiPos[3] = Math.min(option.pos[2], option.pos[3]) * 0.8;
			bgiPos[0] = option.pos[0] + (option.pos[2] - bgiPos[2]) / 2;
			bgiPos[1] = option.pos[1] + (option.pos[3] - bgiPos[3]) / 2;
			ctx.globalAlpha = 0.2;
			ctx.imageSmoothingEnabled = false;
			if (isHover(mouse, option.pos)) {
				glowEffect(ctx, 'white', 20);
				if (option.mouseListener && mouse[option.mouseListener.type]) {
					option.mouseListener.func();
				}
			} else {
				glowEffect(ctx, 'white', 0);
			}
			ctx.drawImage(await getImage('image/backpackItem.png'), ...option.bgiCut, ...bgiPos);
			ctx.globalAlpha = 1;
			option = {
				...option,
				fgc: 'white',
				size: 30
			}
			drawBox(ctx, option);
			ctx.restore();
		}
	} else if (sceneVar.flowChart.asidePage == 1) {
		let list = [aside[0] + asidePadding, aside[1] + pageButtonHeight + asidePadding, aside[2] - asidePadding * 2, (aside[3] - pageButtonHeight) - asidePadding * 2];
		drawBox(ctx, {
			pos: list,
			bgc: color.buttonBgc,
			border: 'white',
			borderWidth: 1
		});
		let { loneDots } = sceneVar.flowChart.flowChart.getLoneDotsAndUnconnectedNodes();
		let currentAndLastSelected = [loneDots[sceneVar.flowChart.emptyWarningSelected], sceneVar.flowChart.emptyWarningSelectedDot];
		if (
			!currentAndLastSelected[0] ||
			!currentAndLastSelected[1] ||
			currentAndLastSelected[0].node !== currentAndLastSelected[1].node ||
			currentAndLastSelected[0].dotIndex != currentAndLastSelected[1].dotIndex
		) {
			sceneVar.flowChart.emptyWarningSelected = undefined;
			sceneVar.flowChart.emptyWarningSelectedDot = undefined;
		}
		drawList({
			targetCvs: tempCvs.nounList,
			targetCtx: tempCtx.nounList,
			list: list,
			getSetScrollY: value => { return value !== undefined ? (sceneVar.flowChart.emptyWarningY = value) : sceneVar.flowChart.emptyWarningY },
			itemList: loneDots,
			itemBgc: color.buttonWarning,
			itemTextFormat: ({ item }) => `${item.node.constructor.name} - ${item.dotIndex}`,
			itemClickListener: ({ index, item }) => {
				sceneVar.flowChart.emptyWarningSelected = index;
				sceneVar.flowChart.emptyWarningSelectedDot = item;
				sceneVar.flowChart.gotoEmptyWarningSelected = true;
			},
			itemSelected: ({ index }) => index === sceneVar.flowChart.emptyWarningSelected,
			listPadding: 10, itemHeight: 30, itemGap: 5,
		});
	}

	sceneVar.flowChart.flowChart.draw({ ctx, chart });
	let backButton = [chart[0] + 20, chart[1] + 20, 50, 50];
	ctx.save();
	if (isHover(mouse, backButton)) {
		glowEffect(ctx, 'white', 2);
		if (mouse.click) {
			let cellEditing = sceneVar.sheet.cellEditing;
			data.cases[cellEditing[0]][cellEditing[1]][cellEditing[2]] = sceneVar.flowChart.flowChart.export();
			currentScene = scene_sheet;
		}
	}
	drawBox(ctx, {
		pos: backButton,
		bgc: color.buttonBgc,
		fgc: 'white',
		text: '<-',
		size: 30,
		border: 'gray',
		borderWidth: 2
	});
	ctx.restore();
	drawBox(ctx, {
		pos: [chart[0] + (chart[2] - chart[2] / 2) / 2, backButton[1], chart[2] / 2, backButton[3]],
		bgc: color.buttonBgc,
		fgc: 'white',
		text: sceneVar.flowChart.title,
		size: 30,
	});

	drawBox(ctx, {
		pos: header,
		bgc: '#313131',
		fgc: 'white',
		text: '< POW Game Manager >',
		size: 30
	});
	drawPoliigon(ctx, {
		points: [[header[0], header[1] + header[3] - 5 / 2], [header[0] + header[2], header[1] + header[3] - 5 / 2]],
		lineWidth: 2,
		stroke: 'white'
	});

	if (mouse.up) {
		sceneVar.flowChart.connectStartData = undefined;
		sceneVar.flowChart.connectStartPos = undefined;
		sceneVar.flowChart.connectEndData = undefined;
		sceneVar.flowChart.connectEndPos = undefined;
	}
}

/* main loop */
async function loop() {
	currentTime = Date.now();
	let eventData = JSON.stringify({ mouse, keyboard });
	if (eventData != lastEventData || CW !== cvs.width || CH !== cvs.height) {
		[CW, CH] = [cvs.width, cvs.height];
		popup.setEvent({ mouse, keyboard }, true);
		if (lastScene != currentScene) {
			sceneChange = true;
			lastScene = currentScene;
		}

		await currentScene();

		sceneChange = false;
		popup.setEvent({ mouse, keyboard }, false);
		popup.draw();
		mouse.click = mouse.DBlClick = mouse.contextMenu = mouse.down = mouse.up = false;
		mouse.deltaX = mouse.deltaY = mouse.deltaZ = mouse.deltaZoom = 0;
		mouse.screenshot = false;
	}
	lastEventData = eventData;
	setTimeout(loop, 30);
}
loop();