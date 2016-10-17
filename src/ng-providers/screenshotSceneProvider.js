
const angular = require('angular');

angular.module('atlasDemo').provider('screenshotScene', ['mainAppProvider', function (mainAppProvider) {

    var singleton = {},
        firebaseView,
        exportable = {
            base64 : ""
        },
        mainApp = mainAppProvider.$get();

    mainApp.on('firebaseView.requireScreenshot', saveScreenshot);

    function setFirebaseView (fv) {
        if (!firebaseView) {
            firebaseView = fv;
            firebaseView.bind(exportable, "base64", "screenshot");
        }
    }

    function drawLinearGradient (ctx, canvas) {
        var grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grd.addColorStop(0, "#657FB5");
        grd.addColorStop(1, "#D3E2FF");

        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function resizeBase64Img(base64, iwidth, iheight, width, height) {
        var canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        var context = canvas.getContext("2d");
        drawLinearGradient(context, canvas);
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
        mainApp.emit('screenshotScene.commited');
    }

    function saveScreenshot (size) {
        size = size || 128;
        var canvas = document.querySelector('#rendererFrame canvas');
        resizeBase64Img(canvas.toDataURL(), canvas.width, canvas.height, size, size).then(commitScreenshot);
    }

    function getBase64WithBackground (originalCanvas) {
        var canvas = document.createElement("canvas");
        canvas.width = originalCanvas.width;
        canvas.height = originalCanvas.height;
        var context = canvas.getContext("2d");
        drawLinearGradient(context, canvas);
        var deferred = $.Deferred();
        $("<img/>").attr("src",  originalCanvas.toDataURL()).load(function() {
            context.drawImage(this, 0,0);
            deferred.resolve(canvas.toDataURL());
        });
        return deferred.promise();
    }

    function triggerDownload (screenshot) {
        var link = document.createElement('a');
        link.href = screenshot;
        link.download = 'screenshot.png';
        document.body.appendChild(link);
        link.click();

        //garbage collection in the DOM
        setTimeout(function () {
            document.body.removeChild(link);
        },10);
    }


    function downloadScreenshot () {
        var canvas = document.querySelector('#rendererFrame canvas');
        getBase64WithBackground(canvas).then(triggerDownload);
    }

    singleton.setFirebaseView = setFirebaseView;
    singleton.saveScreenshot = saveScreenshot;
    singleton.downloadScreenshot = downloadScreenshot;

    this.$get = function () {
        return singleton;
    };
}]);
