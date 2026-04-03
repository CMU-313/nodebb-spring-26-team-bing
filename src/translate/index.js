/* eslint-disable strict */

const translatorApi = module.exports;

translatorApi.translate = async function (postData) {
	const content = typeof postData?.content === 'string' ? postData.content : '';
	if (!content) {
		return [true, ''];
	}

	const baseUrl = 'http://host.docker.internal:5000';
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
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
