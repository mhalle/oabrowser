/**
 * adapt-strap
 * @version v2.6.1 - 2016-08-09
 * @link https://github.com/Adaptv/adapt-strap
 * @author Kashyap Patel (kashyap@adap.tv)
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
(function(window, document, undefined) {
'use strict';

// Source: alerts.tpl.js
angular.module('adaptv.adaptStrap.alerts').run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('alerts/alerts.tpl.html', '<div ng-show="settings.type !== \'\'" class="alert alert-{{ settings.type }} alert-dismissible fade in {{ customClasses }}" role="alert"><button type="button" class="close" ng-click="close();" aria-label="Close"><span aria-hidden="true">&times;</span></button><h4><span ng-class="iconMap[settings.type]"></span>&nbsp;&nbsp; <strong>{{ settings.caption }}</strong> {{ settings.message }}</h4></div>');
  }
]);

// Source: infinitedropdown.tpl.js
angular.module('adaptv.adaptStrap.infinitedropdown').run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('infinitedropdown/infinitedropdown.tpl.html', '<div class="ad-infinite-list-container"><div class="dropdown"><button type="button" class="dropdown-toggle" ng-class="attrs.btnClasses || \'btn btn-default\'" data-toggle="dropdown"><span ng-if="!attrs.labelDisplayProperty || !selectedItems.length">{{ attrs.initialLabel || \'Select\' }}</span> <span ng-if="attrs.labelDisplayProperty && selectedItems.length">{{ adStrapUtils.getObjectProperty(selectedItems[selectedItems.length - 1], attrs.labelDisplayProperty) }}</span> <span class="caret"></span></button><div class="dropdown-header" ng-show="dropdownStatus.open" ng-click="dropdownHeaderAreaClicked($event)" ng-if="attrs.dropdownHeaderTemplateUrl"><ng-include src="attrs.dropdownHeaderTemplateUrl"></ng-include></div><ul class="dropdown-menu" role="menu" ng-class="{\'with-dropdown-header\': attrs.dropdownHeaderTemplateUrl}" ng-style="localConfig.dimensions"><li class="text-overflow" data-ng-repeat="item in items.list" ng-class="{\'active\': adStrapUtils.itemExistsInList(item, selectedItems)}" ng-click="addRemoveItem($event, item, selectedItems)"><a role="menuitem" tabindex="-1" href=""><span ng-if="attrs.displayProperty">{{ adStrapUtils.getObjectProperty(item, attrs.displayProperty) }}</span> <span ng-if="attrs.template" ad-compile-template="{{ attrs.template }}"></span> <span ng-if="attrs.templateUrl" ng-include="attrs.templateUrl"></span></a></li><li class="text-overflow text-center" ng-show="localConfig.loadingData"><a role="menuitem" tabindex="-1" href=""><ad-loading-icon></ad-loading-icon></a></li></ul></div></div>');
  }
]);

// Source: loadingindicator.tpl.js
angular.module('adaptv.adaptStrap.loadingindicator').run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('loadingindicator/loadingindicator.tpl.html', '<div class="ad-loading-overlay-container" ng-class="containerClasses" ng-style="{\'z-index\': zIndex || \'1000\',\'position\': position || \'absolute\'}" ng-show="loading"><div class="wrapper"><div class="loading-indicator"><ad-loading-icon loading-icon-size="{{ loadingIconSize }}" loading-icon-class="{{ loadingIconClass }}"></ad-loading-icon></div></div></div>');
  }
]);

// Source: tableajax.tpl.js
angular.module('adaptv.adaptStrap.tableajax').run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('tableajax/tableajax.tpl.html', '<div class="ad-table-ajax-container" ng-if="items.paging.totalPages || localConfig.loadingData || !attrs.itemsNotFoundMessage"><table class="ad-sticky-table {{ attrs.tableClasses || tableClasses }}" ng-if="attrs.tableMaxHeight || attrs.tableFixedHeight" ng-class="{\'ad-fixed-layout\': (attrs.tableMaxHeight || attrs.tableFixedHeight)}"><thead><tr class="ad-user-select-none" ng-include="\'tableajax/headerRowContent.html\'"></tr></thead></table><div class="ad-table-container" ng-style="{\'max-height\': localConfig.tableMaxHeight, \'height\' : attrs.tableFixedHeight}"><table class="{{ attrs.tableClasses || tableClasses }}" ng-class="{\'ad-fixed-layout\': (attrs.tableMaxHeight || attrs.tableFixedHeight)}"><thead><tr class="ad-user-select-none" ng-if="!(localConfig.tableMaxHeight || attrs.tableFixedHeight)" ng-include="\'tableajax/headerRowContent.html\'"></tr></thead><tbody><tr class="ad-first-row" ng-if="attrs.firstRowTemplate" ng-include="attrs.firstRowTemplate"></tr><tr ng-repeat-start="item in items.list" ng-class="getRowClass(item, $index)" ng-include="\'tableajax/rowContent.html\'" ng-click="onRowClick(item, $event)"></tr><tr ng-if="attrs.rowExpandTemplate && adStrapUtils.itemExistsInList($index, localConfig.expandedItems)" class="expandable-row-content" ng-repeat-end><td colspan="{{ visibleColumnDefinition.length + 1}}" ng-include="attrs.rowExpandTemplate"></td></tr><tr class="ad-last-row" ng-if="attrs.lastRowTemplate" ng-include="attrs.lastRowTemplate"></tr></tbody></table><ad-loading-overlay loading="localConfig.loadingData"></ad-loading-overlay></div><ng-include src="\'tableajax/pagination.html\'"></ng-include></div><div ng-if="localConfig.showNoDataFoundMessage && !localConfig.loadingData && attrs.itemsNotFoundMessage"><div class="alert alert-info" role="alert">{{ attrs.itemsNotFoundMessage }}</div></div>');
  }
]);

// Source: tablelite.tpl.js
angular.module('adaptv.adaptStrap.tablelite').run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('tablelite/tablelite.tpl.html', '<div class="ad-table-lite-container" ng-if="items.allItems.length || !attrs.itemsNotFoundMessage || attrs.enableColumnSearch"><table class="ad-sticky-table {{ attrs.tableClasses || tableClasses }}" ng-if="attrs.tableMaxHeight || attrs.tableFixedHeight" ng-class="{\'ad-fixed-layout\': (attrs.tableMaxHeight || attrs.tableFixedHeight)}"><thead><tr class="ad-user-select-none" ng-include="\'tablelite/headerRowContent.html\'"></tr><tr class="ad-user-select-none" ng-if="attrs.enableColumnSearch" ng-include="\'tablelite/headerRowFilterContent.html\'"></tr></thead></table><div class="ad-table-container" ng-style="{\'max-height\': attrs.tableMaxHeight, \'height\': attrs.tableFixedHeight}"><table class="{{ attrs.tableClasses || tableClasses }}" ng-class="{\'ad-fixed-layout\': (attrs.tableMaxHeight || attrs.tableFixedHeight)}"><thead><tr class="ad-user-select-none" ng-if="!(attrs.tableMaxHeight || attrs.tableFixedHeight)" ng-include="\'tablelite/headerRowContent.html\'"></tr><tr class="ad-user-select-none" ng-if="!(attrs.tableMaxHeight || attrs.tableFixedHeight) && attrs.enableColumnSearch" ng-include="\'tablelite/headerRowFilterContent.html\'"></tr></thead><tbody ng-if="!localConfig.draggable" ng-include="\'tablelite/defaultRow.html\'"></tbody><tbody ng-if="localConfig.draggable" ng-include="\'tablelite/draggableRow.html\'"></tbody></table></div><ng-include src="\'tablelite/pagination.html\'"></ng-include></div><div ng-if="!localConfig.localData.length && attrs.itemsNotFoundMessage && !attrs.enableColumnSearch"><div class="alert alert-info" role="alert">{{ attrs.itemsNotFoundMessage }}</div></div>');
  }
]);

// Source: treeBrowserNode.tpl.js
angular.module('adaptv.adaptStrap.treebrowser').run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('treebrowser/treeBrowserNode.tpl.html', '<div class="content" ng-style="{\'padding-left\': level * (attrs.childrenPadding || 15) + \'px\'}" ng-click="onRowClick(item, level, $event)" ng-class="{{ attrs.rowNgClass }}"><div class="content-holder"><ad-tree-browser-node-toggle ng-if="!attrs.customToggle"></ad-tree-browser-node-toggle><div class="node-content">%=nodeTemplate% <span ng-if="!attrs.nodeTemplateUrl">{{ item.name || "" }}</span></div></div></div><div ng-if="item._ad_expanded"><div class="tree-level tree-sub-level" ng-init="level=level+1" ng-repeat="item in item[attrs.childNode]"><ad-tree-browser-node template-url="attrs.nodeTemplateUrl"></ad-tree-browser-node></div></div>');
  }
]);

// Source: treebrowser.tpl.js
angular.module('adaptv.adaptStrap.treebrowser').run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('treebrowser/treebrowser.tpl.html', '<div class="ad-tree-browser-container" ng-class="{\'tree-bordered\': attrs.bordered}"><div data-level="0" class="tree-view"><div class="tree"><div><div class="tree-level tree-header-level border" ng-if="attrs.nodeHeaderUrl"><div class="content" ng-style="{\'padding-left\': (attrs.childrenPadding || 15) + \'px\'}"><div class="content-holder"><div></div><div class="node-content ad-user-select-none" ng-include="attrs.nodeHeaderUrl"></div></div></div></div><div class="tree-level tree-top-level border" ng-init="level = 1" ng-repeat="item in treeRoot[attrs.childNode]"><ad-tree-browser-node template-url="attrs.nodeTemplateUrl"></ad-tree-browser-node></div></div></div></div></div>');
  }
]);

// Source: treebrowserNodeToggle.tpl.js
angular.module('adaptv.adaptStrap.treebrowser').run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('treebrowser/treebrowserNodeToggle.tpl.html', '<div class="toggle" ng-class="{\'custom-toggle\': attrs.customToggle}"><i ng-if="!item._ad_expanded && hasChildren(item) && !item._ad_loading" ng-class="iconClasses.expand" ng-click="toggle($event,item)"></i> <i ng-if="item._ad_expanded && !item._ad_loading" ng-class="iconClasses.collapse" ng-click="toggle($event,item)"></i> <span ng-if="item._ad_loading"><i ng-class="iconClasses.loadingSpinner"></i></span></div>');
  }
]);

// Source: headerRowContent.js
angular.module('adaptv.adaptStrap.tableajax').run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('tableajax/headerRowContent.html', '<th class="ad-select-cell" ng-if="attrs.rowExpandTemplate"><i></i></th><th class="ad-select-cell" ng-if="attrs.selectedItems && items.allItems"><input type="checkbox" class="ad-cursor-pointer" ng-if="!attrs.enableColumnSearch" ng-click="adStrapUtils.addRemoveItemsFromList(items.allItems, selectedItems)" ng-checked="adStrapUtils.itemsExistInList(items.allItems, selectedItems)"></th><th data-ng-repeat="definition in visibleColumnDefinition" ng-click="sortByColumn(definition)" ng-class="{\'ad-cursor-pointer\': definition.sortKey}" ng-style="{\'width\': definition.width}"><ng-include src="\'tableajax/sortIcons.html\'" ng-if="!attrs.snugSortIcons"></ng-include><div class="ad-display-inline-block" ng-if="definition.columnHeaderTemplate" ad-compile-template="definition.columnHeaderTemplate"></div><div class="ad-display-inline-block" ng-if="definition.columnHeaderTemplateUrl"><ng-include src="definition.columnHeaderTemplateUrl"></ng-include></div><div class="ad-display-inline-block" ng-if="definition.columnHeaderDisplayName" ng-bind="definition.columnHeaderDisplayName"></div><ng-include src="\'tableajax/sortIcons.html\'" ng-if="attrs.snugSortIcons"></ng-include></th>');
  }
]);

// Source: pagination.js
angular.module('adaptv.adaptStrap.tableajax').run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('tableajax/pagination.html', '<div class="row ad-table-pagination-container"><div class="col-md-8 col-sm-8"><ul ng-class="attrs.paginationBtnGroupClasses || \'pagination pagination-sm\'"><li><a class="ad-cursor-pointer" ng-click="loadPage(1)" ng-disabled="items.paging.currentPage == 1" title="First Page" aria-label="First Page"><i ng-class="iconClasses.firstPage"></i></a></li><li><a class="ad-cursor-pointer" ng-click="loadPreviousPage()" ng-disabled="items.paging.currentPage == 1" title="Previous Page" aria-label="Previous Page"><i ng-class="iconClasses.previousPage"></i></a></li><li ng-repeat="page in localConfig.pagingArray" ng-class="{active: items.paging.currentPage == page}"><a class="ad-cursor-pointer" ng-click="loadPage(page)">{{ page }}</a></li><li><a class="ad-cursor-pointer" ng-click="loadNextPage()" ng-disabled="items.paging.currentPage == items.paging.totalPages" title="Next Page" aria-label="Next Page"><i ng-class="iconClasses.nextPage"></i></a></li><li><a class="ad-cursor-pointer" ng-click="loadLastPage()" ng-disabled="items.paging.currentPage == items.paging.totalPages" title="Last Page" aria-label="Last Page"><i ng-class="iconClasses.lastPage"></i></a></li></ul></div><div class="col-md-4 col-sm-4 text-right"><ul ng-class="attrs.paginationBtnGroupClasses || \'pagination pagination-sm\'"><li ng-repeat="size in items.paging.pageSizes" ng-class="{active: items.paging.pageSize == size}"><a class="ad-cursor-pointer" ng-click="pageSizeChanged(size)">{{ size }}</a></li></ul></div></div>');
  }
]);

// Source: rowContent.js
angular.module('adaptv.adaptStrap.tableajax').run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('tableajax/rowContent.html', '<td class="ad-select-cell ad-cursor-pointer table-ajax-col-{{definition.columnHeaderDisplayName ? definition.columnHeaderDisplayName : $index}}" ng-if="attrs.rowExpandTemplate" ng-click="toggle($event, $index, item)"><i ng-class="iconClasses.expand" ng-if="!adStrapUtils.itemExistsInList($index, localConfig.expandedItems)"></i> <i ng-class="iconClasses.collapse" ng-if="adStrapUtils.itemExistsInList($index, localConfig.expandedItems)"></i></td><td class="ad-select-cell table-ajax-col-{{definition.columnHeaderDisplayName ? definition.columnHeaderDisplayName : $index}}" ng-if="attrs.selectedItems"><input type="checkbox" class="ad-cursor-pointer" ng-checked="adStrapUtils.itemExistsInList(item, selectedItems)" ng-click="adStrapUtils.addRemoveItemFromList(item, selectedItems)"></td><td data-ng-repeat="definition in visibleColumnDefinition" ng-style="{\'width\': definition.width}" class="table-ajax-col-{{definition.columnHeaderDisplayName ? definition.columnHeaderDisplayName : $index}}"><div ng-if="definition.templateUrl"><ng-include src="definition.templateUrl"></ng-include></div><div ng-if="definition.template"><span ad-compile-template="definition.template"></span></div><div ng-if="!definition.templateUrl && !definition.template">{{ adStrapUtils.applyFilter(adStrapUtils.getObjectProperty(item, definition.displayProperty, item), definition.cellFilter) }}</div></td>');
  }
]);

// Source: sortIcons.js
angular.module('adaptv.adaptStrap.tableajax').run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('tableajax/sortIcons.html', '<div ng-class="{\'ad-display-inline-block\': attrs.snugSortIcons, \'pull-right\': !attrs.snugSortIcons}" ng-if="definition.sortKey && localConfig.sortState.sortKey == definition.sortKey"><i ng-class="iconClasses.sortAscending" ng-show="localConfig.sortState.sortDirection === \'ASC\'"></i> <i ng-class="iconClasses.sortDescending" ng-show="localConfig.sortState.sortDirection === \'DEC\'"></i></div><div ng-class="{\'ad-display-inline-block\': attrs.snugSortIcons, \'pull-right\': !attrs.snugSortIcons}" ng-if="definition.sortKey && localConfig.sortState.sortKey != definition.sortKey"><i ng-class="iconClasses.sortable"></i></div>');
  }
]);

// Source: defaultRow.js
angular.module('adaptv.adaptStrap.tablelite').run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('tablelite/defaultRow.html', '<tr class="ad-first-row" ng-if="attrs.firstRowTemplate" ng-include="attrs.firstRowTemplate"></tr><tr ng-repeat-start="item in items.list" ng-class="getRowClass(item, $index)" ng-include="\'tablelite/rowContent.html\'" ng-click="onRowClick(item, $event)"></tr><tr ng-if="attrs.rowExpandTemplate && adStrapUtils.itemExistsInList($index, localConfig.expandedItems)" class="expandable-row-content" ng-repeat-end><td colspan="{{ visibleColumnDefinition.length + !!attrs.draggable + !!attrs.selectedItems + 1}}" ng-include="attrs.rowExpandTemplate"></td></tr><tr class="ad-last-row" ng-if="attrs.lastRowTemplate" ng-include="attrs.lastRowTemplate"></tr>');
  }
]);

// Source: draggableRow.js
angular.module('adaptv.adaptStrap.tablelite').run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('tablelite/draggableRow.html', '<tr class="ad-first-row" ng-if="attrs.firstRowTemplate" ng-include="attrs.firstRowTemplate"></tr><tr ad-drag="true" ad-drag-handle="true" ad-drop="true" ad-drag-data="item" ad-drop-over="onDragOver($data, $dragElement, $dropElement, $event)" ad-drop-end="onDropEnd($data, $dragElement, $dropElement, $event)" ad-drag-begin="onDragStart($data, $dragElement, $event)" ad-drag-end="onDragEnd($data, $dragElement, $event)" ng-repeat-start="item in items.list" ng-class="getRowClass(item, $index)" ng-include="\'tablelite/rowContent.html\'"></tr><tr ng-if="attrs.rowExpandTemplate && adStrapUtils.itemExistsInList($index, localConfig.expandedItems)" class="expandable-row-content" ng-repeat-end><td colspan="{{ visibleColumnDefinition.length + !!attrs.draggable + !!attrs.selectedItems + 1}}" ng-include="attrs.rowExpandTemplate"></td></tr><tr class="ad-last-row" ng-if="attrs.lastRowTemplate" ng-include="attrs.lastRowTemplate"></tr>');
  }
]);

// Source: headerRowContent.js
angular.module('adaptv.adaptStrap.tablelite').run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('tablelite/headerRowContent.html', '<th class="ad-select-cell" ng-if="attrs.draggable"><i></i></th><th class="ad-select-cell" ng-if="attrs.rowExpandTemplate"><i></i></th><th class="ad-select-cell" ng-if="attrs.selectedItems && items.allItems"><input type="checkbox" class="ad-cursor-pointer" ng-if="!attrs.enableColumnSearch" ng-click="adStrapUtils.addRemoveItemsFromList(items.allItems, selectedItems)" ng-checked="adStrapUtils.itemsExistInList(items.allItems, selectedItems)"></th><th data-ng-repeat="definition in visibleColumnDefinition" ng-click="sortByColumn(definition)" ng-class="{\'ad-cursor-pointer\': definition.sortKey}" ng-style="{\'width\': definition.width}"><ng-include src="\'tablelite/sortIcons.html\'" ng-if="!attrs.snugSortIcons"></ng-include><div class="ad-display-inline-block" ng-if="definition.columnHeaderTemplate" ad-compile-template="definition.columnHeaderTemplate"></div><div class="ad-display-inline-block" ng-if="definition.columnHeaderTemplateUrl"><ng-include src="definition.columnHeaderTemplateUrl"></ng-include></div><div class="ad-display-inline-block" ng-bind="definition.columnHeaderDisplayName"></div><ng-include src="\'tablelite/sortIcons.html\'" ng-if="attrs.snugSortIcons"></ng-include></th>');
  }
]);

// Source: headerRowFilterContent.js
angular.module('adaptv.adaptStrap.tablelite').run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('tablelite/headerRowFilterContent.html', '<th class="ad-select-cell" ng-if="attrs.draggable"><i></i></th><th class="ad-select-cell" ng-if="attrs.rowExpandTemplate"><i></i></th><th class="ad-select-cell" ng-if="attrs.selectedItems && items.allItems"><input type="checkbox" class="ad-cursor-pointer" ng-if="attrs.enableColumnSearch" ng-click="adStrapUtils.addRemoveItemsFromList(items.allItems, selectedItems)" ng-checked="adStrapUtils.itemsExistInList(items.allItems, selectedItems)"></th><th data-ng-repeat="definition in visibleColumnDefinition"><input ng-if="definition.columnSearchProperty" type="text" class="input-sm form-control" ng-model="filters[definition.columnSearchProperty]"></th>');
  }
]);

// Source: pagination.js
angular.module('adaptv.adaptStrap.tablelite').run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('tablelite/pagination.html', '<div class="row ad-table-pagination-container" ng-if="!attrs.disablePaging"><div class="col-md-8 col-sm-8 text-left"><ul ng-class="attrs.paginationBtnGroupClasses || \'pagination pagination-sm\'"><li><a ng-click="loadPage(1)" class="ad-cursor-pointer" ng-disabled="items.paging.currentPage == 1" title="First Page" aria-label="First Page"><i ng-class="iconClasses.firstPage"></i></a></li><li><a ng-if="!attrs.draggable" class="ad-cursor-pointer" ng-click="loadPreviousPage()" ng-disabled="items.paging.currentPage == 1" title="Previous Page" aria-label="Previous Page"><i ng-class="iconClasses.previousPage"></i></a></li><li><a id="btnPrev" class="ad-cursor-pointer" ng-if="attrs.draggable" ad-drop="true" ad-drop-over="onPageButtonOver($data, $dragElement, $dropElement, $event)" ad-drop-leave="onPageButtonLeave($data, $dragElement, $dropElement, $event)" ad-drop-end="onPageButtonDrop($data, $dragElement, $dropElement, $event)" ng-click="loadPreviousPage()" ng-disabled="items.paging.currentPage == 1" title="Previous Page" aria-label="Previous Page"><i ng-class="iconClasses.previousPage"></i></a></li><li ng-repeat="page in localConfig.pagingArray" ng-class="{active: items.paging.currentPage == page}"><a ng-click="loadPage(page)" class="ad-cursor-pointer">{{ page }}</a></li><li><a ng-if="!attrs.draggable" class="ad-cursor-pointer" ng-click="loadNextPage()" ng-disabled="items.paging.currentPage == items.paging.totalPages" title="Next Page" aria-label="Next Page"><i ng-class="iconClasses.nextPage"></i></a></li><li><a id="btnNext" class="ad-cursor-pointer" ng-if="attrs.draggable" ad-drop="true" ad-drop-over="onPageButtonOver($data, $dragElement, $dropElement, $event)" ad-drop-leave="onPageButtonLeave($data, $dragElement, $dropElement, $event)" ad-drop-end="onPageButtonDrop($data, $dragElement, $dropElement, $event)" ng-click="loadNextPage()" ng-disabled="items.paging.currentPage == items.paging.totalPages" title="Next Page" aria-label="Next Page"><i ng-class="iconClasses.nextPage"></i></a></li><li><a ng-click="loadLastPage()" class="ad-cursor-pointer" ng-disabled="items.paging.currentPage == items.paging.totalPages" title="Last Page" aria-label="Last Page"><i ng-class="iconClasses.lastPage"></i></a></li></ul></div><div class="col-md-4 col-sm-4 text-right"><ul ng-class="attrs.paginationBtnGroupClasses || \'pagination pagination-sm\'"><li ng-repeat="size in items.paging.pageSizes" ng-class="{active: items.paging.pageSize == size}"><a ng-click="pageSizeChanged(size)" class="ad-cursor-pointer">{{ size }}</a></li></ul></div></div>');
  }
]);

// Source: rowContent.js
angular.module('adaptv.adaptStrap.tablelite').run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('tablelite/rowContent.html', '<td class="ad-select-cell ad-cursor-pointer table-lite-col-{{definition.columnHeaderDisplayName ? definition.columnHeaderDisplayName : $index}}" ng-if="attrs.rowExpandTemplate" ng-click="toggle($event, $index, item)"><i ng-class="iconClasses.expand" ng-if="!adStrapUtils.itemExistsInList($index, localConfig.expandedItems)"></i> <i ng-class="iconClasses.collapse" ng-if="adStrapUtils.itemExistsInList($index, localConfig.expandedItems)"></i></td><td class="ad-select-cell ad-drag-handle table-lite-col-{{definition.columnHeaderDisplayName ? definition.columnHeaderDisplayName : $index}}" ng-if="attrs.draggable"><i ng-class="iconClasses.draggable"></i></td><td class="ad-select-cell table-lite-col-{{definition.columnHeaderDisplayName ? definition.columnHeaderDisplayName : $index}}" ng-if="attrs.selectedItems"><input type="checkbox" class="ad-cursor-pointer" ng-checked="adStrapUtils.itemExistsInList(item, selectedItems)" ng-click="adStrapUtils.addRemoveItemFromList(item, selectedItems)"></td><td data-ng-repeat="definition in visibleColumnDefinition" ng-style="{\'width\': definition.width}" class="table-lite-col-{{definition.columnHeaderDisplayName ? definition.columnHeaderDisplayName : $index}}"><div ng-if="definition.templateUrl"><ng-include src="definition.templateUrl"></ng-include></div><div ng-if="definition.template"><span ad-compile-template="definition.template"></span></div><div ng-if="!definition.templateUrl && !definition.template">{{ adStrapUtils.applyFilter(adStrapUtils.getObjectProperty(item, definition.displayProperty), definition.cellFilter) }}</div></td>');
  }
]);

// Source: sortIcons.js
angular.module('adaptv.adaptStrap.tablelite').run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('tablelite/sortIcons.html', '<div ng-class="{\'ad-display-inline-block\': attrs.snugSortIcons, \'pull-right\': !attrs.snugSortIcons}" ng-if="definition.sortKey && localConfig.sortState.sortKey == definition.sortKey"><i ng-class="iconClasses.sortAscending" ng-show="localConfig.sortState.sortDirection === \'ASC\'"></i> <i ng-class="iconClasses.sortDescending" ng-show="localConfig.sortState.sortDirection === \'DEC\'"></i></div><div ng-class="{\'ad-display-inline-block\': attrs.snugSortIcons, \'pull-right\': !attrs.snugSortIcons}" ng-if="definition.sortKey && localConfig.sortState.sortKey != definition.sortKey"><i ng-class="iconClasses.sortable"></i></div>');
  }
]);


})(window, document);
