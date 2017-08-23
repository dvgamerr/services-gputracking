const slack 	= require('./slack-webhook')
slack.hook(`${process.argv[2]} -- Logs`, `\`GPU-Watcher\` Restarting...`)
