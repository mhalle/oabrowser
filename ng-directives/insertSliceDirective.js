
angular.module('atlasDemo').directive( 'insertSlice', function () {
    return {
        restrict: 'A',
        templateUrl: 'ng-templates/slicePanel.html',
        scope: { sliceId : '=sliceid' },
        controller: ['$scope', '$element', 'mainApp', 'volumesManager', 'crosshair', 'firebaseView', function ( $scope, $element, mainApp, volumesManager, crosshair, firebaseView ) {

            $scope.sliceId = $element.attr('sliceid');
            $scope.controls = {
                backgrounds : [],
                labelMaps : []
            };

            $scope.volumesManager = volumesManager;
            $scope.popoverIsOpen = false;

            var sliceContainer = null,
                mousedownPosition = new THREE.Vector2(0,0),
                mouse = new THREE.Vector2(0,0),
                background = null,
                initialWindow,
                initialLevel,
                initialOffset = {},
                initialZoom,
                exportableParams = {
                    globalZoom : 1,
                    globalOffset : {
                        x : 0,
                        y : 0
                    }
                },
                mouseAction,
                canvasOffset,
                currentMatrix = new THREE.Matrix4(),
                currentInverseMatrix = new THREE.Matrix4(),
                ctx;

            firebaseView.bind(exportableParams, ['globalZoom', 'globalOffset'], $scope.sliceId);


            $scope.toggleMeshVisibility = function ($event) {
                var value = !$scope.slice.mesh.visible;
                if ($event.altKey) {
                    volumesManager.setCompositingSlicesVisibility(value);
                }
                else {
                    $scope.slice.mesh.visible = value;
                }
            };

            $scope.togglePopover = function () {
                $scope.popoverIsOpen = ! $scope.popoverIsOpen;
            };

            function updateControlsScope () {

                if (!$scope.slice) {
                    return;
                }

                var volumes = $scope.slice.volumes,
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

                for (var i = 0; i < volumesDatasource.length; i++) {
                    datasource = volumesDatasource[i];
                    match = datasource.source.match(nameRegexp);
                    visible = $scope.slice.getVisibility(datasource.volume);
                    opacity = $scope.slice.getOpacity(datasource.volume);
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
            function update() {
                updateControlsScope();
                $scope.repaint();
            }

            mainApp.on('firebaseView.viewChanged', update);

            mainApp.on('insertSlice', function (data) {
                //we are expecting data to hold two properties :
                //      - sliceId which identify in which directive you want to insert the slice
                //      - slice the actual slice object
                if ($scope.sliceId === data.sliceId) {
                    sliceContainer = $element.find('.slice-container');
                    $scope.slice = data.slice;
                    if (!$scope.canvas) {
                        var canvas = document.createElement('canvas');
                        sliceContainer.append(canvas);
                        $scope.canvas = canvas;
                        $(canvas).on('mousedown', mouseDown);
                        $(canvas).on('mousemove', mouseMove);
                        $(canvas).on('mousewheel', mouseWheel);
                        $(canvas).on('mouseout', mouseOut);
                    }
                    updateControlsScope();
                    Object.defineProperty($scope.controls, 'index', {
                        get : function () {
                            return $scope.slice.index;
                        },
                        set : function (value) {
                            $scope.slice.index = value;
                            $scope.slice.repaint(true);
                        }
                    });
                    mainApp.emit('ui.layout.forcedUpdate');
                    mainApp.on('crosshair.positionChanged', $scope.repaint);
                    mainApp.on('crosshair.visibilityChanged', $scope.repaint);
                    mainApp.on('mainToolbar.sliceVisibilityChanged', update);
                    mainApp.on('ui.layout.resize', $scope.repaint);
                    mainApp.on('volumesManager.volumeAdded', update);
                    $scope.slice.onAddSlice(null, update);
                    $scope.slice.onRemoveSlice(null, update);
                    $scope.slice.onRepaint(null, $scope.repaint);
                    $scope.repaint();

                    firebaseView.bind($scope.slice.mesh, 'visible', $scope.sliceId+'.mesh');
                }
            });



            $scope.repaint = function () {

                if ($scope.canvas) {
                    var canvas = $scope.canvas;
                    canvas.width = sliceContainer.width();
                    canvas.height = sliceContainer.parent().height()-35;

                    var image = $scope.slice.canvas;
                    ctx = canvas.getContext('2d');
                    canvasOffset = $(canvas).offset();

                    var a = 0,
                        b = 0,
                        c = 0,
                        d = 0;

                    var zoom = exportableParams.globalZoom * Math.min(canvas.width/image.width, canvas.height/image.height);

                    ctx.save();
                    ctx.translate(canvas.width/2+exportableParams.globalOffset.x, canvas.height/2+exportableParams.globalOffset.y);
                    if ($scope.sliceId === 'axial') {

                        ctx.scale(-1,1);
                        a = -zoom;
                        d = zoom;

                    } else if ($scope.sliceId === 'coronal') {

                        ctx.scale(-1,-1);
                        a = -zoom;
                        d = -zoom;

                    } else if ($scope.sliceId === 'sagittal') {

                        ctx.rotate(Math.PI/2);
                        ctx.scale(1,-1);
                        c = zoom;
                        b = zoom;

                    }

                    ctx.drawImage(image,
                                  -zoom*image.width/2,
                                  -zoom*image.height/2,
                                  zoom*image.width,
                                  zoom*image.height
                                 );
                    currentMatrix.set(a, c, 0, 0,
                                      b, d, 0, 0,
                                      0, 0, 1, 0,
                                      0, 0, 0, 1);
                    currentInverseMatrix.getInverse(currentMatrix);


                    var crosshairIntersection = crosshair.getFixedCrosshair($scope.sliceId);
                    if (crosshairIntersection && crosshair.visible) {
                        ctx.strokeStyle = "#ffef00";
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(zoom*(-image.width/2+crosshairIntersection[0]), -zoom*image.height/2);
                        ctx.lineTo(zoom*(-image.width/2+crosshairIntersection[0]), zoom*image.height/2);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(-zoom*image.width/2, zoom*(-image.height/2+crosshairIntersection[1]));
                        ctx.lineTo(zoom*image.width/2, zoom*(-image.height/2+crosshairIntersection[1]));
                        ctx.stroke();
                    }

                    var mouseOverCrosshair = crosshair.getMouseOverCrosshair($scope.sliceId);
                    if (mouseOverCrosshair && mouseOverCrosshair.i !== false) {
                        ctx.strokeStyle = "#ff0000";
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(zoom*(-image.width/2+mouseOverCrosshair.i), -zoom*image.height/2);
                        ctx.lineTo(zoom*(-image.width/2+mouseOverCrosshair.i), zoom*image.height/2);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(-zoom*image.width/2, zoom*(-image.height/2+mouseOverCrosshair.j));
                        ctx.lineTo(zoom*image.width/2, zoom*(-image.height/2+mouseOverCrosshair.j));
                        ctx.stroke();
                    }

                    ctx.restore();


                }
            };




            function preventDefault (e) {
                e.preventDefault();
                return false;
            }

            function getIJPosition (x,y) {
                var pos = new THREE.Vector4(),
                    canvas = $scope.canvas,
                    image = $scope.slice.canvas;
                pos.x = x-canvas.width/2-exportableParams.globalOffset.x;
                pos.y = y-canvas.height/2-exportableParams.globalOffset.y;
                pos.applyMatrix4(currentInverseMatrix);
                pos.x += image.width/2;
                pos.y += image.height/2;
                return pos;

            }

            function mouseDown (event) {
                mousedownPosition.x = event.clientX;
                mousedownPosition.y = event.clientY;
                if (event.which === 1) {
                    background = $scope.slice.getBackground();
                    if (background) {
                        $(document.body).on('mouseup', mouseUp);
                        $(document.body).on('mousemove', mouseMoveAction);
                        initialLevel = background.level;
                        initialWindow = background.window;
                        mouseAction = "windowLevel";
                    }
                }
                else if (event.which === 3) {
                    //right button -> zoom
                    $(document.body).on('mouseup', mouseUp);
                    $(document.body).on('mousemove', mouseMoveAction);
                    initialZoom = exportableParams.globalZoom;
                    mouseAction = "zoom";
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    $(document).on("contextmenu",preventDefault);
                }
                else if (event.which === 2) {
                    //middle button ->translation
                    $(document.body).on('mouseup', mouseUp);
                    $(document.body).on('mousemove', mouseMoveAction);
                    initialOffset.x = exportableParams.globalOffset.x;
                    initialOffset.y = exportableParams.globalOffset.y;
                    mouseAction = "translation";
                    event.preventDefault();
                    event.stopImmediatePropagation();
                }

                //prevent any element from being selected
                $(document.body).addClass('unselectable');

            }

            function mouseMove (event) {

                if (!mouseAction) {
                    var x = event.clientX-canvasOffset.left,
                        y = event.clientY-canvasOffset.top;
                    var IJ = getIJPosition(x,y);
                    var structures = $scope.slice.getStructuresAtPosition(IJ.x, IJ.y);
                    if (structures[0]) {
                        mainApp.emit('mouseOverObject', structures[0].mesh);
                    }
                    else {
                        //free the breadcrumbs
                        mainApp.emit('mouseOverObject', null);
                    }

                    crosshair.setMouseOverCrosshair(IJ.x, IJ.y, $scope.sliceId, structures[0] || null);

                }
            }

            function mouseMoveAction (event) {
                mouse.x = event.clientX-mousedownPosition.x;
                mouse.y = event.clientY-mousedownPosition.y;
                if (mouseAction === "windowLevel") {
                    background.window = Math.max(initialWindow + 2*mouse.x,0);
                    background.level = initialLevel+mouse.y;
                    background.repaintAllSlices();
                    volumesManager.repaintCompositingSlices(false);
                }
                else if (mouseAction === "zoom") {
                    exportableParams.globalZoom = initialZoom * Math.exp(mouse.y/$scope.canvas.height);
                    $scope.repaint();
                    event.preventDefault();
                }
                else if (mouseAction === "translation") {
                    exportableParams.globalOffset.x = initialOffset.x + mouse.x;
                    exportableParams.globalOffset.y = initialOffset.y + mouse.y;
                    $scope.repaint();
                    event.preventDefault();
                }
            }

            function mouseUp (event) {
                $(document.body).off('mouseup', mouseUp);
                $(document.body).off('mousemove', mouseMoveAction);
                mouseAction = null;
                //prevent right click menu
                if (mouseAction === "zoom" || mouseAction === "translation") {
                    event.preventDefault();
                }
                event.stopImmediatePropagation();
                //detach event blocker with a timeout to block 'contextmenu' which happens after mouse up
                setTimeout(function () {$(document).off('contextmenu', preventDefault);},100);

                //allow user to select any text when dragging is over
                $(document.body).removeClass('unselectable');
            }

            function mouseWheel (event) {
                var index = $scope.slice.index + Number(event.deltaY);
                index = Math.min(index, $scope.slice.maxIndex);
                index = Math.max(index, 0);
                $scope.slice.index = index;
                $scope.slice.repaint(true);
            }

            function mouseOut () {
                //set coordinates to false to prevent rendering when mouse is not over
                crosshair.setMouseOverCrosshair(false, false, $scope.sliceId);
            }


        }]
    };
});
