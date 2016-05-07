angular.module('atlasDemo').directive( 'sceneCrosshair', [function () {
    return {
        restrict: 'EA',
        scope: {},
        templateUrl : 'ng-templates/sceneCrosshair.html',
        controller: ['$scope', '$element', 'mainApp', 'firebaseView', function ( $scope, $element, mainApp, firebaseView) {

            $scope.style = {
                stroke : "white",
                display : "none",
                top : "0px",
                left : "0px"
            };


            var canvas = $('#rendererFrame canvas'),
                debouncedCommit = (function () {firebaseView.commit('sceneCrosshair');}).debounce(150);

            function getOppositeColorOfMesh (mesh) {
                var color = mesh.material && mesh.material.color,
                    oppositeColor = new THREE.Color("white");
                if (color) {
                    var hsl = color.getHSL();
                    oppositeColor.setHSL((hsl.h+180)%360, hsl.s, hsl.l);
                }
                return oppositeColor.getStyle();
            }

            function toScreenXY(position) {
                var camera = mainApp.camera;
                if (!camera) {
                    return {x:0,y:0};
                }
                var pos = position.clone();
                var projScreenMat = new THREE.Matrix4();
                projScreenMat.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
                pos = pos.applyProjection(projScreenMat);

                return { x: ( pos.x + 1 ) * canvas.width() / 2 + canvas.offset().left,
                        y: ( - pos.y + 1) * canvas.height() / 2 + canvas.offset().top };
            }

            function onMouseOverScene (evt) {
                var object = evt.object,
                    point = evt.point;

                $scope.style.display = "none";

                if (!object) {
                    $scope.style.point = false;
                }
                else {
                    $scope.style.point = point;
                    $scope.stroke = getOppositeColorOfMesh(object);
                }
                debouncedCommit();
            }

            function displayCrosshair () {
                if ($scope.style.point) {
                    $scope.style.display = "block";
                    var p = $scope.style.point,
                        point = new THREE.Vector3(p.x, p.y, p.z),
                        screenPos = toScreenXY(point);
                    $scope.style.top = screenPos.y-10;
                    $scope.style.left = screenPos.x-10;
                }
                else{
                    $scope.style.display = "none";
                }
            }

            mainApp.on('mouseOverScene', onMouseOverScene);

            firebaseView.bind($scope.style, ['stroke', 'point'], 'sceneCrosshair');

            mainApp.on('firebaseView.viewChanged', displayCrosshair);


        }]
    };
}]);
