angular.module('adaptv.adaptStrap.tablelite', ['adaptv.adaptStrap.utils'])
/**
 * Use this directive if you need to render a simple table with local data source.
 */
  .directive('adTableLite', [
    '$parse', '$http', '$compile', '$filter', '$templateCache',
    '$adConfig', 'adStrapUtils', 'adDebounce', 'adLoadLocalPage',
    function ($parse, $http, $compile, $filter, $templateCache,
              $adConfig, adStrapUtils, adDebounce, adLoadLocalPage) {
      'use strict';
      function controllerFunction($scope, $attrs) {
        // ---------- $$scope initialization ---------- //
        $scope.attrs = $attrs;
        $scope.attrs.state = $scope.attrs.state || {};
        $scope.iconClasses = $adConfig.iconClasses;
        $scope.adStrapUtils = adStrapUtils;
        $scope.tableClasses = $adConfig.componentClasses.tableLiteClass;

        $scope.columnDefinition = $scope.$eval($attrs.columnDefinition);
        $scope.visibleColumnDefinition = $filter('filter')($scope.columnDefinition, $scope.columnVisible);

        $scope.items = {
          list: undefined,
          allItems: undefined,
          paging: {
            currentPage: 1,
            totalPages: undefined,
            pageSize: Number($attrs.pageSize) || $adConfig.paging.pageSize,
            pageSizes: $parse($attrs.pageSizes)() || $adConfig.paging.pageSizes
          }
        };

        $scope.filters = {};

        $scope.localConfig = {
          localData: adStrapUtils.parse($scope.$eval($attrs.localDataSource)),
          pagingArray: [],
          dragChange: $scope.$eval($attrs.onDragChange),
          expandedItems: [],
          sortState: {},
          stateChange: $scope.$eval($attrs.onStateChange),
          draggable: $scope.$eval($attrs.draggable) || false
        };

        $scope.selectedItems = $scope.$eval($attrs.selectedItems);
        $scope.searchText = $scope.$eval($attrs.searchText);

        // ---------- Local data ---------- //
        var placeHolder = null,
          placeHolderInDom = false,
          pageButtonElement = null,
          validDrop = false,
          initialPos,
          watchers = [];

        function moveElementNode(nodeToMove, relativeNode, dragNode) {
          if (relativeNode.next()[0] === nodeToMove[0]) {
            relativeNode.before(nodeToMove);
          } else if (relativeNode.prev()[0] === nodeToMove[0]) {
            relativeNode.after(nodeToMove);
          } else {
            if (relativeNode.next()[0] === dragNode[0]) {
              relativeNode.before(nodeToMove);
            } else if (relativeNode.prev()[0] === dragNode[0]) {
              relativeNode.after(nodeToMove);
            }
          }
        }

        if (!$scope.items.paging.pageSize && $scope.items.paging.pageSizes[0]) {
          $scope.items.paging.pageSize = $scope.items.paging.pageSizes[0];
        }

        // ---------- ui handlers ---------- //
        $scope.loadPage = adDebounce(function (page) {
          $scope.collapseAll();
          var itemsObject,
              params,
              parsedData = adStrapUtils.parse($scope.$eval($attrs.localDataSource)),
              filterObj = {};

          $scope.localConfig.localData = !!$scope.searchText ?
            $filter('filter')(parsedData, $scope.searchText) :
            parsedData;

          if ($attrs.enableColumnSearch && adStrapUtils.hasAtLeastOnePropertyWithValue($scope.filters)) {
            angular.forEach($scope.filters, function (value, key) {
              if (key.indexOf('.') > -1) {
                angular.extend(filterObj, adStrapUtils.createdChainObjectAndInitValue(key, value));
              } else {
                filterObj[key] = value;
              }
            });
            $scope.localConfig.localData = $filter('filter')($scope.localConfig.localData, filterObj);
          }

          itemsObject = $scope.localConfig.localData;
          params = {
            pageNumber: page,
            pageSize: (!$attrs.disablePaging) ? $scope.items.paging.pageSize : itemsObject.length,
            sortKey: $scope.localConfig.sortState.sortKey,
            sortDirection: $scope.localConfig.sortState.sortDirection === 'DEC',
            localData: itemsObject,
            draggable: $scope.localConfig.draggable
          };

          var response = adLoadLocalPage(params);
          $scope.items.list = response.items;
          $scope.items.allItems = response.allItems;
          $scope.items.paging.currentPage = response.currentPage;
          $scope.items.paging.totalPages = response.totalPages;
          $scope.localConfig.pagingArray = response.pagingArray;
          if (response.items.length === 0) {
            $scope.loadPreviousPage();
            return;
          }
          $scope.$emit('adTableLite:pageChanged', $scope.items.paging);
        }, 100);

        $scope.loadNextPage = function () {
          if ($scope.items.paging.currentPage + 1 <= $scope.items.paging.totalPages) {
            $scope.loadPage($scope.items.paging.currentPage + 1);
          }
        };

        $scope.loadPreviousPage = function () {
          if ($scope.items.paging.currentPage - 1 > 0) {
            $scope.loadPage($scope.items.paging.currentPage - 1);
          }
        };

        $scope.loadLastPage = function () {
          if (!$scope.localConfig.disablePaging) {
            $scope.loadPage($scope.items.paging.totalPages);
          }
        };

        $scope.pageSizeChanged = function (size) {
          $scope.items.paging.pageSize = size;
          $scope.loadPage(1);
        };

        $scope.columnVisible = function(column) {
          return column.visible !== false;
        };

        $scope.sortByColumn = function (column, preventNotification) {
          var sortDirection = $scope.localConfig.sortState.sortDirection || 'ASC';
          if (column.sortKey) {
            if (column.sortKey !== $scope.localConfig.sortState.sortKey) {
              $scope.localConfig.sortState = {
                sortKey: column.sortKey,
                sortDirection: column.sortDirection ? column.sortDirection : sortDirection
              };
            } else {
              if ($scope.localConfig.sortState.sortDirection === sortDirection) {
                $scope.localConfig.sortState.sortDirection = sortDirection === 'ASC' ? 'DEC' : 'ASC';
              } else {
                $scope.localConfig.sortState = {};
              }
            }
            $scope.loadPage($scope.items.paging.currentPage);

            if (!preventNotification && $scope.localConfig.stateChange) {
              $scope.localConfig.stateChange($scope.localConfig.sortState);
            }

          }
        };

        $scope.unSortTable = function () {
          $scope.localConfig.sortState = {};
        };

        $scope.collapseAll = function () {
          $scope.localConfig.expandedItems.length = 0;
        };

        $scope.expandCollapseRow = function (index) {
          adStrapUtils.addRemoveItemFromList(index, $scope.localConfig.expandedItems);
        };

        $scope.onDragStart = function(data, dragElement) {
          $scope.localConfig.expandedItems.length = 0;
          dragElement = dragElement.el;
          var parent = dragElement.parent();
          placeHolder = $('<tr id="row-phldr"><td colspan=' + dragElement.find('td').length + '>&nbsp;</td></tr>');
          initialPos = dragElement.index() + (($scope.items.paging.currentPage - 1) *
            $scope.items.paging.pageSize);
          if (!placeHolderInDom) {
            if (dragElement[0] !== parent.children().last()[0]) {
              dragElement.next().before(placeHolder);
              placeHolderInDom = true;
            } else {
              parent.append(placeHolder);
              placeHolderInDom = true;
            }
          }
        };

        $scope.onDragEnd = function() {
          $('#row-phldr').remove();
          placeHolderInDom = false;
        };

        $scope.onDragOver = function(data, dragElement, dropElement) {
          if (placeHolder) {
            // Restricts valid drag to current table instance
            moveElementNode(placeHolder, dropElement.el, dragElement.el);
          }
        };

        $scope.onDropEnd = function(data, dragElement) {
          var endPos;
          dragElement = dragElement.el;
          if (placeHolder) {
            // Restricts drop to current table instance
            if (placeHolder.next()[0]) {
              placeHolder.next().before(dragElement);
            } else if (placeHolder.prev()[0]) {
              placeHolder.prev().after(dragElement);
            }

            $('#row-phldr').remove();
            placeHolderInDom = false;

            validDrop = true;
            endPos = dragElement.index() + (($scope.items.paging.currentPage - 1) *
              $scope.items.paging.pageSize);
            adStrapUtils.moveItemInList(initialPos, endPos, $scope.localConfig.localData);
            if ($scope.localConfig.draggable && $scope.localConfig.dragChange) {
              $scope.localConfig.dragChange(initialPos, endPos, data);
            }
            $scope.unSortTable();
            $scope.loadPage($scope.items.paging.currentPage);
          }
        };

        $scope.onPageButtonOver = function(data, dragElement, dropElement) {
          if (dropElement.el.attr('disabled') !== 'disabled') {
            pageButtonElement = dropElement.el;
            pageButtonElement.parent().addClass('active');
          }
        };

        $scope.onPageButtonLeave = function(data, dragElement, dropElement) {
          if (pageButtonElement && pageButtonElement === dropElement.el) {
            pageButtonElement.parent().removeClass('active');
            pageButtonElement = null;
          }
        };

        $scope.onPageButtonDrop = function(data, dragElement) {
          var endPos;
          if (pageButtonElement) {
            validDrop = true;
            if (pageButtonElement.attr('id') === 'btnPrev') {
              // endPos - 1 due to zero indexing
              endPos = ($scope.items.paging.pageSize * ($scope.items.paging.currentPage - 1)) - 1;
            }
            if (pageButtonElement.attr('id') === 'btnNext') {
              endPos = $scope.items.paging.pageSize * $scope.items.paging.currentPage;
            }
            adStrapUtils.moveItemInList(initialPos, endPos, $scope.localConfig.localData);
            $scope.loadPage($scope.items.paging.currentPage);

            $('#row-phldr').remove();
            placeHolderInDom = false;

            dragElement.el.remove();
            if ($scope.localConfig.draggable && $scope.localConfig.dragChange) {
              $scope.localConfig.dragChange(initialPos, endPos, data);
            }
            pageButtonElement.parent().removeClass('active');
            pageButtonElement = null;
          }
        };

        $scope.getRowClass = function (item, index) {
          var rowClass = '';
          rowClass += ($attrs.selectedItems &&
            adStrapUtils.itemExistsInList(item, $scope.selectedItems)) ? 'ad-selected' : '';
          rowClass += (adStrapUtils.itemExistsInList(index, $scope.localConfig.expandedItems) ? ' row-expanded' : '');
          if ($attrs.rowClassProvider) {
            rowClass += ' ' + $scope.$eval($attrs.rowClassProvider)(item, index);
          }
          return rowClass;
        };

        $scope.toggle = function (event, index, item) {
          event.stopPropagation();
          adStrapUtils.addRemoveItemFromList(index, $scope.localConfig.expandedItems);
          if (adStrapUtils.itemExistsInList(index, $scope.localConfig.expandedItems)) {
            var rowExpandCallback = $scope.$eval($attrs.rowExpandCallback);
            if (rowExpandCallback) {
              rowExpandCallback(item);
            }
          }
        };

        $scope.onRowClick = function (item, event) {
          var onRowClick = $scope.$parent.$eval($attrs.onRowClick);
          if (onRowClick) {
            onRowClick(item, event);
          }
        };

        // ---------- initialization and event listeners ---------- //

        var state = $scope.$eval($attrs.state) || {};
        var column = {
          sortKey: state.sortKey,
          sortDirection: state.sortDirection
        };
        $scope.sortByColumn(column, true);

        $scope.loadPage(1);

        // ---------- external events ------- //
        $scope.$on('adTableLiteAction', function (event, data) {
          // Exposed methods for external actions
          var actions = {
            expandCollapseRow: $scope.expandCollapseRow
          };
          if (data.tableName === $scope.attrs.tableName) {
            data.action(actions);
          }
        });

        // ---------- set watchers ---------- //
        watchers.push(
          $scope.$watch($attrs.localDataSource, function () {
            $scope.loadPage($scope.items.paging.currentPage);
          })
        );
        watchers.push(
          $scope.$watch($attrs.localDataSource + '.length', function () {
            $scope.loadPage($scope.items.paging.currentPage);
          })
        );
        watchers.push(
          $scope.$watchCollection($attrs.columnDefinition, function () {
            $scope.columnDefinition = $scope.$eval($attrs.columnDefinition);
            $scope.visibleColumnDefinition = $filter('filter')($scope.columnDefinition, $scope.columnVisible);
          })
        );
        watchers.push(
          $scope.$watch($attrs.searchText, function() {
            $scope.searchText = $scope.$eval($attrs.searchText);
            $scope.loadPage(1);
          })
        );

        if ($attrs.enableColumnSearch) {
          var loadFilterPage = adDebounce(function() {
            $scope.loadPage(1);
          }, Number($attrs.columnSearchDebounce) || 400);
          watchers.push($scope.$watch('filters', function () {
            loadFilterPage();
          }, true));
        }

        // ---------- disable watchers ---------- //
        $scope.$on('$destroy', function () {
          watchers.forEach(function (watcher) {
            watcher();
          });
        });
      }

      return {
        restrict: 'E',
        controller: ['$scope', '$attrs', controllerFunction],
        templateUrl: 'tablelite/tablelite.tpl.html',
        scope: true
      };
    }]);
