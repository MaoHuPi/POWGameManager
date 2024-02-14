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
class CircumstanceNode extends FlowChartNode {
	static itemGap = 10;
	constructor({ anchor = [-200, 200], conditionalStatements = [], ifTrue = undefined, ifFalse = undefined }) {
		super({ anchor: anchor, relativeAnchorPos: [0.5, 0], size: undefined, draggable: true });
		this.conditionalStatements = conditionalStatements;
		this.ifTrue = undefined;
		this.ifFalse = undefined;
		this.calc();
	}
	export() {
		let { anchor, conditionalStatements, ifTrue, ifFalse } = this;
		return { anchor, conditionalStatements, ifTrue, ifFalse };
	}
	calc() {
		let { charSize, padding } = FlowChartNode;
		let blockPadding = padding / 2;
		this.size = [
			10 * FlowChartNode.charSize + padding * 2,
			padding * 2 +
			blockPadding * 2 +
			((charSize + DialogNode.itemGap) * (this.conditionalStatements.length + 1) - DialogNode.itemGap)
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
		let itemGap = DialogNode.itemGap * scale;
		let reCalc = false;
		drawBox(ctx, {
			pos,
			bgc: color.buttonBgc,
			border: 'white',
			borderWidth: 5 * scale
		});
		this.drawTab(ctx, pos, '判斷');
		let conditionalStatementsPos = [pos[0] + padding, pos[1] + padding, pos[2] - padding * 2, (charSize + itemGap) * (this.conditionalStatements.length + 1) - itemGap + blockPadding * 2];
		drawBox(ctx, {
			pos: conditionalStatementsPos,
			border: 'white',
			borderWidth: 2 * scale
		});
		for (let i = 0; i < this.conditionalStatements.length + 1; i++) {
			let option = {
				pos: [conditionalStatementsPos[0] + blockPadding, conditionalStatementsPos[1] + blockPadding + (charSize + itemGap) * i, conditionalStatementsPos[2] - blockPadding * 2, charSize],
				bgc: 'white',
				fgc: 'white',
				size: charSize * 0.8
			};
			let hovered = isHover(mouse, chart) && isHover(mouse, option.pos);
			if (hovered) mouse.down = false;
			if (i === this.conditionalStatements.length) {
				option.text = '+';
				if (hovered && mouse.click) {
					sceneVar.flowChart.draggingNode = undefined;
					this.conditionalStatements.push('');
					reCalc = true;
					mouse.click = false;
				}
			} else {
				option.text = this.conditionalStatements[i];
				if (hovered && mouse.DBlClick) {
					console.log('edit!');
					mouse.DBlClick = false;
				}
				if (hovered && mouse.contextMenu) {
					sceneVar.flowChart.draggingNode = undefined;
					this.conditionalStatements.splice(i, 1);
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
		this.drawDots(ctx, chart, dotsPos, [0, 1, 3]);
		if (this.ifTrue) sceneVar.flowChart.connections.push([{ node: this, dotIndex: 1 }, { node: this.ifTrue, dotIndex: 0 }]);
		if (this.ifFalse) sceneVar.flowChart.connections.push([{ node: this, dotIndex: 3 }, { node: this.ifFalse, dotIndex: 0 }]);
		sceneVar.flowChart.nodesDots.set(this, dotsPos);
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
class DialogNode extends FlowChartNode {
	static itemGap = 10;
	constructor({ anchor = [200, 200], image = '', message = '......', words = [], operations = [] }) {
		super({ anchor: anchor, relativeAnchorPos: [0.5, 0], size: undefined, draggable: true });
		this.image = image;
		this.message = message;
		this.words = words;
		this.operations = operations;
		this.calc();
	}
	export() {
		let { anchor, image, message, words, operations } = this;
		return { anchor, image, message, words, operations };
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
			((charSize + DialogNode.itemGap) * (this.words.length + this.operations.length + 1 * 2) - DialogNode.itemGap * 2)
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
					mouse.click = false;
					popup.search({ list: [...project.partOfSpeech.n, ...project.partOfSpeech.v], type: 'string' }, selected => {
						if (selected !== null) {
							this.words.push(selected.value);
							this.calc();
						}
					});
				}
			} else {
				option.text = this.words[i];
				option.bgc = project.partOfSpeech.v.includes(this.words[i]) ? color.wordBoxV : color.wordBoxSAndO;
				if (hovered && mouse.contextMenu) {
					sceneVar.flowChart.draggingNode = undefined;
					this.words.splice(i, 1);
					reCalc = true;
					mouse.contextMenu = false;
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
					mouse.click = false;
				}
			} else {
				option.text = this.operations[i];
				if (hovered && mouse.DBlClick) {
					console.log('edit!');
					mouse.DBlClick = false;
				}
				if (hovered && mouse.contextMenu) {
					sceneVar.flowChart.draggingNode = undefined;
					this.operations.splice(i, 1);
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
			circumstance: {}
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
		circumstance = {}
	} = {}) {
		function generateNode(dataList, nodeClass) {
			return Object.entries(dataList).map(([id, nodeData]) => [id, { data: nodeData, node: new nodeClass(nodeData) }]);
		}
		let dialogNodeListWithId = generateNode(dialog, DialogNode);
		let circumstanceNodeListWithId = generateNode(circumstance, CircumstanceNode);
		let id2nodeDataList = Object.fromEntries([
			...dialogNodeListWithId,
			...circumstanceNodeListWithId
		]);
		function id2Node(nodeData) {
			for (let key in nodeData) {
				if (Number.isInteger(nodeData[key])) {
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
		this.catch = {};
	}
	export() {
		let node2idList = new Map(Object.entries([...this.dialogNodeList, ...this.circumstanceNodeList]).map(IVPair => [IVPair[1], parseInt(IVPair[0])]))
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
			circumstance: Object.fromEntries(this.circumstanceNodeList.map(node2Id))
		};
	}
	draw({ ctx, chart }) {
		let nodeList = [this.startNode, ...this.dialogNodeList, ...this.circumstanceNodeList];
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
				...this.dialogNodeList
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