(function() {
  
  module.exports = function() {

    this.Given(/^I am signed out$/, function (callback) {
		  this.client
      .url(process.env.ROOT_URL + "logout")
      .waitForExist('#at-field-email', 5000)
      .waitForVisible('#at-field-email', 5000)
      .call(callback);
		});

		this.Given(/^I am on the objects page$/, function (callback) {
		  this.client
		  .url(process.env.ROOT_URL + 'objects')
		  .call(callback);
		});

		this.Then(/^I should be redirected to login page$/, function (callback) {
		  this.client
      .waitForExist('#at-field-email', 5000)
      .waitForVisible('#at-field-email', 5000)
      .call(callback);
		});

		this.Given(/^I am on the geoportal page$/, function (callback) {
		  this.client
		  .url(process.env.ROOT_URL + 'geoportal')
		  .call(callback);
		});

		this.Given(/^I am on the login page$/, function (callback) {
		  this.client
		  .url(process.env.ROOT_URL + 'sign-in')
		  .call(callback);
		});

		this.Given(/^I enter my authentication information$/, function (callback) {
		  this.client
      .setValue('#at-field-email', 'aidanxyz@gmail.com')
      .setValue('#at-field-password', 'testtest')
      .submitForm('#at-pwd-form')
      .call(callback);
		});

		this.Then(/^I should be logged in$/, function (callback) {
		  this.client
      .waitForExist('.navbar', 7000)
      .waitForVisible('.navbar')
      .getText('.navbar-right', function (err, text) {
        assert.equal(text, 'Выйти');
      })
      .call(callback);
		});

		this.Given(/^I enter incorrect authentication information$/, function (callback) {
		  this.client
      .setValue('#at-field-email', 'aidanxyz@gmail.com')
      .setValue('#at-field-password', 'wrong pw')
      .submitForm('#at-pwd-form')
      .call(callback);
		});

		this.Then(/^I should see a user not found error$/, function (callback) {
		  this.client
      .waitForExist('.at-error', 5000)
      .waitForVisible('.at-error')
      .getText('.at-error', function (err, text) {
        assert.equal(text, 'Login forbidden');
      })
      .call(callback);
		});

  }

})();