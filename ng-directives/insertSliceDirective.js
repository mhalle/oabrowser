
angular.module('atlasDemo').directive( 'insertSlice', function () {
    return {
        restrict: 'A',
        templateUrl: 'ng-templates/slicePanel.html',
        scope: { sliceId : '=sliceid' },
        controller: function ( $scope, $element, mainApp, volumesManager ) {

            $scope.sliceId = $element.attr('sliceid');
            $scope.controls = {
                backgrounds : [],
                labelMaps : []
            };

            $scope.volumesManager = volumesManager;

            var sliceContainer = null,
                mousedownPosition = new THREE.Vector2(0,0),
                mouse = new THREE.Vector2(0,0),
                background = null,
                initialWindow,
                initialLevel,
                initialOffset,
                initialZoom,
                globalZoom = 1,
                globalOffset = new THREE.Vector2(0,0),
                mouseAction,
                canvasOffset,
                currentMatrix = new THREE.Matrix4(),
                currentInverseMatrix = new THREE.Matrix4();

            $scope.toggleLink = function () {
                volumesManager.slicesLinked = !volumesManager.slicesLinked;
            };

            $scope.toggleVisibility = function (item) {
                volumesManager.toggleVisibility(item.volume, $scope.slice);
                updateControlsScope();
            };

            $scope.toggleMeshVisibility = function ($event) {
                var value = !$scope.slice.mesh.visible;
                if ($event.altKey) {
                    volumesManager.setCompositingSlicesVisibility(value);
                }
                else {
                    $scope.slice.mesh.visible = value;
                }
            };

            function updateControlsScope () {

                var volumes = $scope.slice.volumes,
                    volumesDatasource = volumes.map(x=>x.datasource),
                    nameRegexp = /([0-9a-zA-Z_\-]+)\.\w+$/,
                    datasource,
                    match,
                    visible,
                    object;

                $scope.controls.backgrounds = [];
                $scope.controls.labelMaps = [];

                for (var i = 0; i < volumesDatasource.length; i++) {
                    datasource = volumesDatasource[i];
                    match = datasource.source.match(nameRegexp);
                    visible = $scope.slice.getOpacity(datasource.volume) > 0;
                    object = {
                        name : match[1],
                        visible : visible,
                        volume : volumes[i]
                    };
                    if (volumesManager.isBackground(datasource)) {
                        $scope.controls.backgrounds.push(object);
                    }
                    else {
                        $scope.controls.labelMaps.push(object);
                    }
                }


            }

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
                    $scope.slice.onAddSlice(null, updateControlsScope);
                    $scope.slice.onRemoveSlice(null, updateControlsScope);
                    $scope.slice.onRepaint(null, $scope.repaint);
                    $scope.repaint();
                }
            });

            //set timeout to wait for the scope to be created
            setTimeout( function () {
                mainApp.on('ui.layout.resize', $scope.repaint);
            }, 1000);

            $scope.repaint = function () {

                if ($scope.canvas) {
                    var canvas = $scope.canvas;
                    canvas.width = sliceContainer.width();
                    canvas.height = sliceContainer.parent().height()-35;

                    var image = $scope.slice.canvas;
                    var ctx = canvas.getContext('2d');
                    canvasOffset = $(canvas).offset();

                    var a = 0,
                        b = 0,
                        c = 0,
                        d = 0;

                    var zoom = globalZoom * Math.min(canvas.width/image.width, canvas.height/image.height);

                    ctx.save();
                    ctx.translate(canvas.width/2+globalOffset.x, canvas.height/2+globalOffset.y);
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
                    console.log($scope.sliceId, currentMatrix);


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
                pos.x = x-canvas.width/2-globalOffset.x;
                pos.y = y-canvas.height/2-globalOffset.y;
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
                    initialZoom = globalZoom;
                    mouseAction = "zoom";
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    $(document).on("contextmenu",preventDefault);
                }
                else if (event.which === 2) {
                    //middle button ->translation
                    $(document.body).on('mouseup', mouseUp);
                    $(document.body).on('mousemove', mouseMoveAction);
                    initialOffset = globalOffset.clone();
                    mouseAction = "translation";
                    event.preventDefault();
                    event.stopImmediatePropagation();
                }


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
                    globalZoom = initialZoom * Math.exp(mouse.y/$scope.canvas.height);
                    $scope.repaint();
                    event.preventDefault();
                }
                else if (mouseAction === "translation") {
                    globalOffset.x = initialOffset.x + mouse.x;
                    globalOffset.y = initialOffset.y + mouse.y;
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
            }

            function mouseWheel (event) {
                $scope.slice.index += Number(event.deltaY);
                $scope.slice.repaint(true);
            }


        }
    };
});
