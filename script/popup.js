class Popup {
	static color = {
		mask: '#00000088',
		bg: 'black',
		border: 'white',
		text: 'white'
	};
	constructor(ctx) {
		this.ctx = ctx;
		this.show = false;
		this.callBack = () => { };
		this.type = undefined;
		this.event = {};
		this.setEvent();
		this.elements = [];
	}
	setEvent({ mouse = { x: 0, y: 0 }, keyboard = {} } = {}) {
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
	draw() {
		if (this.show) {
			const color = Popup.color;
			const ctx = this.ctx;
			const [CW, CH] = [ctx.canvas.width, ctx.canvas.height];
			const mouse = this.event.mouse;
			const keyboard = this.event.keyboard;

			ctx.fillStyle = color.mask;
			ctx.fillRect(0, 0, CW, CH);
			this.elements.forEach(element => {
				ctx.save();
				element = element({ ctx, CW, CH, mouse, keyboard, popup: this });
				if (isHover(mouse, element.pos) && element.hovered !== undefined) {
					element = element.hovered.bind(element)({ ctx, CW, CH, mouse, keyboard, popup: this });
				}
				drawBox(ctx, element);
				ctx.restore();
				if (element.show === false) {
					this.show = false;
					this.argument = undefined;
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
		let { lines } = calcSize({ sizeBOCS: [(bg[2] - messagePadding * 2 / charSize), undefined], text: this.argument, charSize, padding: messagePadding, charFont });
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
			pos: (() => {
				bg[0] = (CW - bg[2]) / 2;
				bg[1] = (CH - bg[3]) / 2;
				return [bg[0], bg[1] + bg[3] - 50, bg[2], 50];
			})(),
			fgc: color.text,
			text: '確定',
			size: 25,
			border: color.border,
			borderWidth: 3,
			hovered: function ({ ctx, mouse, popup }) {
				glowEffect(ctx, this.border, 20);
				this.bgc = 'white';
				this.fgc = 'black';
				if (mouse.click) {
					this.res = true;
					this.show = false;
				}
				return this;
			}
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
		let { lines } = calcSize({ sizeBOCS: [(bg[2] - messagePadding * 2 / charSize), undefined], text: this.argument, charSize, padding: messagePadding, charFont });
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
			pos: (() => {
				bg[0] = (CW - bg[2]) / 2;
				bg[1] = (CH - bg[3]) / 2;
				return [bg[0], bg[1] + bg[3] - 50, bg[2] / 2, 50];
			})(),
			fgc: color.text,
			text: '確認',
			size: 25,
			border: color.border,
			borderWidth: 3,
			hovered: function ({ ctx, mouse }) {
				glowEffect(ctx, this.border, 20);
				this.bgc = 'white';
				this.fgc = 'black';
				if (mouse.click) {
					this.res = true;
					this.show = false;
				}
				return this;
			}
		}));
		elements.push(({ CW, CH }) => ({
			pos: (() => {
				bg[0] = (CW - bg[2]) / 2;
				bg[1] = (CH - bg[3]) / 2;
				return [bg[0] + bg[2] / 2, bg[1] + bg[3] - 50, bg[2] / 2, 50];
			})(),
			fgc: color.text,
			text: '取消',
			size: 25,
			border: color.border,
			borderWidth: 3,
			hovered: function ({ ctx, mouse }) {
				glowEffect(ctx, this.border, 20);
				this.bgc = 'white';
				this.fgc = 'black';
				if (mouse.click) {
					this.res = false;
					this.show = false;
				}
				return this;
			}
		}));
	}
	prompt(text, callBack = () => { }) {
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
		let { lines } = calcSize({ sizeBOCS: [(bg[2] - messagePadding * 2 / charSize), undefined], text: this.argument, charSize, padding: messagePadding, charFont });
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
			pos: (() => {
				bg[0] = (CW - bg[2]) / 2;
				bg[1] = (CH - bg[3]) / 2;
				return [bg[0], bg[1] + bg[3] - 50, bg[2] / 2, 50];
			})(),
			fgc: color.text,
			text: '確認',
			size: 25,
			border: color.border,
			borderWidth: 3,
			hovered: function ({ ctx, mouse }) {
				glowEffect(ctx, this.border, 20);
				this.bgc = 'white';
				this.fgc = 'black';
				if (mouse.click) {
					this.res = '';
					this.show = false;
				}
				return this;
			}
		}));
		elements.push(({ CW, CH }) => ({
			pos: (() => {
				bg[0] = (CW - bg[2]) / 2;
				bg[1] = (CH - bg[3]) / 2;
				return [bg[0] + bg[2] / 2, bg[1] + bg[3] - 50, bg[2] / 2, 50];
			})(),
			fgc: color.text,
			text: '取消',
			size: 25,
			border: color.border,
			borderWidth: 3,
			hovered: function ({ ctx, mouse }) {
				glowEffect(ctx, this.border, 20);
				this.bgc = 'white';
				this.fgc = 'black';
				if (mouse.click) {
					this.res = undefined;
					this.show = false;
				}
				return this;
			}
		}));
	}
	search(list, callBack = () => { }) {
		this.type = 'search';
		this.argument = list;
		this.callBack = callBack;
		this.show = true;

		const color = Popup.color;
		const ctx = this.ctx;
		const [CW, CH] = [ctx.canvas.width, ctx.canvas.height];
		const mouse = this.event.mouse;
	}
}