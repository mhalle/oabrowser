/**
 * adapt-strap
 * @version v2.6.1 - 2016-08-09
 * @link https://github.com/Adaptv/adapt-strap
 * @author Kashyap Patel (kashyap@adap.tv)
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
(function(window, document, undefined) {
'use strict';
// Source: module.js
angular.module('adaptv.adaptStrap', [
  'adaptv.adaptStrap.utils',
  'adaptv.adaptStrap.treebrowser',
  'adaptv.adaptStrap.tablelite',
  'adaptv.adaptStrap.tableajax',
  'adaptv.adaptStrap.loadingindicator',
  'adaptv.adaptStrap.draggable',
  'adaptv.adaptStrap.infinitedropdown',
  'adaptv.adaptStrap.alerts'
]).provider('$adConfig', function () {
  var iconClasses = this.iconClasses = {
      expand: 'glyphicon glyphicon-plus-sign',
      collapse: 'glyphicon glyphicon-minus-sign',
      loadingSpinner: 'glyphicon glyphicon-refresh ad-spin',
      firstPage: 'glyphicon glyphicon-fast-backward',
      previousPage: 'glyphicon glyphicon-backward',
      nextPage: 'glyphicon glyphicon-forward',
      lastPage: 'glyphicon glyphicon-fast-forward',
      sortAscending: 'glyphicon glyphicon-chevron-up',
      sortDescending: 'glyphicon glyphicon-chevron-down',
      sortable: 'glyphicon glyphicon-resize-vertical',
      draggable: 'glyphicon glyphicon-align-justify',
      selectedItem: 'glyphicon glyphicon-ok',
      alertInfoSign: 'glyphicon glyphicon-info-sign',
      alertSuccessSign: 'glyphicon glyphicon-ok',
      alertWarningSign: 'glyphicon glyphicon-warning-sign',
      alertDangerSign: 'glyphicon glyphicon-exclamation-sign'
    }, paging = this.paging = {
      request: {
        start: 'skip',
        pageSize: 'limit',
        page: 'page',
        sortField: 'sort',
        sortDirection: 'sort_dir',
        sortAscValue: 'asc',
        sortDescValue: 'desc'
      },
      response: {
        itemsLocation: 'data',
        totalItems: 'pagination.totalCount'
      },
      pageSize: 10,
      pageSizes: [
        10,
        25,
        50
      ]
    }, componentClasses = this.componentClasses = {
      tableLiteClass: 'table',
      tableAjaxClass: 'table'
    };
  this.$get = function () {
    return {
      iconClasses: iconClasses,
      paging: paging,
      componentClasses: componentClasses
    };
  };
});

// Source: alerts.js
angular.module('adaptv.adaptStrap.alerts', []).directive('adAlerts', [function () {
function controllerFunction($scope, $attrs, $adConfig, adAlerts) {
      $scope.iconMap = {
        'info': $adConfig.iconClasses.alertInfoSign,
        'success': $adConfig.iconClasses.alertSuccessSign,
        'warning': $adConfig.iconClasses.alertWarningSign,
        'danger': $adConfig.iconClasses.alertDangerSign
      };
      var timeout = $scope.timeout && !Number(timeout).isNAN ? $scope.timeout : 0;
      var timeoutPromise;
      $scope.close = function () {
        adAlerts.clear();
        if (timeoutPromise) {
          clearTimeout(timeoutPromise);
        }
      };
      $scope.customClasses = $scope.customClasses || '';
      $scope.settings = adAlerts.settings;
      if (timeout !== 0) {
        $scope.$watch('settings.type', function (type) {
          if (type !== '') {
            if (timeoutPromise) {
              clearTimeout(timeoutPromise);
            }
            timeoutPromise = setTimeout($scope.close, timeout);
          }
        });
      }
    }
    return {
      restrict: 'AE',
      scope: {
        timeout: '=',
        customClasses: '@'
      },
      templateUrl: 'alerts/alerts.tpl.html',
      controller: [
        '$scope',
        '$attrs',
        '$adConfig',
        'adAlerts',
        controllerFunction
      ]
    };
  }]);

// Source: alerts.svc.js
angular.module('adaptv.adaptStrap.alerts').factory('adAlerts', [function () {
    var _settings = {
        type: '',
        caption: '',
        message: ''
      };
    function _updateSettings(type, caption, msg) {
      _settings.type = type;
      _settings.caption = caption;
      _settings.message = msg;
    }
    function _warning(cap, msg) {
      _updateSettings('warning', cap, msg);
    }
    function _info(cap, msg) {
      _updateSettings('info', cap, msg);
    }
    function _success(cap, msg) {
      _updateSettings('success', cap, msg);
    }
    function _error(cap, msg) {
      _updateSettings('danger', cap, msg);
    }
    function _clearSettings() {
      _settings.type = '';
      _settings.caption = '';
      _settings.message = '';
    }
    return {
      settings: _settings,
      warning: _warning,
      info: _info,
      success: _success,
      error: _error,
      clear: _clearSettings
    };
  }]);

// Source: draggable.js
angular.module('adaptv.adaptStrap.draggable', []).directive('adDrag', [
  '$rootScope',
  '$parse',
  '$timeout',
  function ($rootScope, $parse, $timeout) {
    function linkFunction(scope, element, attrs) {
      scope.draggable = attrs.adDrag;
      scope.hasHandle = attrs.adDragHandle === 'false' || typeof attrs.adDragHandle === 'undefined' ? false : true;
      scope.onDragStartCallback = $parse(attrs.adDragBegin) || null;
      scope.onDragEndCallback = $parse(attrs.adDragEnd) || null;
      scope.useClonedElement = attrs.adDragCloneElement === 'true';
      scope.data = null;
      var offset, mx, my, tx, ty;
      var hasTouch = 'ontouchstart' in document.documentElement;
      /* -- Events -- */
      var startEvents = 'touchstart mousedown';
      var moveEvents = 'touchmove mousemove';
      var endEvents = 'touchend mouseup';
      var $document = $(document);
      var $window = $(window);
      var dragEnabled = false;
      var pressTimer = null;
      var draggedClone = null;
      function reset() {
        var elem = scope.useClonedElement ? draggedClone : element;
        elem.css({
          left: '',
          top: '',
          position: '',
          'z-index': ''
        });
        var width = elem.data('ad-draggable-temp-width');
        if (width) {
          elem.css({ width: width });
        } else {
          elem.css({ width: '' });
        }
        elem.children().each(function () {
          var width = $(this).data('ad-draggable-temp-width');
          if (width) {
            $(this).css({ width: width });
          } else {
            $(this).css({ width: '' });
          }
        });
      }
      function moveElement(x, y) {
        var elem = scope.useClonedElement ? draggedClone : element;
        elem.css({
          left: x,
          top: y,
          position: 'fixed',
          'z-index': 99999
        });
      }
      function onDragStart(evt, o) {
        if (o.el === element && o.callback) {
          o.callback(evt);
        }
      }
      function onDragEnd(evt, o) {
        if (o.el === element && o.callback) {
          o.callback(evt);
        }
      }
      function onDragBegin(evt) {
        if (!scope.onDragStartCallback) {
          return;
        }
        var elem = scope.useClonedElement ? draggedClone : element;
        scope.$apply(function () {
          scope.onDragStartCallback(scope, {
            $data: scope.data,
            $dragElement: { el: elem },
            $event: evt
          });
        });
      }
      function onDragComplete(evt) {
        if (!scope.onDragEndCallback) {
          return;
        }
        var elem = scope.useClonedElement ? draggedClone : element;
        // To fix a bug issue where onDragEnd happens before
        // onDropEnd. Currently the only way around this
        // Ideally onDropEnd should fire before onDragEnd
        $timeout(function () {
          scope.$apply(function () {
            scope.onDragEndCallback(scope, {
              $data: scope.data,
              $dragElement: { el: elem },
              $event: evt
            });
          });
        }, 100);
      }
      function onMove(evt) {
        var cx, cy;
        if (!dragEnabled) {
          return;
        }
        evt.preventDefault();
        cx = evt.pageX || evt.originalEvent.touches[0].pageX;
        cy = evt.pageY || evt.originalEvent.touches[0].pageY;
        tx = cx - mx + offset.left - $window.scrollLeft();
        ty = cy - my + offset.top - $window.scrollTop();
        cx = cx - $window.scrollLeft();
        cy = cy - $window.scrollTop();
        moveElement(tx, ty);
        var elem = scope.useClonedElement ? draggedClone : element;
        $rootScope.$broadcast('draggable:move', {
          x: mx,
          y: my,
          tx: tx,
          ty: ty,
          cx: cx,
          cy: cy,
          el: elem,
          data: scope.data
        });
      }
      function onRelease(evt) {
        if (!dragEnabled) {
          return;
        }
        evt.preventDefault();
        var elem = scope.useClonedElement ? draggedClone : element;
        $rootScope.$broadcast('draggable:end', {
          x: mx,
          y: my,
          tx: tx,
          ty: ty,
          el: elem,
          data: scope.data,
          callback: onDragComplete
        });
        if (scope.useClonedElement) {
          element.removeClass('ad-dragging');
          elem.remove();
        } else {
          elem.removeClass('ad-dragging');
        }
        reset();
        $document.off(moveEvents, onMove);
        $document.off(endEvents, onRelease);
      }
      function onEnableChange(newVal) {
        dragEnabled = scope.$eval(newVal);
      }
      function onDragDataChange(newVal) {
        scope.data = newVal;
      }
      function getInlineProperty(prop, element) {
        var styles = $(element).attr('style'), value;
        if (styles) {
          styles.split(';').forEach(function (e) {
            var style = e.split(':');
            if ($.trim(style[0]) === prop) {
              value = style[1];
            }
          });
        }
        return value;
      }
      function persistElementWidth() {
        var elem = scope.useClonedElement ? draggedClone : element;
        if (getInlineProperty('width', elem)) {
          elem.data('ad-draggable-temp-width', getInlineProperty('width', elem));
        }
        elem.width(elem.width());
        elem.children().each(function () {
          if (getInlineProperty('width', this)) {
            $(this).data('ad-draggable-temp-width', getInlineProperty('width', this));
          }
          $(this).width($(this).width());
        });
      }
      function onLongPress(evt) {
        if (!dragEnabled) {
          return;
        }
        evt.preventDefault();
        if (scope.useClonedElement) {
          draggedClone = element.clone().appendTo(element.parent());
          draggedClone.css({ position: 'fixed' });
        }
        var elem = scope.useClonedElement ? draggedClone : element;
        offset = element.offset();
        if (scope.hasHandle) {
          offset = element.find('.ad-drag-handle').offset();
        } else {
          offset = element.offset();
        }
        element.addClass('ad-dragging');
        mx = evt.pageX || evt.originalEvent.touches[0].pageX;
        my = evt.pageY || evt.originalEvent.touches[0].pageY;
        tx = offset.left - $window.scrollLeft();
        ty = offset.top - $window.scrollTop();
        persistElementWidth();
        moveElement(tx, ty);
        $document.on(moveEvents, onMove);
        $document.on(endEvents, onRelease);
        $rootScope.$broadcast('draggable:start', {
          x: mx,
          y: my,
          tx: tx,
          ty: ty,
          el: elem,
          data: scope.data,
          callback: onDragBegin
        });
      }
      function cancelPress() {
        clearTimeout(pressTimer);
        $document.off(moveEvents, cancelPress);
        $document.off(endEvents, cancelPress);
      }
      /*
       * When the element is clicked start the drag behaviour
       * On touch devices as a small delay so as not to prevent native window scrolling
       */
      function onPress(evt) {
        if (!dragEnabled) {
          return;
        }
        if ($(evt.target).is('[ad-prevent-drag]') || $(evt.target).parents('[ad-prevent-drag]').length > 0) {
          return;
        }
        if (hasTouch) {
          cancelPress();
          pressTimer = setTimeout(function () {
            cancelPress();
            onLongPress(evt);
          }, 100);
          $document.on(moveEvents, cancelPress);
          $document.on(endEvents, cancelPress);
        } else {
          onLongPress(evt);
          return false;
        }
      }
      function toggleListeners(enable) {
        if (!enable) {
          return;
        }
        // add listeners.
        scope.$on('$destroy', function () {
          toggleListeners(false);
        });
        attrs.$observe('adDrag', onEnableChange);
        scope.$watch(attrs.adDragData, onDragDataChange);
        scope.$on('draggable:start', onDragStart);
        scope.$on('draggable:end', onDragEnd);
        if (scope.hasHandle) {
          element.on(startEvents, '.ad-drag-handle', onPress);
        } else {
          element.on(startEvents, onPress);
          element.addClass('ad-draggable');
        }
      }
      function init() {
        element.attr('draggable', 'false');
        // prevent native drag
        toggleListeners(true);
      }
      init();
    }
    return {
      restrict: 'A',
      link: linkFunction
    };
  }
]).directive('adDrop', [
  '$rootScope',
  '$parse',
  function ($rootScope, $parse) {
    function linkFunction(scope, element, attrs) {
      scope.droppable = attrs.adDrop;
      scope.onDropCallback = $parse(attrs.adDropEnd) || null;
      scope.onDropOverCallback = $parse(attrs.adDropOver) || null;
      scope.onDropLeaveCallback = $parse(attrs.adDropLeave) || null;
      var dropEnabled = false;
      var elem = null;
      var lastDropElement = null;
      var $window = $(window);
      function getCurrentDropElement(x, y) {
        var bounds = element.offset();
        // set drag sensitivity
        var vthold = Math.floor(element.outerHeight() / 6);
        x = x + $window.scrollLeft();
        y = y + $window.scrollTop();
        return y >= bounds.top + vthold && y <= bounds.top + element.outerHeight() - vthold && (x >= bounds.left && x <= bounds.left + element.outerWidth()) && (x >= bounds.left && x <= bounds.left + element.outerWidth()) ? element : null;
      }
      function onEnableChange(newVal) {
        dropEnabled = scope.$eval(newVal);
      }
      function onDropChange(evt, obj) {
        if (elem !== obj.el) {
          elem = null;
        }
      }
      function onDragMove(evt, obj) {
        if (!dropEnabled) {
          return;
        }
        // If the dropElement and the drag element are the same
        if (element === obj.el) {
          return;
        }
        var el = getCurrentDropElement(obj.cx, obj.cy);
        if (el !== null) {
          elem = el;
          lastDropElement = elem;
          obj.el.lastDropElement = elem;
          scope.$apply(function () {
            scope.onDropOverCallback(scope, {
              $data: obj.data,
              $dragElement: { el: obj.el },
              $dropElement: { el: elem },
              $event: evt
            });
          });
          element.addClass('ad-drop-over');
          $rootScope.$broadcast('draggable:change', { el: elem });
        } else {
          if (obj.el.lastDropElement === element) {
            scope.$apply(function () {
              scope.onDropLeaveCallback(scope, {
                $data: obj.data,
                $dragElement: { el: obj.el },
                $dropElement: { el: obj.el.lastDropElement },
                $event: evt
              });
            });
            obj.el.lastDropElement.removeClass('ad-drop-over');
            delete obj.el.lastDropElement;  //elem = null;
          }
        }
      }
      function onDragEnd(evt, obj) {
        if (!dropEnabled) {
          return;
        }
        // call the adDrop element callback
        // Callback should fire only once
        if (elem) {
          scope.$apply(function () {
            scope.onDropCallback(scope, {
              $data: obj.data,
              $dragElement: { el: obj.el },
              $dropElement: { el: elem },
              $lastDropElement: { el: lastDropElement },
              $event: evt
            });
          });
        }
        elem = null;
        lastDropElement = null;
      }
      function toggleListeners(enable) {
        if (!enable) {
          return;
        }
        // add listeners.
        attrs.$observe('adDrop', onEnableChange);
        scope.$on('$destroy', function () {
          toggleListeners(false);
        });
        scope.$on('draggable:move', onDragMove);
        scope.$on('draggable:end', onDragEnd);
        scope.$on('draggable:change', onDropChange);
      }
      function init() {
        toggleListeners(true);
      }
      init();
    }
    return {
      restrict: 'A',
      link: linkFunction
    };
  }
]);

// Source: infinitedropdown.js
angular.module('adaptv.adaptStrap.infinitedropdown', [
  'adaptv.adaptStrap.utils',
  'adaptv.adaptStrap.loadingindicator'
]).directive('adInfiniteDropdown', [
  '$parse',
  '$compile',
  '$timeout',
  '$templateCache',
  '$adConfig',
  'adLoadPage',
  'adDebounce',
  'adStrapUtils',
  'adLoadLocalPage',
  function ($parse, $compile, $timeout, $templateCache, $adConfig, adLoadPage, adDebounce, adStrapUtils, adLoadLocalPage) {
function linkFunction(scope, element, attrs) {
      // scope initialization
      scope.attrs = attrs;
      scope.adStrapUtils = adStrapUtils;
      scope.onDataLoadedCallback = $parse(attrs.onDataLoaded) || null;
      scope.items = {
        list: [],
        paging: {
          currentPage: 1,
          totalPages: undefined,
          pageSize: Number(attrs.pageSize) || 10
        }
      };
      scope.localConfig = {
        loadingData: false,
        singleSelectionMode: $parse(attrs.singleSelectionMode)() ? true : false,
        dimensions: {
          'max-height': attrs.maxHeight || '200px',
          'max-width': attrs.maxWidth || 'auto'
        }
      };
      scope.selectedItems = scope.$eval(attrs.selectedItems) || [];
      scope.ajaxConfig = scope.$eval(attrs.ajaxConfig) || {};
      // ---------- Local data ---------- //
      var lastRequestToken, watchers = [];
      // ---------- ui handlers ---------- //
      scope.addRemoveItem = function (event, item, items) {
        event.stopPropagation();
        if (scope.localConfig.singleSelectionMode) {
          scope.selectedItems[0] = item;
        } else {
          adStrapUtils.addRemoveItemFromList(item, items);
        }
        var callback = scope.$eval(attrs.onItemClick);
        if (callback) {
          callback(item);
        }
        if (scope.localConfig.singleSelectionMode) {
          scope.dropdownStatus.open = false;
          element.find('.dropdown').removeClass('open');
        }
      };
      scope.loadPage = adDebounce(function (page) {
        lastRequestToken = Math.random();
        scope.localConfig.loadingData = true;
        var pageLoader = scope.$eval(attrs.pageLoader) || adLoadPage, params = {
            pageNumber: page,
            pageSize: scope.items.paging.pageSize,
            sortKey: scope.localConfig.predicate,
            sortDirection: scope.localConfig.reverse,
            ajaxConfig: scope.ajaxConfig,
            token: lastRequestToken
          }, successHandler = function (response) {
            if (response.token === lastRequestToken) {
              if (page === 1) {
                scope.items.list = response.items;
              } else {
                scope.items.list = scope.items.list.concat(response.items);
              }
              scope.items.paging.totalPages = response.totalPages;
              scope.items.paging.currentPage = response.currentPage;
              scope.localConfig.loadingData = false;
              if (attrs.onDataLoaded) {
                scope.onDataLoadedCallback(scope, {
                  $success: true,
                  $response: response
                });
              }
            }
          }, errorHandler = function () {
            scope.localConfig.loadingData = false;
            if (attrs.onDataLoaded) {
              scope.onDataLoadedCallback(scope, {
                $success: false,
                $response: null
              });
            }
          };
        if (attrs.localDataSource) {
          params.localData = scope.$eval(attrs.localDataSource);
          successHandler(adLoadLocalPage(params));
        } else {
          pageLoader(params).then(successHandler, errorHandler);
        }
      }, 10);
      scope.loadNextPage = function () {
        if (!scope.localConfig.loadingData) {
          if (scope.items.paging.currentPage + 1 <= scope.items.paging.totalPages) {
            scope.loadPage(scope.items.paging.currentPage + 1);
          }
        }
      };
      scope.dropdownHeaderAreaClicked = function (event) {
        event.stopPropagation();
      };
      // ---------- initialization and event listeners ---------- //
      //We do the compile after injecting the name spacing into the template.
      scope.loadPage(1);
      // ---------- set watchers ---------- //
      // reset on parameter change
      if (attrs.ajaxConfig) {
        scope.$watch(attrs.ajaxConfig, function (value) {
          if (value) {
            scope.loadPage(1);
          }
        }, true);
      }
      if (attrs.localDataSource) {
        watchers.push(scope.$watch(attrs.localDataSource, function (value) {
          if (value) {
            scope.loadPage(1);
          }
        }));
        watchers.push(scope.$watch(attrs.localDataSource + '.length', function (value) {
          if (value) {
            scope.loadPage(1);
          }
        }));
      }
      // for dropdown-header area
      scope.dropdownStatus = scope.$eval(attrs.dropdownStatus) || { open: false };
      watchers.push(scope.$watch('dropdownStatus.open', function (value) {
        if (value === true) {
          $timeout(function () {
            element.find('.dropdown').addClass('open');
          }, 0);
        } else {
          $timeout(function () {
            element.find('.dropdown').removeClass('open');
          }, 0);
        }
      }));
      element.find('.dropdown-toggle').click(function () {
        scope.$apply(function () {
          if (scope.dropdownStatus.open) {
            scope.dropdownStatus.open = false;
          } else {
            scope.dropdownStatus.open = true;
            element.find('.dropdown-header').outerWidth(element.find('.dropdown-menu').outerWidth());
          }
        });
      });
      $(document).click(function () {
        scope.$apply(function () {
          if (scope.dropdownStatus.open) {
            scope.dropdownStatus.open = false;
          }
        });
      });
      // ---------- disable watchers ---------- //
      scope.$on('$destroy', function () {
        watchers.forEach(function (watcher) {
          watcher();
        });
      });
      var listContainer = angular.element(element).find('ul')[0];
      // infinite scroll handler
      var loadFunction = adDebounce(function () {
          // This is for infinite scrolling.
          // When the scroll gets closer to the bottom, load more items.
          if (listContainer.scrollTop + listContainer.offsetHeight >= listContainer.scrollHeight - 300) {
            scope.loadNextPage();
          }
        }, 50);
      angular.element(listContainer).bind('mousewheel DOMMouseScroll scroll', function (event) {
        console.log('scrolling');
        if (event.originalEvent && event.originalEvent.deltaY) {
          listContainer.scrollTop += event.originalEvent.deltaY;
          event.preventDefault();
          event.stopPropagation();
        }
        loadFunction();
      });
    }
    return {
      restrict: 'E',
      scope: true,
      link: linkFunction,
      templateUrl: 'infinitedropdown/infinitedropdown.tpl.html'
    };
  }
]);

// Source: loadingindicator.js
angular.module('adaptv.adaptStrap.loadingindicator', []).directive('adLoadingIcon', [
  '$adConfig',
  '$compile',
  function ($adConfig, $compile) {
    return {
      restrict: 'E',
      compile: function compile() {
        return {
          pre: function preLink(scope, element, attrs) {
            var loadingIconClass = attrs.loadingIconClass || $adConfig.iconClasses.loadingSpinner, ngStyleTemplate = attrs.loadingIconSize ? 'ng-style="{\'font-size\': \'' + attrs.loadingIconSize + '\'}"' : '', template = '<i class="' + loadingIconClass + '" ' + ngStyleTemplate + '></i>';
            element.empty();
            element.append($compile(template)(scope));
          }
        };
      }
    };
  }
]).directive('adLoadingOverlay', [
  '$adConfig',
  function ($adConfig) {
    return {
      restrict: 'E',
      templateUrl: 'loadingindicator/loadingindicator.tpl.html',
      scope: {
        loading: '=',
        zIndex: '@',
        position: '@',
        containerClasses: '@',
        loadingIconClass: '@',
        loadingIconSize: '@'
      },
      compile: function compile() {
        return {
          pre: function preLink(scope) {
            scope.loadingIconClass = scope.loadingIconClass || $adConfig.iconClasses.loading;
            scope.loadingIconSize = scope.loadingIconSize || '3em';
          }
        };
      }
    };
  }
]);

// Source: tableajax.js
angular.module('adaptv.adaptStrap.tableajax', [
  'adaptv.adaptStrap.utils',
  'adaptv.adaptStrap.loadingindicator'
]).directive('adTableAjax', [
  '$parse',
  '$filter',
  '$adConfig',
  'adLoadPage',
  'adDebounce',
  'adStrapUtils',
  function ($parse, $filter, $adConfig, adLoadPage, adDebounce, adStrapUtils) {
function controllerFunction($scope, $attrs) {
      // ---------- $scope initialization ---------- //
      $scope.attrs = $attrs;
      $scope.attrs.state = $scope.attrs.state || {};
      $scope.iconClasses = $adConfig.iconClasses;
      $scope.adStrapUtils = adStrapUtils;
      $scope.tableClasses = $adConfig.componentClasses.tableAjaxClass;
      $scope.onDataLoadedCallback = $parse($attrs.onDataLoaded) || null;
      $scope.items = {
        list: undefined,
        allItems: undefined,
        paging: {
          currentPage: 1,
          totalPages: undefined,
          totalItems: undefined,
          pageSize: Number($attrs.pageSize) || $adConfig.paging.pageSize,
          pageSizes: $parse($attrs.pageSizes)() || $adConfig.paging.pageSizes
        }
      };
      $scope.localConfig = {
        pagingArray: [],
        loadingData: false,
        showNoDataFoundMessage: false,
        tableMaxHeight: $attrs.tableMaxHeight,
        expandedItems: [],
        sortState: {},
        stateChange: $scope.$eval($attrs.onStateChange)
      };
      $scope.selectedItems = $scope.$eval($attrs.selectedItems);
      $scope.onRowClick = function (item, event) {
        var onRowClick = $scope.$parent.$eval($attrs.onRowClick);
        if (onRowClick) {
          onRowClick(item, event);
        }
      };
      $scope.ajaxConfig = $scope.$eval($attrs.ajaxConfig);
      $scope.columnDefinition = $scope.$eval($attrs.columnDefinition);
      $scope.visibleColumnDefinition = $filter('filter')($scope.columnDefinition, $scope.columnVisible);
      // ---------- Local data ---------- //
      var lastRequestToken, watchers = [];
      if (!$scope.items.paging.pageSize && $scope.items.paging.pageSizes[0]) {
        $scope.items.paging.pageSize = $scope.items.paging.pageSizes[0];
      }
      // ---------- ui handlers ---------- //
      $scope.loadPage = adDebounce(function (page) {
        $scope.collapseAll();
        lastRequestToken = Math.random();
        $scope.localConfig.loadingData = true;
        $scope.localConfig.showNoDataFoundMessage = false;
        var pageLoader = $scope.$eval($attrs.pageLoader) || adLoadPage, params = {
            pageNumber: page,
            pageSize: $scope.items.paging.pageSize,
            sortKey: $scope.localConfig.sortState.sortKey,
            sortDirection: $scope.localConfig.sortState.sortDirection === 'DEC',
            ajaxConfig: $scope.ajaxConfig,
            token: lastRequestToken
          }, successHandler = function (response) {
            if (response.token === lastRequestToken) {
              $scope.items.list = response.items;
              $scope.items.allItems = response.items;
              $scope.items.paging.totalPages = response.totalPages;
              $scope.items.paging.totalItems = response.totalItems;
              $scope.items.paging.currentPage = response.currentPage;
              $scope.localConfig.pagingArray = response.pagingArray;
              $scope.localConfig.loadingData = false;
            }
            if (!response.totalPages) {
              $scope.localConfig.showNoDataFoundMessage = true;
            }
            if ($scope.onDataLoadedCallback) {
              $scope.onDataLoadedCallback($scope, {
                $success: true,
                $response: response
              });
            }
          }, errorHandler = function () {
            $scope.localConfig.loadingData = false;
            $scope.localConfig.showNoDataFoundMessage = true;
            if ($scope.onDataLoadedCallback) {
              $scope.onDataLoadedCallback($scope, {
                $success: false,
                $response: null
              });
            }
          };
        pageLoader(params).then(successHandler, errorHandler);
      });
      $scope.loadNextPage = function () {
        if (!$scope.localConfig.loadingData) {
          if ($scope.items.paging.currentPage + 1 <= $scope.items.paging.totalPages) {
            $scope.loadPage($scope.items.paging.currentPage + 1);
          }
        }
      };
      $scope.loadPreviousPage = function () {
        if (!$scope.localConfig.loadingData) {
          if ($scope.items.paging.currentPage - 1 > 0) {
            $scope.loadPage($scope.items.paging.currentPage - 1);
          }
        }
      };
      $scope.loadLastPage = function () {
        if (!$scope.localConfig.loadingData) {
          if ($scope.items.paging.currentPage !== $scope.items.paging.totalPages) {
            $scope.loadPage($scope.items.paging.totalPages);
          }
        }
      };
      $scope.pageSizeChanged = function (size) {
        if (Number(size) !== $scope.items.paging.pageSize) {
          $scope.items.paging.pageSize = Number(size);
          $scope.loadPage(1);
        }
      };
      $scope.columnVisible = function (column) {
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
      $scope.collapseAll = function () {
        $scope.localConfig.expandedItems.length = 0;
      };
      $scope.expandCollapseRow = function (index) {
        adStrapUtils.addRemoveItemFromList(index, $scope.localConfig.expandedItems);
      };
      $scope.getRowClass = function (item, index) {
        var rowClass = '';
        rowClass += $attrs.selectedItems && adStrapUtils.itemExistsInList(item, $scope.selectedItems) ? 'ad-selected' : '';
        rowClass += adStrapUtils.itemExistsInList(index, $scope.localConfig.expandedItems) ? ' row-expanded' : '';
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
      // ---------- initialization and event listeners ---------- //
      var state = $scope.$eval($attrs.state) || {};
      var column = {
          sortKey: state.sortKey,
          sortDirection: state.sortDirection
        };
      $scope.sortByColumn(column, true);
      $scope.loadPage(1);
      // ---------- external events ------- //
      $scope.$on('adTableAjaxAction', function (event, data) {
        // Exposed methods for external actions
        var actions = { expandCollapseRow: $scope.expandCollapseRow };
        if (data.tableName === $scope.attrs.tableName) {
          data.action(actions);
        }
      });
      // reset on parameter change
      watchers.push($scope.$watch($attrs.ajaxConfig, function () {
        $scope.loadPage(1);
      }, true));
      watchers.push($scope.$watchCollection($attrs.columnDefinition, function () {
        $scope.columnDefinition = $scope.$eval($attrs.columnDefinition);
        $scope.visibleColumnDefinition = $filter('filter')($scope.columnDefinition, $scope.columnVisible);
      }));
      // ---------- disable watchers ---------- //
      $scope.$on('$destroy', function () {
        watchers.forEach(function (watcher) {
          watcher();
        });
      });
    }
    return {
      restrict: 'E',
      scope: true,
      templateUrl: 'tableajax/tableajax.tpl.html',
      controller: [
        '$scope',
        '$attrs',
        controllerFunction
      ]
    };
  }
]);

// Source: tablelite.js
angular.module('adaptv.adaptStrap.tablelite', ['adaptv.adaptStrap.utils']).directive('adTableLite', [
  '$parse',
  '$http',
  '$compile',
  '$filter',
  '$templateCache',
  '$adConfig',
  'adStrapUtils',
  'adDebounce',
  'adLoadLocalPage',
  function ($parse, $http, $compile, $filter, $templateCache, $adConfig, adStrapUtils, adDebounce, adLoadLocalPage) {
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
      var placeHolder = null, placeHolderInDom = false, pageButtonElement = null, validDrop = false, initialPos, watchers = [];
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
        var itemsObject, params, parsedData = adStrapUtils.parse($scope.$eval($attrs.localDataSource)), filterObj = {};
        $scope.localConfig.localData = !!$scope.searchText ? $filter('filter')(parsedData, $scope.searchText) : parsedData;
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
          pageSize: !$attrs.disablePaging ? $scope.items.paging.pageSize : itemsObject.length,
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
      $scope.columnVisible = function (column) {
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
      $scope.onDragStart = function (data, dragElement) {
        $scope.localConfig.expandedItems.length = 0;
        dragElement = dragElement.el;
        var parent = dragElement.parent();
        placeHolder = $('<tr id="row-phldr"><td colspan=' + dragElement.find('td').length + '>&nbsp;</td></tr>');
        initialPos = dragElement.index() + ($scope.items.paging.currentPage - 1) * $scope.items.paging.pageSize;
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
      $scope.onDragEnd = function () {
        $('#row-phldr').remove();
        placeHolderInDom = false;
      };
      $scope.onDragOver = function (data, dragElement, dropElement) {
        if (placeHolder) {
          // Restricts valid drag to current table instance
          moveElementNode(placeHolder, dropElement.el, dragElement.el);
        }
      };
      $scope.onDropEnd = function (data, dragElement) {
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
          endPos = dragElement.index() + ($scope.items.paging.currentPage - 1) * $scope.items.paging.pageSize;
          adStrapUtils.moveItemInList(initialPos, endPos, $scope.localConfig.localData);
          if ($scope.localConfig.draggable && $scope.localConfig.dragChange) {
            $scope.localConfig.dragChange(initialPos, endPos, data);
          }
          $scope.unSortTable();
          $scope.loadPage($scope.items.paging.currentPage);
        }
      };
      $scope.onPageButtonOver = function (data, dragElement, dropElement) {
        if (dropElement.el.attr('disabled') !== 'disabled') {
          pageButtonElement = dropElement.el;
          pageButtonElement.parent().addClass('active');
        }
      };
      $scope.onPageButtonLeave = function (data, dragElement, dropElement) {
        if (pageButtonElement && pageButtonElement === dropElement.el) {
          pageButtonElement.parent().removeClass('active');
          pageButtonElement = null;
        }
      };
      $scope.onPageButtonDrop = function (data, dragElement) {
        var endPos;
        if (pageButtonElement) {
          validDrop = true;
          if (pageButtonElement.attr('id') === 'btnPrev') {
            // endPos - 1 due to zero indexing
            endPos = $scope.items.paging.pageSize * ($scope.items.paging.currentPage - 1) - 1;
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
        rowClass += $attrs.selectedItems && adStrapUtils.itemExistsInList(item, $scope.selectedItems) ? 'ad-selected' : '';
        rowClass += adStrapUtils.itemExistsInList(index, $scope.localConfig.expandedItems) ? ' row-expanded' : '';
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
        var actions = { expandCollapseRow: $scope.expandCollapseRow };
        if (data.tableName === $scope.attrs.tableName) {
          data.action(actions);
        }
      });
      // ---------- set watchers ---------- //
      watchers.push($scope.$watch($attrs.localDataSource, function () {
        $scope.loadPage($scope.items.paging.currentPage);
      }));
      watchers.push($scope.$watch($attrs.localDataSource + '.length', function () {
        $scope.loadPage($scope.items.paging.currentPage);
      }));
      watchers.push($scope.$watchCollection($attrs.columnDefinition, function () {
        $scope.columnDefinition = $scope.$eval($attrs.columnDefinition);
        $scope.visibleColumnDefinition = $filter('filter')($scope.columnDefinition, $scope.columnVisible);
      }));
      watchers.push($scope.$watch($attrs.searchText, function () {
        $scope.searchText = $scope.$eval($attrs.searchText);
        $scope.loadPage(1);
      }));
      if ($attrs.enableColumnSearch) {
        var loadFilterPage = adDebounce(function () {
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
      controller: [
        '$scope',
        '$attrs',
        controllerFunction
      ],
      templateUrl: 'tablelite/tablelite.tpl.html',
      scope: true
    };
  }
]);

// Source: treebrowser.js
angular.module('adaptv.adaptStrap.treebrowser', []).directive('adTreeBrowser', [
  '$adConfig',
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
      $scope.localConfig = { rendererTemplateId: 'tree-renderer-' + templateToken + '.html' };
    }
    return {
      restrict: 'E',
      scope: true,
      controller: [
        '$scope',
        '$attrs',
        controllerFunction
      ],
      templateUrl: 'treebrowser/treebrowser.tpl.html'
    };
  }
]).directive('adTreeBrowserNode', [
  '$compile',
  '$http',
  '$templateCache',
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
    function linkFunction(scope, element, attrs) {
      function compileTemplate(nodeTemplate) {
        getTemplate(nodeTemplate)(scope, function (clonedElement) {
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
]).directive('adTreeBrowserNodeToggle', function () {
  return {
    scope: true,
    restrict: 'E',
    replace: true,
    templateUrl: 'treebrowser/treebrowserNodeToggle.tpl.html'
  };
});

// Source: utils.js
angular.module('adaptv.adaptStrap.utils', []).factory('adStrapUtils', [
  '$filter',
  function ($filter) {
    var evalObjectProperty = function (obj, property) {
        var arr = property.split('.');
        if (obj) {
          while (arr.length) {
            var key = arr.shift();
            if (obj) {
              obj = obj[key];
            }
          }
        }
        return obj;
      }, createdChainObjectAndInitValue = function (property, value) {
        var arr = property.split('.');
        var obj = { obj: {} };
        var ob2 = obj.obj;
        while (arr.length) {
          var key = arr.shift();
          if (ob2) {
            if (arr.length === 0) {
              ob2[key] = value;
            } else {
              ob2[key] = {};
              ob2 = ob2[key];
            }
          }
        }
        return obj.obj;
      }, applyFilter = function (value, filter, item) {
        var filterName, filterOptions, optionsIndex;
        if (value && 'function' === typeof value) {
          return value(item);
        }
        if (filter) {
          optionsIndex = filter.indexOf(':');
          if (optionsIndex > -1) {
            filterName = filter.substring(0, optionsIndex);
            filterOptions = filter.substring(optionsIndex + 1);
            value = $filter(filterName)(value, filterOptions);
          } else {
            value = $filter(filter)(value);
          }
        }
        return value;
      }, itemExistsInList = function (compareItem, list) {
        var exist = false;
        list.forEach(function (item) {
          if (angular.equals(compareItem, item)) {
            exist = true;
          }
        });
        return exist;
      }, itemsExistInList = function (items, list) {
        var exist = true, i;
        for (i = 0; i < items.length; i++) {
          if (itemExistsInList(items[i], list) === false) {
            exist = false;
            break;
          }
        }
        return exist;
      }, addItemToList = function (item, list) {
        list.push(item);
      }, removeItemFromList = function (item, list) {
        var i;
        for (i = list.length - 1; i > -1; i--) {
          if (angular.equals(item, list[i])) {
            list.splice(i, 1);
          }
        }
      }, addRemoveItemFromList = function (item, list) {
        var i, found = false;
        for (i = list.length - 1; i > -1; i--) {
          if (angular.equals(item, list[i])) {
            list.splice(i, 1);
            found = true;
          }
        }
        if (found === false) {
          list.push(item);
        }
      }, addItemsToList = function (items, list) {
        items.forEach(function (item) {
          if (!itemExistsInList(item, list)) {
            addRemoveItemFromList(item, list);
          }
        });
      }, addRemoveItemsFromList = function (items, list) {
        if (itemsExistInList(items, list)) {
          list.length = 0;
        } else {
          addItemsToList(items, list);
        }
      }, moveItemInList = function (startPos, endPos, list) {
        if (endPos < list.length) {
          list.splice(endPos, 0, list.splice(startPos, 1)[0]);
        }
      }, parse = function (items) {
        var itemsObject = [];
        if (angular.isArray(items)) {
          itemsObject = items;
        } else {
          angular.forEach(items, function (item) {
            itemsObject.push(item);
          });
        }
        return itemsObject;
      }, getObjectProperty = function (item, property) {
        if (property && 'function' === typeof property) {
          return property(item);
        }
        var arr = property.split('.');
        while (arr.length) {
          item = item[arr.shift()];
        }
        return item;
      }, hasAtLeastOnePropertyWithValue = function (obj) {
        var has = false, name, value;
        for (name in obj) {
          value = obj[name];
          if (value instanceof Array) {
            if (value.length > 0) {
              has = true;
            }
          } else if (!!value) {
            has = true;
          }
          if (has) {
            break;
          }
        }
        return has;
      };
    return {
      evalObjectProperty: evalObjectProperty,
      createdChainObjectAndInitValue: createdChainObjectAndInitValue,
      applyFilter: applyFilter,
      itemExistsInList: itemExistsInList,
      itemsExistInList: itemsExistInList,
      addItemToList: addItemToList,
      removeItemFromList: removeItemFromList,
      addRemoveItemFromList: addRemoveItemFromList,
      addItemsToList: addItemsToList,
      addRemoveItemsFromList: addRemoveItemsFromList,
      moveItemInList: moveItemInList,
      parse: parse,
      getObjectProperty: getObjectProperty,
      hasAtLeastOnePropertyWithValue: hasAtLeastOnePropertyWithValue
    };
  }
]).factory('adDebounce', [
  '$timeout',
  '$q',
  function ($timeout, $q) {
var deb = function (func, delay, immediate, ctx) {
      var timer = null, deferred = $q.defer(), wait = delay || 300;
      return function () {
        var context = ctx || this, args = arguments, callNow = immediate && !timer, later = function () {
            if (!immediate) {
              deferred.resolve(func.apply(context, args));
              deferred = $q.defer();
            }
          };
        if (timer) {
          $timeout.cancel(timer);
        }
        timer = $timeout(later, wait);
        if (callNow) {
          deferred.resolve(func.apply(context, args));
          deferred = $q.defer();
        }
        return deferred.promise;
      };
    };
    return deb;
  }
]).directive('adCompileTemplate', [
  '$compile',
  function ($compile) {
    return function (scope, element, attrs) {
      scope.$watch(function (scope) {
        return scope.$eval(attrs.adCompileTemplate);
      }, function (value) {
        element.html(value);
        $compile(element.contents())(scope);
      });
    };
  }
]).factory('adLoadPage', [
  '$adConfig',
  '$http',
  'adStrapUtils',
  function ($adConfig, $http, adStrapUtils) {
    return function (options) {
      var start = (options.pageNumber - 1) * options.pageSize, pagingConfig = angular.copy($adConfig.paging), ajaxConfig = angular.copy(options.ajaxConfig);
      if (ajaxConfig.paginationConfig && ajaxConfig.paginationConfig.request) {
        angular.extend(pagingConfig.request, ajaxConfig.paginationConfig.request);
      }
      if (ajaxConfig.paginationConfig && ajaxConfig.paginationConfig.response) {
        angular.extend(pagingConfig.response, ajaxConfig.paginationConfig.response);
      }
      ajaxConfig.params = ajaxConfig.params ? ajaxConfig.params : {};
      if (pagingConfig.request.start) {
        ajaxConfig.params[pagingConfig.request.start] = start;
      }
      if (pagingConfig.request.pageSize) {
        ajaxConfig.params[pagingConfig.request.pageSize] = options.pageSize;
      }
      if (pagingConfig.request.page) {
        ajaxConfig.params[pagingConfig.request.page] = options.pageNumber;
      }
      if (options.sortKey && pagingConfig.request.sortField) {
        ajaxConfig.params[pagingConfig.request.sortField] = options.sortKey;
      }
      if (options.sortDirection === false && pagingConfig.request.sortDirection) {
        ajaxConfig.params[pagingConfig.request.sortDirection] = pagingConfig.request.sortAscValue;
      } else if (options.sortDirection === true && pagingConfig.request.sortDirection) {
        ajaxConfig.params[pagingConfig.request.sortDirection] = pagingConfig.request.sortDescValue;
      }
      var promise;
      if (ajaxConfig.method === 'JSONP') {
        promise = $http.jsonp(ajaxConfig.url + '?callback=JSON_CALLBACK', ajaxConfig);
      } else {
        promise = $http(ajaxConfig);
      }
      return promise.then(function (result) {
        var response = {
            items: adStrapUtils.evalObjectProperty(result.data, pagingConfig.response.itemsLocation),
            currentPage: options.pageNumber,
            totalPages: Math.ceil(adStrapUtils.evalObjectProperty(result.data, pagingConfig.response.totalItems) / options.pageSize),
            totalItems: Math.ceil(adStrapUtils.evalObjectProperty(result.data, pagingConfig.response.totalItems)),
            pagingArray: [],
            token: options.token
          };
        var TOTAL_PAGINATION_ITEMS = 5;
        var minimumBound = options.pageNumber - Math.floor(TOTAL_PAGINATION_ITEMS / 2);
        for (var i = minimumBound; i <= options.pageNumber; i++) {
          if (i > 0) {
            response.pagingArray.push(i);
          }
        }
        while (response.pagingArray.length < TOTAL_PAGINATION_ITEMS) {
          if (i > response.totalPages) {
            break;
          }
          response.pagingArray.push(i);
          i++;
        }
        return response;
      });
    };
  }
]).factory('adLoadLocalPage', [
  '$filter',
  function ($filter) {
    return function (options) {
      var response = {
          items: undefined,
          currentPage: options.pageNumber,
          totalPages: undefined,
          pagingArray: [],
          token: options.token
        };
      if (angular.isDefined(options.localData)) {
        var start = (options.pageNumber - 1) * options.pageSize, end = start + options.pageSize, i, itemsObject = options.localData, localItems = itemsObject;
        if (options.sortKey && !options.draggable) {
          localItems = $filter('orderBy')(itemsObject, options.sortKey, options.sortDirection);
        }
        response.items = localItems.slice(start, end);
        response.allItems = itemsObject;
        response.currentPage = options.pageNumber;
        response.totalPages = Math.ceil(itemsObject.length / options.pageSize);
        var TOTAL_PAGINATION_ITEMS = 5;
        var minimumBound = options.pageNumber - Math.floor(TOTAL_PAGINATION_ITEMS / 2);
        for (i = minimumBound; i <= options.pageNumber; i++) {
          if (i > 0) {
            response.pagingArray.push(i);
          }
        }
        while (response.pagingArray.length < TOTAL_PAGINATION_ITEMS) {
          if (i > response.totalPages) {
            break;
          }
          response.pagingArray.push(i);
          i++;
        }
      }
      return response;
    };
  }
]);

})(window, document);
