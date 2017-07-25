const request = require('request-promise')

module.exports = {
	miner: message => {
		return request({
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			url: 'https://hooks.slack.com/services/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',
			formData: { payload: JSON.stringify({ text: message }) }
		})
	},
	hook: (name, message) => {
		return request({
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			url: 'https://hooks.slack.com/services/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',
			formData: { payload: JSON.stringify({ text: message, username: name }) }
		})
	}
}