function isHover(mouse, [x, y, w, h]) {
	return mouse.x > x && mouse.y > y && mouse.x < x + w && mouse.y < y + h;
}
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