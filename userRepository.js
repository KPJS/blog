module.exports = function(mongo) {
	if(!mongo) {
		throw 'Missing mongo';
	}

	return {
		findAndInsertUser: function(authProfile, dbUserCallback) {
			mongo.collection("users").findAndModify(
				{ provider: authProfile.provider,
					providerId: authProfile.id
				},
				[],
				{ $setOnInsert: { name: authProfile.displayName } },
				{ new: true, upsert: true },
				function(err,result) {
					dbUserCallback(err, result.value);
				});
		}
	};
};
