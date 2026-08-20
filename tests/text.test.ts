import { describe, expect, it } from 'vitest';
import { redact } from '../src/lib/text';

describe('redact', () => {
	it('masks CJK, latin letters and digits, keeps CJK punctuation', () => {
		expect(redact('你好，世界！')).toBe('██，██！');
	});

	it('masks latin and digits, keeps spaces and ASCII punctuation', () => {
		expect(redact('Hello, World 2024')).toBe('█████, █████ ████');
	});

	it('masks phone-number-like content but keeps separators', () => {
		expect(redact('电话：138-1234-5678')).toBe('██：███-████-████');
	});

	it('masks emoji and symbols as single blocks', () => {
		expect(redact('a👍b€')).toBe('████');
	});

	it('keeps line breaks', () => {
		expect(redact('第一行\n\n第二行')).toBe('███\n\n███');
	});

	it('returns empty string unchanged', () => {
		expect(redact('')).toBe('');
	});
});
