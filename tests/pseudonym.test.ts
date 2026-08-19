import { describe, expect, it } from 'vitest';
import { pseudonymFor } from '../src/lib/pseudonym';

describe('pseudonymFor', () => {
	it('is deterministic for the same hash', () => {
		const hash = 'aabbccddeeff0011223344556677889900';
		expect(pseudonymFor(hash)).toBe(pseudonymFor(hash));
	});

	it('formats as "形容词名词 #数字"', () => {
		expect(pseudonymFor('aabbccddeeff0011223344556677889900')).toMatch(/^.+ #\d{1,2}$/);
	});

	it('varies across different hashes', () => {
		const names = new Set(
			Array.from({ length: 16 }, (_, i) =>
				pseudonymFor(`${String(i).padStart(2, '0')}` + '0'.repeat(32))
			)
		);
		expect(names.size).toBeGreaterThan(1);
	});
});
