(function() {

	Meteor.methods({
		addUser: function(opts) {
			Meteor.users.remove({});
			Accounts.createUser({
				email: opts.email,
				password: opts.password || 'testtest'
			});
			Objects.remove({});
			Polygons.remove({});
		}
	});

})();