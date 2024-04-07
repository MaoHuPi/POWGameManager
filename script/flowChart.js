class FlowChartNode {
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
			} else if ((isHover(mouse, this.getTabScreenPos(pos)) || isHover(mouse, pos)) && mouse.down) {
				sceneVar.flowChart.draggingNode = this;
				sceneVar.flowChart.nodePosBeforeDrag = [...this.pos];
				sceneVar.flowChart.dragStartPos = [mouse.x, mouse.y];
			}
		}
	}
	draw() { }
	drawTab(ctx, screenPos, name) {
		drawBox(ctx, {
			pos: this.getTabScreenPos(screenPos),
			bgc: 'white',
			fgc: 'black',
			text: name,
			size: FlowChartNode.charSize * sceneVar.flowChart.scale * 0.6,
			font: FlowChartNode.charFont,
		});
	}
	chartVec2ScreenVec(chart, vec) {
		vec = vec.map(n => n * sceneVar.flowChart.scale);
		vec[0] += chart[0] + chart[2] / 2 + sceneVar.flowChart.chartX;
		vec[1] += chart[1] + chart[3] / 2 + sceneVar.flowChart.chartY;
		return vec;
	}
	screenVec2chartVec(chart, vec) {
		vec[0] -= chart[0] + chart[2] / 2 + sceneVar.flowChart.chartX;
		vec[1] -= chart[1] + chart[3] / 2 + sceneVar.flowChart.chartY;
		vec = vec.map(n => n / sceneVar.flowChart.scale);
		return vec;
	}
	getScreenPos(chart) {
		let pos = [...this.pos];
		pos = pos.map(n => n * sceneVar.flowChart.scale);
		pos[0] += chart[0] + chart[2] / 2 + sceneVar.flowChart.chartX;
		pos[1] += chart[1] + chart[3] / 2 + sceneVar.flowChart.chartY;
		return pos;
	}
	getTabScreenPos(screenPos) {
		let [tabWidth, tabHeight] = [60, 30].map(n => n * sceneVar.flowChart.scale);
		return [screenPos[0], screenPos[1] - tabHeight, tabWidth, tabHeight];
	}
	getDotsScreenPos(screenPos) {
		let center = [screenPos[0] + screenPos[2] / 2, screenPos[1] + screenPos[3] / 2];
		let distance = 20 * sceneVar.flowChart.scale;
		return [
			[center[0]/*                              */, screenPos[1] - distance/*                */],
			[screenPos[0] + screenPos[2] + distance/* */, center[1]/*                              */],
			[center[0]/*                              */, screenPos[1] + screenPos[3] + distance/* */],
			[screenPos[0] - distance/*                */, center[1]/*                              */]
		];
	}
	drawDots(ctx, chart, dotsScreenPos, activeDotsIndex) {
		let scale = sceneVar.flowChart.scale;
		let distance = 20 * scale;
		for (let i of activeDotsIndex) {
			let dot = dotsScreenPos[i];
			if (isHover(mouse, [dot[0] - distance, dot[1] - distance, distance * 2, distance * 2])) {
				if (mouse.down) {
					sceneVar.flowChart.connectStartData = { node: this, dotIndex: i };
					sceneVar.flowChart.connectStartPos = dot;
				}
				if (mouse.up && sceneVar.flowChart.connectStartData) {
					sceneVar.flowChart.connectEndData = { node: this, dotIndex: i };
					sceneVar.flowChart.connectEndPos = dot;
					let connectElements = [sceneVar.flowChart.connectStartData, sceneVar.flowChart.connectEndData];
					let toIndex = connectElements.map(item => item.dotIndex).indexOf(0);
					if (connectElements[0].node !== connectElements[1].node && toIndex !== -1) {
						let fromIndex = [1, 0][toIndex];
						if (connectElements[fromIndex].dotIndex !== 0) {
							connectElements[fromIndex].node.connect(connectElements[fromIndex].dotIndex, connectElements[toIndex].node);
						}
					}
				}
			}
			if (
				sceneVar.flowChart.emptyWarningSelectedDot &&
				sceneVar.flowChart.emptyWarningSelectedDot.node === this &&
				sceneVar.flowChart.emptyWarningSelectedDot.dotIndex == i
			) {
				ctx.beginPath();
				ctx.arc(...dot, 8 * scale, 0, 2 * Math.PI);
				ctx.fillStyle = color.buttonWarning;
				ctx.fill();
				if (sceneVar.flowChart.gotoEmptyWarningSelected) {
					[sceneVar.flowChart.chartX, sceneVar.flowChart.chartY] = [
						dot[0] - (chart[0] + chart[2] / 2 + sceneVar.flowChart.chartX),
						dot[1] - (chart[1] + chart[3] / 2 + sceneVar.flowChart.chartY)
					].map(n => -n);
					sceneVar.flowChart.gotoEmptyWarningSelected = false;
				}
			}
			ctx.beginPath();
			ctx.arc(...dot, 6 * scale, 0, 2 * Math.PI);
			ctx.fillStyle = 'white';
			ctx.fill();
		}
	}
}
class StartNode extends FlowChartNode {
	constructor({ text = '', then = undefined }) {
		super({ anchor: [0, 0], relativeAnchorPos: [0.5, 0.5], size: undefined, draggable: false });
		this.text = text;
		this.then = then;
		this.calc();
	}
	export() {
		let { text, then } = this;
		return { text, then };
	}
	calc() {
		let { size, lines } = calcSize({ ...FlowChartNode, sizeBOCS: [undefined, 1], text: this.text });
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
			padding: this.lines !== undefined ? FlowChartNode.padding * sceneVar.flowChart.scale : undefined,
			size: FlowChartNode.charSize * sceneVar.flowChart.scale,
			font: FlowChartNode.charFont,
			border: 'white',
			borderWidth: 5 * sceneVar.flowChart.scale
		});
		this.drawTab(ctx, pos, '起始');
		// this.update(chart);
		let dotsPos = this.getDotsScreenPos(pos);
		this.drawDots(ctx, chart, dotsPos, [2]);
		if (this.then) sceneVar.flowChart.connections.push([{ node: this, dotIndex: 2 }, { node: this.then, dotIndex: 0 }]);
		sceneVar.flowChart.nodesDots.set(this, dotsPos);
	}
	connect(fromDot, toNode) {
		if (fromDot === 2) {
			this.then = toNode;
		}
	}
}
function expressionTypeAndColor({ key1, key2 }) {
	let typeColorMap = {
		'num': '#4caf50',
		'str': '#ff5722',
		'pos': '#9c27b0',
		'tof': '#3f51b5',
		'tmp': '#607d8b',
		'var': '#607d8b'
	}
	let propTypeMap = {
		'position': 'pos',
		'opened': 'tof'
	}
	if (key1 in typeColorMap) {
		if (['tmp', 'var'].includes(key1)) {
			let variableType = key2.toString().slice(0, 3);
			if (variableType in typeColorMap && !['tmp', 'var'].includes(variableType)) {
				return { type: variableType, color: typeColorMap[variableType] };
			} else return { type: undefined, color: typeColorMap.var };
		} else return { type: key1, color: typeColorMap[key1] };
	} else if (key2 in propTypeMap) {
		let type = propTypeMap[key2];
		return { type, color: typeColorMap[type] };
	} else return { type: undefined, color: typeColorMap.var };
}
function expressionEditFunction(defaultValue, mustBeMutable = false, callBack = ({ key1, key2 }) => { }) {
	popup.search({
		dict: {
			...(!mustBeMutable ? {
				'num: 數字(number)': 'num',
				'str: 字串(string)': 'str',
				'pos: 位置(position)': 'pos',
				'tof: 布林(bool)': 'tof'
			} : {}),
			'tmp: 暫時變數(temporary variable)': 'tmp',
			'var: 遊戲變數(game variable)': 'var',
			...Object.fromEntries(Object.entries(project.partOfSpeech.n).map(([_, word]) => [`wvn: 詞卡狀態(word state) > ${word}`, `wvn.${word}`])),
			...Object.fromEntries(Object.entries(project.partOfSpeech.v).map(([_, word]) => [`wvv: 詞卡狀態(word state) > ${word}`, `wvv.${word}`]))
		}, defaultValue: defaultValue.key1, type: 'text'
	}, async res1 => {
		if (res1 !== null) {
			defaultValue = res1.value == defaultValue.key1 ? defaultValue.key2 : undefined;
			let search2CallBack = res2 => {
				if (res2 !== null) callBack({ key1: res1.value, key2: res2.value });
			}
			if (res1.value == 'tof') {
				popup.search({ dict: { '是(true)': true, '非(false)': false }, defaultValue, type: 'bool' }, search2CallBack);
			} else if (['num', 'str', 'pos'].includes(res1.value)) {
				popup.prompt({ text: `輸入「${res1.value}」類型的值：`, defaultValue }, value => {
					if (value !== null) {
						switch (res1.value) {
							case 'num':
								value = Number(value);
								break;
							case 'str':
								value = value.toString(); // 避免錯誤
								break;
							case 'pos':
								try {
									value = JSON.parse(value);
								} catch (e) { }
								if ('center' in value || 'size' in value) {
									let center = 'center' in value ? value.center : [0, 0],
										size = 'size' in value ? value.size : [0, 0];
									value = { center, size };
								}
								break;
						}
						callBack({ key1: res1.value, key2: value });
					}
				});
			} else if (res1.value == 'tmp') {
				let tmpVariableList = [];
				[...sceneVar.flowChart.flowChart.circumstanceNodeList,
				...sceneVar.flowChart.flowChart.assignmentNodeList].forEach(node => {
					[node.leftExpression,
					node.rightExpression].forEach(({ key1, key2 }) => {
						if (key1 === 'tmp') tmpVariableList.push(key2);
					});
				});
				popup.search({ list: tmpVariableList, type: 'text', defaultValue, canOutOfEntries: true }, search2CallBack);
			} else if (res1.value == 'var') {
				let varVariableList = [];
				[...project.cases.flat().flat(), sceneVar.flowChart.flowChart.export()].forEach(caseObj => {
					if (caseObj) {
						[...Object.values(caseObj.circumstance),
						...Object.values(caseObj.assignment)].forEach(node => {
							[node.leftExpression,
							node.rightExpression].forEach(({ key1, key2 }) => {
								if (key1 === 'var') varVariableList.push(key2);
							});
						});
					}
				});
				popup.search({ list: [...new Set(varVariableList)], type: 'text', defaultValue, canOutOfEntries: true }, search2CallBack);
			} else {
				let valueSplitByDot = res1.value.split('.');
				let valuePOS = valueSplitByDot.shift() == 'wvn' ? 'n' : 'v';
				let valueIndex = project.partOfSpeech[valuePOS].indexOf(valueSplitByDot.join('.'));
				let wordAttribute = project.wordAttribute[valuePOS][valueIndex];
				let stateList = [];
				if (valuePOS == 'n' && (!mustBeMutable || (mustBeMutable && wordAttribute.moveable))) stateList.push('position');
				if (wordAttribute.openable) stateList.push('opened');
				popup.search({ list: stateList, type: 'text', defaultValue }, search2CallBack);
			}
		}
	});
}
class CircumstanceNode extends FlowChartNode {
	static compTypeSymbolTable = {
		num: ['=', '<', '>'],
		str: ['=', '≈', '⊂'],
		pos: ['=', '⊆', '∩(≠∅)'],
		tof: ['=']
	}
	constructor({ anchor = [-200, 200], compType = 0, leftExpression = { key1: 'var', key2: 'num myVar' }, rightExpression = { key1: 'num', key2: '1' }, ifTrue = undefined, ifFalse = undefined }) {
		super({ anchor: anchor, relativeAnchorPos: [0.5, 0], size: undefined, draggable: true });
		this.compType = compType;
		this.leftExpression = leftExpression;
		this.rightExpression = rightExpression;
		this.ifTrue = ifTrue;
		this.ifFalse = ifFalse;
		this.calc();
	}
	export() {
		let { anchor, leftExpression, rightExpression, compType, ifTrue, ifFalse } = this;
		return { anchor, leftExpression, rightExpression, compType, ifTrue, ifFalse };
	}
	calc() {
		let { charSize, padding } = FlowChartNode;
		charSize *= 0.8;
		let blockPadding = padding / 2;
		let buttonWidth = 10 * FlowChartNode.charSize - blockPadding * 2;
		let sizeData1 = calcSize({ ...FlowChartNode, charSize, padding: blockPadding, sizeBOCS: [buttonWidth / charSize, undefined], text: `${this.leftExpression.key1}: ${this.leftExpression.key2}` });
		let sizeData2 = calcSize({ ...FlowChartNode, charSize, padding: blockPadding, sizeBOCS: [buttonWidth / charSize, undefined], text: `${this.rightExpression.key1}: ${this.rightExpression.key2}` });
		this.leftExpressionLines = sizeData1.lines;
		this.rightExpressionLines = sizeData2.lines; ``
		this.size = [
			Math.max(10 * FlowChartNode.charSize, sizeData1.size[0], sizeData2.size[0]) + padding * 2,
			padding * 3 +
			blockPadding * 8 +
			((charSize) * (1 + sizeData1.lines.length + sizeData2.lines.length))
		];
		this.pos = [
			this.anchor[0] - this.size[0] / 2, this.anchor[1],
			this.size[0], this.size[1]
		];
	}
	draw(ctx, chart) {
		let pos = this.getScreenPos(chart);
		const scale = sceneVar.flowChart.scale;
		let padding = FlowChartNode.padding * scale;
		let blockPadding = padding / 2;
		let charSize = FlowChartNode.charSize * scale;
		let reCalc = false;
		drawBox(ctx, {
			pos,
			bgc: color.buttonBgc,
			border: 'white',
			borderWidth: 5 * scale
		});
		this.drawTab(ctx, pos, '判斷');
		let boxY = pos[1] + padding;
		let typeAndColorLeft = expressionTypeAndColor(this.leftExpression),
			typeAndColorRight = expressionTypeAndColor(this.rightExpression);
		let typeEqual = (typeAndColorLeft.type && typeAndColorRight.type && typeAndColorLeft.type === typeAndColorRight.type);
		let compTypeEnable = (typeEqual && (typeAndColorLeft.type in CircumstanceNode.compTypeSymbolTable) &&
			CircumstanceNode.compTypeSymbolTable[typeAndColorLeft.type].length > this.compType);
		for (let itemData of [
			{
				text: this.leftExpressionLines,
				bgc: typeAndColorLeft.color,
				editFunction: () => {
					expressionEditFunction(this.leftExpression, false, expression => {
						this.leftExpression = expression;
						this.calc();
					});
				}
			},
			{
				text: compTypeEnable ? CircumstanceNode.compTypeSymbolTable[typeAndColorLeft.type][this.compType] : 'x',
				bgc: typeEqual ? typeAndColorLeft.color : 'white',
				editFunction: () => {
					let dict = compTypeEnable ? Object.fromEntries(Object.entries(CircumstanceNode.compTypeSymbolTable[typeAndColorLeft.type]).map(([index, symbol]) => [symbol, index])) : { 'x': 0 };
					popup.search({ dict, type: 'number' }, res => {
						if (res !== null) this.compType = res.value;
					});
				}
			},
			{
				text: this.rightExpressionLines,
				bgc: typeAndColorRight.color,
				editFunction: () => {
					expressionEditFunction(this.rightExpression, false, expression => {
						this.rightExpression = expression;
						this.calc();
					});
				}
			}
		]) {
			let boxHeight = (charSize * (typeof itemData.text == 'string' ? 1 : itemData.text.length)) + blockPadding * 2;
			let boxPos = [pos[0] + padding, boxY, pos[2] - padding * 2, boxHeight];
			drawBox(ctx, {
				pos: boxPos,
				border: 'white',
				borderWidth: 2 * scale
			});

			let option = {
				pos: [boxPos[0] + blockPadding, boxPos[1] + blockPadding, boxPos[2] - blockPadding * 2, boxPos[3] - blockPadding * 2],
				bgc: itemData.bgc ? itemData.bgc : 'white',
				fgc: 'white',
				text: itemData.text,
				size: charSize * 0.8,
				font: FlowChartNode.charFont,
				padding: charSize * 0.1
			};
			let hovered = isHover(mouse, chart) && isHover(mouse, option.pos);
			if (hovered) {
				mouse.down = false;
				if (mouse.click) {
					itemData.editFunction();
					mouse.click = false;
				}
			}
			ctx.globalAlpha = 0.5;
			drawBox(ctx, { ...option, text: undefined });
			ctx.globalAlpha = 1;
			drawBox(ctx, { ...option, bgc: undefined });

			boxY += boxPos[3] + blockPadding;
		}

		let dotsPos = this.getDotsScreenPos(pos);
		this.drawDots(ctx, chart, dotsPos, [0, 1, 3]);
		if (this.ifTrue) sceneVar.flowChart.connections.push([{ node: this, dotIndex: 1 }, { node: this.ifTrue, dotIndex: 0 }]);
		if (this.ifFalse) sceneVar.flowChart.connections.push([{ node: this, dotIndex: 3 }, { node: this.ifFalse, dotIndex: 0 }]);
		sceneVar.flowChart.nodesDots.set(this, dotsPos);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.font = `${FlowChartNode.charSize * scale * 0.6}px ${FlowChartNode.charFont}`;
		ctx.fillStyle = color.text;
		ctx.fillText('t', dotsPos[1][0], dotsPos[1][1] - 30 * scale);
		ctx.fillText('f', dotsPos[3][0], dotsPos[3][1] - 30 * scale);
		if (reCalc) {
			this.calc();
		} else {
			this.update(chart);
		}
	}
	connect(fromDot, toNode) {
		if (fromDot == 1) {
			this.ifTrue = toNode;
		} else if (fromDot == 3) {
			this.ifFalse = toNode;
		}
	}
}
class AssignmentNode extends FlowChartNode {
	static operateTypeSymbolTable = {
		num: ['=', '+=', '*=', '^=', '%='],
		str: ['=', '+='],
		pos: ['=', 'center +=', 'center =', 'size =', 'goto'],
		tof: ['=', '|=', '&=', '^='],
	}
	constructor({ anchor = [-200, 200], operateType = 0, leftExpression = { key1: 'var', key2: 'num myVar' }, rightExpression = { key1: 'num', key2: '1' }, then = undefined }) {
		super({ anchor: anchor, relativeAnchorPos: [0.5, 0], size: undefined, draggable: true });
		this.operateType = operateType;
		this.leftExpression = leftExpression;
		this.rightExpression = rightExpression;
		this.then = then;
		this.calc();
	}
	export() {
		let { anchor, leftExpression, rightExpression, operateType, then } = this;
		return { anchor, leftExpression, rightExpression, operateType, then };
	}
	calc() {
		let { charSize, padding } = FlowChartNode;
		charSize *= 0.8;
		let blockPadding = padding / 2;
		let buttonWidth = 10 * FlowChartNode.charSize - blockPadding * 2;
		let sizeData1 = calcSize({ ...FlowChartNode, charSize, padding: blockPadding, sizeBOCS: [buttonWidth / charSize, undefined], text: `${this.leftExpression.key1}: ${this.leftExpression.key2}` });
		let sizeData2 = calcSize({ ...FlowChartNode, charSize, padding: blockPadding, sizeBOCS: [buttonWidth / charSize, undefined], text: `${this.rightExpression.key1}: ${this.rightExpression.key2}` });
		this.leftExpressionLines = sizeData1.lines;
		this.rightExpressionLines = sizeData2.lines; ``
		this.size = [
			Math.max(10 * FlowChartNode.charSize, sizeData1.size[0], sizeData2.size[0]) + padding * 2,
			padding * 3 +
			blockPadding * 8 +
			((charSize) * (1 + sizeData1.lines.length + sizeData2.lines.length))
		];
		this.pos = [
			this.anchor[0] - this.size[0] / 2, this.anchor[1],
			this.size[0], this.size[1]
		];
	}
	draw(ctx, chart) {
		let pos = this.getScreenPos(chart);
		const scale = sceneVar.flowChart.scale;
		let padding = FlowChartNode.padding * scale;
		let blockPadding = padding / 2;
		let charSize = FlowChartNode.charSize * scale;
		let reCalc = false;
		drawBox(ctx, {
			pos,
			bgc: color.buttonBgc,
			border: 'white',
			borderWidth: 5 * scale
		});
		this.drawTab(ctx, pos, '操作');
		let boxY = pos[1] + padding;
		let typeAndColorLeft = expressionTypeAndColor(this.leftExpression),
			typeAndColorRight = expressionTypeAndColor(this.rightExpression);
		let typeEqual = (typeAndColorLeft.type && typeAndColorRight.type && typeAndColorLeft.type === typeAndColorRight.type);
		let operateTypeEnable = (typeEqual && (typeAndColorLeft.type in AssignmentNode.operateTypeSymbolTable) &&
			AssignmentNode.operateTypeSymbolTable[typeAndColorLeft.type].length > this.operateType);
		for (let itemData of [
			{
				text: this.leftExpressionLines,
				bgc: typeAndColorLeft.color,
				editFunction: () => {
					expressionEditFunction(this.leftExpression, true, expression => {
						this.leftExpression = expression;
						this.calc();
					});
				}
			},
			{
				text: operateTypeEnable ? AssignmentNode.operateTypeSymbolTable[typeAndColorLeft.type][this.operateType] : 'x',
				bgc: typeEqual ? typeAndColorLeft.color : 'white',
				editFunction: () => {
					let dict = operateTypeEnable ? Object.fromEntries(Object.entries(AssignmentNode.operateTypeSymbolTable[typeAndColorLeft.type]).map(([index, symbol]) => [symbol, parseInt(index)])) : { 'x': 0 };
					popup.search({ dict, type: 'number' }, res => {
						if (res !== null) this.operateType = res.value;
					});
				}
			},
			{
				text: this.rightExpressionLines,
				bgc: typeAndColorRight.color,
				editFunction: () => {
					expressionEditFunction(this.rightExpression, false, expression => {
						this.rightExpression = expression;
						this.calc();
					});
				}
			}
		]) {
			let boxHeight = (charSize * (typeof itemData.text == 'string' ? 1 : itemData.text.length)) + blockPadding * 2;
			let boxPos = [pos[0] + padding, boxY, pos[2] - padding * 2, boxHeight];
			drawBox(ctx, {
				pos: boxPos,
				border: 'white',
				borderWidth: 2 * scale
			});

			let option = {
				pos: [boxPos[0] + blockPadding, boxPos[1] + blockPadding, boxPos[2] - blockPadding * 2, boxPos[3] - blockPadding * 2],
				bgc: itemData.bgc ? itemData.bgc : 'white',
				fgc: 'white',
				text: itemData.text,
				size: charSize * 0.8,
				font: FlowChartNode.charFont,
				padding: charSize * 0.1
			};
			let hovered = isHover(mouse, chart) && isHover(mouse, option.pos);
			if (hovered) {
				mouse.down = false;
				if (mouse.click) {
					itemData.editFunction();
					mouse.click = false;
				}
			}
			ctx.globalAlpha = 0.5;
			drawBox(ctx, { ...option, text: undefined });
			ctx.globalAlpha = 1;
			drawBox(ctx, { ...option, bgc: undefined });

			boxY += boxPos[3] + blockPadding;
		}

		let dotsPos = this.getDotsScreenPos(pos);
		this.drawDots(ctx, chart, dotsPos, [0, 2]);
		if (this.then) sceneVar.flowChart.connections.push([{ node: this, dotIndex: 2 }, { node: this.then, dotIndex: 0 }]);
		sceneVar.flowChart.nodesDots.set(this, dotsPos);
		if (reCalc) {
			this.calc();
		} else {
			this.update(chart);
		}
	}
	connect(fromDot, toNode) {
		if (fromDot == 2) {
			this.then = toNode;
		}
	}
}
class DialogNode extends FlowChartNode {
	static itemGap = 10;
	constructor({ anchor = [200, 200], image = '', message = '輸入對話內容', appendWords = [], removeWords = [] }) {
		super({ anchor: anchor, relativeAnchorPos: [0.5, 0], size: undefined, draggable: true });
		this.image = image;
		this.message = message;
		this.appendWords = appendWords;
		this.removeWords = removeWords;
		this.calc();
	}
	export() {
		let { anchor, image, message, appendWords, removeWords } = this;
		return { anchor, image, message, appendWords, removeWords };
	}
	calc() {
		let { charSize, padding } = FlowChartNode;
		let blockPadding = padding / 2;
		let { size, lines } = calcSize({ ...FlowChartNode, padding: blockPadding, sizeBOCS: [10, undefined], text: this.message });
		this.size = [
			size[0] + padding * 2,
			padding * 2 +
			blockPadding * 7 +
			size[0] / 1920 * 1080 +
			size[1]/* size[1] 已含 blockPadding*2 */ +
			((charSize + DialogNode.itemGap) * (this.appendWords.length + this.removeWords.length + 1 * 2) - DialogNode.itemGap * 2)
		];
		this.messageLines = lines;
		this.pos = [
			this.anchor[0] - this.size[0] / 2, this.anchor[1],
			this.size[0], this.size[1]
		];
	}
	draw(ctx, chart) {
		let pos = this.getScreenPos(chart);
		let padding = FlowChartNode.padding * sceneVar.flowChart.scale;
		let blockPadding = padding / 2;
		let charSize = FlowChartNode.charSize * sceneVar.flowChart.scale;
		let itemGap = DialogNode.itemGap * sceneVar.flowChart.scale;
		let reCalc = false;
		drawBox(ctx, {
			pos,
			bgc: color.buttonBgc,
			border: 'white',
			borderWidth: 5 * sceneVar.flowChart.scale
		});
		this.drawTab(ctx, pos, '對話');
		let imagePos = [pos[0] + padding, pos[1] + padding, pos[2] - padding * 2, (pos[2] - padding * 2) / 1920 * 1080];
		let imageBoxText = '';
		drawBox(ctx, {
			pos: imagePos,
			bgc: 'gray'
		});
		if (this.image in project.imageDataDict) {
			ctx.drawImage(project.imageDataDict[this.image].element, ...imagePos);
		} else {
			imageBoxText = '選擇背景圖片';
			this.image = '';
		}
		drawBox(ctx, {
			pos: imagePos,
			fgc: 'white',
			text: imageBoxText,
			size: charSize,
			font: FlowChartNode.charFont,
			border: 'white',
			borderWidth: 2 * sceneVar.flowChart.scale
		});
		if (isHover(mouse, imagePos)) {
			mouse.down = false;
			if (mouse.click) {
				popup.search({ dict: project.imageDataDict, defaultValue: this.image, type: 'imageData' }, selected => {
					if (selected !== null) {
						this.image = selected.key;
						this.calc();
					}
				});
			}
		}
		let messagePos = [pos[0] + padding, imagePos[1] + imagePos[3] + blockPadding, pos[2] - padding * 2, charSize * this.messageLines.length + blockPadding * 2];
		drawBox(ctx, {
			pos: messagePos,
			fgc: 'white',
			text: this.messageLines,
			padding: blockPadding,
			size: charSize,
			font: FlowChartNode.charFont,
			border: 'white',
			borderWidth: 2 * sceneVar.flowChart.scale
		});
		if (isHover(mouse, messagePos)) {
			mouse.down = false;
			if (mouse.click) {
				popup.prompt({ text: '請輸入對話內容：', defaultValue: this.message }, newMessage => {
					if (newMessage !== null) {
						this.message = newMessage;
						this.calc();
					}
				});
			}
		}
		let appendWordsPos = [messagePos[0], messagePos[1] + messagePos[3] + blockPadding, messagePos[2], (charSize + itemGap) * (this.appendWords.length + 1) - itemGap + blockPadding * 2];
		drawBox(ctx, {
			pos: appendWordsPos,
			border: 'white',
			borderWidth: 2 * sceneVar.flowChart.scale
		});
		for (let i = 0; i < this.appendWords.length + 1; i++) {
			let option = {
				pos: [appendWordsPos[0] + blockPadding, appendWordsPos[1] + blockPadding + (charSize + itemGap) * i, appendWordsPos[2] - blockPadding * 2, charSize],
				bgc: 'white',
				fgc: 'white',
				size: charSize * 0.8
			};
			let hovered = isHover(mouse, chart) && isHover(mouse, option.pos);
			if (hovered) mouse.down = false;
			if (i === this.appendWords.length) {
				option.text = '[+] 獲取詞卡';
				if (hovered && mouse.click) {
					sceneVar.flowChart.draggingNode = undefined;
					mouse.click = false;
					popup.search({ list: [...project.partOfSpeech.n, ...project.partOfSpeech.v], type: 'string' }, selected => {
						if (selected !== null) {
							this.appendWords.push(selected.value);
							this.calc();
						}
					});
				}
			} else {
				option.text = this.appendWords[i];
				option.bgc = project.partOfSpeech.v.includes(this.appendWords[i]) ? color.wordBoxV : color.wordBoxSAndO;
				if (hovered && mouse.contextMenu) {
					sceneVar.flowChart.draggingNode = undefined;
					this.appendWords.splice(i, 1);
					reCalc = true;
					mouse.contextMenu = false;
				}
			}
			ctx.globalAlpha = 0.5;
			drawBox(ctx, { ...option, text: undefined });
			ctx.globalAlpha = 1;
			drawBox(ctx, { ...option, bgc: undefined });
		}
		let removeWordsPos = [messagePos[0], appendWordsPos[1] + appendWordsPos[3] + blockPadding, messagePos[2], (charSize + itemGap) * (this.removeWords.length + 1) - itemGap + blockPadding * 2];
		drawBox(ctx, {
			pos: removeWordsPos,
			border: 'white',
			borderWidth: 2 * sceneVar.flowChart.scale
		});
		for (let i = 0; i < this.removeWords.length + 1; i++) {
			let option = {
				pos: [removeWordsPos[0] + blockPadding, removeWordsPos[1] + blockPadding + (charSize + itemGap) * i, removeWordsPos[2] - blockPadding * 2, charSize],
				bgc: 'white',
				fgc: 'white',
				size: charSize * 0.8
			};
			let hovered = isHover(mouse, chart) && isHover(mouse, option.pos);
			if (hovered) mouse.down = false;
			if (i === this.removeWords.length) {
				option.text = '[+] 收回詞卡';
				if (hovered && mouse.click) {
					sceneVar.flowChart.draggingNode = undefined;
					mouse.click = false;
					popup.search({ list: [...project.partOfSpeech.n, ...project.partOfSpeech.v], type: 'string' }, selected => {
						if (selected !== null) {
							this.removeWords.push(selected.value);
							this.calc();
						}
					});
				}
			} else {
				option.text = this.removeWords[i];
				option.bgc = project.partOfSpeech.v.includes(this.removeWords[i]) ? color.wordBoxV : color.wordBoxSAndO;
				if (hovered && mouse.contextMenu) {
					sceneVar.flowChart.draggingNode = undefined;
					this.removeWords.splice(i, 1);
					reCalc = true;
					mouse.contextMenu = false;
				}
			}
			ctx.globalAlpha = 0.5;
			drawBox(ctx, { ...option, text: undefined });
			ctx.globalAlpha = 1;
			drawBox(ctx, { ...option, bgc: undefined });
		}
		let dotsPos = this.getDotsScreenPos(pos);
		this.drawDots(ctx, chart, dotsPos, [0]);
		sceneVar.flowChart.nodesDots.set(this, dotsPos);
		if (reCalc) {
			this.calc();
		} else {
			this.update(chart);
		}
	}
}
class FlowChart {
	static exportEmpty() {
		return {
			start: undefined,
			dialog: {},
			circumstance: {},
			assignment: {}
		}
	}
	static statusMap = new WeakMap();
	static updateStatus(flowChart) {
		let json = undefined;
		try { json = JSON.stringify(flowChart); } catch (e) { }
		if (json !== undefined) {
			FlowChart.statusMap.set(flowChart, json);
		}
	}
	static statusChanged(flowChart) {
		let json = undefined;
		try { json = JSON.stringify(flowChart); } catch (e) { }
		return json !== undefined && FlowChart.statusMap.get(flowChart) !== json;
	}
	constructor({
		title = 'Title',
		start = undefined,
		dialog = {},
		circumstance = {},
		assignment = {}
	} = {}) {
		function generateNode(dataList, nodeClass) {
			return Object.entries(dataList).map(([id, nodeData]) => [id, { data: nodeData, node: new nodeClass(nodeData) }]);
		}
		let dialogNodeListWithId = generateNode(dialog, DialogNode);
		let circumstanceNodeListWithId = generateNode(circumstance, CircumstanceNode);
		let assignmentNodeListWithId = generateNode(assignment, AssignmentNode);
		let id2nodeDataList = Object.fromEntries([
			...dialogNodeListWithId,
			...circumstanceNodeListWithId,
			...assignmentNodeListWithId
		]);
		function id2Node(nodeData) {
			for (let key in nodeData) {
				if (['then', 'ifTrue', 'ifFalse'].includes(key) && !([undefined, null].includes(nodeData[key]))) {
					nodeData[key] = id2nodeDataList[nodeData[key]].node;
				}
			}
			return nodeData;
		}
		function id2NodeBindNode(nodeData, node) {
			nodeData = id2Node(nodeData);
			for (let key in nodeData) {
				node[key] = nodeData[key];
			}
			return node;
		}
		this.startNode = new StartNode(id2Node({ text: title, then: start }));
		this.dialogNodeList = dialogNodeListWithId.map(([_, { data, node }]) => id2NodeBindNode(data, node));
		this.circumstanceNodeList = circumstanceNodeListWithId.map(([_, { data, node }]) => id2NodeBindNode(data, node));
		this.assignmentNodeList = assignmentNodeListWithId.map(([_, { data, node }]) => id2NodeBindNode(data, node));
		this.catch = {};
	}
	export() {
		let node2idList = new Map(Object.entries([
			...this.dialogNodeList,
			...this.circumstanceNodeList,
			...this.assignmentNodeList
		]).map(IVPair => [IVPair[1], parseInt(IVPair[0])]))
		function node2Id(node) {
			let nodeId = node2idList.get(node);
			let nodeData = node.export();
			for (let key in nodeData) {
				if (nodeData[key] instanceof FlowChartNode) {
					nodeData[key] = node2idList.get(nodeData[key]);
				}
			}
			return [nodeId, nodeData];
		}
		return {
			start: node2Id(this.startNode)[1].then,
			dialog: Object.fromEntries(this.dialogNodeList.map(node2Id)),
			circumstance: Object.fromEntries(this.circumstanceNodeList.map(node2Id)),
			assignment: Object.fromEntries(this.assignmentNodeList.map(node2Id))
		};
	}
	draw({ ctx, chart }) {
		let nodeList = [
			this.startNode,
			...this.dialogNodeList,
			...this.circumstanceNodeList,
			...this.assignmentNodeList
		];
		sceneVar.flowChart.connections = [];
		sceneVar.flowChart.nodesDots = new Map();

		tempCtx.chart.clearRect(0, 0, CW, CH);
		tempCtx.nodeDragging.clearRect(0, 0, CW, CH);

		for (let i = 0; i < nodeList.length; i++) {
			let node = nodeList[i];
			let targetCtx = sceneVar.flowChart.draggingNode === node ? tempCtx.nodeDragging : tempCtx.chart;
			node.draw(targetCtx, chart);
		}
		tempCtx.chart.lineWidth = 5 * sceneVar.flowChart.scale;
		for (let connection of sceneVar.flowChart.connections) {
			let nodesDots1 = sceneVar.flowChart.nodesDots.get(connection[0].node),
				nodesDots2 = sceneVar.flowChart.nodesDots.get(connection[1].node);
			if (!nodesDots2) {
				connection[0].node.connect(connection[0].dotIndex, undefined);
			} else {
				let dot1 = nodesDots1[connection[0].dotIndex],
					dot2 = nodesDots2[connection[1].dotIndex];
				tempCtx.chart.beginPath();
				tempCtx.chart.moveTo(...dot1);
				tempCtx.chart.lineTo(...dot2);
				tempCtx.chart.stroke();
			}
		}
		if (sceneVar.flowChart.connectStartPos) {
			tempCtx.chart.beginPath();
			tempCtx.chart.moveTo(...sceneVar.flowChart.connectStartPos);
			tempCtx.chart.lineTo(mouse.x, mouse.y);
			tempCtx.chart.stroke();
		}

		if (isHover(mouse, chart) && mouse.down && sceneVar.flowChart.draggingNode == undefined) {
			sceneVar.flowChart.dragStartPos = [mouse.x, mouse.y];
			sceneVar.flowChart.mouseSelecting = true;
		}
		if (mouse.up && sceneVar.flowChart.mouseSelecting) {
			sceneVar.flowChart.mouseSelecting = false
		};
		if (sceneVar.flowChart.mouseSelecting) {
			let mouseDownPos = sceneVar.flowChart.dragStartPos;
			let selectRect = [mouseDownPos[0], mouseDownPos[1], mouse.x - mouseDownPos[0], mouse.y - mouseDownPos[1]];
			drawBox(tempCtx.chart, {
				pos: selectRect,
				bgc: color.wordBoxSAndO + '55',
				border: color.wordBoxSAndO,
				borderWidth: 2,
			});
		}

		ctx.drawImage(tempCvs.chart, ...chart, ...chart);
		ctx.drawImage(tempCvs.nodeDragging, ...chart, ...chart);
		tempCtx.nodeDragging.clearRect(...chart);
		ctx.globalAlpha = 0.5;
		ctx.drawImage(tempCvs.nodeDragging, 0, 0);
		ctx.globalAlpha = 1;
	}
	getLoneDotsAndUnconnectedNodes() {
		if (FlowChart.statusChanged(this) || !('loneDots' in this.catch && 'unconnectedNodes' in this.catch)) {
			function getConnected(node) {
				if (node instanceof StartNode) {
					return { 2: node.then };
				} else if (node instanceof CircumstanceNode) {
					return { 1: node.ifTrue, 3: node.ifFalse };
				} else if (node instanceof DialogNode) {
					return {}
				} else if (node instanceof AssignmentNode) {
					return { 2: node.then };
				}
			}
			let loneDots = [];
			let checkedNodes = [];
			let toCheckNodes = [this.startNode];
			while (toCheckNodes.length > 0) {
				let node = toCheckNodes.shift();
				if (!checkedNodes.includes(node)) {
					let connected = getConnected(node);
					for (let i in connected) {
						if (!(connected[i] instanceof FlowChartNode)) {
							loneDots.push({ node: node, dotIndex: i });
						}
					}
					toCheckNodes.push(...Object.values(connected).filter(item => item instanceof FlowChartNode));
					checkedNodes.push(node);
				}
			}
			let unconnectedNodes = [
				this.startNode,
				...this.circumstanceNodeList,
				...this.dialogNodeList,
				...this.assignmentNodeList
			].filter(node => !checkedNodes.includes(node));
			FlowChart.updateStatus(this);
			[this.catch.loneDots, this.catch.unconnectedNodes] = [loneDots, unconnectedNodes]
			return { loneDots, unconnectedNodes };
		} else {
			let { loneDots, unconnectedNodes } = this.catch;
			return { loneDots, unconnectedNodes };
		}
	}
}