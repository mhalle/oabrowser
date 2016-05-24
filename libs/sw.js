self.CACHE_NAME =  'atlas-viewer';

// caches polyfill because it is not added to native yet!
var caches = require('./lib/serviceworker-caches');

if(typeof self.CACHE_NAME !== 'string') {
	throw new Error('Cache Name cannot be empty');
}

self.addEventListener('fetch', function(event) {

	// Clone the request for fetch and cache
	// A request is a stream and can be consumed only once.
	var fetchRequest = event.request.clone(),
		cacheRequest = event.request.clone();

	// Respond with content from fetch or cache
	event.respondWith(

		// Try fetch
		fetch(fetchRequest)

			// when fetch is successful, we update the cache
			.then(function(response) {

				// A response is a stream and can be consumed only once.
				// Because we want the browser to consume the response,
				// as well as cache to consume the response, we need to
				// clone it so we have 2 streams
				var responseToCache = response.clone();

				// and update the cache
				caches
					.open(self.CACHE_NAME)
					.then(function(cache) {

						// Clone the request again to use it
						// as the key for our cache
						var cacheSaveRequest = event.request.clone();
						cache.put(cacheSaveRequest, responseToCache);

					});

				// Return the response stream to be consumed by browser
				return response;

			})

			// when fetch times out or fails
			.catch(function(err) {

				// Return the promise which
				// resolves on a match in cache for the current request
				// ot rejects if no matches are found
				return caches.match(cacheRequest);

			})
	);
});

// Now we need to clean up resources in the previous versions
// of Service Worker scripts
self.addEventListener('activate', function(event) {

	// Destroy the cache
	event.waitUntil(caches.delete(self.CACHE_NAME));

});
