import { world, system } from "@minecraft/server";

const FLOWER = "succulents:bloom_flower";
const SUCCULENTS = new Set([
	"succulents:echeveria_derenbergii",
	"succulents:echeveria_elegans",
	"succulents:echeveria_fallax"
]);

const DIMENSIONS = ["overworld", "nether", "the_end"];

function isSucc(block) {
	return block != null && SUCCULENTS.has(block.typeId);
}

function watchFlowers() {
	for (const dimName of DIMENSIONS) {
		let dim;
		try {
			dim = world.getDimension(dimName);
		} catch {
			continue;
		}

		let flowers;
		try {
			flowers = dim.getEntities({ type: FLOWER });
		} catch {
			continue;
		}

		const bySucc = new Map();
		for (const flower of flowers) {
			let pos;
			try {
				pos = flower.location;
			} catch {
				continue;
			}

			const fx = Math.floor(pos.x);
			const fy = Math.floor(pos.y);
			const fz = Math.floor(pos.z);

			const self = dim.getBlock({ x: fx, y: fy, z: fz });
			const below = dim.getBlock({ x: fx, y: fy - 1, z: fz });

			if (!isSucc(self) && !isSucc(below)) {
				try {
					flower.remove();
				} catch {}
				continue;
			}

			const succCell = isSucc(self)
				? { x: fx, y: fy, z: fz }
				: { x: fx, y: fy - 1, z: fz };
			const key = `${succCell.x},${succCell.y},${succCell.z}`;
			const best = bySucc.get(key);

			if (!best) {
				bySucc.set(key, flower);
				continue;
			}

			const bestDist = Math.abs(best.location.y - (succCell.y + 1));
			const newDist = Math.abs(pos.y - (succCell.y + 1));
			if (newDist < bestDist) {
				try {
					best.remove();
				} catch {}
				bySucc.set(key, flower);
			} else {
				try {
					flower.remove();
				} catch {}
			}
		}
	}
}

system.runInterval(() => {
	try {
		watchFlowers();
	} catch {}
}, 20);