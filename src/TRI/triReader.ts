// Vibe coded based on: https://github.com/ousnius/BodySlide-and-Outfit-Studio/blob/dev/src/files/TriFile.cpp

import * as fs from "node:fs"
import type { TriBodySlide, TriMorphSparse } from "../types"

class Cursor {
	constructor(
		public buf: Buffer,
		public off = 0,
	) {}
	ensure(n: number) {
		if (this.off + n > this.buf.length) {
			throw new RangeError(
				`TRI parse overrun at ${this.off} (need ${n}, size ${this.buf.length})`,
			)
		}
	}
	u8() {
		this.ensure(1)
		const v = this.buf.readUInt8(this.off)
		this.off += 1
		return v
	}
	u16() {
		this.ensure(2)
		const v = this.buf.readUInt16LE(this.off)
		this.off += 2
		return v
	}
	i16() {
		this.ensure(2)
		const v = this.buf.readInt16LE(this.off)
		this.off += 2
		return v
	}
	f32() {
		this.ensure(4)
		const v = this.buf.readFloatLE(this.off)
		this.off += 4
		return v
	}
	strN(n: number) {
		this.ensure(n)
		const s = this.buf.subarray(this.off, this.off + n).toString("utf8")
		this.off += n
		return s
	}
	skip(n: number) {
		this.ensure(n)
		this.off += n
	}
}

export function readTriFromBuffer(buf: Buffer): TriBodySlide {
	const cur = new Cursor(buf)
	const magic = buf.subarray(0, 4).toString("ascii")
	if (magic !== "PIRT")
		throw new Error(
			`Invalid TRI header: expected 'PIRT', got ${JSON.stringify(magic)}`,
		)
	cur.skip(4)

	const _version = cur.u16()
	const setName = cur.strN(cur.u8())
	const morphCount = cur.u16()

	const morphs: TriMorphSparse[] = new Array(morphCount)
	for (let i = 0; i < morphCount; i++) {
		const name = cur.strN(cur.u8())
		const scale = cur.f32()
		const num = cur.u16()

		const entries: TriMorphSparse["entries"] = new Array(num)
		for (let j = 0; j < num; j++) {
			const index = cur.u16()
			const dx = cur.i16()
			const dy = cur.i16()
			const dz = cur.i16()
			entries[j] = { index, dx, dy, dz }
		}
		morphs[i] = { name, scale, entries }
	}

	return { setName, morphs }
}

export function readTriFromFile(filePath: string): TriBodySlide {
	const buf = fs.readFileSync(filePath)
	return readTriFromBuffer(buf)
}
