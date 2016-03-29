
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
            var sliceContainer = null;

            $scope.toggleLink = function () {
                volumesManager.slicesLinked = !volumesManager.slicesLinked;
            };

            $scope.toggleVisibility = function (item) {
                volumesManager.toggleVisibility(item.volume, $scope.slice);
                updateControlsScope();
            };

            function updateControlsScope () {

                var volumes = $scope.slice.volumes,
                    volumesDatasource = volumes.map(x=>x.datasource),
                    nameRegexp = /([0-9a-zA-Z_\-]+)\.\w+$/,
                    datasource,
                    match,
                    visible,
                    object;

                $scope.controls.background = [];
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
                        $scope.controls.background.push(object);
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
                    sliceContainer = $element.find('.sliceContainer');
                    $scope.slice = data.slice;
                    if (!$scope.canvas) {
                        var canvas = document.createElement('canvas');
                        sliceContainer.append(canvas);
                        $scope.canvas = canvas;
                    }
                    updateControlsScope();
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
                    var canvas = sliceContainer.canvas;
                    canvas.width = sliceContainer.width();
                    canvas.height = sliceContainer.height();

                    var image = $scope.slice.canvas;
                    var ctx = canvas.getContext('2d');

                    var zoom = Math.min(canvas.width/image.width, canvas.height/image.height);

                    ctx.save();
                    ctx.translate(canvas.width/2, canvas.height/2);
                    if ($scope.sliceId === 'axial') {

                        ctx.scale(-1,1);

                    } else if ($scope.sliceId === 'coronal') {

                        ctx.scale(-1,-1);

                    } else if ($scope.sliceId === 'sagittal') {

                        ctx.rotate(Math.PI/2);
                        ctx.scale(1,-1);

                    }

                    ctx.drawImage(image,
                                  -zoom*image.width/2,
                                  -zoom*image.height/2,
                                  zoom*image.width,
                                  zoom*image.height
                                 );

                    ctx.restore();


                }
            };


        }
    };
});
