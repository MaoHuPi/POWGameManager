/* global varible declare and initialize */
const cvs = document.querySelector('#viewCanvas'),
	ctx = cvs.getContext('2d');
const cvsDataUrlHead = cvs.toDataURL('image/png').split(',')[0] + ',';
[cvs.width, cvs.height] = [window.innerWidth, window.innerHeight];
const tempCvs = {}, tempCtx = {};
['gridTitle', 'gridValue', 'nounList', 'verbList'].forEach(key => {
	tempCvs[key] = document.createElement('canvas');
	tempCtx[key] = tempCvs[key].getContext('2d');
	[tempCvs[key].width, tempCvs[key].height] = [window.innerWidth, window.innerHeight];
});
Object.entries({
	'chart': 'gridValue',
	'nodeDragging': 'gridTitle',
	'asideList': 'nounList',
	'map': 'gridValue',
	'posDragging': 'gridTitle',
}).forEach(KVPair => {
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
function clearSceneVar() {
	for (let key in sceneVar) {
		delete sceneVar[key];
	}
	sceneVar.global = {};
}
clearSceneVar();

const popup = new Popup(ctx);

class Project {
	constructor({
		partOfSpeech = { n: [], v: [] },
		cases = [],
		imageDataDict = {},
		wordAttribute = { n: [], v: [] },
		init = FlowChart.exportEmpty(),
		defaultCase = FlowChart.exportEmpty()
	} = {}) {
		this.partOfSpeech = partOfSpeech;
		this.cases = cases;
		this.imageDataDict = imageDataDict;
		this.init = init;
		this.defaultCase = defaultCase;
		Object.keys(partOfSpeech).forEach(POS => {
			if (!(POS in wordAttribute)) wordAttribute[POS] = [];
			partOfSpeech[POS].map((n, i) => {
				if (!wordAttribute[POS][i]) wordAttribute[POS][i] = {};
			})
		});
		this.wordAttribute = wordAttribute;
	}
	export() {
		let { partOfSpeech, cases, imageDataDict, wordAttribute, init, defaultCase } = this;
		return { partOfSpeech, cases, imageDataDict, wordAttribute, init, defaultCase };
	}
	static async fromZip(zip) {
		if (!zip instanceof JSZip) return;
		if (!zip.file('project.json')) return;
		let json = await zip.file('project.json').async('string');
		let jsonData = JSON.parse(json);
		let imageDataDict = {};
		if (zip.folder('image')) {
			let fileNameList = zip.file(/image\/.*/);
			let cvs = document.createElement('canvas'),
				ctx = cvs.getContext(`2d`);
			for (let file of fileNameList) {
				let base64 = await file.async('base64');

				let element = new Image();
				element.src = `${cvsDataUrlHead}${base64}`;
				let fileNameWithoutExtension = file.name.split('/').pop().split('.');
				fileNameWithoutExtension.pop();
				fileNameWithoutExtension = fileNameWithoutExtension.join('.');

				imageDataDict[fileNameWithoutExtension] = { element, base64 };
			}
		}
		return new Project({ ...jsonData, imageDataDict });;
	}
	toZip() {
		let jsonData = this.export();
		let imageDataDict = jsonData.imageDataDict;
		delete jsonData.imageDataDict;

		const cvs = document.createElement('canvas'),
			ctx = cvs.getContext('2d');

		let zip = new JSZip();
		zip.file('project.json', JSON.stringify(jsonData));
		let imageDir = zip.folder('image');
		Object.entries(imageDataDict).forEach(([name, imageData]) => {
			let imageBase64;
			if (imageData.base64) {
				imageBase64 = imageData.base64;
			} else {
				[cvs.width, cvs.height] = [imageData.element.width, imageData.element.height];
				ctx.drawImage(imageData.element, 0, 0);
				imageBase64 = cvs.toDataURL('image/png').replace(cvsDataUrlHead, '');
			}
			imageDir.file(name + '.png', imageBase64, { base64: true });
		});

		return zip;
	}
}
let project = new Project();
// project.partOfSpeech = {
// 	n: ['1', '2'], v: ['a']
// };
// project.wordAttribute = {
// 	n: [{}, {}], v: [{}]
// };
// project.cases = NDArray([1, 2, 2], ([i1, i2, i3]) => i2 != i3 ? FlowChart.exportEmpty() : undefined);
// (async () => {
// 	project.imageDataDict['headerButton'] = { element: await getImage('image/headerButton.png'), buffer: undefined };
// })();

let projectName = 'project.pow';
function updateEditingFlowChartToProject() {
	if (sceneVar.sheet?.cellEditing && sceneVar.flowChart?.flowChart) {
		let cellEditing = sceneVar.sheet.cellEditing;
		if (cellEditing[0] == -1 && cellEditing[1] == -1 && cellEditing[2] == -1) {
			project.init = sceneVar.flowChart.flowChart.export();
		} else if (cellEditing[0] == -2 && cellEditing[1] == -2 && cellEditing[2] == -2) {
			project.defaultCase = sceneVar.flowChart.flowChart.export();
		} else {
			project.cases[cellEditing[0]][cellEditing[1]][cellEditing[2]] = sceneVar.flowChart.flowChart.export();
		}
	}
}
async function importProject(file) {
	let zip = await JSZip.loadAsync(file);
	project = await Project.fromZip(zip);
}
async function exportProject() {
	let zip = project.toZip();
	let dataBuffer = await zip.generateAsync({
		type: 'arrayBuffer',
	});
	await saveFile(dataBuffer, projectName);
}
function changeProjectName(newName) {
	projectName = newName;
}
function newProject() {
	currentScene = scene_sheet;
	clearSceneVar();
	project = new Project();
	window.fileEntry = undefined;
}
async function openProject() {
	let lastProject = project;
	await openFile();
	if (project !== lastProject) {
		currentScene = scene_sheet;
		clearSceneVar();
	}
}
async function saveProject() {
	if (currentScene == scene_flowChart) {
		updateEditingFlowChartToProject();
	} else if (currentScene == scene_attribute) {
		project.wordAttribute[sceneVar.sheet.wordEditingPOS][sceneVar.sheet.wordEditing] = sceneVar.attribute.attributeData;
	}
	await exportProject();
}
async function editProjectInit() {
	updateEditingFlowChartToProject();
	sceneVar.sheet.cellEditing = [-1, -1, -1];
	lastScene = scene_sheet;
	currentScene = scene_flowChart;
}
async function editProjectDefaultCase() {
	updateEditingFlowChartToProject();
	sceneVar.sheet.cellEditing = [-2, -2, -2];
	lastScene = scene_sheet;
	currentScene = scene_flowChart;
}

const color = {
	buttonHover: 'white',
	buttonDefault: '#b5986a',
	buttonDisabled: 'gray',
	buttonBgc: '#00000055',
	wordBoxSAndO: '#ffc107',
	wordBoxV: '#ff5722',
	buttonWarning: '#03a9f4',
	selectedNode: '#ffffff'
};

let currentScene = async () => { };
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
		mouse.deltaZoom += keyboard.Control == true ? event.deltaY / 10 : event.deltaY;
	} else if (event.shiftKey) {
		mouse.deltaX += event.deltaY;
	} else {
		mouse.deltaX += event.deltaX;
		mouse.deltaY += event.deltaY;
		mouse.deltaZ += event.deltaZ;
	}
});
const keyboard = {};
function updateKeyboard(event, setValue) {
	let preventDefaultKeys = ['Enter', 'Escape', 'Tab', 'ArrowUp', 'ArrowDown'];
	if (preventDefaultKeys.includes(event.key)) event.preventDefault();
	if (event.ctrlKey && ['=', '+', '-', '_', '0'].includes(event.key)) {
		event.preventDefault();
		if (event.key == '0') {
			sceneVar[({
				scene_sheet: 'sheet',
				scene_flowChart: 'flowChart',
				scene_attribute: 'attribute'
			}[currentScene.name])].scale = 1;
		} else if (['=', '+'].includes(event.key)) {
			mouse.deltaZoom = -10;
		} else if (['-', '_'].includes(event.key)) {
			mouse.deltaZoom = 10;
		}
	}
	keyboard[event.key] = setValue;
	keyboard.Control = event.ctrlKey;
	keyboard.Shift = event.shiftKey;
	keyboard.Alt = event.altKey;
}
window.addEventListener('copy', () => {
	keyboard.Copy = true;
});
window.addEventListener('cut', () => {
	keyboard.Cut = true;
});
window.addEventListener('paste', event => {
	let pasteContent = (event.clipboardData || window.clipboardData).getData("text");
	keyboard.Paste = pasteContent;
});
window.addEventListener('keydown', event => { updateKeyboard(event, true) });
window.addEventListener('keyup', event => { updateKeyboard(event, false) });

/* draw element method */
// move to basic.js to share with popup.js

/* data control method */
function wordExist(word) {
	return project.partOfSpeech.n.includes(word) || project.partOfSpeech.v.includes(word);
}
function wordAdd({ POS }) {
	popup.prompt({ text: '請輸入新詞卡的名稱：' }, newWord => {
		if (newWord === null) return;
		if (wordExist(newWord)) {
			popup.alert('您輸入的名稱已存在，詞卡新增失敗。');
		} else {
			let oldNLength = project.partOfSpeech.n.length;
			project.partOfSpeech[POS].push(newWord);
			project.wordAttribute[POS].push({})
			if (POS == 'v') {
				project.cases.push(NDArray([oldNLength, oldNLength], ([i1, i2]) => i1 != i2 ? FlowChart.exportEmpty() : undefined));
			} else {
				project.cases.forEach(vList => {
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
	let oldName = project.partOfSpeech[POS][index]
	popup.prompt({ text: `請輸入「${oldName}」的新名稱：` }, newName => {
		if (newName === null) return;
		if (wordExist(newName)) {
			if (newName == oldName) {
				popup.alert('新、舊名稱相同。');
			} else {
				popup.alert('您輸入的名稱已存在，名稱更改失敗。');
			}
		} else {
			project.partOfSpeech[POS].splice(index, 1, newName);
			['cases', 'init', 'defaultCase'].forEach(casesKey => {
				project[casesKey] = JSON.parse(JSON.stringify(project[casesKey]).replaceAll(`"wv${POS}.${oldName}"`, `"wv${POS}.${newName}"`));
			});
		}
	});
}
function wordDelete({ POS, index, listName }) {
	let oldName = project.partOfSpeech[POS][index];
	popup.confirm(`確定刪除「${oldName}」？`, res => {
		if (res) {
			project.partOfSpeech[POS].splice(index, 1);
			project.wordAttribute[POS].splice(index, 1);
			sceneVar.sheet[listName + 'Selected'] = false;
			if (POS == 'v') {
				project.cases.splice(index, 1);
			} else {
				project.cases.forEach(vList => {
					vList.splice(index, 1);
					vList.forEach(sList => sList.splice(index, 1));
				});
			}
			['cases', 'init', 'defaultCase'].forEach(casesKey => {
				project[casesKey] = JSON.parse(JSON.stringify(project[casesKey]).replaceAll(`"wv${POS}.${oldName}"`, `"str"`));
			});
		}
	});
}
function wordAttribute({ POS, index }) {
	// popup.alert('詞卡屬性設定與編輯功能尚未完成，敬請期待！');
	sceneVar.sheet.wordEditingPOS = POS;
	sceneVar.sheet.wordEditing = index;
	currentScene = scene_attribute;
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
async function allScene() {
	let header = [0, 0, CW, 70];
	drawBox(ctx, {
		pos: header,
		bgc: '#313131',
		// fgc: 'white',
		// text: '< POW Game Manager >',
		// size: 30
	});

	drawPoliigon(ctx, {
		points: [[header[0], header[1] + header[3] - 5 / 2], [header[0] + header[2], header[1] + header[3] - 5 / 2]],
		lineWidth: 2,
		stroke: 'white'
	});

	let logoImage = await getImage('image/logo_withoutBackground.png');
	let logo = [0, 5, , header[3] * 1.2];
	logo[2] = logo[3] / logoImage.height * logoImage.width;
	logo[0] = (CW - logo[2]) / 2;
	ctx.drawImage(logoImage, ...logo);

	for (let option of [
		{ // new project
			pos: [header[0], header[1], header[3], header[3]],
			bgiClip: [0, 0, 16, 16],
			mouseClickListener: newProject
		},
		{ // open project
			pos: [header[0] + header[3], header[1], header[3], header[3]],
			bgiClip: [16, 0, 16, 16],
			mouseClickListener: openProject
		},
		{ // save project
			pos: [header[0] + header[3] * 2, header[1], header[3], header[3]],
			bgiClip: [16 * 2, 0, 16, 16],
			mouseClickListener: saveProject
		},
		{ // edit project init
			pos: [header[0] + header[3] * 3, header[1], header[3], header[3]],
			bgiClip: [16 * 3, 0, 16, 16],
			mouseClickListener: editProjectInit
		},
		{ // edit project default case
			pos: [header[0] + header[3] * 4, header[1], header[3], header[3]],
			bgiClip: [16 * 4, 0, 16, 16],
			mouseClickListener: editProjectDefaultCase
		}
	]) {
		ctx.save();
		let bgiPos = [0, 0, 0, 0];
		bgiPos[2] = bgiPos[3] = Math.min(option.pos[2], option.pos[3]) * 0.8;
		bgiPos[0] = option.pos[0] + (option.pos[2] - bgiPos[2]) / 2;
		bgiPos[1] = option.pos[1] + (option.pos[3] - bgiPos[3]) / 2;
		ctx.imageSmoothingEnabled = false;
		if (isHover(mouse, option.pos)) {
			glowEffect(ctx, 'white', 20);
			if (option.mouseClickListener && mouse.click) {
				option.mouseClickListener();
			}
		} else {
			glowEffect(ctx, 'white', 0);
		}
		ctx.drawImage(await getImage('image/headerButton.png'), ...option.bgiClip, ...bgiPos);
		option = {
			...option,
			fgc: 'white',
			size: 30
		}
		drawBox(ctx, option);
		ctx.restore();
	}
}
async function scene_sheet() {
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

	/* warning refresh */
	let emptyCaseList = [];
	if (sceneVar.sheet.asidePage == 1 || sceneVar.sheet.emptyWarningSelectedCell !== undefined) {
		for (let vI = 0; vI < project.cases.length; vI++)
			for (let sI = 0; sI < project.cases[vI].length; sI++)
				for (let oI = 0; oI < project.cases[vI][sI].length; oI++) {
					if (project.cases[vI][sI][oI] && project.cases[vI][sI][oI].start === undefined) {
						emptyCaseList.push({
							text: `${project.partOfSpeech.n[sI]} - ${project.partOfSpeech.v[vI]} - ${project.partOfSpeech.n[oI]}`,
							s: sI, v: vI, o: oI
						});
					}
				}
		let currentAndLastSelected = [emptyCaseList[sceneVar.sheet.emptyWarningSelected], sceneVar.sheet.emptyWarningSelectedCell];
		if (
			!currentAndLastSelected[0] ||
			!currentAndLastSelected[1] ||
			currentAndLastSelected[0].text !== currentAndLastSelected[1].text
		) {
			sceneVar.sheet.emptyWarningSelected = undefined;
			sceneVar.sheet.emptyWarningSelectedCell = undefined;
		}
	}

	/* draw */
	drawBox(ctx, {
		pos: [0, 0, CW, CH],
		bgc: '#1c1c1c'
	});

	let header = [0, 0, CW, 70];
	let aside = [CW - 400, header[3], 400, CH - header[3]];

	let grid = [0, header[3], aside[0], CH - header[3]];
	if (project.partOfSpeech.n.length >= 2 && project.partOfSpeech.v.length >= 1) {
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
		let gridSize = project.partOfSpeech.n.length + 1;
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
			s = sceneVar.sheet.emptyWarningSelectedCell.s;
			v = sceneVar.sheet.emptyWarningSelectedCell.v;
			o = sceneVar.sheet.emptyWarningSelectedCell.o;
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
				if (r == c && r == 0) { // 左上角動詞欄位
					option.border = color.wordBoxV;
					option.text = project.partOfSpeech.v[sceneVar.sheet.vIndex];
					if (sceneVar.global.gotoType == 'v') {
						option.bgc = option.border;
						option.fgc = 'black';
					}
				} else if (r == 0 || c == 0) { // 左側主詞 與 上方受詞 欄位
					targetCtx = tempCtx.gridTitle;
					if (i == r) {
						option.pos[1] += dY;
					} else {
						option.pos[0] += dX;
					}
					let cellHovered = gridHovered && isHover(mouse, cell);
					option.text = project.partOfSpeech.n[rI - 1];
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
					if (rI - 1 < 0 || rI > project.partOfSpeech.n.length) {
						if (cellHovered) sceneVar.sheet.hoveredCell = [false, false];
						continue;
					};
				} else { // 內部格子
					targetCtx = tempCtx.gridValue;
					option.pos[1] += dY;
					option.pos[0] += dX;
					let cellHovered = isHover(mouse, gridValuePos) && isHover(mouse, cell);
					if (rR == rC) {
						option.bgc = '#313131';
					} else {
						try {
							let caseNow = project.cases[sceneVar.sheet.vIndex][rR - 1][rC - 1];
							if (caseNow && caseNow.dialog !== undefined) {
								let nodeCount = ['circumstance', 'assignment', 'dialog'].map(key => Object.keys(caseNow[key]).length)
								if (nodeCount.reduce((s, n) => s + n) > 0) {
									option.text = nodeCount.join(',');
								}
							};
						} catch (error) { }
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
						sceneVar.sheet.emptyWarningSelectedCell &&
						sceneVar.sheet.vIndex === sceneVar.sheet.emptyWarningSelectedCell.v &&
						rR - 1 === sceneVar.sheet.emptyWarningSelectedCell.s &&
						rC - 1 === sceneVar.sheet.emptyWarningSelectedCell.o
					) {
						option.border = color.buttonWarning;
					}
					if (Math.min(rR, rC) - 1 < 0 || Math.max(rR, rC) > project.partOfSpeech.n.length) {
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
	} else {
		drawBox(ctx, {
			pos: grid,
			fgc: 'gray',
			text: '至少存在2個以上的名詞詞卡、1個以上的動詞詞卡，方可使用動作編輯表。',
			size: CW * 0.015
		})
	}

	drawBox(ctx, {
		pos: aside,
		bgc: '#1e1e1e'
	});
	let pageButtonHeight = 50;
	[
		{
			pos: [aside[0], aside[1], aside[2] / 2, pageButtonHeight],
			text: '詞卡總覽',
		},
		{
			pos: [aside[0] + aside[2] / 2, aside[1], aside[2] / 2, pageButtonHeight],
			text: '空缺提示',
		}
	].map((pageButton, i) => {
		pageButton.size = 20;
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
				itemList: project.partOfSpeech[listPOS],
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
							popup.alert(`請先選擇${listPOS == 'v' ? '動詞' : '名詞'}詞卡！`);
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
		drawList({
			targetCvs: tempCvs.asideList,
			targetCtx: tempCtx.asideList,
			list: list,
			getSetScrollY: value => { return value !== undefined ? (sceneVar.sheet.emptyWarningY = value) : sceneVar.sheet.emptyWarningY },
			itemList: emptyCaseList,
			itemBgc: color.buttonWarning,
			itemTextFormat: ({ item }) => item.text,
			itemClickListener: ({ index, item }) => {
				sceneVar.sheet.emptyWarningSelected = index;
				sceneVar.sheet.emptyWarningSelectedCell = item;
				sceneVar.sheet.gotoEmptyWarningSelected = true;
			},
			itemSelected: ({ index }) => index === sceneVar.sheet.emptyWarningSelected,
			listPadding: 10, itemHeight: 30, itemGap: 5,
		});
	}
	drawPoliigon(ctx, {
		points: [[aside[0] + 5 / 2, aside[1]], [aside[0] + 5 / 2, aside[1] + aside[3]]],
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
		sceneVar.flowChart.imageListY = 0;
		sceneVar.flowChart.emptyWarningY = 0;
		sceneVar.flowChart.selectedNodeList = new Set();;
	}
	if (sceneChange) {
		let cellEditing = sceneVar.sheet.cellEditing;
		if (cellEditing[0] == -1 && cellEditing[1] == -1 && cellEditing[2] == -1) {
			sceneVar.flowChart.title = 'project init';
			sceneVar.flowChart.flowChart = new FlowChart({
				title: sceneVar.flowChart.title,
				...project.init
			});
		} else if (cellEditing[0] == -2 && cellEditing[1] == -2 && cellEditing[2] == -2) {
			sceneVar.flowChart.title = 'project default case';
			sceneVar.flowChart.flowChart = new FlowChart({
				title: sceneVar.flowChart.title,
				...project.defaultCase
			});
		} else {
			sceneVar.flowChart.title = [
				project.partOfSpeech.n[cellEditing[1]],
				project.partOfSpeech.v[cellEditing[0]],
				project.partOfSpeech.n[cellEditing[2]]
			].join(' - ');
			sceneVar.flowChart.flowChart = new FlowChart({
				title: sceneVar.flowChart.title,
				...project.cases[cellEditing[0]][cellEditing[1]][cellEditing[2]]
			});
		}
		sceneVar.flowChart.selectedNodeList.clear();
	}

	/* warning refresh */
	let loneDots = [];
	if (sceneVar.flowChart.asidePage == 2 || sceneVar.flowChart.emptyWarningSelectedDot !== undefined) {
		loneDots = sceneVar.flowChart.flowChart.getLoneDotsAndUnconnectedNodes().loneDots;
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
	let pageButtonHeight = 50;
	[
		{
			pos: [aside[0], aside[1], aside[2] / 3, pageButtonHeight],
			text: '圖卡背包',
		},
		{
			pos: [aside[0] + aside[2] / 3, aside[1], aside[2] / 3, pageButtonHeight],
			text: '圖片總覽',
		},
		{
			pos: [aside[0] + aside[2] / 3 * 2, aside[1], aside[2] / 3, pageButtonHeight],
			text: '空缺提示',
		}
	].map((pageButton, i) => {
		pageButton.size = 20;
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
	let wordHeight = 30, wordGap = 5;
	if (sceneVar.flowChart.asidePage == 0) {
		let list = [aside[0] + asidePadding, aside[1] + pageButtonHeight + asidePadding, aside[2] - asidePadding * 2, (aside[3] - pageButtonHeight) - asidePadding * 2];
		drawBox(ctx, {
			pos: list,
			bgc: color.buttonBgc,
			border: 'white',
			borderWidth: 1
		});
		let buttonHeight = list[3] / 4;
		for (let option of [
			{
				i: 0,
				text: '判斷節點',
				bgiClip: [16 * 0, 0, 16, 16],
				mouseListener: {
					type: 'down',
					func: () => {
						let nodePosBeforeDrag = [mouse.x - (chart[0] + chart[2] / 2) - sceneVar.flowChart.chartX, mouse.y - (chart[1] + chart[3] / 2) - sceneVar.flowChart.chartY].map(n => n / sceneVar.flowChart.scale);
						let node = new CircumstanceNode({ anchor: nodePosBeforeDrag });
						node.posBeforeDrag = nodePosBeforeDrag;
						sceneVar.flowChart.draggingNode = node;
						sceneVar.flowChart.dragStartPos = [mouse.x, mouse.y];
						sceneVar.flowChart.flowChart.circumstanceNodeList.push(node);
					}
				}
			},
			{
				i: 1,
				text: '操作節點',
				bgiClip: [16 * 1, 0, 16, 16],
				mouseListener: {
					type: 'down',
					func: () => {
						let nodePosBeforeDrag = [mouse.x - (chart[0] + chart[2] / 2) - sceneVar.flowChart.chartX, mouse.y - (chart[1] + chart[3] / 2) - sceneVar.flowChart.chartY].map(n => n / sceneVar.flowChart.scale);
						let node = new AssignmentNode({ anchor: nodePosBeforeDrag });
						node.posBeforeDrag = nodePosBeforeDrag;
						sceneVar.flowChart.draggingNode = node;
						sceneVar.flowChart.dragStartPos = [mouse.x, mouse.y];
						sceneVar.flowChart.flowChart.assignmentNodeList.push(node);
					}
				}
			},
			{
				i: 2,
				text: '對話節點',
				bgiClip: [16 * 2, 0, 16, 16],
				mouseListener: {
					type: 'down',
					func: () => {
						let nodePosBeforeDrag = [mouse.x - (chart[0] + chart[2] / 2) - sceneVar.flowChart.chartX, mouse.y - (chart[1] + chart[3] / 2) - sceneVar.flowChart.chartY].map(n => n / sceneVar.flowChart.scale);
						let node = new DialogNode({ anchor: nodePosBeforeDrag });
						node.posBeforeDrag = nodePosBeforeDrag;
						sceneVar.flowChart.draggingNode = node;
						sceneVar.flowChart.dragStartPos = [mouse.x, mouse.y];
						sceneVar.flowChart.flowChart.dialogNodeList.push(node);
					}
				}
			},
			{
				i: 3,
				text: '節點刪除',
				bgiClip: [16 * 3, 0, 16, 16],
				mouseListener: {
					type: 'up',
					func: () => {
						if (sceneVar.flowChart.draggingNode) {
							if (sceneVar.flowChart.selectedNodeList && sceneVar.flowChart.selectedNodeList.has(sceneVar.flowChart.draggingNode)) {
								[
									sceneVar.flowChart.flowChart.circumstanceNodeList,
									sceneVar.flowChart.flowChart.assignmentNodeList,
									sceneVar.flowChart.flowChart.dialogNodeList
								].forEach(nodeList => {
									sceneVar.flowChart.selectedNodeList.forEach(node => {
										if (nodeList.includes(node)) {
											nodeList.splice(nodeList.indexOf(node), 1);
										}
									});
								});
							} else {
								[
									sceneVar.flowChart.flowChart.circumstanceNodeList,
									sceneVar.flowChart.flowChart.assignmentNodeList,
									sceneVar.flowChart.flowChart.dialogNodeList
								].forEach(nodeList => {
									if (nodeList.includes(sceneVar.flowChart.draggingNode)) {
										nodeList.splice(nodeList.indexOf(sceneVar.flowChart.draggingNode), 1);
									}
								});
							}
						}
					}
				}
			}
		]) {
			option.pos = [list[0], list[1] + buttonHeight * option.i, list[2], buttonHeight];
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
			ctx.drawImage(await getImage('image/backpackItem.png'), ...option.bgiClip, ...bgiPos);
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
		let list = [aside[0] + asidePadding, aside[1] + pageButtonHeight + asidePadding, aside[2] - asidePadding * 2, (aside[3] - pageButtonHeight) - wordHeight - asidePadding * 3];
		drawBox(ctx, {
			pos: list,
			bgc: color.buttonBgc,
			border: 'white',
			borderWidth: 1
		});
		let buttonBox = [list[0], list[1] + list[3] + asidePadding, list[2], wordHeight * 2 + wordGap];
		let buttonWidth = (buttonBox[2] - wordGap * 2) / 3;
		let buttonList = [
			{
				pos: [buttonBox[0], buttonBox[1], buttonWidth, wordHeight], label: '上傳', selectFirst: false,
				method: () => {
					let input = document.createElement('input');
					input.type = 'file';
					input.multiple = true;
					input.setAttribute('description', '');
					input.setAttribute('accept', 'image/png, image/jpeg');
					input.onchange = async () => {
						if (input.files && input.files.length > 0) {
							for (let file of input.files) {
								let fileNameWithoutExtension = file.name.split('/').pop().split('.');
								fileNameWithoutExtension.pop();
								fileNameWithoutExtension = fileNameWithoutExtension.join('.');
								let oriFileNameWithoutExtension = fileNameWithoutExtension,
									imageNum = 1;
								while (fileNameWithoutExtension in project.imageDataDict) {
									imageNum++;
									fileNameWithoutExtension = `${oriFileNameWithoutExtension}(${imageNum})`;
								}
								let reader = new FileReader();
								reader.onload = () => {
									let image = new Image();
									image.src = reader.result;
									project.imageDataDict[fileNameWithoutExtension] = { element: image, buffer: undefined };
								}
								reader.readAsDataURL(file);
							}
						}
					}
					input.click();
				}
			},
			{
				pos: [buttonBox[0] + (buttonWidth + wordGap), buttonBox[1], buttonWidth, wordHeight], label: '改名', selectFirst: true,
				method: ({ index }) => {
					let [selectedImageName, selectedImageData] = Object.entries(project.imageDataDict)[index];
					let oldName = selectedImageName;
					popup.prompt({ text: `請輸入「${oldName}」的新名稱：` }, newName => {
						if (newName === null) return;
						if (newName in project.imageDataDict) {
							if (newName == oldName) {
								popup.alert('新、舊名稱相同。');
							} else {
								popup.alert('您輸入的名稱已存在，名稱更改失敗。');
							}
						} else {
							project.imageDataDict[newName] = selectedImageData;
							delete project.imageDataDict[oldName];
							sceneVar.flowChart.flowChart = new FlowChart({ title: sceneVar.flowChart.title, ...JSON.parse(JSON.stringify(sceneVar.flowChart.flowChart.export()).replaceAll(`"${oldName}"`, `"${newName}"`)) });
							['cases', 'init', 'defaultCase'].forEach(casesKey => {
								project[casesKey] = JSON.parse(JSON.stringify(project[casesKey]).replaceAll(`"${oldName}"`, `"${newName}"`));
							});
						}
					});
				}
			},
			{
				pos: [buttonBox[0] + (buttonWidth + wordGap) * 2, buttonBox[1], buttonWidth, wordHeight], label: '刪除', selectFirst: true,
				method: ({ index }) => {
					let [selectedImageName, selectedImageData] = Object.entries(project.imageDataDict)[index];
					popup.confirm(`確定刪除「${selectedImageName}」？`, res => {
						if (res) {
							delete project.imageDataDict[selectedImageName];
							sceneVar.flowChart.imageListSelected = false;
						}
					});
				}
			}
		];
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
					let selectedImage = sceneVar.flowChart.imageListSelected;
					if (button.selectFirst && selectedImage === false) {
						popup.alert(`請先選擇圖片！`);
					} else {
						button.method({ index: selectedImage });
					}
				}
			}
			drawBox(ctx, option);
			ctx.restore();
		});
		let imageList = Object.entries(project.imageDataDict);
		drawList({
			targetCvs: tempCvs.asideList,
			targetCtx: tempCtx.asideList,
			list: list,
			getSetScrollY: value => { return value !== undefined ? (sceneVar.flowChart.imageListY = value) : sceneVar.flowChart.imageListY },
			itemList: imageList,
			itemBgc: 'white',
			itemDecoration: ({ ctx, pos, index }) => {
				ctx.drawImage(imageList[index][1].element, ...pos);
			},
			itemTextFormat: ({ item }) => item[0],
			itemClickListener: ({ index }) => {
				sceneVar.flowChart.imageListSelected = index;
			},
			itemSelected: ({ index }) => index === sceneVar.flowChart.imageListSelected,
			listPadding: 10, itemHeight: 200, itemGap: 5,
		});
	} else if (sceneVar.flowChart.asidePage == 2) {
		let list = [aside[0] + asidePadding, aside[1] + pageButtonHeight + asidePadding, aside[2] - asidePadding * 2, (aside[3] - pageButtonHeight) - asidePadding * 2];
		drawBox(ctx, {
			pos: list,
			bgc: color.buttonBgc,
			border: 'white',
			borderWidth: 1
		});
		drawList({
			targetCvs: tempCvs.asideList,
			targetCtx: tempCtx.asideList,
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
	drawPoliigon(ctx, {
		points: [[aside[0] + 5 / 2, aside[1]], [aside[0] + 5 / 2, aside[1] + aside[3]]],
		lineWidth: 2,
		stroke: 'white'
	});

	sceneVar.flowChart.flowChart.draw({ ctx, chart });
	let backButton = [chart[0] + 20, chart[1] + 20, 50, 50];
	ctx.save();
	if (isHover(mouse, backButton)) {
		glowEffect(ctx, 'white', 2);
		if (mouse.click) {
			updateEditingFlowChartToProject();
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
async function scene_attribute() {
	/* init */
	if (!('attribute' in sceneVar)) {
		sceneVar.attribute = {};
		sceneVar.attribute.scale = 1;
		sceneVar.attribute.mapX = 0;
		sceneVar.attribute.mapY = 0;
		sceneVar.attribute.asidePage = 0;
		sceneVar.attribute.shapeListY = 0;
		sceneVar.attribute.title = '';
		sceneVar.attribute.attributeListY = 0;
	}
	if (sceneChange) {
		let wordEditing = project.partOfSpeech[sceneVar.sheet.wordEditingPOS][sceneVar.sheet.wordEditing];
		sceneVar.attribute.title = `${sceneVar.sheet.wordEditingPOS}: ${wordEditing}`;
		let attributeData = project.wordAttribute[sceneVar.sheet.wordEditingPOS][sceneVar.sheet.wordEditing];
		sceneVar.attribute.attributeData = attributeData;
		attributeData.center = 'center' in attributeData ? attributeData.center : [0, 0];
	}

	/* draw */
	drawBox(ctx, {
		pos: [0, 0, CW, CH],
		bgc: '#1c1c1c'
	});

	let header = [0, 0, CW, 70];
	let aside = [CW - 400, header[3], 400, CH - header[3]];

	let map = [0, header[3], aside[0], CH - header[3]];
	if (isHover(mouse, map)) {
		let lastScale = sceneVar.attribute.scale;
		sceneVar.attribute.scale -= mouse.deltaZoom * Math.abs(mouse.deltaZoom) / 1e4;
		sceneVar.attribute.scale = Math.min(Math.max(sceneVar.attribute.scale, 0.2), 1.5);
		let relativeMouse = [
			mouse.x - (map[0] + map[2] / 2) - (sceneVar.attribute.mapX),
			mouse.y - (map[1] + map[3] / 2) - (sceneVar.attribute.mapY)
		];
		sceneVar.attribute.mapX += relativeMouse[0] - relativeMouse[0] / lastScale * sceneVar.attribute.scale;
		sceneVar.attribute.mapY += relativeMouse[1] - relativeMouse[1] / lastScale * sceneVar.attribute.scale;
		sceneVar.attribute.mapX -= mouse.deltaX / 2;
		sceneVar.attribute.mapY -= mouse.deltaY / 2;
	}

	drawBox(ctx, {
		pos: aside,
		bgc: '#1e1e1e'
	});
	let pageButtonHeight = 50;
	[
		{
			pos: [aside[0], aside[1], aside[2] / 1, pageButtonHeight],
			text: '詞卡屬性',
		}
	].map((pageButton, i) => {
		pageButton.size = 20;
		if (i == sceneVar.attribute.asidePage) {
			pageButton.fgc = 'white';
			pageButton.bgc = 'transparent';
		} else {
			pageButton.fgc = 'gray';
			pageButton.bgc = '#3e3e3e';
		}
		if (isHover(mouse, pageButton.pos) && mouse.click) {
			sceneVar.attribute.asidePage = i;
		}
		drawBox(ctx, pageButton);
	});
	let asidePadding = 20;
	let wordHeight = 30, wordGap = 5;
	if (sceneVar.attribute.asidePage == 0) {
		let list = [aside[0] + asidePadding, aside[1] + pageButtonHeight + asidePadding, aside[2] - asidePadding * 2, (aside[3] - pageButtonHeight) - asidePadding * 2];
		drawBox(ctx, {
			pos: list,
			bgc: color.buttonBgc,
			border: 'white',
			borderWidth: 1
		});
		let attributeOptions = sceneVar.sheet.wordEditingPOS == 'n' ? [
			{ text: '可以移動', key: 'moveable' },
			{ text: '可以開關', key: 'openable' },
			{ text: '屬於區域', key: 'isArea' }
		] : [
			{ text: '屬於被動（雙受詞）', key: 'isPassive' } // 如：我 - 「被給予」 - 信封
		];
		drawList({
			targetCvs: tempCvs.asideList,
			targetCtx: tempCtx.asideList,
			list: list,
			getSetScrollY: value => { return value !== undefined ? (sceneVar.attribute.attributeListY = value) : sceneVar.attribute.attributeListY },
			itemList: attributeOptions,
			itemBgc: 'white',
			itemTextFormat: ({ item }) => `[${sceneVar.attribute.attributeData[item.key] ? 'v' : 'x'}] ${item.text}`,
			itemClickListener: ({ item }) => {
				sceneVar.attribute.attributeData[item.key] = !sceneVar.attribute.attributeData[item.key];
			},
			itemSelected: ({ item }) => sceneVar.attribute.attributeData[item.key],
			listPadding: 10, itemHeight: 30, itemGap: 5,
		});
	}
	drawPoliigon(ctx, {
		points: [[aside[0] + 5 / 2, aside[1]], [aside[0] + 5 / 2, aside[1] + aside[3]]],
		lineWidth: 2,
		stroke: 'white'
	});

	tempCtx.map.clearRect(0, 0, CW, CH);
	let editingWordPos;
	function toScreenPos({ center, size }) {
		let pos = [center[0] - size[0] / 2, center[1] - size[1] / 2, size[0], size[1]];
		pos = pos.map(n => n * sceneVar.attribute.scale);
		pos[0] += map[0] + map[2] / 2 + sceneVar.attribute.mapX;
		pos[1] += map[1] + map[3] / 2 + sceneVar.attribute.mapY;
		return pos;
	}
	let dotOption = {
		bgc: 'gray'
	}, areaOption = {
		bgc: 'transparent',
		border: 'gray',
		borderWidth: 5 * sceneVar.attribute.scale
	};
	for (let i = 0; i < project.wordAttribute.n.length; i++) {
		let word = project.partOfSpeech.n[i];
		let wordAttribute = project.wordAttribute.n[i];
		let isEditingWord = (wordAttribute === sceneVar.attribute.attributeData);
		if (!('center' in wordAttribute)) wordAttribute.center = [0, 0];
		areaOption.border = isEditingWord ? 'white' : 'gray';
		dotOption.bgc = isEditingWord ? 'white' : 'gray';
		let size;
		let option = {};
		if (wordAttribute.isArea) {
			if (!('size' in wordAttribute)) wordAttribute.size = [50, 50];
			size = wordAttribute.size;
			option = areaOption;
		} else {
			if ('size' in wordAttribute) delete wordAttribute.size;
			size = [10, 10];
			option = dotOption;
		}
		let wordPos = toScreenPos({ center: wordAttribute.center, size });
		drawBox(tempCtx.map, { ...option, pos: wordPos });
		if (isEditingWord) {
			editingWordPos = wordPos;
			if (wordAttribute.isArea) {
				if (!('size' in wordAttribute)) wordAttribute.size = [20, 20];
				drawBox(tempCtx.map, {
					...dotOption,
					pos: toScreenPos({ center: wordAttribute.center, size: [10, 10] })
				});
			}
		}
	}
	ctx.drawImage(tempCvs.map, ...map, ...map);

	/* edit center and size of editing word data */
	let wordAttribute = sceneVar.attribute.attributeData;
	if (sceneVar.sheet.wordEditingPOS === 'n' && mouse.down) {
		let halfSize = [editingWordPos[2] / 2, editingWordPos[3] / 2];
		let center = [editingWordPos[0] + halfSize[0], editingWordPos[1] + halfSize[1]];
		let toCursor = [mouse.x - center[0], mouse.y - center[1]];
		if (wordAttribute.isArea) {
			function getCrossPoint(vec, [p1, p2] /* relative vertical or horizontal line */) {
				let isVertical = p1[0] == p2[0];
				let crossPoint = [0, 0];
				let i1 = isVertical ? 0 : 1, i2 = isVertical ? 1 : 0;
				crossPoint[i1] = p1[i1];
				crossPoint[i2] = crossPoint[i1] / vec[i1] * vec[i2];
				if (
					Math.max(p1[i2], p2[i2], crossPoint[i2]) === crossPoint[i2] ||
					Math.min(p1[i2], p2[i2], crossPoint[i2]) === crossPoint[i2]
				) return;
				return crossPoint;
			}
			let relativePoints = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([wRate, hRate]) => [halfSize[0] * wRate, halfSize[1] * hRate]);
			for (let i = 0; i < relativePoints.length; i++) {
				let crossPoint = getCrossPoint(toCursor, [relativePoints[i], relativePoints[(i + 1) % relativePoints.length]]);
				if (crossPoint) {
					let cursorToEdgeDistance = vecLength([crossPoint[0] - toCursor[0], crossPoint[1] - toCursor[1]]);
					if (cursorToEdgeDistance <= 10) sceneVar.attribute.areaDraggingEdge = i;
				}
			}
		}
		if (!wordAttribute.isArea || (wordAttribute.isArea && sceneVar.attribute.areaDraggingEdge === undefined)) {
			if (vecLength(toCursor) <= 10) sceneVar.attribute.areaDraggingCenter = true;
		}
	} else { // else => !mouse.down
		let mapMousePos = [
			mouse.x - (map[0] + map[2] / 2 + sceneVar.attribute.mapX),
			mouse.y - (map[1] + map[3] / 2 + sceneVar.attribute.mapY)
		].map(n => n / sceneVar.attribute.scale);
		if (wordAttribute.isArea && sceneVar.attribute.areaDraggingEdge !== undefined) {
			let edgeIsVertical = (sceneVar.attribute.areaDraggingEdge % 2 == 1);
			let targetIndex = edgeIsVertical ? 0 : 1;
			wordAttribute.size[targetIndex] = Math.abs(mapMousePos[targetIndex] - wordAttribute.center[targetIndex]) * 2;
			if (mouse.up) sceneVar.attribute.areaDraggingEdge = undefined;
		} else if (sceneVar.attribute.areaDraggingCenter) {
			wordAttribute.center = mapMousePos;
			if (mouse.up) sceneVar.attribute.areaDraggingCenter = false;
		}
	}

	let backButton = [map[0] + 20, map[1] + 20, 50, 50];
	ctx.save();
	if (isHover(mouse, backButton)) {
		glowEffect(ctx, 'white', 2);
		if (mouse.click) {
			project.wordAttribute[sceneVar.sheet.wordEditingPOS][sceneVar.sheet.wordEditing] = sceneVar.attribute.attributeData;
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
		pos: [map[0] + (map[2] - map[2] / 2) / 2, backButton[1], map[2] / 2, backButton[3]],
		bgc: color.buttonBgc,
		fgc: 'white',
		text: sceneVar.attribute.title,
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

	// if (mouse.up) {
	// 	sceneVar.flowChart.connectStartData = undefined;
	// 	sceneVar.flowChart.connectStartPos = undefined;
	// 	sceneVar.flowChart.connectEndData = undefined;
	// 	sceneVar.flowChart.connectEndPos = undefined;
	// }
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
		await allScene();
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

/* hot keys */
window.addEventListener('keydown', event => {
	if (event.ctrlKey && !popup.show) {
		let preventDefault = true;
		let sceneVarDict;
		switch (event.key) {
			case 'o':
				openProject();
				break;
			case 's':
				saveProject();
				break;
			case 'e':
				newProject();
				break;
			case 'd':
				editProjectDefaultCase();
				break;
			case 'i':
				editProjectInit();
				break;
			case '1':
				if (currentScene == scene_attribute) sceneVarDict = sceneVar.attribute;
			case '2':
				if (currentScene == scene_sheet) sceneVarDict = sceneVar.sheet;
			case '3':
				if (currentScene == scene_flowChart) sceneVarDict = sceneVar.flowChart;
				if (sceneVarDict) sceneVarDict.asidePage = parseInt(event.key) - 1;
				// else preventDefault = false;
				break;
			default:
				preventDefault = false;
				break;
		}
		if (preventDefault) event.preventDefault();
	}
});