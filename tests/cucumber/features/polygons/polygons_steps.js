(function() {

	module.exports = function() {

		this.Given(/^I am logged in$/, function (callback) {
		  this.client
      .setValue('#at-field-email', 'aidanxyz@gmail.com')
      .setValue('#at-field-password', 'testtest')
      .submitForm('#at-pwd-form')
      .waitForExist('.navbar', 7000)
      .waitForVisible('.navbar')
      .getText('.navbar-right', function (err, text) {
        assert.equal(text, 'Выйти');
      })
      .call(callback);
		});

		this.When(/^I click the "([^"]*)" button$/, function (arg1, callback) {
		  this.client
		  .click('#btn-draw')
		  .call(callback);
		});

		this.When(/^I click on the right part of the map$/, function (callback) {
		  this.client
		  .moveToObject('.map-canvas', 400, 100)
		  .leftClick()
		  .pause(3000)
		  .call(callback);
		});

		this.When(/^I click on the left part of the map$/, function (callback) {
		  this.client
		  .moveToObject('.map-canvas', 50, 100)			
		  .leftClick()
		  .pause(3000)
		  .call(callback);
		});

		this.When(/^I double click on the bottom part of the map$/, function (callback) {
		  this.client
		  .moveToObject('.map-canvas', 175, 200)
		  .leftClick()
		  .pause(1000)
		  .leftClick()
		  .pause(3000)
		  .call(callback);
		});

		this.Then(/^the polygons counter should be equal to (\d+)$/, function (arg1, callback) {
		  this.client
		  .getText('#polygons-counter', function(err, text) {
		  	assert.equal(text, '1');
		  })
		  .call(callback);
		});

	}

})();