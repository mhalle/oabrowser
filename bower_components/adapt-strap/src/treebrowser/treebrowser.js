'use strict';

angular.module('adaptv.adaptStrap.treebrowser', [])

/**
 * adTreeBrowser directive populates a tree dataStructure
 */
  .directive('adTreeBrowser', ['$adConfig',
    function ($adConfig) {
      function controllerFunction($scope, $attrs) {
        var templateToken = Math.random();
        // scope initialization
        $scope.attrs = $attrs;
        $scope.iconClasses = $adConfig.iconClasses;
        $scope.treeRoot = $scope.$eval($attrs.treeRoot) || {};
        $scope.toggle = function (event, item) {
          var toggleCallback;
          event.stopPropagation();
          toggleCallback = $scope.$eval($attrs.toggleCallback);
          if (toggleCallback) {
            toggleCallback(item);
          } else {
            item._ad_expanded = !item._ad_expanded;
          }
        };
        $scope.onRowClick = function (item, level, event) {
          var onRowClick = $scope.$parent.$eval($attrs.onRowClick);
          if (onRowClick) {
            onRowClick(item, level, event);
          }
        };
        var hasChildren = $scope.$eval($attrs.hasChildren);
        $scope.hasChildren = function (item) {
          var found = item[$attrs.childNode] && item[$attrs.childNode].length > 0;
          if (hasChildren) {
            found = hasChildren(item);
          }
          return found;
        };
        // for unique template
        $scope.localConfig = {
          rendererTemplateId: 'tree-renderer-' + templateToken + '.html'
        };
      }

      return {
        restrict: 'E',
        scope: true,
        controller: ['$scope', '$attrs', controllerFunction],
        templateUrl: 'treebrowser/treebrowser.tpl.html'
      };
    }])
  .directive('adTreeBrowserNode', ['$compile', '$http', '$templateCache',
    function ($compile, $http, $templateCache) {
      var tbNodeTemplate = $templateCache.get('treebrowser/treeBrowserNode.tpl.html');
      var compiledTemplates = {};

      function getTemplate(contentTpl) {
        var tplUrl = contentTpl.config.url;
        var compiledTpl = compiledTemplates[tplUrl];
        if (!compiledTpl) {
          var tbNodeHtml = tbNodeTemplate.replace(/%=nodeTemplate%/g, contentTpl.data);
          compiledTemplates[tplUrl] = $compile(tbNodeHtml);
        }
        return compiledTemplates[tplUrl];
      }

      function linkFunction (scope, element, attrs) {
        function compileTemplate(nodeTemplate) {
          getTemplate(nodeTemplate)(scope, function(clonedElement) {
            element.append(clonedElement);
          });
        }
        $http({
          cache: $templateCache,
          url: scope.$eval(attrs.templateUrl),
          method: 'GET'
        }).then(compileTemplate);
      }

      return {
        link: linkFunction,
        scope: true,
        restrict: 'E'
      };
    }
  ])
  .directive('adTreeBrowserNodeToggle', function() {
    return {
      scope: true,
      restrict: 'E',
      replace: true,
      templateUrl: 'treebrowser/treebrowserNodeToggle.tpl.html'
    };
  });
