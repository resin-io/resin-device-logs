###
Copyright 2016 Resin.io

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
###

assign = require('lodash/assign')
memoize = require('lodash/memoize')
Promise = require('bluebird')
PubNub = require('pubnub')

getPublishKey = (options) -> options.publishKey or options.publish_key

getSubscribeKey = (options) -> options.subscribeKey or options.subscribe_key

###*
# @summary Get a PubNub instance
# @function
# @protected
#
# @param {Object} options - PubNub options
# @param {String} options.subscribeKey - subscribe key (`subscribe_key` is also supported)
# @param {String} options.publishKey - publish key (`publish_key` is also supported)
#
# @returns {Object} PubNub instance
###
exports.getInstance = memoize (options) ->
	new PubNub({
		publishKey: getPublishKey(options)
		subscribeKey: getSubscribeKey(options)
		ssl: true
	})
, getSubscribeKey

###*
# @summary Get logs history from an instance
# @function
# @protected
#
# @description
# **Note:** For invalid (non-existent) channel this will return
# an empty array as if it exists but doesn't have any history messages.
#
# @param {Object} instance - PubNub instance
# @param {String} channel - channel
# @param {Object} [options] - other options supported by
# https://www.pubnub.com/docs/nodejs-javascript/api-reference#history
#
# @returns {Promise<any[]>} history messages
###
exports.history = (instance, channel, options = {}) ->
	options = assign({ channel }, options)
	return instance.history(options)
	.then ({ messages }) ->
		messages.map((m) -> m.entry)
