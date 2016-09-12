angular.module('adaptv.adaptStrap.utils', [])
  .factory('adStrapUtils', ['$filter', function ($filter) {

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
      },
      createdChainObjectAndInitValue = function (property, value) {
        var arr = property.split('.');
        var obj = {obj: {}};
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
      },
      applyFilter = function (value, filter, item) {
        var filterName,
          filterOptions,
          optionsIndex;

        if (value && ('function' === typeof value)) {
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
      },
      itemExistsInList = function (compareItem, list) {
        var exist = false;
        list.forEach(function (item) {
          if (angular.equals(compareItem, item)) {
            exist = true;
          }
        });
        return exist;
      },
      itemsExistInList = function (items, list) {
        var exist = true,
          i;
        for (i = 0; i < items.length; i++) {
          if (itemExistsInList(items[i], list) === false) {
            exist = false;
            break;
          }
        }
        return exist;
      },
      addItemToList = function (item, list) {
        list.push(item);
      },
      removeItemFromList = function (item, list) {
        var i;
        for (i = list.length - 1; i > -1; i--) {
          if (angular.equals(item, list[i])) {
            list.splice(i, 1);
          }
        }
      },
      addRemoveItemFromList = function (item, list) {
        var i,
          found = false;
        for (i = list.length - 1; i > -1; i--) {
          if (angular.equals(item, list[i])) {
            list.splice(i, 1);
            found = true;
          }
        }
        if (found === false) {
          list.push(item);
        }
      },
      addItemsToList = function (items, list) {
        items.forEach(function (item) {
          if (!itemExistsInList(item, list)) {
            addRemoveItemFromList(item, list);
          }
        });
      },
      addRemoveItemsFromList = function (items, list) {
        if (itemsExistInList(items, list)) {
          list.length = 0;
        } else {
          addItemsToList(items, list);
        }
      },
      moveItemInList = function (startPos, endPos, list) {
        if (endPos < list.length) {
          list.splice(endPos, 0, list.splice(startPos, 1)[0]);
        }
      },
      parse = function(items) {
        var itemsObject = [];
        if (angular.isArray(items)) {
          itemsObject = items;
        } else {
          angular.forEach(items, function (item) {
            itemsObject.push(item);
          });
        }
        return itemsObject;
      },
      getObjectProperty = function (item, property) {
        if (property && ('function' === typeof property)) {
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

  }])
  .factory('adDebounce', ['$timeout', '$q', function ($timeout, $q) {
    'use strict';
    var deb = function (func, delay, immediate, ctx) {
      var timer = null,
        deferred = $q.defer(),
        wait = delay || 300;
      return function () {
        var context = ctx || this,
          args = arguments,
          callNow = immediate && !timer,
          later = function () {
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
  }])
  .directive('adCompileTemplate', ['$compile', function ($compile) {
    return function (scope, element, attrs) {
      scope.$watch(
        function (scope) {
          return scope.$eval(attrs.adCompileTemplate);
        },
        function (value) {
          element.html(value);
          $compile(element.contents())(scope);
        }
      );
    };
  }])
  .factory('adLoadPage', ['$adConfig', '$http', 'adStrapUtils', function ($adConfig, $http, adStrapUtils) {
    return function (options) {
      var start = (options.pageNumber - 1) * options.pageSize,
        pagingConfig = angular.copy($adConfig.paging),
        ajaxConfig = angular.copy(options.ajaxConfig);

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
          totalPages: Math.ceil(
              adStrapUtils.evalObjectProperty(result.data, pagingConfig.response.totalItems) /
              options.pageSize
          ),
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
  }])
  .factory('adLoadLocalPage', ['$filter', function ($filter) {
    return function (options) {
      var response = {
        items: undefined,
        currentPage: options.pageNumber,
        totalPages: undefined,
        pagingArray: [],
        token: options.token
      };

      if(angular.isDefined(options.localData)) {
        var start = (options.pageNumber - 1) * options.pageSize,
          end = start + options.pageSize,
          i,
          itemsObject = options.localData,
          localItems = itemsObject;

        if (options.sortKey && !options.draggable) {
          localItems = $filter('orderBy')(
            itemsObject,
            options.sortKey,
            options.sortDirection
          );
        }

        response.items = localItems.slice(start, end);
        response.allItems = itemsObject;
        response.currentPage = options.pageNumber;
        response.totalPages = Math.ceil(
            itemsObject.length /
            options.pageSize
        );
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
  }]);
