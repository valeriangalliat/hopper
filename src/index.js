const { gzip } = require('mz/zlib')
const requestPromise = require('request-promise')

const base = 'https://mobile-api.hopper.com/api'

const request = (path, options) =>
  requestPromise(`${base}${path}`, options)

const encodeHRequest = object => gzip(JSON.stringify(object))

const generateHRequest = options =>
  encodeHRequest({
    identity: {
      userId: options.userId,
      deviceId: '0',
      appId: '',
      version: {
        value: '0',
        buildNumber: 0
      }
    },
    preferences: {
      locale: options.locale,
      currency: options.currency,
      timeZone: options.timeZone
    },
    savedItems: []
  })
    .then(buffer => buffer.toString('base64'))

module.exports = options => ({
  googleFlightsLink (origin, destination, departureDate, returnDate) {
    const link = `https://www.google.com/flights/#search;f=${origin};t=${destination};d=${departureDate}`
    if (!returnDate) return `${link};tt=o`
    return `${link};r=${returnDate}`
  },
  prediction (origin, destination, departureDate, returnDate) {
    return generateHRequest(options)
      .then(hRequest => request('/v2/prediction', {
        method: 'POST',
        headers: {
          'H-Request': hRequest,
          'X-User-ID': options.userId,
          'X-Build-Number': 0,
          'X-Locale': options.locale,
          'X-Currency': options.currency,
          'X-TimeZone': options.timeZone
        },
        json: {
          alertKey: {
            filter: {
              TripFilter: 'NoFilter'
            },
            grouping: {
              TripGrouping: 'DateGrouping',
              departureDate,
              returnDate,
              route: {
                destination: {
                  code: destination,
                  regionType: 'airport'
                },
                origin: {
                  code: origin,
                  regionType: 'airport'
                }
              }
            }
          },
          autoWatch: false,
          isOnboarding: false
        }
      }))
      .then(body => body.response)
  }
})
