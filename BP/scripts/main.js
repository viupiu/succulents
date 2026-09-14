import { world, system } from "@minecraft/server";

const FLOWER = "succulents:bloom_flower";
const SUCCULENTS = new Set([
	"succulents:echeveria_derenbergii",
	"succulents:echeveria_elegans",
	"succulents:echeveria_fallax"
]);

const DIMENSIONS = ["overworld", "nether", "the_end"];

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

		const places = new Set();
		for (const flower of flowers) {
			let pos;
			try {
				pos = flower.location;
			} catch {
				continue;
			}

			const below = dim.getBlock({
				x: Math.floor(pos.x),
				y: Math.floor(pos.y) - 1,
				z: Math.floor(pos.z)
			});

			if (!below || !SUCCULENTS.has(below.typeId)) {
				try {
					flower.remove();
				} catch {}
				continue;
			}

			const key = `${Math.floor(pos.x)},${Math.floor(pos.y) - 1},${Math.floor(pos.z)}`;
			if (places.has(key)) {
				try {
					flower.remove();
				} catch {}
			} else {
				places.add(key);
			}
		}
	}
}

system.runInterval(() => {
	try {
		watchFlowers();
	} catch {}
}, 20);