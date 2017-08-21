const line = require('@line/bot-sdk');
const msgID = 'U99a557887fe970d1e51dcef21f2fc278'
const access_token = 'aLWtThxKjje3XZPX9MMczLk/0tHwqCN7OVcfbfLSKFAMb8aLSL7VGW9xX/SeSCCEjE/N8TEiKTMJmOzWPrPvx3Ki03ezUhlS8CE8XkKNOLjlugrrXbD5lrpD4IAsehEleBS+mNcAjfLTtRim7qaeWQdB04t89/1O/w1cDnyilFU='

const client = new line.Client({ channelAccessToken: access_token })

let sender = {
	type: 'template',
	altText: `GPUMiner stats`,
	template: {
		type: 'buttons',
		title: 'Algorithm',
		text: `algo 'Equihash' Profit: 0.0006802400000000002 BTC/Day`,
		thumbnailImageUrl: 'https://image.ibb.co/i4dHRk/1080ti_2b_1.jpg',
		actions: [
			{ type: 'message', label: 'UNPAID', text: 'text' }
		]
	}
}

client.pushMessage(msgID, sender).then(data => {
  console.log('success message. =>', data)
}).catch(err => {
  console.log('error message. =>', err)
})