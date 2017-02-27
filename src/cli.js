const Config = require('configstore')
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

module.exports = argv => {
  hopper.prediction(...argv)
    .then(data => {
      console.log(JSON.stringify(data, null, 2))
      console.log()
      console.log(hopper.googleFlightsLink(...argv))
    })
    .catch(err => console.log(err.stack || err))
}
