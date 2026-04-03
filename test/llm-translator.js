'use strict';

const assert = require('assert');

const runningLlmTestFile = process.argv.some(arg => arg.includes('llm-translator.js'));

if (process.env.LLM_TEST_ENABLED === 'true' && runningLlmTestFile) {
	describe('LLM translator integration (real service)', () => {
		let translatorApi;
		let originalTranslatorApi;

		before(async () => {
			originalTranslatorApi = process.env.TRANSLATOR_API;
			if (!process.env.TRANSLATOR_API) {
				process.env.TRANSLATOR_API = 'http://host.docker.internal:5000';
			}

			translatorApi = require('../src/translate');

			// Fail fast with a clear reason if the real translator is unavailable.
			const [isEnglish] = await translatorApi.translate({ content: 'Ceci est un message en francais' });
			assert.strictEqual(
				isEnglish,
				false,
				`Translator service was not reachable/usable at ${process.env.TRANSLATOR_API}. Set TRANSLATOR_API and ensure it is running.`
			);
		});

		after(async () => {
			if (originalTranslatorApi) {
				process.env.TRANSLATOR_API = originalTranslatorApi;
			} else {
				delete process.env.TRANSLATOR_API;
			}
		});

		it('should translate Chinese content', async () => {
			const [isEnglish, translatedContent] = await translatorApi.translate({ content: '这是一条中文消息' });
			assert.equal(isEnglish, false);
			const normalized = translatedContent.toLowerCase();
			assert.ok(normalized.includes('this'));
			assert.ok(normalized.includes('chinese'));
			assert.ok(normalized.includes('message'));
		});

		it('should translate Spanish content', async () => {
			const [isEnglish, translatedContent] = await translatorApi.translate({ content: 'Este es un mensaje en espanol' });
			assert.equal(isEnglish, false);
			const normalized = translatedContent.toLowerCase();
			assert.ok(normalized.includes('this'));
			assert.ok(normalized.includes('spanish'));
			assert.ok(normalized.includes('message'));
		});

		it('should translate French content', async () => {
			const [isEnglish, translatedContent] = await translatorApi.translate({ content: 'Ceci est un message en francais' });
			assert.equal(isEnglish, false);
			const normalized = translatedContent.toLowerCase();
			assert.ok(normalized.includes('this'));
			assert.ok(normalized.includes('french'));
			assert.ok(normalized.includes('message'));
		});

		it('should translate Japanese content', async () => {
			const [isEnglish, translatedContent] = await translatorApi.translate({ content: 'これは日本語のメッセージです' });
			assert.equal(isEnglish, false);
			const normalized = translatedContent.toLowerCase();
			assert.ok(normalized.includes('this'));
			assert.ok(normalized.includes('japanese'));
			assert.ok(normalized.includes('message'));
		});

		it('should handle LLM normal response pattern', async () => {
			const [isEnglish, translatedContent] = await translatorApi.translate({
				content: 'Je parle en francais, donc beaucoup de ces exemples seront en francais.',
			});
			assert.equal(isEnglish, false);
			const normalized = translatedContent.toLowerCase();
			assert.ok(normalized.includes('french'));
			assert.ok(normalized.includes('these examples'));
		});

		it('should handle LLM gibberish response pattern', async () => {
			const [isEnglish, translatedContent] = await translatorApi.translate({ content: 'efghwoepjfbwejn' });
			assert.strictEqual(typeof isEnglish, 'boolean');
			assert.strictEqual(typeof translatedContent, 'string');
			const normalized = translatedContent.toLowerCase();
			assert.ok(normalized.includes('efghwoepjfbwejn'));
		});
	});
}
