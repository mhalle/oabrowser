
const angular = require('angular');
const FileSaver = require('file-saver');

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

    function saveScreenshot() {
        var sourceCanvas = document.querySelector('#rendererFrame canvas');
        var destCanvas = resizeCanvasWithBackground (sourceCanvas);
        exportable.base64 = destCanvas.toDataURL();
        setTimeout(function() {
            firebaseView.commit('screenshot');
            mainApp.emit('screenshotScene.commited');
        }, 0);
    }

    function resizeCanvasWithBackground (sourceCanvas, size) {
        var size = size || 128;
        var width = size;
        var height = size;
        var canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        var context = canvas.getContext("2d");
        drawLinearGradient(context, canvas);
        var ratio = Math.min(sourceCanvas.width/width, sourceCanvas.height/height);
        context.drawImage(sourceCanvas, sourceCanvas.width/2-ratio*width/2, 
                sourceCanvas.height/2-ratio*height/2, 
                ratio*width, ratio*height, 0, 0, width, height);
        return canvas;
    }

    function downloadScreenshot () {
        var canvas = document.querySelector('#rendererFrame canvas');
        canvas.toBlob(function(blob) {
            FileSaver.saveAs(blob, 'atlas-screenshot.png');
        });
    }

    singleton.setFirebaseView = setFirebaseView;
    singleton.saveScreenshot = saveScreenshot;
    singleton.downloadScreenshot = downloadScreenshot;

    this.$get = function () {
        return singleton;
    };
}]);
