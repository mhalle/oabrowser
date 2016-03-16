
angular.module('atlasDemo').directive( 'insertSlice', function () {
    return {
        restrict: 'A',
        scope: { sliceId : '=sliceid' },
        controller: function ( $scope, $element, $rootScope ) {


            $rootScope.$on('insertSlice', function (event, data) {
                //we are expecting data to hold two properties :
                //      - sliceId which identify in which directive you want to insert the slice
                //      - slice the actual slice object
                if ($scope.sliceId === data.sliceId || $element.attr('sliceid')=== data.sliceId) {
                    $scope.slice = data.slice;
                    var canvas = document.createElement('canvas');
                    $element.append(canvas);
                    $scope.canvas = canvas;
                    $scope.repaint();
                }
            });

            //set timeout to wait for the scope to be created
            setTimeout( function () {
                angular.element(document.body).scope().$on('ui.layout.resize', $scope.repaint);
            }, 1000);

            $scope.repaint = function () {

                if ($scope.canvas) {
                    var canvas = $scope.canvas;
                    canvas.width = $element.width();
                    canvas.height = $element.height();

                    var image = $scope.slice.canvas;
                    var ctx = canvas.getContext('2d');

                    var zoom = Math.min(canvas.width/image.width, canvas.height/image.height);

                    ctx.drawImage(image,
                                  canvas.width/2-zoom*image.width/2,
                                  canvas.height/2-zoom*image.height/2,
                                  zoom*image.width,
                                  zoom*image.height
                                 );


                }
            };


        }
    };
});
