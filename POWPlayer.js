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
		#variable = {};
		#runFlowChart = function (flowChartData) {
			if (flowChartData === undefined) throw Error('找不到要執行的節點樹！');
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
			// console.log(flowChartData);

			let returnDialog = {};
			let nextNodeId = flowChartData.start;
			while (nextNodeId !== undefined) {
				let nodeData = flowChartData.nodeDataDict[nextNodeId];
				switch (nodeData.nodeType) {
					case 'assignment':
						nextNodeId = nodeData.then;
						break;
					case 'circumstance':
						nextNodeId = nodeData.ifTrue;
						break;
					case 'dialog':
						returnDialog = { ...nodeData };
						delete returnDialog.dataType;
						nextNodeId = undefined;
						break;
				}
			}
			return returnDialog;
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
			return this.#runFlowChart(this.#project.init);
		}
		exec([s, v, o]) {
			if (!this.#project) throw Error('播放器尚未載入專案！');
			[s, v, o] = [s, v, o].map(word => this.#project.partOfSpeech.n.indexOf(word));
			if ([s, v, o].includes(-1)) throw Error('輸入了未定義的詞卡！');
			return this.#runFlowChart(this.#project.cases[s][v][o]);
		}
	}
	return POWPlayer;
})();