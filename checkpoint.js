const slack 	= require('./slack-webhook')
slack.hook(`${process.argv[2]} -- Logs`, `\`gpuminer\` Restarting...`)
