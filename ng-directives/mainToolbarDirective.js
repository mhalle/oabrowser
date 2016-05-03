
angular.module('atlasDemo').directive( 'mainToolbar', function () {
    return {
        restrict: 'A',
        templateUrl: 'ng-templates/mainToolbar.html',
        scope: {},
        controller: function ( $scope, $element, mainApp, volumesManager, crosshair, firebaseView ) {

            $scope.controls = {
                backgrounds : [],
                labelMaps : []
            };

            $scope.volumesManager = volumesManager;
            $scope.popoverIsOpen = false;
            $scope.crosshair = crosshair;
            $scope.firebaseView = firebaseView;


            $scope.toggleLink = function () {
                volumesManager.slicesLinked = !volumesManager.slicesLinked;
            };

            $scope.toggleCrosshair = function () {
                crosshair.visible = ! crosshair.visible;
            };

            $scope.toggleVisibility = function (item) {
                var slice = volumesManager.compositingSlices.axial;
                if (slice) {
                    volumesManager.toggleVisibility(item.volume, slice);
                    mainApp.emit('mainToolbar.sliceVisibilityChanged');
                }
            };

            $scope.togglePopover = function () {
                $scope.popoverIsOpen = ! $scope.popoverIsOpen;
            };

            $scope.toggleViewLock = function () {
                if (firebaseView.isLocked()){
                    firebaseView.unlockView();
                }
                else {
                    firebaseView.lockView();
                }
            };

            function updateControlsScope () {

                var volumes = volumesManager.volumes,
                    volumesDatasource = volumes.map(x=>x.datasource),
                    nameRegexp = /([0-9a-zA-Z_\-]+)\.\w+$/,
                    datasource,
                    match,
                    visible,
                    object,
                    opacity;

                $scope.sliders = {};
                $scope.sliders.options = {
                    labelOpacity : {
                        onChange : function (id) {
                            var item = $scope.controls.labelMaps[Number(id) || 0];
                            volumesManager.setVolumeOpacityInCompositingSlices(item.volume, item.opacity);
                            volumesManager.repaintCompositingSlices();
                        },
                        floor : 0,
                        ceil : 1,
                        step : 0.02,
                        precision : 1,
                        showSelectionBar : true
                    },
                    threshold : {
                        onChange: function() {
                            volumesManager.repaintCompositingSlices(true);
                        },
                        draggableRange : true
                    }
                };

                $scope.controls.backgrounds = [];
                $scope.controls.labelMaps = [];
                $scope.controls.activeBackground = null;

                var slice = volumesManager.compositingSlices.axial;
                if (slice) {
                    for (var i = 0; i < volumesDatasource.length; i++) {
                        datasource = volumesDatasource[i];
                        match = datasource.source.match(nameRegexp);
                        visible = slice.getVisibility(datasource.volume);
                        opacity = slice.getOpacity(datasource.volume);
                        object = {
                            name : match[1],
                            visible : visible,
                            volume : volumes[i],
                            opacity : opacity
                        };
                        if (volumesManager.isBackground(datasource)) {
                            $scope.controls.backgrounds.push(object);
                            if (visible) {
                                $scope.controls.activeBackground = object;
                                $scope.sliders.options.threshold.floor = volumes[i].min;
                                $scope.sliders.options.threshold.ceil = volumes[i].max;
                            }
                        }
                        else {
                            object.sliderOptions = Object.assign({},$scope.sliders.options.labelOpacity);
                            object.sliderOptions.id = $scope.controls.labelMaps.length;
                            $scope.controls.labelMaps.push(object);

                        }
                    }
                }


            }

            firebaseView.bind(crosshair, 'visible', 'crosshair');


            mainApp.on('mainToolbar.sliceVisibilityChanged', updateControlsScope);
            mainApp.on('volumesManager.volumeAdded', updateControlsScope);
            mainApp.on('insertSlice', updateControlsScope);
            mainApp.on('firebaseView.viewChanged', updateControlsScope);
            var once = true;
            mainApp.on('insertSlice', function () {
                if (once) {
                    once = false;
                    volumesManager.compositingSlices.axial.onAddSlice(null, updateControlsScope);
                    volumesManager.compositingSlices.axial.onRemoveSlice(null, updateControlsScope);
                }
            });

        }
    };
});
