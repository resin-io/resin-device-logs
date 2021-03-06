// Generated by CoffeeScript 1.12.7

/*
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
 */

/**
 * @module logs
 */
var EventEmitter, Promise, SUBSCRIBE_ERROR_CATEGORY, assign, extractMessages, flatten, getChannels, pubnub, ref;

flatten = require('lodash/flatten');

assign = require('lodash/assign');

Promise = require('bluebird');

EventEmitter = require('events').EventEmitter;

pubnub = require('./pubnub');

ref = require('./utils'), extractMessages = ref.extractMessages, getChannels = ref.getChannels;

SUBSCRIBE_ERROR_CATEGORY = 'PNNetworkIssuesCategory';


/**
 * @summary Subscribe to device logs
 * @function
 * @public
 *
 * @description This function emits various events:
 *
 * - `line`: When a log line arrives, passing an object as an argument.
 * - `clear`: When the `clear` request is published (see the `clear` method)
 * - `error`: When an error occurs, passing an error code as an argument.
 *
 * The object returned by this function also contains the following functions:
 *
 * - `.unsubscribe()`: Unsubscribe from the device channel.
 *
 * @param {Object} pubnubKeys - PubNub keys
 * @param {Object} device - device
 *
 * @returns {EventEmitter} logs
 *
 * @example
 * deviceLogs = logs.subscribe
 * 	subscribe_key: '...'
 * 	publish_key: '...'
 * ,
 * 	device
 *
 * deviceLogs.on 'line', (line) ->
 * 	console.log(line.message)
 * 	console.log(line.isSystem)
 * 	console.log(line.timestamp)
 *
 * deviceLogs.on 'error', (error) ->
 * 	throw error
 *
 * deviceLogs.on 'clear', ->
 * 	console.clear()
 */

exports.subscribe = function(pubnubKeys, device) {
  var channel, clearChannel, emit, emitter, instance, onMessage, pubnubListener, ref1;
  ref1 = getChannels(device), channel = ref1.channel, clearChannel = ref1.clearChannel;
  instance = pubnub.getInstance(pubnubKeys);
  emitter = new EventEmitter();
  emit = function(event, data) {
    return emitter.emit(event, data);
  };
  onMessage = function(message) {
    if (message.channel === clearChannel) {
      return emit('clear');
    }
    if (message.channel === channel) {
      return extractMessages(message.message).forEach(function(payload) {
        return emit('line', payload);
      });
    }
  };
  pubnubListener = {
    message: onMessage,
    status: function(arg) {
      var category;
      category = arg.category;
      if (category === SUBSCRIBE_ERROR_CATEGORY) {
        return emit('error', SUBSCRIBE_ERROR_CATEGORY);
      }
    }
  };
  instance.addListener(pubnubListener);
  instance.subscribe({
    channels: [channel, clearChannel]
  });
  emitter.unsubscribe = function() {
    instance.removeListener(pubnubListener);
    return instance.unsubscribe({
      channels: [channel, clearChannel]
    });
  };
  return emitter;
};


/**
 * @summary Get device logs history
 * @function
 * @public
 *
 * @param {Object} pubnubKeys - PubNub keys
 * @param {Object} device - device
 * @param {Object} [options] - other options supported by
 * https://www.pubnub.com/docs/nodejs-javascript/api-reference#history
 *
 * @returns {Promise<Object[]>} device logs history
 *
 * @example
 * logs.history
 * 	subscribe_key: '...'
 * 	publish_key: '...'
 * ,
 * 	device
 * .then (lines) ->
 * 	for line in lines
 * 		console.log(line.message)
 * 		console.log(line.isSystem)
 * 		console.log(line.timestamp)
 */

exports.history = function(pubnubKeys, device, options) {
  return Promise["try"](function() {
    var channel, instance;
    instance = pubnub.getInstance(pubnubKeys);
    channel = getChannels(device).channel;
    return pubnub.history(instance, channel, options);
  }).map(extractMessages).then(flatten);
};


/**
 * @summary Get device logs history after the most recent clear
 * @function
 * @public
 *
 * @param {Object} pubnubKeys - PubNub keys
 * @param {Object} device - device
 * @param {Object} [options] - other options supported by
 * https://www.pubnub.com/docs/nodejs-javascript/api-reference#history
 *
 * @returns {Promise<Object[]>} device logs history
 *
 * @example
 * logs.historySinceLastClear
 * 	subscribe_key: '...'
 * 	publish_key: '...'
 * ,
 * 	device
 * .then (lines) ->
 * 	for line in lines
 * 		console.log(line.message)
 * 		console.log(line.isSystem)
 * 		console.log(line.timestamp)
 */

exports.historySinceLastClear = function(pubnubKeys, device, options) {
  return exports.getLastClearTime(pubnubKeys, device).then(function(endTime) {
    options = assign({
      count: 200
    }, options, {
      end: endTime
    });
    return exports.history(pubnubKeys, device, options);
  });
};


/**
 * @summary Clear device logs history
 * @function
 * @public
 *
 * @param {Object} pubnubKeys - PubNub keys
 * @param {Object} device - device
 *
 * @returns {Promise} - resolved witht he PubNub publish response
 */

exports.clear = function(pubnubKeys, device) {
  return Promise["try"](function() {
    var clearChannel, instance;
    instance = pubnub.getInstance(pubnubKeys);
    clearChannel = getChannels(device).clearChannel;
    return instance.time().then(function(arg) {
      var timetoken;
      timetoken = arg.timetoken;
      return instance.publish({
        channel: clearChannel,
        message: timetoken
      });
    });
  });
};


/**
 * @summary Get the most recent device logs history clear time
 * @function
 * @public
 *
 * @param {Object} pubnubKeys - PubNub keys
 * @param {Object} device - device
 *
 * @returns {Promise<number>} timetoken
 */

exports.getLastClearTime = function(pubnubKeys, device) {
  return Promise["try"](function() {
    var clearChannel, instance;
    instance = pubnub.getInstance(pubnubKeys);
    clearChannel = getChannels(device).clearChannel;
    return pubnub.history(instance, clearChannel, {
      count: 1
    }).then(function(messages) {
      return (messages != null ? messages[0] : void 0) || 0;
    });
  });
};
