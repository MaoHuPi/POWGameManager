/* generate object */
function NDArray(lengthList, initValueFunc, indexList = []) {
	return new Array(lengthList.shift()).fill(0).map((n, i) => {
		let indexListNow = [...indexList];
		indexListNow.push(i);
		if (lengthList.length == 0) {
			return initValueFunc(indexListNow);
		} else {
			return NDArray([...lengthList], initValueFunc, indexListNow);
		}
	});
}

/* load metarial */
function loadMaterial(url, _constructor, eventName = 'onload') {
	return new Promise(resolve => {
		let element = new _constructor();
		element[eventName] = () => {
			resolve(element);
		};
		element.src = url;
	});
}
const imageCatch = {};
async function getImage(url) {
	if (url in imageCatch) {
		return imageCatch[url];
	} else {
		let image = await loadMaterial(url, Image);
		imageCatch[url] = image;
		return (image);
	}
}

/* detect and calculate */
function vecLength(vec){
	return Math.sqrt(vec.map(n => Math.pow(n, 2)).reduce((s, n) => s+n))
}
function isHover(mouse, [x, y, w, h]) {
	return mouse.x > x && mouse.y > y && mouse.x < x + w && mouse.y < y + h;
}
function glowEffect(ctx, color, size) {
	ctx.shadowColor = color;
	ctx.shadowBlur = size;
}
function calcSize({ sizeBOCS, text = '', charSize, padding, charFont }) {
	ctx.save();
	let reLines = [''];
	let size = sizeBOCS.map(n => n === undefined ? undefined : n * charSize + padding * 2);
	if (size[0] == undefined && size[1] == undefined) {
		ctx.font = `${charSize}px ${charFont}`;
		let textRect = ctx.measureText(text);
		size = [textRect.width + padding * 2, textRect.height + padding * 2];
		reLines = [text];
	} else if (size[0] == undefined) {
		let charPerLine = Math.ceil(text.length / sizeBOCS[1]);
		let lines = [], linesWidth = [];
		let charList = text.split('');
		while (charList.length > 0) {
			let line = charList.splice(0, charPerLine).join('');
			let lineRect = ctx.measureText(line);
			linesWidth.push(lineRect.width);
			lines.push(line);
		}
		size[0] = Math.max(...linesWidth) + padding * 2;
		reLines = lines;
	} else if (size[1] == undefined) {
		let width = sizeBOCS[0] * charSize;
		let lines = [''], linesWidth = [0];
		ctx.font = `${charSize}px ${charFont}`;
		for (let i = 0; i < text.length; i++) {
			let charRect = ctx.measureText(text[i]);
			if (linesWidth[linesWidth.length - 1] + charRect.width <= width) {
				linesWidth[linesWidth.length - 1] += charRect.width;
				lines[lines.length - 1] += text[i];
			} else {
				linesWidth.push(charRect.width);
				lines.push(text[i]);
			}
		}
		size[1] = lines.length * charSize + padding * 2;
		reLines = lines;
	}
	ctx.restore();
	return { size, lines: reLines };
}

/* draw things */
function drawBox(ctx, { pos, bgc, border, borderWidth, text, decorate, font = 'Zpix', size, fgc, stroke, textAlign, padding = 0, gap = 0 }) {
	if (pos == undefined) return;
	if (bgc !== undefined) {
		ctx.fillStyle = bgc;
		ctx.fillRect(...pos);
	}
	if (border !== undefined) {
		ctx.lineWidth = borderWidth;
		ctx.strokeStyle = border;
		ctx.strokeRect(...pos);
	}
	if (text !== undefined) {
		ctx.font = `${decorate ? decorate + ' ' : ''} ${size}px ${font}`;
		ctx.textBaseline = 'middle';
		ctx.textAlign = textAlign !== undefined ? textAlign : 'center';
		if (typeof text == 'string') {
			if (fgc !== undefined) {
				ctx.fillStyle = fgc;
				ctx.fillText(text, pos[0] + pos[2] / 2, pos[1] + pos[3] / 2);
			}
			if (stroke !== undefined) {
				ctx.strokeStyle = stroke;
				ctx.strokeText(text, pos[0] + pos[2] / 2, pos[1] + pos[3] / 2);
			}
		} else {
			ctx.textAlign = textAlign !== undefined ? textAlign : 'left';
			for (let i = 0; i < text.length; i++) {
				let linePos = [pos[0] + padding, pos[1] + padding + (size + gap) * i, pos[2] - padding * 2, size];
				let lineAnchor = [0, linePos[1] + linePos[3] / 2];
				lineAnchor[0] = ctx.textAlign == 'center' ? linePos[0] + linePos[2] / 2 :
					ctx.textAlign == 'left' ? linePos[0] :
						ctx.textAlign == 'right' ? linePos[0] + linePos[2] : 0
				if (fgc !== undefined) {
					ctx.fillStyle = fgc;
					ctx.fillText(text[i], ...lineAnchor);
				}
				if (stroke !== undefined) {
					ctx.strokeStyle = stroke;
					ctx.strokeText(text[i], ...lineAnchor);
				}
			}
		}
	}
}
function drawPoliigon(ctx, { points, fill, stroke, lineWidth = 1 }) {
	if (points == undefined) return;
	ctx.beginPath();
	ctx.moveTo(...points[0]);
	for (let i = 1; i < points.length; i++) {
		ctx.lineTo(...points[i]);
	}
	if (fill !== undefined) {
		ctx.closePath();
		ctx.fillStyle = fill;
		ctx.fill();
	}
	if (stroke !== undefined) {
		ctx.lineWidth = lineWidth;
		ctx.strokeStyle = stroke;
		ctx.stroke();
	}
}
function drawList({
	targetCvs, targetCtx,
	list = [0, 0, 0, 0],
	getSetScrollY = value => { let v; return value ? (v = value) : v },
	itemList = [],
	itemBgc = 'gray',
	itemDecoration = undefined,
	itemTextFormat = item => item,
	itemClickListener = () => { },
	itemSelected = () => { },
	listPadding = 10,
	itemHeight = 30,
	itemGap = 5,
}) {
	let listHovered = isHover(mouse, list);
	let scrollY = getSetScrollY();
	if (listHovered) {
		scrollY -= mouse.deltaY;
		scrollY = Math.min(Math.max(scrollY, -((itemHeight + itemGap) * itemList.length - itemGap - (list[3] - listPadding * 2))), 0);
	}
	targetCtx.clearRect(0, 0, CW, CH);
	for (let i = 0; i < itemList.length; i++) {
		targetCtx.save();
		let option = {
			pos: [list[0] + listPadding, list[1] + (itemHeight + itemGap) * i + listPadding + scrollY, list[2] - listPadding * 2, itemHeight],
			bgc: itemBgc,
			fgc: 'white',
			text: itemTextFormat({ index: i, item: itemList[i] }),
			size: 20
		}
		if (listHovered && isHover(mouse, option.pos)) {
			glowEffect(targetCtx, option.bgc, 10);
			if (mouse.click) {
				itemClickListener({ index: i, item: itemList[i] });
			}
		}
		if (itemDecoration) {
			itemDecoration({ cvs: targetCvs, ctx: targetCtx, index: i, ...option });
		}
		if (itemSelected({ index: i, item: itemList[i] })) {
			targetCtx.globalAlpha = 0.9;
			drawBox(targetCtx, { ...option, text: '' });
			targetCtx.globalAlpha = 1;
			drawBox(targetCtx, { ...option, bgc: undefined, fgc: 'black' });
		} else {
			targetCtx.globalAlpha = 0.5;
			drawBox(targetCtx, { ...option, text: '' });
			targetCtx.globalAlpha = 1;
			drawBox(targetCtx, { ...option, bgc: undefined });
		}
		targetCtx.restore();
	}
	ctx.drawImage(targetCvs, ...list, ...list);
	getSetScrollY(scrollY);
}