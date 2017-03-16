const chalk = require('chalk')
const Table = require('cli-table2')
const Config = require('configstore')
const fs = require('fs')
const merge = require('lodash.merge')
const uuid = require('uuid')

const Hopper = require('./')
const pkg = require('../package')

const config = new Config(pkg.name, { userId: uuid() })

const configOptions = {
  userId: config.get('userId'),
  locale: config.get('locale'),
  currency: config.get('currency'),
  timeZone: config.get('timeZone')
}

const envOptions = {
  userId: process.env.HOPPER_USER_ID,
  locale: process.env.HOPPER_LOCALE,
  currency: process.env.HOPPER_CURRENCY,
  timeZone: process.env.HOPPER_TIME_ZONE || process.env.TZ
}

const dateSystemOptions = Intl.DateTimeFormat().resolvedOptions()

const systemOptions = {
  locale: dateSystemOptions.locale.replace('-', '_'),
  timeZone: dateSystemOptions.timeZone
}

const defaultOptions = {
  locale: 'en_US',
  currency: 'USD',
  timeZone: 'America/New_York'
}

// Can't use `Object.assign` because we want to ignore `undefined` values.
const options = merge({}, defaultOptions, systemOptions, envOptions, configOptions)

const hopper = Hopper(options)

function render (copy, googleFlightsLink) {
  const logo = fs.readFileSync(`${__dirname}/../logo.ascii`, 'utf8')
  const lines = logo.split('\n').map(x => x + '  ')

  const textLines = [
    `${chalk.yellow(copy.origin)} to ${chalk.yellow(copy.destination)}`,
    chalk.yellow(copy.travelDates),
    '',
    `Current Lowest Price: ${chalk.bold(copy.lowestPriceLabel)}${copy.carrier}`,
    '',
    chalk.black.bgYellow(copy.recommendationTitle[0]),
    copy.recommendationBody[0],
  ];

  Object.keys(copy.intervals).forEach(interval => {
    textLines.push('', `${copy.intervals[interval].dates}:`, copy.intervals[interval].copy)
  })

  textLines.push('', 'See options on Google Flights:', chalk.blue(googleFlightsLink))

  const padding = Math.floor((lines.length - textLines.length) / 2)

  textLines
    .map(line => line.replace(/<strong>/g, chalk.styles.bold.open).replace(/<\/strong>/g, chalk.styles.bold.close))
    .forEach((line, i) => {
      lines[padding + i] += `  ${line}`
    })

  return lines.join('\n')
}

module.exports = argv => {
  hopper.prediction(...argv)
    .then(data => {
      console.log(render(data.predictionCopy, hopper.googleFlightsLink(...argv)))
    })
    .catch(err => console.log(err.stack || err))
}
