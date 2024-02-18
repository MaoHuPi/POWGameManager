let POWPlayer = (() => {
	const cvsDataUrlHead = document.createElement('canvas').toDataURL('image/png').split(',')[0] + ',';
	class POWProject {
		constructor({
			partOfSpeech = { n: [], v: [] },
			cases = [],
			imageDataDict = {},
			wordAttribute = { n: [], v: [] },
			init = FlowChart.exportEmpty()
		} = {}) {
			this.partOfSpeech = partOfSpeech;
			this.cases = cases;
			this.imageDataDict = imageDataDict;
			this.init = init;
			Object.keys(partOfSpeech).forEach(POS => {
				if (!(POS in wordAttribute)) wordAttribute[POS] = [];
				partOfSpeech[POS].map((n, i) => {
					if (!wordAttribute[POS][i]) wordAttribute[POS][i] = {};
				})
			});
			this.wordAttribute = wordAttribute;
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
			return new POWProject({ ...jsonData, imageDataDict });;
		}
	}
	class POWPlayer {
		static POWProject = POWProject;
		#project = undefined;
		#variableDict = {};
		#getExpressionTypeAndValue = function ({ key1, key2 }) {
			let basicType = ['num', 'str', 'pos', 'tof'];
			if (basicType.includes(key1)) {
				return { type: key1, value: key2, overrideFunc: () => { } };
			} else {
				let type, value, overrideFunc;
				value = key1 in this.#variableDict ? this.#variableDict[key1][key2] : undefined;
				overrideFunc = newValue => {
					if (!(key1 in this.#variableDict)) {
						this.#variableDict[key1] = {};
					}
					this.#variableDict[key1][key2] = newValue;
				};
				if (['tmp', 'var'].includes(key1)) {
					type = key2.toString().slice(0, 3); // toString 以免出現非字串的 key2
					type = basicType.includes(type) ? basicType : undefined;
				} else {
					let propTypeMap = {
						'position': 'pos',
						'opened': 'tof'
					}
					type = key2 in propTypeMap ? propTypeMap[key2] : undefined;
				}
				return { type, value, overrideFunc };
			}
		}
		#pos2TwoDots = function (pos) {
			if (!('center' in pos)) pos.center = [0, 0];
			if (!('size' in pos)) pos.size = [0, 0];
			return [
				pos.center[0] - pos.size[0] / 2,
				pos.center[1] - pos.size[1] / 2,
				pos.center[0] + pos.size[0] / 2,
				pos.center[1] + pos.size[1] / 2
			];
		}
		#runFlowChart = function (flowChartData) {
			if (flowChartData == undefined) throw Error('找不到要執行的節點樹！');
			if (!flowChartData.initialized) {
				let processQueueList = [
					[flowChartData.assignment, 'assignment'],
					[flowChartData.circumstance, 'circumstance'],
					[flowChartData.dialog, 'dialog']
				];
				processQueueList.forEach(([dataDict, dataType]) => {
					Object.values(dataDict).forEach(data => {
						data.nodeType = dataType;
					});
				});
				flowChartData.nodeDataDict = Object.fromEntries(processQueueList.map(([dataDict, _]) => Object.entries(dataDict)).flat());
				flowChartData.initialized = true;
			}

			let returnDialog = {};
			let nextNodeId = flowChartData.start;
			while (nextNodeId !== undefined) {
				let nodeData = flowChartData.nodeDataDict[nextNodeId];
				let leftExpressionData, rightExpressionData;
				switch (nodeData.nodeType) {
					case 'assignment':
						leftExpressionData = this.#getExpressionTypeAndValue(nodeData.leftExpression);
						rightExpressionData = this.#getExpressionTypeAndValue(nodeData.rightExpression);
						if (
							leftExpressionData.type === rightExpressionData.type ||
							!([leftExpressionData.type, rightExpressionData.type].includes(undefined))
						) {
							let newValue;
							switch (leftExpressionData.type) {
								case 'num':
									newValue =
										nodeData.compType == 0 ? rightExpressionData.value :
											nodeData.compType == 1 ? leftExpressionData.value + rightExpressionData.value :
												nodeData.compType == 2 ? leftExpressionData.value * rightExpressionData.value :
													nodeData.compType == 3 ? Math.pow(leftExpressionData.value, rightExpressionData.value) :
														undefined;
									break;
								case 'str':
									newValue =
										nodeData.compType == 0 ? rightExpressionData.value :
											nodeData.compType == 1 ? leftExpressionData.value + rightExpressionData.value :
												undefined;
									break;
								case 'pos':
									newValue =
										nodeData.compType == 0 ? rightExpressionData.value :
											nodeData.compType == 1 ? { center: leftExpressionData.value.map((n, i) => n + rightExpressionData.value[i]), size: leftExpressionData.value.size } :
												nodeData.compType == 2 ? { center: rightExpressionData.value.center, size: leftExpressionData.value.size } :
													nodeData.compType == 3 ? { center: leftExpressionData.value.center, size: rightExpressionData.value.size } :
														undefined;
									break;
								case 'tof':
									newValue =
										nodeData.compType == 0 ? rightExpressionData.value :
											nodeData.compType == 1 ? leftExpressionData.value | rightExpressionData.value :
												nodeData.compType == 2 ? leftExpressionData.value & rightExpressionData.value :
													nodeData.compType == 3 ? leftExpressionData.value ^ rightExpressionData.value :
														undefined;
									break;
							}
							leftExpressionData.overrideFunc(newValue);
						}
						nextNodeId = nodeData.then;
						break;
					case 'circumstance':
						let cmp = false;
						leftExpressionData = this.#getExpressionTypeAndValue(nodeData.leftExpression);
						rightExpressionData = this.#getExpressionTypeAndValue(nodeData.rightExpression);
						if (
							leftExpressionData.type === rightExpressionData.type ||
							!([leftExpressionData.type, rightExpressionData.type].includes(undefined))
						) {
							switch (leftExpressionData.type) {
								case 'num':
									cmp =
										nodeData.compType == 0 ? leftExpressionData.value == rightExpressionData.value :
											nodeData.compType == 1 ? leftExpressionData.value < rightExpressionData.value :
												nodeData.compType == 2 ? leftExpressionData.value > rightExpressionData.value :
													undefined;
									break;
								case 'str':
									cmp =
										nodeData.compType == 0 ? leftExpressionData.value == rightExpressionData.value :
											nodeData.compType == 1 ? leftExpressionData.value.toLowerCase() == rightExpressionData.value.toLowerCase() :
												nodeData.compType == 2 ? rightExpressionData.value.includes(leftExpressionData) :
													undefined;
									break;
								case 'pos':
									let ltd = this.#pos2TwoDots(leftExpressionData.value), // left expression pos 2 two dots
										rtd = this.#pos2TwoDots(rightExpressionData.value); // right expression pos 2 two dots
									cmp =
										nodeData.compType == 0 ? (ltd[0] == rtd[0] && ltd[1] == rtd[1] && ltd[2] == rtd[2] && ltd[3] == rtd[3]) :
											nodeData.compType == 1 ? (ltd[0] > rtd[0] && ltd[1] > rtd[1] && ltd[2] < rtd[2] && ltd[3] < rtd[3]) :
												nodeData.compType == 2 ? !(ltd[0] > rtd[2] || ltd[1] > rtd[3] || ltd[2] < rtd[0] || ltd[3] < rtd[1]) :
													undefined;
									break;
								case 'tof':
									cmp = nodeData.compType == 0 ? leftExpressionData.value == rightExpressionData.value : undefined;
									break;
							}
						}
						nextNodeId = cmp ? nodeData.ifTrue : nodeData.ifFalse;
						break;
					case 'dialog':
						returnDialog = { ...nodeData };
						delete returnDialog.dataType;
						nextNodeId = undefined;
						break;
				}
			}
			return {
				image: this.#project.imageDataDict[returnDialog.image].element,
				message: returnDialog.message,
				appendWords: returnDialog.appendWords,
				removeWords: returnDialog.removeWords
			};
		}
		constructor() { }
		async load(source) {
			if (source instanceof POWProject) {
				this.#project = source;
			} else if (source instanceof File) {
				let zip = await JSZip.loadAsync(source);
				this.#project = await POWProject.fromZip(zip);
			} else if (typeof source == 'string') {
				let xhr = new XMLHttpRequest();
				xhr.addEventListener('load', async () => {
					let zip = await JSZip.loadAsync(xhr.response);
					this.#project = await POWProject.fromZip(zip);
				});
				xhr.responseType = 'arraybuffer';
				xhr.overrideMimeType('application/zip');
				xhr.open('GET', source);
				xhr.send();
			} else throw Error('不支援此格式！');
		}
		init() {
			if (!this.#project) throw Error('播放器尚未載入專案！');
			this.#project.partOfSpeech.n.map((word, i) => {
				let wordAttribute = this.#project.wordAttribute.n[i];
				let handle = this.#getExpressionTypeAndValue({ key1: `wvn.${word}`, key2: 'position' });
				let center = 'center' in wordAttribute ? wordAttribute.center : [0, 0];
				let size = 'size' in wordAttribute ? wordAttribute.size : [0, 0];
				handle.overrideFunc({ center, size });
			})
			return this.#runFlowChart(this.#project.init);
		}
		exec([s, v, o]) {
			if (!this.#project) throw Error('播放器尚未載入專案！');
			[s, o] = [s, o].map(word => this.#project.partOfSpeech.n.indexOf(word));
			v = this.#project.partOfSpeech.v.indexOf(v);
			if ([s, v, o].includes(-1)) throw Error('輸入了未定義的詞卡！');
			return this.#runFlowChart(this.#project.cases[v][s][o]);
		}
	}
	return POWPlayer;
})();