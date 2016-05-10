
angular.module('atlasDemo').provider('screenshotScene', [function () {

    var singleton = {},
        firebaseView,
        exportable = {
            base64 : ""
        };

    function setFirebaseView (fv) {
        if (!firebaseView) {
            firebaseView = fv;
            firebaseView.bind(exportable, "base64", "screenshot");
        }
    }

    function resizeBase64Img(base64, iwidth, iheight, width, height) {
        var canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        var context = canvas.getContext("2d");
        var deferred = $.Deferred();
        var ratio = Math.min(iwidth/width, iheight/height);
        $("<img/>").attr("src",  base64).load(function() {
            context.drawImage(this, iwidth/2-ratio*width/2, iheight/2-ratio*height/2, ratio*width, ratio*height, 0,0,width, height);
            deferred.resolve(canvas.toDataURL());
        });
        return deferred.promise();
    }

    function commitScreenshot (screenshot) {
        exportable.base64 = screenshot;
        firebaseView.commit('screenshot');
    }

    function saveScreenshot (size) {
        size = size || 128;
        var canvas = document.querySelector('#rendererFrame canvas');
        resizeBase64Img(canvas.toDataURL(), canvas.width, canvas.height, size, size).then(commitScreenshot);
    }

    singleton.setFirebaseView = setFirebaseView;
    singleton.saveScreenshot = saveScreenshot;

    this.$get = function () {
        return singleton;
    };
}]);
