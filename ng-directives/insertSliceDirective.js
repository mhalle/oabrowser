
angular.module('atlasDemo').directive( 'insertSlice', function () {
    return {
        restrict: 'A',
        scope: { sliceId : '=sliceid' },
        controller: function ( $scope, $element, mainApp ) {

            $scope.sliceId = $element.attr('sliceid');

            mainApp.on('insertSlice', function (data) {
                //we are expecting data to hold two properties :
                //      - sliceId which identify in which directive you want to insert the slice
                //      - slice the actual slice object
                if ($scope.sliceId === data.sliceId) {
                    $scope.slice = data.slice;
                    var canvas = document.createElement('canvas');
                    $element.append(canvas);
                    $scope.canvas = canvas;
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
                    canvas.width = $element.width();
                    canvas.height = $element.height();

                    var image = $scope.slice.canvas;
                    var ctx = canvas.getContext('2d');

                    var zoom = Math.min(canvas.width/image.width, canvas.height/image.height);

                    ctx.save();
                    ctx.translate(canvas.width/2 canvas.height/2);
                    if ($scope.sliceId === 'axial') {

                        ctx.scale(-1,1);

                    } else if ($scope.sliceId === 'coronal') {

                        ctx.scale(-1,-1);

                    } else if ($scope.sliceId === 'sagittal') {

                        ctx.rotate(Math.PI/2)
                        ctx.scale(-1,1);

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
