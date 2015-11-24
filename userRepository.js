module.exports = function(mongo) {
	if(!mongo) {
		throw 'Missing mongo';
	}

	return {
		findAndInsertUser: function(authProfile, dbUserCallback) {
			mongo.collection("users").findAndModify(
				{ providerId: authProfile.id },
				[],               
				{ $set: { 
							name: authProfile.displayName,
							provider: authProfile.provider,
							providerId: authProfile.id 
						}},
				{ new: true, upsert: true },
				function(err,result) {
					dbUserCallback(result.value);
				});		
		}
	};
};