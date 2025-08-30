// bodyslide-tri.ts
import fs from "node:fs"
import type { BodySlideTri, TriChannel, TriHeader } from "../types"

type Vec3 = [number, number, number]

/** Little-endian cursor */
class Cursor {
	private o = 0
	constructor(private v: DataView) {}
	u8() {
		const x = this.v.getUint8(this.o)
		this.o += 1
		return x
	}
	i16() {
		const x = this.v.getInt16(this.o, true)
		this.o += 2
		return x
	}
	u16() {
		const x = this.v.getUint16(this.o, true)
		this.o += 2
		return x
	}
	f32() {
		const x = this.v.getFloat32(this.o, true)
		this.o += 4
		return x
	}
	strN(n: number) {
		const a = new Uint8Array(this.v.buffer, this.v.byteOffset + this.o, n)
		this.o += n
		return new TextDecoder().decode(a)
	}
	strLen8() {
		return this.strN(this.u8())
	}
}

export function parseBodySlideTri(path: string): BodySlideTri {
	const buf = fs.readFileSync(path)
	const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
	const c = new Cursor(dv)

	const magic = c.strN(4) as "PIRT"
	if (magic !== "PIRT") throw new Error(`Not a BodySlide TRI (magic=${magic})`)

	const version = c.u16()
	if (version !== 1) throw new Error(`Unsupported TRI version ${version}`)

	const baseName = c.strLen8()
	const channelCount = c.u16()

	const header: TriHeader = { magic, version, baseName, channelCount }

	const channels: TriChannel[] = []
	channels.length = channelCount

	for (let i = 0; i < channelCount; i++) {
		const name = c.strLen8()
		const scale = c.f32()
		const numAffected = c.u16()

		const indices = new Uint16Array(numAffected)
		const deltas = new Int16Array(numAffected * 3)

		for (let j = 0; j < numAffected; j++) {
			const vidx = c.u16()
			const dx = c.i16()
			const dy = c.i16()
			const dz = c.i16()
			indices[j] = vidx
			const k = j * 3
			deltas[k + 0] = dx
			deltas[k + 1] = dy
			deltas[k + 2] = dz
		}

		channels[i] = { name, scale, numAffected, indices, deltas }
	}

	return { header, channels }
}
