angular.module('atlasDemo').provider("mainApp", function () {

    var singleton = {
            globalParameters : window.globalViewerParameters
        },
        listeners = {};

    singleton.createEvent = function (eventName) {

        if (!listeners[eventName]) {
            listeners[eventName] = [];
        }

    };

    singleton.on = function (eventName, callback, context) {

        if (!listeners[eventName]) {
            singleton.createEvent(eventName);
        }
        var listener = {
            callback : callback,
            context : context
        };

        listeners[eventName].push(listener);

    };

    singleton.once = function (eventName, callback, context) {

        if (!listeners[eventName]) {
            singleton.createEvent(eventName);
        }

        function wraper (evt) {
            callback.call(this || null, evt);
            singleton.off(eventName, wraper);
        }

        var listener = {
            callback : wraper,
            context : context
        };

        listeners[eventName].push(listener);
    };

    singleton.off = function (eventName, callback) {

        if (listeners[eventName]) {
            var index = listeners[eventName].findIndex(function (listener) {
                return listener.callback === callback;
            });
            listeners[eventName].splice(index, 1);
        }

    };

    singleton.emit = function (eventName, event) {

        var i,
            listener;

        if (!listeners[eventName]) {

            singleton.createEvent(eventName);
        }

        for (i = 0; i < listeners[eventName].length; i++) {

            listener = listeners[eventName][i];
            listener.callback.call(listener.context || null, event);

        }

    };


    this.$get = function () {
        return singleton;
    };
});
