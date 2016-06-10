(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
    // Set the CACHE_NAME first
    self.CACHE_NAME = 'atlas-viewer';

    // and require the sw-cache-all
    require('../../index.js');

},{"../../index.js":2}],2:[function(require,module,exports){
    // caches polyfill because it is not added to native yet!
    var caches = require('./lib/serviceworker-caches');

    if(typeof self.CACHE_NAME !== 'string') {
        throw new Error('Cache Name cannot be empty');
    }

    self.addEventListener('fetch', function(event) {

        //ignore POST request
        if (event.request.method === 'POST') {
            return fetch(event.request).then(function(response) {
                return response;
            }).catch(function(error) {
                throw error;
            });
        }

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
},{"./lib/serviceworker-caches":3}],3:[function(require,module,exports){
    if (!Cache.prototype.add) {
        Cache.prototype.add = function add(request) {
            return this.addAll([request]);
        };
    }

    if (!Cache.prototype.addAll) {
        Cache.prototype.addAll = function addAll(requests) {
            var cache = this;

            // Since DOMExceptions are not constructable:
            function NetworkError(message) {
                this.name = 'NetworkError';
                this.code = 19;
                this.message = message;
            }
            NetworkError.prototype = Object.create(Error.prototype);

            return Promise.resolve().then(function() {
                if (arguments.length < 1) throw new TypeError();

                // Simulate sequence<(Request or USVString)> binding:
                var sequence = [];

                requests = requests.map(function(request) {
                    if (request instanceof Request) {
                        return request;
                    }
                    else {
                        return String(request); // may throw TypeError
                    }
                });

                return Promise.all(
                    requests.map(function(request) {
                        if (typeof request === 'string') {
                            request = new Request(request);
                        }

                        var scheme = new URL(request.url).protocol;

                        if (scheme !== 'http:' && scheme !== 'https:') {
                            throw new NetworkError("Invalid scheme");
                        }

                        return fetch(request.clone());
                    })
                );
            }).then(function(responses) {
                // TODO: check that requests don't overwrite one another
                // (don't think this is possible to polyfill due to opaque responses)
                return Promise.all(
                    responses.map(function(response, i) {
                        return cache.put(requests[i], response);
                    })
                );
            }).then(function() {
                return undefined;
            });
        };
    }

    if (!CacheStorage.prototype.match) {
        // This is probably vulnerable to race conditions (removing caches etc)
        CacheStorage.prototype.match = function match(request, opts) {
            var caches = this;

            return this.keys().then(function(cacheNames) {
                var match;

                return cacheNames.reduce(function(chain, cacheName) {
                    return chain.then(function() {
                        return match || caches.open(cacheName).then(function(cache) {
                            return cache.match(request, opts);
                        }).then(function(response) {
                            match = response;
                            return match;
                        });
                    });
                }, Promise.resolve());
            });
        };
    }

    module.exports = self.caches;
},{}]},{},[1]);
