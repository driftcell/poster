import { describe, expect, it } from 'vitest';
import { purgePublicCache, type CacheStore } from '../src/lib/server/cache';

function fakeStore(): { store: CacheStore; deleted: string[] } {
	const deleted: string[] = [];
	return {
		deleted,
		store: {
			default: {
				delete: async (url: string) => {
					deleted.push(url);
					return true;
				}
			}
		}
	};
}

describe('purgePublicCache', () => {
	it('deletes each path against the origin', async () => {
		const { store, deleted } = fakeStore();
		await purgePublicCache(store, 'https://poster.driftcell.dev', ['/', '/atom.xml']);
		expect(deleted).toEqual([
			'https://poster.driftcell.dev/',
			'https://poster.driftcell.dev/atom.xml'
		]);
	});

	it('does nothing for an empty path list', async () => {
		const { store, deleted } = fakeStore();
		await purgePublicCache(store, 'https://poster.driftcell.dev', []);
		expect(deleted).toEqual([]);
	});
});
