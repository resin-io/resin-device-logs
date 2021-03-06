Promise = require('bluebird')
m = require('mochainon')
pubnub = require('../lib/pubnub')
{ getChannels } = require('../lib/utils')
logs = require('../lib/logs')

pubnubKeys = require('./config')
{ randomId, randomChannel, getMessages } = require('./helpers')

global.Promise ?= Promise

describe 'Logs:', ->

	@timeout(10000)
	@retries(5)

	beforeEach ->
		@instance = pubnub.getInstance(pubnubKeys)
		@device = {
			uuid: randomId()
			logs_channel: randomId()
		}
		@channel = getChannels(@device).channel

	describe '.subscribe()', ->

		it 'should send message events', ->
			pubnubStream = logs.subscribe(pubnubKeys, @device)

			Promise.mapSeries ['foo', 'bar', 'baz'], (m) =>
				@instance.publish
					channel: @channel
					message: [
						m: m
						t: null
						s: false
					]
			.thenReturn(getMessages(pubnubStream, 3))
			.then (messages) ->
				m.chai.expect(messages).to.deep.equal [
					message: 'foo'
					isSystem: false
					timestamp: null
					serviceId: null
				,
					message: 'bar'
					isSystem: false
					timestamp: null
					serviceId: null
				,
					message: 'baz'
					isSystem: false
					timestamp: null
					serviceId: null
				]

	describe '.history()', ->

		it 'should eventually return the messages', ->
			Promise.mapSeries ['Foo', 'Bar', 'Baz'], (m) =>
				@instance.publish
					channel: @channel
					message: [
						m: m
						t: null
						s: false
					]
			.delay(1000)
			.then => logs.history(pubnubKeys, @device)
			.then (messages) ->
				m.chai.expect(messages).to.deep.equal [
					message: 'Foo'
					isSystem: false
					timestamp: null
					serviceId: null
				,
					message: 'Bar'
					isSystem: false
					timestamp: null
					serviceId: null
				,
					message: 'Baz'
					isSystem: false
					timestamp: null
					serviceId: null
				]

		it 'should ignore .clear', ->
			Promise.mapSeries [1..3], (i) =>
				@instance.publish
					channel: @channel
					message: [
						m: "Message #{i}"
						t: null
						s: false
					]
			.delay(1000)
			.then => logs.clear(pubnubKeys, @device)
			.delay(1000)
			.then => logs.history(pubnubKeys, @device)
			.then (messages) ->
				m.chai.expect(messages.length).to.equal(3)

	describe 'historySinceLastClear()', ->

		it 'should show all messages, if .clear has never been called', ->
			Promise.mapSeries [1..3], (i) =>
				@instance.publish
					channel: @channel
					message: [
						m: "Message #{i}"
						t: null
						s: false
					]
			.delay(1000)
			.then => logs.historySinceLastClear(pubnubKeys, @device)
			.then (messages) ->
				m.chai.expect(messages).to.deep.equal [
					message: 'Message 1'
					isSystem: false
					timestamp: null
					serviceId: null
				,
					message: 'Message 2'
					isSystem: false
					timestamp: null
					serviceId: null
				,
					message: 'Message 3'
					isSystem: false
					timestamp: null
					serviceId: null
				]

		it 'should only show messages since the .clear(), if it has been called', ->
			Promise.mapSeries [1..3], (i) =>
				@instance.publish
					channel: @channel
					message: [
						m: "Message #{i}"
						t: null
						s: false
					]
			.delay(1000)
			.then => logs.clear(pubnubKeys, @device)
			.delay(1000)
			.then =>
				Promise.mapSeries [4..5], (i) =>
					@instance.publish
						channel: @channel
						message: [
							m: "Message #{i}"
							t: null
							s: false
						]
			.delay(1000)
			.then => logs.historySinceLastClear(pubnubKeys, @device)
			.then (messages) ->
				m.chai.expect(messages).to.deep.equal [
					message: 'Message 4'
					isSystem: false
					timestamp: null
					serviceId: null
				,
					message: 'Message 5'
					isSystem: false
					timestamp: null
					serviceId: null
				]
