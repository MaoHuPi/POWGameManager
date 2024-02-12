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
Object.entries({ 'chart': 'gridValue', 'shapeDragging': 'gridTitle' }).forEach(KVPair => {
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
// popup.prompt('請輸入字串：', res => {
// console.log(res);
// });

const data = {};
data.partOfSpeech = {
	n: ['我', '門', '電腦', '紙條', '寶箱', '電話', '鍵盤', '手錶', '蠟燭', '屎', '筆', '墨水', '衛生紙'],
	v: ['走向', '檢查', '打開']
};
// https://stackoverflow.com/questions/13589880/using-json-stringify-on-custom-class
// class Dialog {
// 	constructor({
// 		position = [0, 0],
// 		message = '......',
// 		words = [],
// 		operation = []
// 	} = {}) {
// 		this.position = position; // position
// 		this.message = message; // message
// 		this.words = words; // words
// 		this.operation = operation; // operation
// 	}
// }
// class ConditionalStatement {
// 	constructor({
// 		left = ['num', 1],
// 		operator = 'equ',
// 		right = ['num', 1]
// 	} = {}) {
// 		this.left = left // value 1
// 		this.operator = operator
// 		this.right = right // value 2
// 	}
// }
// class Circumstance {
// 	constructor({
// 		position = [0, 0],
// 		conditionalStatement = new ConditionalStatement(),
// 		ifTrue = 0,
// 		ifFalse = 0
// 	} = {}) {
// 		this.position = position; // position
// 		this.conditionalStatement = conditionalStatement;
// 		this.ifTrue = ifTrue;
// 		this.ifFalse = ifFalse;
// 	}
// }
class Case {
	constructor({
		start = 0,
		dialogList = [],
		circumstanceList = []
	} = {}) {
		this.start = start;
		this.dialogList = dialogList;
		this.circumstanceList = circumstanceList;
	}
}
function NDArray(lengthList, initValueFunc) {
	return new Array(lengthList.shift()).fill(0).map(() => {
		if (lengthList.length == 0) {
			return initValueFunc();
		} else {
			return NDArray([...lengthList], initValueFunc);
		}
	});
}
data.cases = NDArray([data.partOfSpeech.v.length, data.partOfSpeech.n.length, data.partOfSpeech.n.length], () => new Case());

const color = {
	buttonHover: 'white',
	// buttonDefault: '#6585ad',
	buttonDefault: '#b5986a',
	buttonDisabled: 'gray',
	buttonBgc: '#00000055',
	wordBoxSAndO: '#ffc107',
	wordBoxV: '#ff5722'
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
let lastMouseData = JSON.stringify(mouse);
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
	} else {
		mouse.deltaX += event.deltaX;
		mouse.deltaY += event.deltaY;
		mouse.deltaZ += event.deltaZ;
	}
});

/* draw element method */
// move to basic.js to share with popup.js

/* data control method */
function wordExist(word) {
	return data.partOfSpeech.n.includes(word) || data.partOfSpeech.v.includes(word);
}
function wordAdd({ POS }) {
	popup.prompt(`請輸入新字卡的名稱：`, newWord => {
		if (newWord === null) return;
		if (wordExist(newWord)) {
			popup.alert('您輸入的名稱已存在，字卡新增失敗。');
		} else {
			data.partOfSpeech[POS].push(newWord);
			let nLength = data.partOfSpeech.n.length;
			if (POS == 'v') {
				data.cases.push(NDArray([nLength, nLength], () => new Case()));
			} else {
				data.cases.forEach(vList => {
					vList.push(NDArray([nLength], () => new Case()));
					vList.forEach(sList => sList.push(new Case()));
				});
			}
		}
	});
}
function wordRename({ POS, index }) {
	let oldName = data.partOfSpeech[POS][index]
	popup.prompt(`請輸入「${oldName}」的新名稱：`, newName => {
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
	sceneVar.global.gotoAniStart = currentTime;
}
function gotoV({ POS, index }) {
	if (POS !== 'v') return;
	sceneVar.global.gotoType = 'v';
	sceneVar.global.gotoIndex = index;
	sceneVar.global.gotoAniStart = currentTime;
}
function gotoO({ POS, index }) {
	if (POS !== 'n') return;
	sceneVar.global.gotoType = 'o';
	sceneVar.global.gotoIndex = index;
	sceneVar.global.gotoAniStart = currentTime;
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
	}

	/* draw */
	drawBox(ctx, {
		pos: [0, 0, CW, CH],
		bgc: '#1c1c1c'
	});

	let header = [0, 0, CW, 70];
	let aside = [CW - 400, header[3], 400, CH - header[3]];

	let grid = [0, header[3], aside[0], CH - header[3]];
	if (isHover(mouse, grid)) {
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
	if (sceneVar.global.gotoType !== undefined && sceneVar.global.gotoIndex !== undefined) {
		if (sceneVar.global.gotoType == 's') {
			sceneVar.sheet.gridY -= (sceneVar.sheet.gridY + (cellHeight + cellGap) * sceneVar.global.gotoIndex + cellHeight / 2) - (grid[1] + grid[3] / 2);
		} else if (sceneVar.global.gotoType == 'v') {
			sceneVar.sheet.vIndex = sceneVar.global.gotoIndex;
		} else if (sceneVar.global.gotoType == 'o') {
			sceneVar.sheet.gridX -= (sceneVar.sheet.gridX + (cellWidth + cellGap) * sceneVar.global.gotoIndex + cellHeight / 2) - (grid[0] + grid[2] / 2);
		}
	}
	sceneVar.sheet.gridX = Math.min(Math.max(sceneVar.sheet.gridX, -(((cellWidth + cellGap) * (gridSize - 1)) - (grid[2] - cellWidth))), 0);
	sceneVar.sheet.gridY = Math.min(Math.max(sceneVar.sheet.gridY, -(((cellHeight + cellGap) * (gridSize - 1)) - (grid[3] - cellHeight))), 0);

	tempCtx.gridTitle.clearRect(0, 0, CW, CH);
	tempCtx.gridValue.clearRect(0, 0, CW, CH);
	let gridHovered = isHover(mouse, grid);
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
					if (currentTime - sceneVar.global.gotoAniStart > 2e3) {
						sceneVar.global.gotoType = undefined;
						sceneVar.global.gotoIndex = undefined;
						sceneVar.global.gotoAniStart = undefined;
					} else {
						option.bgc = option.border;
						option.fgc = 'black';
					}
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
						if (currentTime - sceneVar.global.gotoAniStart > 2e3) {
							sceneVar.global.gotoType = undefined;
							sceneVar.global.gotoIndex = undefined;
							sceneVar.global.gotoAniStart = undefined;
						} else {
							option.bgc = option.border;
							option.fgc = 'black';
						}
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
	let listPadding = 10;
	let wordHeight = 30,
		wordGap = 5;
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
			let targetCtx = tempCtx[listName];
			let listY = sceneVar.sheet[listName + 'Y'];
			let listLength = data.partOfSpeech[listPOS].length;
			drawBox(ctx, {
				pos: list,
				bgc: color.buttonBgc,
				border: 'white',
				borderWidth: 1
			});
			let listHovered = isHover(mouse, list);
			if (listHovered) {
				listY -= mouse.deltaY;
				listY = Math.min(Math.max(listY, -((wordHeight + wordGap) * listLength - wordGap - (list[3] - listPadding * 2))), 0);
			}
			tempCtx[listName].clearRect(0, 0, CW, CH);
			for (let i = 0; i < listLength; i++) {
				targetCtx.save();
				let option = {
					pos: [list[0] + listPadding, list[1] + (wordHeight + wordGap) * i + listPadding + listY, list[2] - listPadding * 2, wordHeight],
					bgc: listPOS == 'v' ? color.wordBoxV : color.wordBoxSAndO,
					fgc: 'white',
					text: data.partOfSpeech[listPOS][i],
					size: 20
				}
				if (listHovered && isHover(mouse, option.pos)) {
					glowEffect(targetCtx, option.bgc, 10);
					if (mouse.click) {
						sceneVar.sheet[listName + 'Selected'] = i;
						sceneVar.sheet[theOtherName + 'Selected'] = false;
					}
				}
				if (i === sceneVar.sheet[listName + 'Selected']) {
					option.fgc = 'black';
					drawBox(targetCtx, option);
				} else {
					targetCtx.globalAlpha = 0.5;
					drawBox(targetCtx, { ...option, text: '' });
					targetCtx.globalAlpha = 1;
					drawBox(targetCtx, { ...option, bgc: undefined });
				}
				targetCtx.restore();
			}
			ctx.drawImage(tempCvs[listName], ...list, ...list);
			sceneVar.sheet[listName + 'Y'] = listY;

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
	}

	drawBox(ctx, {
		pos: header,
		bgc: '#313131',
		fgc: 'white',
		text: '< 文字獄 - 後台 >',
		size: 30
	});
	drawPoliigon(ctx, {
		points: [[header[0], header[1] + header[3] - 5 / 2], [header[0] + header[2], header[1] + header[3] - 5 / 2]],
		lineWidth: 2,
		stroke: 'white'
	});
}
class FloatChartNode {
	static charSize = 30;
	static charFont = 'Zpix';
	static padding = 20;
	constructor({ anchor = [0, 0], relativeAnchorPos = [0.5, 0], size = [100, 100], draggable = true }) {
		this.anchor = anchor;
		this.relativeAnchorPos = relativeAnchorPos;
		this.size = size;
		this.draggable = draggable;
	}
	update(chart) {
		if (this.draggable) {
			let pos = this.getScreenPos(chart);
			if (sceneVar.flowChart.draggingNode === this) {
				let startPos = sceneVar.flowChart.dragStartPos,
					posBeforeDrag = sceneVar.flowChart.nodePosBeforeDrag;
				let deltaMousePos = [mouse.x - startPos[0], mouse.y - startPos[1]];
				// delta 為二者之差，平移會抵消，所以只須做縮放
				deltaMousePos = deltaMousePos.map(n => n / sceneVar.flowChart.scale);
				[this.pos[0], this.pos[1]] = [posBeforeDrag[0] + deltaMousePos[0], posBeforeDrag[1] + deltaMousePos[1]];
				if (mouse.up) {
					this.anchor = [this.pos[0] + this.pos[2] * this.relativeAnchorPos[0], this.pos[1] + this.pos[3] * this.relativeAnchorPos[1]];
					sceneVar.flowChart.draggingNode = undefined;
					this.calc();
				}
			} else if (isHover(mouse, pos) && mouse.down) {
				sceneVar.flowChart.draggingNode = this;
				sceneVar.flowChart.nodePosBeforeDrag = [...this.pos];
				sceneVar.flowChart.dragStartPos = [mouse.x, mouse.y];
			}
		}
	}
	draw() { }
	drawTab({ screenPos, name }) {
		let [tabWidth, tabHeight] = [60, 30].map(n => n * sceneVar.flowChart.scale);
		drawBox(ctx, {
			pos: [screenPos[0], screenPos[1] - tabHeight, tabWidth, tabHeight],
			bgc: 'white',
			fgc: 'black',
			text: name,
			size: FloatChartNode.charSize * sceneVar.flowChart.scale * 0.6,
			font: FloatChartNode.charFont,
		});
	}
	getScreenPos(chart) {
		let pos = [...this.pos];
		pos = pos.map(n => n * sceneVar.flowChart.scale);
		pos[0] += chart[0] + chart[2] / 2 + sceneVar.flowChart.chartX;
		pos[1] += chart[1] + chart[3] / 2 + sceneVar.flowChart.chartY;
		return pos;
	}
}
class StartNode extends FloatChartNode {
	constructor({ text = '' }) {
		super({ anchor: [0, 0], relativeAnchorPos: [0.5, 0.5], size: undefined, draggable: false });
		this.text = text;
		this.calc();
	}
	calc() {
		let { size, lines } = calcSize({ ...FloatChartNode, sizeBOCS: [undefined, 1], text: this.text });
		this.size = size;
		this.lines = lines;
		this.pos = [
			this.anchor[0] - this.size[0] / 2, this.anchor[1] - this.size[1] / 2,
			this.size[0], this.size[1]
		];
	}
	draw(ctx, chart) {
		let pos = this.getScreenPos(chart);
		drawBox(ctx, {
			pos,
			bgc: color.buttonBgc,
			fgc: 'white',
			text: this.lines !== undefined ? this.lines : this.text,
			padding: this.lines !== undefined ? FloatChartNode.padding * sceneVar.flowChart.scale : undefined,
			size: FloatChartNode.charSize * sceneVar.flowChart.scale,
			font: FloatChartNode.charFont,
			border: 'white',
			borderWidth: 5 * sceneVar.flowChart.scale
		});
		this.drawTab({ screenPos: pos, name: '起始' });
		// this.update(chart);
	}
}
class DialogNode extends FloatChartNode {
	static itemGap = 10;
	constructor({ anchor = [200, 200], message = '123', words = [], operations = [] }) {
		super({ anchor: anchor, relativeAnchorPos: [0.5, 0], size: undefined, draggable: true });
		this.message = message;
		this.words = words;
		this.operations = operations;
		this.calc();
	}
	calc() {
		let { charSize, padding } = FloatChartNode;
		let blockPadding = padding / 2;
		let { size, lines } = calcSize({ ...FloatChartNode, padding: blockPadding, sizeBOCS: [10, undefined], text: this.message });
		this.size = [size[0] + padding * 2, size[1] + padding * 2 + blockPadding * 2 + ((charSize + DialogNode.itemGap) * (this.words.length + this.operations.length + 1 * 2) - DialogNode.itemGap * 2 + blockPadding * 2 * 2)];
		this.messageLines = lines;
		this.pos = [
			this.anchor[0] - this.size[0] / 2, this.anchor[1],
			this.size[0], this.size[1]
		];
	}
	draw(ctx, chart) {
		let pos = this.getScreenPos(chart);
		let padding = FloatChartNode.padding * sceneVar.flowChart.scale;
		let blockPadding = padding / 2;
		let charSize = FloatChartNode.charSize * sceneVar.flowChart.scale;
		let itemGap = DialogNode.itemGap * sceneVar.flowChart.scale;
		let reCalc = false;
		drawBox(ctx, {
			pos,
			bgc: color.buttonBgc,
			border: 'white',
			borderWidth: 5 * sceneVar.flowChart.scale
		});
		this.drawTab({ screenPos: pos, name: '對話' });
		let messagePos = [pos[0] + padding, pos[1] + padding, pos[2] - padding * 2, charSize * this.messageLines.length + blockPadding * 2];
		drawBox(ctx, {
			pos: messagePos,
			fgc: 'white',
			text: this.messageLines,
			padding: blockPadding,
			size: charSize,
			font: FloatChartNode.charFont,
			border: 'white',
			borderWidth: 2 * sceneVar.flowChart.scale
		});
		let wordsPos = [messagePos[0], messagePos[1] + messagePos[3] + blockPadding, messagePos[2], (charSize + itemGap) * (this.words.length + 1) - itemGap + blockPadding * 2];
		drawBox(ctx, {
			pos: wordsPos,
			border: 'white',
			borderWidth: 2 * sceneVar.flowChart.scale
		});
		for (let i = 0; i < this.words.length + 1; i++) {
			let option = {
				pos: [wordsPos[0] + blockPadding, wordsPos[1] + blockPadding + (charSize + itemGap) * i, wordsPos[2] - blockPadding * 2, charSize],
				bgc: 'white',
				fgc: 'white',
				size: charSize * 0.8
			};
			let hovered = isHover(mouse, chart) && isHover(mouse, option.pos);
			if (hovered) mouse.down = false;
			if (i === this.words.length) {
				option.text = '+';
				if (hovered && mouse.click) {
					sceneVar.flowChart.draggingNode = undefined;
					popup.search([...data.partOfSpeech.n, ...data.partOfSpeech.v], word => {
						if (word !== undefined) {
							this.words.push(word);
							reCalc = true;
						}
					});
				}
			} else {
				option.text = this.words[i];
				option.bgc = data.partOfSpeech.v.includes(this.words[i]) ? color.wordBoxV : color.wordBoxSAndO;
				if (hovered && mouse.contextMenu) {
					sceneVar.flowChart.draggingNode = undefined;
					this.words.splice(i, 1);
					// reCalc = true;
					this.calc();
				}
			}
			ctx.globalAlpha = 0.5;
			drawBox(ctx, { ...option, text: undefined });
			ctx.globalAlpha = 1;
			drawBox(ctx, { ...option, bgc: undefined });
		}
		let operationsPos = [messagePos[0], wordsPos[1] + wordsPos[3] + blockPadding, messagePos[2], (charSize + itemGap) * (this.operations.length + 1) - itemGap + blockPadding * 2];
		drawBox(ctx, {
			pos: operationsPos,
			border: 'white',
			borderWidth: 2 * sceneVar.flowChart.scale
		});
		for (let i = 0; i < this.operations.length + 1; i++) {
			let option = {
				pos: [operationsPos[0] + blockPadding, operationsPos[1] + blockPadding + (charSize + itemGap) * i, operationsPos[2] - blockPadding * 2, charSize],
				bgc: 'white',
				fgc: 'white',
				size: charSize * 0.8
			};
			let hovered = isHover(mouse, chart) && isHover(mouse, option.pos);
			if (hovered) mouse.down = false;
			if (i === this.operations.length) {
				option.text = '+';
				if (hovered && mouse.click) {
					sceneVar.flowChart.draggingNode = undefined;
					this.operations.push('');
					reCalc = true;
				}
			} else {
				option.text = this.operations[i];
				if (hovered && mouse.DBlClick) {
					console.log('edit!');
				}
				if (hovered && mouse.contextMenu) {
					sceneVar.flowChart.draggingNode = undefined;
					this.operations.splice(i, 1);
					reCalc = true;
				}
			}
			ctx.globalAlpha = 0.5;
			drawBox(ctx, { ...option, text: undefined });
			ctx.globalAlpha = 1;
			drawBox(ctx, { ...option, bgc: undefined });
		}
		if (reCalc) {
			this.calc();
		} else {
			this.update(chart);
		}
	}
}
function scene_flowChart() {
	/* init */
	if (!('flowChart' in sceneVar)) {
		sceneVar.flowChart = {};
		sceneVar.flowChart.scale = 1;
		sceneVar.flowChart.chartX = 0;
		sceneVar.flowChart.chartY = 0;
		sceneVar.flowChart.asidePage = 0;
		sceneVar.flowChart.shapeListY = 0;
		sceneVar.flowChart.title = '';
		sceneVar.flowChart.tree = [];
	}
	if (sceneChange) {
		let cellEditing = sceneVar.sheet.cellEditing;
		sceneVar.flowChart.title = [
			data.partOfSpeech.n[cellEditing[1]],
			data.partOfSpeech.v[cellEditing[0]],
			data.partOfSpeech.n[cellEditing[2]]
		].join(' - ');
		let nodeTree = sceneVar.flowChart.tree = [];
		let caseObj = data.cases[cellEditing[0]][cellEditing[1]][cellEditing[2]];
		nodeTree.push(new StartNode({ text: sceneVar.flowChart.title }));
		// caseObj.start
		nodeTree.push(new DialogNode({}));
		caseObj.dialogList.forEach(dialog => {
			nodeTree.push(new DialogNode({ dialog }));
		});
		// caseObj.circumstanceList
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
	let [cellWidth, cellHeight] = [180, 60].map(n => n * sceneVar.flowChart.scale);
	// let chartSize = data.partOfSpeech.n.length + 1;
	// let cellGap = 5;
	// let cellBorderWidth = 2;
	// sceneVar.flowChart.chartX = Math.min(Math.max(sceneVar.flowChart.chartX, -(((cellWidth + cellGap) * (chartSize - 1)) - (chart[2] - cellWidth))), 0);
	// sceneVar.flowChart.chartY = Math.min(Math.max(sceneVar.flowChart.chartY, -(((cellHeight + cellGap) * (chartSize - 1)) - (chart[3] - cellHeight))), 0);

	tempCtx.chart.clearRect(0, 0, CW, CH);
	tempCtx.shapeDragging.clearRect(0, 0, CW, CH);
	let chartHovered = isHover(mouse, chart);

	for (let i = 0; i < sceneVar.flowChart.tree.length; i++) {
		let node = sceneVar.flowChart.tree[i];
		node.draw(tempCtx.chart, chart);
	}
	ctx.drawImage(tempCvs.chart, ...chart, ...chart);
	ctx.drawImage(tempCvs.shapeDragging, 0, 0);
	let backButton = [chart[0] + 20, chart[1] + 20, 50, 50];
	ctx.save();
	if (isHover(mouse, backButton)) {
		glowEffect(ctx, 'white', 2);
		if (mouse.click) {
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
	let listPadding = 10;
	let wordHeight = 30,
		wordGap = 5;
	if (sceneVar.flowChart.asidePage == 0) {
		let list = [aside[0] + asidePadding, aside[1] + pageButtonHeight + asidePadding, aside[2] - asidePadding * 2, (aside[3] - pageButtonHeight) - asidePadding * 2];
		drawBox(ctx, {
			pos: list,
			bgc: color.buttonBgc,
			border: 'white',
			borderWidth: 1
		});
	} else if (sceneVar.flowChart.asidePage == 1) {
		let list = [aside[0] + asidePadding, aside[1] + pageButtonHeight + asidePadding, aside[2] - asidePadding * 2, (aside[3] - pageButtonHeight) - asidePadding * 2];
		drawBox(ctx, {
			pos: list,
			bgc: color.buttonBgc,
			border: 'white',
			borderWidth: 1
		});
	}

	drawBox(ctx, {
		pos: header,
		bgc: '#313131',
		fgc: 'white',
		text: '< 文字獄 - 後台 >',
		size: 30
	});
	drawPoliigon(ctx, {
		points: [[header[0], header[1] + header[3] - 5 / 2], [header[0] + header[2], header[1] + header[3] - 5 / 2]],
		lineWidth: 2,
		stroke: 'white'
	});
}

/* main loop */
function loop() {
	currentTime = Date.now();
	let mouseData = JSON.stringify(mouse);
	if (mouseData != lastMouseData || CW !== cvs.width || CH !== cvs.height) {
		[CW, CH] = [cvs.width, cvs.height];
		popup.setEvent({ mouse });
		if (lastScene != currentScene) {
			sceneChange = true;
			lastScene = currentScene;
		}
		currentScene();
		sceneChange = false;
		// console.log('rendered!');
		popup.draw();
		mouse.click = mouse.DBlClick = mouse.contextMenu = mouse.down = mouse.up = false;
		mouse.deltaX = mouse.deltaY = mouse.deltaZ = mouse.deltaZoom = 0;
		mouse.screenshot = false;
	}
	lastMouseData = mouseData;
	setTimeout(loop, 30);
}
loop();