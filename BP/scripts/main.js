import { world, system } from "@minecraft/server";

const FLOWER = "succulents:bloom_flower";
const SUCCULENTS = new Set([
	"succulents:echeveria_derenbergii",
	"succulents:echeveria_elegans",
	"succulents:echeveria_fallax"
]);
const DIMENSIONS = ["overworld", "nether", "the_end"];

const blooms = new Map();

function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isSucc(block) {
	return block !== undefined && block !== null && SUCCULENTS.has(block.typeId);
}

function cleanLegacyEntities() {
	for (const dimName of DIMENSIONS) {
		let dim;
		try {
			dim = world.getDimension(dimName);
		} catch {
			continue;
		}
		let list;
		try {
			list = dim.getEntities({ type: "succulents:bloom_flower" });
		} catch {
			continue;
		}
		for (const entity of list) {
			try {
				entity.remove();
			} catch {}
		}
	}
}

function tickFlowers() {
	const now = Date.now();
	for (const dimName of DIMENSIONS) {
		let dim;
		try {
			dim = world.getDimension(dimName);
		} catch {
			continue;
		}
		for (const [key, rec] of [...blooms]) {
			const block = dim.getBlock({ x: rec.x, y: rec.y, z: rec.z });
			if (block === undefined || block === null) {
				continue;
			}
			if (block.typeId !== FLOWER) {
				blooms.delete(key);
				continue;
			}
			const below = dim.getBlock({ x: rec.x, y: rec.y - 1, z: rec.z });
			if (below === undefined || below === null) {
				continue;
			}
			if (!isSucc(below)) {
				try {
					dim.setBlock({ x: rec.x, y: rec.y, z: rec.z }, "minecraft:air");
				} catch {}
				blooms.delete(key);
				continue;
			}
			if (now >= rec.expires) {
				try {
					dim.setBlock({ x: rec.x, y: rec.y, z: rec.z }, "minecraft:air");
				} catch {}
				blooms.delete(key);
			}
		}
	}
}

function tryBloom() {
	for (const player of world.getAllPlayers()) {
		const pos = player.location;
		const baseX = Math.floor(pos.x);
		const baseY = Math.floor(pos.y);
		const baseZ = Math.floor(pos.z);
		for (let i = 0; i < 12; i++) {
			const x = baseX + randomInt(-12, 12);
			const z = baseZ + randomInt(-12, 12);
			const y = baseY + randomInt(-4, 6);
			let dim;
			try {
				dim = player.dimension;
			} catch {
				continue;
			}
			const cell = dim.getBlock({ x, y, z });
			if (cell === undefined || cell === null) {
				continue;
			}
			if (cell.typeId === FLOWER) {
				const belowFlower = dim.getBlock({ x, y: y - 1, z });
				if (belowFlower !== undefined && belowFlower !== null && !isSucc(belowFlower)) {
					try {
						dim.setBlock({ x, y, z }, "minecraft:air");
					} catch {}
				}
				continue;
			}
			if (cell.typeId !== "minecraft:air") {
				continue;
			}
			const below = dim.getBlock({ x, y: y - 1, z });
			if (below === undefined || below === null || !isSucc(below)) {
				continue;
			}
			try {
				dim.setBlock({ x, y, z }, FLOWER);
				blooms.set(`${x},${y},${z}`, {
					x,
					y,
					z,
					expires: Date.now() + randomInt(160000, 240000)
				});
			} catch {}
			break;
		}
	}
}

system.runInterval(() => {
	try {
		cleanLegacyEntities();
	} catch {}
	try {
		tickFlowers();
	} catch {}
}, 4);

system.runInterval(() => {
	try {
		tryBloom();
	} catch {}
}, 600);