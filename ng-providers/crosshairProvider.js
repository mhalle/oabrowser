angular.module('atlasDemo').provider("crosshair", ["mainAppProvider", "volumesManagerProvider", "firebaseView", function (mainAppProvider, volumesManagerProvider, firebaseView) {

    var singleton = {},
        volumesManager = volumesManagerProvider.$get(),
        mainApp = mainAppProvider.$get(),
        crosshairPosition = {},
        needUpdate =true,
        visible = false,
        mouseOverCrosshair = {};


    function computeCrosshairPosition () {
        var sagittal = volumesManager.compositingSlices.sagittal,
            coronal = volumesManager.compositingSlices.coronal,
            axial = volumesManager.compositingSlices.axial;
        if (axial && sagittal && coronal) {
            var dimensions = volumesManager.volumes[0].RASDimensions;
            crosshairPosition =  {
                coronal:[sagittal.index, axial.index],
                sagittal :[dimensions[2]-axial.index, dimensions[1]-coronal.index],
                axial :[sagittal.index, dimensions[1]-coronal.index]
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


    Object.defineProperty(singleton, 'visible', {
        get : function () {
            return visible;
        },
        set : function (value) {
            visible = value;
            mainApp.emit('crosshair.visibilityChanged');
        }
    });

    singleton.setMouseOverCrosshair = function (i, j, orientation) {
        if (firebaseView.isLastModifier()) {
            mouseOverCrosshair.i = i;
            mouseOverCrosshair.j = j;
            mouseOverCrosshair.orientation = orientation;
        }
    };

    firebaseView.bind(mouseOverCrosshair, ['i','j','orientation'], 'crosshair.mouseOver');

    singleton.getMouseOverCrosshair = function (orientation) {
        if (orientation !== mouseOverCrosshair.orientation || firebaseView.isLastModifier()) {
            return null;
        }
        return mouseOverCrosshair;
    };


    this.$get = function () {
        return singleton;
    };
}]);
