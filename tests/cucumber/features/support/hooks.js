(function() {
  
  module.exports = function() {
  	this.Before(function(callback) {
  	  this.server.call('addUser', {email: 'aidanxyz@gmail.com'})
  	  .then(callback);
  	});
  }

})();