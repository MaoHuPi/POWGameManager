class Popup {
	static color = {
		mask: '#00000088',
		bg: 'black',
		border: 'white',
		text: 'white'
	};
	static button = {
		fgc: Popup.color.text,
		size: 25,
		border: Popup.color.border,
		borderWidth: 3,
		value: () => true,
		keys: ['Enter'],
		hovered: function (argumentDir) {
			let { ctx, mouse } = argumentDir;
			glowEffect(ctx, this.border, 20);
			this.bgc = 'white';
			this.fgc = 'black';
			if (mouse.click) {
				this.res = this.value(argumentDir);
				this.show = false;
			}
		},
		keyboardListener: function (argumentDir) {
			let { keyboard } = argumentDir;
			if (this.keys.filter(key => keyboard[key]).length > 0) {
				this.res = this.value(argumentDir);
				this.show = false;
			}
		}
	};
	constructor(ctx) {
		this.ctx = ctx;
		this.tempCvs = ctx.canvas.ownerDocument.createElement('canvas');
		this.tempCtx = this.tempCvs.getContext('2d');
		this.show = false;
		this.callBack = () => { };
		this.type = undefined;
		this.event = {};
		this.setEvent();
		this.elements = [];
		this.input = ctx.canvas.ownerDocument.createElement('input');
		this.input.id = 'popup-input';
		this.input.type = 'text';
		this.input.setAttribute('aria-autocomplete', 'false');
		this.inputStyle({
			position: 'absolute',
			fontFamily: 'Zpix',
			boxSizing: 'border-box'
		});
	}
	inputStyle(style) {
		Object.entries(style).forEach(KVPair => { this.input.style[KVPair[0]] = KVPair[1]; });
	}
	showInput() {
		this.ctx.canvas.ownerDocument.body.appendChild(this.input);
		this.input.value = '';
		this.input.focus();
	}
	hideInput() {
		this.input.remove();
	}
	setEvent({ mouse = { x: 0, y: 0 }, keyboard = {} } = {}, isBefore = true) {
		if (this.show === isBefore) {
			let [x, y] = [-1, -1];
			if (this.event.mouse !== undefined) ({ x, y } = this.event.mouse);
			this.event.mouse = { ...mouse };
			if (
				x !== -1 && y !== -1 &&
				mouse.x === -1 && mouse.y === -1
			) {
				this.event.mouse.x = x;
				this.event.mouse.y = y;
			}
			this.event.keyboard = { ...keyboard };
			if (this.show) {
				[mouse, keyboard].map(eventObject => {
					for (let key in eventObject) {
						if (eventObject[key] === true) {
							eventObject[key] = false;
						} else if (eventObject[key] === parseFloat(eventObject[key])) {
							eventObject[key] = -1;
						}
					}
				});
			}
		}
	}
	draw() {
		if (this.show) {
			const color = Popup.color;
			const ctx = this.ctx;
			const tempCvs = this.tempCvs;
			const [CW, CH] = [ctx.canvas.width, ctx.canvas.height];
			const mouse = this.event.mouse;
			const keyboard = this.event.keyboard;

			ctx.fillStyle = color.mask;
			ctx.fillRect(0, 0, CW, CH);
			this.elements.forEach(element => {
				ctx.save();
				[tempCvs.width, tempCvs.height] = [ctx.canvas.width, ctx.canvas.height];
				let argumentDir = { ctx, CW, CH, mouse, keyboard, popup: this };
				element = element(argumentDir);
				if (isHover(mouse, element.pos) && element.hovered !== undefined) {
					element.hovered.bind(element)(argumentDir);
				}
				if (element.keyboardListener !== undefined) {
					element.keyboardListener.bind(element)(argumentDir);
				}
				drawBox(element.drawOnTempCvs ? this.tempCtx : ctx, element);
				if (element.tempCvsRect) {
					ctx.drawImage(tempCvs, ...element.tempCvsRect, ...element.tempCvsRect);
				}
				ctx.restore();
				if (element.show === false) {
					this.show = false;
					this.argument = undefined;
					this.hideInput(); // must hide input before call this.callBack
					this.callBack(element.res);
				}
			});
		}
	}
	alert(text, callBack = () => { }) {
		this.type = 'alert';
		this.argument = text;
		this.callBack = callBack;
		this.show = true;

		const color = Popup.color;
		const ctx = this.ctx;
		const elements = this.elements = [];

		let bg = [0, 0, 400, 200];
		let charSize = 25;
		let charFont = 'Zpix';
		let messagePadding = 20;
		let { lines } = calcSize({ sizeBOCS: [(bg[2] - messagePadding * 2) / charSize, undefined], text: this.argument, charSize, padding: messagePadding, charFont });
		this.argument = lines;
		elements.push(({ CW, CH }) => ({
			pos: (() => {
				bg[0] = (CW - bg[2]) / 2;
				bg[1] = (CH - bg[3]) / 2;
				return bg;
			})(),
			bgc: color.bg,
			border: color.border,
			borderWidth: 5
		}));
		elements.push(({ CW, CH }) => ({
			pos: (() => {
				bg[0] = (CW - bg[2]) / 2;
				bg[1] = (CH - bg[3]) / 2;
				return [bg[0], bg[1], bg[2], bg[3] - 50];
			})(),
			fgc: color.text,
			text: this.argument,
			size: charSize,
			font: charFont,
			padding: messagePadding
		}));
		elements.push(({ CW, CH }) => ({
			...Popup.button,
			pos: (() => {
				bg[0] = (CW - bg[2]) / 2;
				bg[1] = (CH - bg[3]) / 2;
				return [bg[0], bg[1] + bg[3] - 50, bg[2], 50];
			})(),
			text: '確定',
			value: () => undefined,
			keys: ['Enter', 'Escape']
		}));
	}
	confirm(text, callBack = () => { }) {
		this.type = 'confirm';
		this.argument = text;
		this.callBack = callBack;
		this.show = true;

		const color = Popup.color;
		const ctx = this.ctx;
		const elements = this.elements = [];

		let bg = [0, 0, 400, 200];
		let charSize = 25;
		let charFont = 'Zpix';
		let messagePadding = 20;
		let { lines } = calcSize({ sizeBOCS: [(bg[2] - messagePadding * 2) / charSize, undefined], text: this.argument, charSize, padding: messagePadding, charFont });
		this.argument = lines;
		elements.push(({ CW, CH }) => ({
			pos: (() => {
				bg[0] = (CW - bg[2]) / 2;
				bg[1] = (CH - bg[3]) / 2;
				return bg;
			})(),
			bgc: color.bg,
			border: color.border,
			borderWidth: 5
		}));
		elements.push(({ CW, CH }) => ({
			pos: (() => {
				bg[0] = (CW - bg[2]) / 2;
				bg[1] = (CH - bg[3]) / 2;
				return [bg[0], bg[1], bg[2], bg[3] - 50];
			})(),
			fgc: color.text,
			text: this.argument,
			size: charSize,
			font: charFont,
			padding: messagePadding
		}));
		elements.push(({ CW, CH }) => ({
			...Popup.button,
			pos: (() => {
				bg[0] = (CW - bg[2]) / 2;
				bg[1] = (CH - bg[3]) / 2;
				return [bg[0], bg[1] + bg[3] - 50, bg[2] / 2, 50];
			})(),
			text: '確認',
			value: () => true,
			keys: ['Enter']
		}));
		elements.push(({ CW, CH }) => ({
			...Popup.button,
			pos: (() => {
				bg[0] = (CW - bg[2]) / 2;
				bg[1] = (CH - bg[3]) / 2;
				return [bg[0] + bg[2] / 2, bg[1] + bg[3] - 50, bg[2] / 2, 50];
			})(),
			text: '取消',
			value: () => false,
			keys: ['Escape']
		}));
	}
	prompt({ text, defaultValue = '' }, callBack = () => { }) {
		this.type = 'prompt';
		this.argument = text;
		this.callBack = callBack;
		this.show = true;

		const color = Popup.color;
		const ctx = this.ctx;
		const elements = this.elements = [];

		let bg = [0, 0, 400, 200];
		let charSize = 25;
		let charFont = 'Zpix';
		let messagePadding = 20;
		let { lines } = calcSize({ sizeBOCS: [(bg[2] - messagePadding * 2) / charSize, undefined], text: this.argument, charSize, padding: messagePadding, charFont });
		this.argument = lines;
		elements.push(({ CW, CH }) => ({
			pos: (() => {
				bg[0] = (CW - bg[2]) / 2;
				bg[1] = (CH - bg[3]) / 2;
				return bg;
			})(),
			bgc: color.bg,
			border: color.border,
			borderWidth: 5
		}));
		elements.push(({ CW, CH }) => ({
			pos: (() => {
				bg[0] = (CW - bg[2]) / 2;
				bg[1] = (CH - bg[3]) / 2;
				return [bg[0], bg[1], bg[2], bg[3] - 50];
			})(),
			fgc: color.text,
			text: this.argument,
			size: charSize,
			font: charFont,
			padding: messagePadding
		}));
		elements.push(({ CW, CH }) => {
			let inputHeight = charSize + messagePadding * 2;
			bg[0] = (CW - bg[2]) / 2;
			bg[1] = (CH - bg[3]) / 2;
			let input = [bg[0] + messagePadding, bg[1] + bg[3] - 50 - messagePadding - inputHeight, bg[2] - messagePadding * 2, inputHeight];
			this.inputStyle({
				left: input[0] + 'px',
				top: input[1] + 'px',
				width: input[2] + 'px',
				height: input[3] + 'px'
			});
			let borderWidth = 3;
			return {
				pos: input,
				fgc: color.text,
				text: [this.input.value],
				size: charSize,
				font: charFont,
				padding: messagePadding,
				border: 'white',
				borderWidth: borderWidth,
				drawOnTempCvs: true,
				tempCvsRect: [input[0] - borderWidth / 2, input[1] - borderWidth / 2, input[2] + borderWidth, input[3] + borderWidth]
			};
		});
		this.inputStyle({
			fontSize: charSize + 'px',
			padding: messagePadding + 'px',
			color: 'white',
			backgroundColor: color.bg,
			borderColor: 'white',
			borderStyle: 'solid',
			borderWidth: 2 + 'px'
		});
		this.showInput();
		this.input.value = defaultValue;
		elements.push(({ CW, CH }) => ({
			...Popup.button,
			pos: (() => {
				bg[0] = (CW - bg[2]) / 2;
				bg[1] = (CH - bg[3]) / 2;
				return [bg[0], bg[1] + bg[3] - 50, bg[2] / 2, 50];
			})(),
			text: '確認',
			value: ({ popup }) => popup.input.value,
			keys: ['Enter']
		}));
		elements.push(({ CW, CH }) => ({
			...Popup.button,
			pos: (() => {
				bg[0] = (CW - bg[2]) / 2;
				bg[1] = (CH - bg[3]) / 2;
				return [bg[0] + bg[2] / 2, bg[1] + bg[3] - 50, bg[2] / 2, 50];
			})(),
			text: '取消',
			value: () => null,
			keys: ['Escape']
		}));
	}
	search({ dict, list, type = 'text', defaultValue = '', canOutOfEntries = false }, callBack = () => { }) {
		this.type = 'search';
		this.argument = {
			entries: (dict ? Object.entries(dict) : (list.map(item => [item, item]))),
			type: type,
			optionListY: 0,
			selected: undefined,
			canOutOfEntries: canOutOfEntries
		};
		this.callBack = callBack;
		this.show = true;

		const color = Popup.color;
		const ctx = this.ctx;
		const elements = this.elements = [];

		let charSize = 25;
		let charFont = 'Zpix';
		let messagePadding = 20;
		let inputHeight = charSize + messagePadding * 2;
		let bg = [0, 0, 750, inputHeight + messagePadding * 2];
		elements.push(({ CW, CH }) => {
			bg[0] = (CW - bg[2]) / 2;
			bg[1] = (CH - bg[3]) / 2;
			let input = [bg[0] + messagePadding, bg[1] + messagePadding, bg[2] - messagePadding * 2 - inputHeight, inputHeight];
			this.inputStyle({
				left: input[0] + 'px',
				top: input[1] + 'px',
				width: input[2] + 'px',
				height: input[3] + 'px'
			});
			let borderWidth = 3;
			return {
				pos: input,
				fgc: color.text,
				text: [this.input.value],
				size: charSize,
				font: charFont,
				padding: messagePadding,
				border: 'white',
				borderWidth: borderWidth,
				drawOnTempCvs: true,
				tempCvsRect: [input[0] - borderWidth / 2, input[1] - borderWidth / 2, input[2] + borderWidth, input[3] + borderWidth]
			};
		});
		this.inputStyle({
			fontSize: charSize + 'px',
			padding: messagePadding + 'px',
			color: 'white',
			backgroundColor: color.bg,
			borderColor: 'white',
			borderStyle: 'solid',
			borderWidth: 2 + 'px'
		});
		this.showInput();
		this.argument.selected = this.argument.entries[this.argument.entries.map(([_, n]) => n).indexOf(defaultValue)];
		if (this.argument.selected !== undefined) this.input.value = this.argument.selected[0];
		let optionHeight = 40, optionGap = 10;
		elements.push(({ CW, CH, mouse }) => {
			bg[0] = (CW - bg[2]) / 2;
			bg[1] = (CH - bg[3]) / 2;
			let optionList = [bg[0] + messagePadding, bg[1] + messagePadding + inputHeight, bg[2] - messagePadding * 2 - inputHeight, 0];
			let filteredList = this.argument.entries.filter(KVPair => KVPair[0].includes(this.input.value));
			let listHeight = Math.max((optionHeight + optionGap) * filteredList.length - optionGap, 0);
			let listMaxViewHeight = (CH - optionList[1]) * 0.9;
			optionList[3] = Math.min(listHeight, listMaxViewHeight);
			let keys = filteredList.map(KVPair => KVPair[0]);
			if (keys.includes(this.input.value)) {
				this.argument.selected = filteredList[keys.indexOf(this.input.value)];
			}
			let listHovered = isHover(mouse, optionList);
			if (listHovered) {
				this.argument.optionListY -= mouse.deltaY / 2;
			}
			this.argument.optionListY = Math.min(Math.max(this.argument.optionListY, -(listHeight - listMaxViewHeight)), 0);
			const tempCtx = this.tempCtx;
			for (let i = 0; i < filteredList.length; i++) {
				tempCtx.save();
				let optionOption = {
					pos: [optionList[0], optionList[1] + (optionHeight + optionGap) * i + this.argument.optionListY, optionList[2], optionHeight],
					fgc: color.text,
					text: [filteredList[i][0]],
					size: optionHeight - 10,
					font: charFont
				};
				if (listHovered && isHover(mouse, optionOption.pos)) {
					glowEffect(tempCtx, 'white', 20);
					optionOption.bgc = 'white';
					optionOption.fgc = 'black';
					if (mouse.click) {
						this.argument.selected = filteredList[i];
						this.input.value = this.argument.selected[0];
					}
				} else if (filteredList[i] === this.argument.selected) {
					glowEffect(tempCtx, 'white', 20);
					optionOption.bgc = '#ffffff88';
					optionOption.fgc = 'black';
				}
				optionOption.padding = (optionOption.pos[3] - optionOption.size) / 2;
				drawBox(tempCtx, optionOption);
				if (type == 'imageData') {
					let pos = optionOption.pos;
					let image = filteredList[i][1].element;
					let drawWidth = pos[3] / image.height * image.width;
					let imagePos = [pos[0] + pos[2] - drawWidth, pos[1], drawWidth, pos[3]];
					tempCtx.fillStyle = 'gray';
					tempCtx.fillRect(...imagePos);
					tempCtx.drawImage(filteredList[i][1].element, ...imagePos);
				}
				tempCtx.restore();
			}
			return {
				pos: optionList,
				tempCvsRect: optionList,
				bgc: '#303030'
			};
		});
		elements.push(({ CW, CH }) => ({
			...Popup.button,
			pos: (() => {
				let inputHeight = charSize + messagePadding * 2;
				bg[0] = (CW - bg[2]) / 2;
				bg[1] = (CH - bg[3]) / 2;
				return [bg[0] + bg[2] - messagePadding - inputHeight, bg[1] + messagePadding, inputHeight, inputHeight];
			})(),
			text: '選定',
			value: ({ popup, keyboard }) => {
				if (keyboard.Escape) return null;
				let filteredList = this.argument.entries.filter(KVPair => KVPair[0].includes(this.input.value));
				if (keyboard.ArrowUp || keyboard.ArrowDown) {
					if (this.argument.selected !== undefined && filteredList.includes(this.argument.selected)) {
						let nextIndex = filteredList.indexOf(this.argument.selected) + (keyboard.ArrowUp ? -1 : 1);
						let nextSelected = filteredList[nextIndex];
						if (nextSelected !== undefined) {
							bg[0] = (CW - bg[2]) / 2;
							bg[1] = (CH - bg[3]) / 2;
							let optionList = [bg[0] + messagePadding, bg[1] + messagePadding + inputHeight, bg[2] - messagePadding * 2 - inputHeight, 0];
							let filteredList = this.argument.entries.filter(KVPair => KVPair[0].includes(this.input.value));
							let listHeight = Math.max((optionHeight + optionGap) * filteredList.length - optionGap, 0);
							let listMaxViewHeight = (CH - optionList[1]) * 0.9;
							optionList[3] = Math.min(listHeight, listMaxViewHeight);
							let selectedPos = [optionList[0], optionList[1] + (optionHeight + optionGap) * nextIndex + this.argument.optionListY, optionList[2], optionHeight];
							if (selectedPos[1] < optionList[1]) {
								this.argument.optionListY += optionList[1] - selectedPos[1];
							} else if ((selectedPos[1] + selectedPos[3]) > (optionList[1] + optionList[3])) {
								this.argument.optionListY += (optionList[1] + optionList[3]) - (selectedPos[1] + selectedPos[3]);
							}

							this.argument.selected = nextSelected;
						}
					} else if (this.argument.selected === undefined && filteredList.length > 0) {
						this.argument.selected = filteredList[0];
					} else {
						this.argument.selected = undefined;
					}
					return undefined;
				}
				if (keyboard.Tab) {
					if (this.argument.selected === undefined) this.argument.selected = filteredList[0];
					if (this.argument.selected !== undefined) this.input.value = this.argument.selected[0];
					return undefined;
				};
				if (popup.argument.selected === undefined) {
					if (popup.argument.canOutOfEntries) return { key: popup.input.value, value: popup.input.value };
					else if (filteredList.length > 0) popup.argument.selected = filteredList[0];
					else return null;
				}
				return { key: popup.argument.selected[0], value: popup.argument.selected[1] };
			},
			keys: ['Enter', 'Escape', 'Tab', 'ArrowUp', 'ArrowDown'],
			hovered: function (argumentDir) {
				let { ctx, mouse } = argumentDir;
				glowEffect(ctx, this.border, 20);
				this.bgc = 'white';
				this.fgc = 'black';
				if (mouse.click) {
					this.res = this.value(argumentDir);
					this.show = false;
				}
			},
			keyboardListener: function (argumentDir) {
				let { keyboard } = argumentDir;
				if (Object.entries(keyboard).filter(([key, value]) => !this.keys.includes(key) && value).length > 0) {
					popup.argument.selected = undefined;
				}
				if (this.keys.filter(key => keyboard[key]).length > 0) {
					this.res = this.value(argumentDir);
					this.show = (this.res === undefined ? true : false);
				}
			}
		}));
	}
}