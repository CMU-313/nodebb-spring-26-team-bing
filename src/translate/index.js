/* eslint-disable strict */

const translatorApi = module.exports;

translatorApi.translate = async function (postData) {
	const content = typeof postData?.content === 'string' ? postData.content : '';
	if (!content) {
		return [true, ''];
	}

	const urlsToTry = [
		process.env.TRANSLATOR_API,
		'http://host.docker.internal:5000',
		'http://127.0.0.1:5000',
	].filter(Boolean);

	const tryUrl = async function (index) {
		if (index >= urlsToTry.length) {
			return null;
		}

		const baseUrl = urlsToTry[index];
		try {
			const response = await fetch(`${baseUrl}/?content=${encodeURIComponent(content)}`);
			if (!response.ok) {
				return await tryUrl(index + 1);
			}

			const data = await response.json();
			const isEnglish = Boolean(data.is_english ?? true);
			const translatedContent = String(data.translated_content ?? '');

			return [isEnglish, translatedContent];
		} catch (err) {
			// Try the next URL before failing closed.
			return await tryUrl(index + 1);
		}
	};

	const result = await tryUrl(0);
	if (result) {
		return result;
	}

	return [true, ''];
};
