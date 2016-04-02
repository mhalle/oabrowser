angular.module('atlasDemo').provider("crosshair", ["mainAppProvider", "volumesManagerProvider", function (mainAppProvider, volumesManagerProvider) {

    var singleton = {},
        volumesManager = volumesManagerProvider.$get(),
        mainApp = mainAppProvider.$get(),
        crosshairPosition,
        needUpdate =true;


    function computeCrosshairPosition () {
        if (volumesManager.compositingSlices.axial) {
            var sagittal = volumesManager.compositingSlices.sagittal,
                coronal = volumesManager.compositingSlices.coronal,
                axial = volumesManager.compositingSlices.axial,
                dimensions = volumesManager.volumes[0].RASDimensions;
            crosshairPosition =  {
                coronal:[sagittal.index, axial.index],
                sagittal :[coronal.index, axial.index],
                axial :[sagittal.index, coronal.index]
            };
            mainApp.emit('crosshair.positionChanged');
        }
    }

    singleton.getFixedCrosshair = function (orientation) {
        if (needUpdate) {
            computeCrosshairPosition();
            needUpdate = false;
        }
        return crosshairPosition[orientation];
    };

    mainApp.on('insertSlice', function (data) {
        data.slice.onUpdateGeometry(null, computeCrosshairPosition);
    });


               this.$get = function () {
        return singleton;
    };
}]);
