const angular = require('angular');
const templateUrl = require('../ng-templates/confirmationModal.html');

angular.module('atlasDemo').directive( 'confirmationModal', function () {
    return {
        restrict: 'EA',
        templateUrl: templateUrl,
        scope: {},
        controller: ['$scope', '$element', 'mainApp', function ( $scope, $element, mainApp ) {


            mainApp.on('firebaseView.askConfirmation', firebaseConfirmation);

            var defaultText = 'This task needs your confirmation. \nAre you sure you want to do this ?';

            function firebaseConfirmation (param) {
                $scope.confirmationText = param.text || defaultText;
                $scope.cancel = function () {
                    if (param.failure) {
                        param.failure();
                    }
                };
                $scope.accept = function () {
                    if (param.success) {
                        param.success();
                    }
                };
                $scope.openModal();
            }


            $scope.openModal = function () {
                $('#confirmationModal').modal('show');
            };

            $scope.closeModal = function () {
                $('#confirmationModal').modal('hide');
            };

        }]
    };
});
