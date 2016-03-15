angular.module('atlasDemo').controller('ModalDemoCtrl', function ($scope, $uibModal, $log) {

    var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'ng-templates/modalContent.html',
        controller: 'ModalInstanceCtrl',
        resolve: {}
    });

    /*
    modalInstance.result.then(function (selectedItem) {
        $scope.selected = selectedItem;
    }, function () {
        $log.info('Modal dismissed at: ' + new Date());
    });
    */


});

// Please note that $uibModalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.

angular.module('atlasDemo').controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, $rootScope) {

    $scope.loadingJSON = true;
    $scope.loadingVTK = false;
    $scope.loadingHierarchy = false;

    $scope.loadedVTKFiles = 0;
    $scope.numberOfVTKFiles = 1;

    $scope.done = false;

    $rootScope.$on('modal.JSONLoaded', function (event, numberOfVTKFiles) {
        $scope.loadingJSON = false;
        $scope.loadingVTK = true;
        $scope.numberOfVTKFiles = numberOfVTKFiles;
        $scope.$apply();
    });

    $rootScope.$on('modal.fileLoaded', function () {
        console.log('file ++');
        $scope.loadedVTKFiles++;
        if ($scope.loadedVTKFiles === $scope.numberOfVTKFiles) {
            $scope.loadingVTK = false;
            $scope.loadingHierarchy = true;
        }
        $scope.$apply();
    });

    $rootScope.$on('modal.hierarchyLoaded', function () {
        $scope.loadingHierarchy = false;
        $scope.done = true;
        $scope.$apply();
    });

    $scope.ok = function () {
        $uibModalInstance.close(true);
    };
    /*
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
    */
});
