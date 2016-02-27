var app = angular.module('atlasDemo', [ 'ngSanitize', 'adaptv.adaptStrap', 'ui.bootstrap' ]);
angular.module('atlasDemo').directive( 'insertTree', function ( $compile ) {
    return {
        restrict: 'A',
        scope: { text: '@' },
        controller: function ( $scope, $element, $rootScope ) {
            console.log('event listener registred');
            $rootScope.$on('insertTree', function (event, hierarchy) {
                console.log('event received', hierarchy);
                var template = document.getElementById('treeListDirective').innerHTML;
                $scope.data = {
                    root : hierarchy
                };
                var el = $compile( template )( $scope );
                $element.append( el );
            });
        }
    };
});