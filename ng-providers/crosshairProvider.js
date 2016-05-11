angular.module('atlasDemo').provider("crosshair", ["mainAppProvider", "volumesManagerProvider", function (mainAppProvider, volumesManagerProvider) {

    var singleton = {},
        volumesManager = volumesManagerProvider.$get(),
        mainApp = mainAppProvider.$get(),
        crosshairPosition = {},
        needUpdate =true,
        visible = false,
        mouseOverCrosshair = {},
        firebaseView,
        debouncedCommit = (function () {
            if(firebaseView) {
                firebaseView.commit('crosshair');
            }
        }).debounce(150);


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

    singleton.setMouseOverCrosshair = function (i, j, orientation, hoveredStructure) {
        if (firebaseView.isLastModifier()) {
            mouseOverCrosshair.i = i;
            mouseOverCrosshair.j = j;
            mouseOverCrosshair.orientation = orientation;
            mouseOverCrosshair.objectId = (hoveredStructure && hoveredStructure['@id']) || false;
            debouncedCommit();
        }
    };


    singleton.getMouseOverCrosshair = function (orientation) {
        if (orientation !== mouseOverCrosshair.orientation || firebaseView.isLastModifier()) {
            return null;
        }
        return mouseOverCrosshair;
    };

    singleton.setFirebaseView = function (fv) {
        if (!firebaseView) {
            firebaseView = fv;
            firebaseView.bind(mouseOverCrosshair, ['i','j','orientation', 'objectId'], 'crosshair.mouseOver');
        }
    };

    //handle distant mouse over return and send it to breadcrumbs to display
    function sendDistantToBreadcrumbs () {
        mainApp.emit('distantMouseOverObject',mouseOverCrosshair.objectId || false);
    }

    mainApp.on('firebaseView.viewChanged', sendDistantToBreadcrumbs);


    this.$get = function () {
        return singleton;
    };
}]);
