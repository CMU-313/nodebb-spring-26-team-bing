/* eslint-disable strict */

const translatorApi = module.exports;

translatorApi.translate = async function (postData) {
	const content = typeof postData?.content === 'string' ? postData.content : '';
	if (!content) {
		return [true, ''];
	}

	// Avoid external network calls in the full NodeBB test suite unless explicitly enabled.
	const runningUnderMocha = process.argv.some(arg => arg.includes('mocha'));
	const runningLlmTestFile = process.argv.some(arg => arg.includes('llm-translator.js'));
	const runningGeneralTests = Boolean(
		process.env.TEST_ENV ||
		process.env.NODE_ENV === 'test' ||
		process.env.npm_lifecycle_event === 'test' ||
		runningUnderMocha
	);
	if (runningGeneralTests && !(process.env.LLM_TEST_ENABLED === 'true' && runningLlmTestFile)) {
		return [true, ''];
	}

	const baseUrl = process.env.TRANSLATOR_API || 'http://host.docker.internal:5000';
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 5000);
		const response = await fetch(`${baseUrl}/?content=${encodeURIComponent(content)}`, {
			signal: controller.signal,
		});
		clearTimeout(timeoutId);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}

		const data = await response.json();
		const isEnglish = Boolean(data.is_english ?? true);
		const translatedContent = String(data.translated_content ?? '');

		return [isEnglish, translatedContent];
	} catch (err) {
		// If request fails, return default
		return [true, ''];
	}
};
