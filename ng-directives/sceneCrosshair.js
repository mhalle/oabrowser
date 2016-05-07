angular.module('atlasDemo').directive( 'sceneCrossair', [function () {
    return {
        restrict: 'EA',
        scope: {},
        templateUrl : 'ng-templates/sceneCrosshair.html',
        controller: ['$scope', '$element', 'mainApp', function ( $scope, $element, mainApp) {

            $scope.style = {
                stroke : "white",
                display : "node",
                top : "0px",
                left : "0px"
            };


            var canvas = $('#rendererFrame canvas');

            function toScreenXY(position) {
                var camera = mainApp.camera;
                if (!camera) {
                    return {x:0,y:0};
                }
                var pos = position.clone();
                var projScreenMat = new THREE.Matrix4();
                projScreenMat.multiply(camera.projectionMatrix, camera.matrixWorldInverse);
                projScreenMat.multiplyVector3( pos );

                return { x: ( pos.x + 1 ) * canvas.width() / 2 + canvas.offset().left,
                        y: ( - pos.y + 1) * canvas.height() / 2 + canvas.offset().top };
            }

            function onMouseOverObject (object, point) {
                if (!object) {
                    $scope.style.display = "none";
                }
                else {
                    $scope.style.display = "block";
                    var screenPos = toScreenXY(point);
                    $scope.style.top = screenPos.y;
                    $scope.style.left = screenPos.x;
                }
            }

            mainApp.on('mouseOverObject', onMouseOverObject);


        }]
    };
}]);
