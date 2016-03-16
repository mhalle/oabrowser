
angular.module('atlasDemo').directive( 'insertSlice', function () {
    return {
        restrict: 'A',
        scope: { sliceId : '=' },
        controller: function ( $scope, $element, $rootScope ) {


            $rootScope.$on('insertSlice', function (event, data) {
                //we are expecting data to hold two properties :
                //      - sliceId which identify in which directive you want to insert the slice
                //      - slice the actual slice object
                if ($scope.sliceId === data.sliceId) {
                    $scope.slice = data.slice;
                    var canvas = document.createElement('canvas');
                    $element.append(canvas);
                    $scope.canvas = canvas;
                    $scope.repaint();
                }
            });

            angular.element(document.body).scope().$on('ui.layout.resize', $scope.repaint);

            $scope.repaint = function () {

                if ($scope.canvas) {
                    var canvas = $scope.canvas;
                    canvas.width = $element.width;
                    canvas.height = $element.height;

                    var image = $scope.slice.canvas;
                    var ctx = canvas.getContext('2D');

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
