//this filter converts a dictionnary of object to an array of object but keep the key as the $key attribute of each object
angular.module('atlasDemo').filter('toArray', function () {
    'use strict';

    return function (obj) {
        if (!(obj instanceof Object)) {
            return obj;
        }

        return Object.keys(obj).map(function (key) {
            //using define property allows us to create a constant property.
            return Object.defineProperty(obj[key], '$key', {__proto__: null, value: key});
        });
    };
});
