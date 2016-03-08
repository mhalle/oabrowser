angular.module('adaptv.adaptStrap', [
  'adaptv.adaptStrap.utils',
  'adaptv.adaptStrap.treebrowser',
  'adaptv.adaptStrap.tablelite',
  'adaptv.adaptStrap.tableajax',
  'adaptv.adaptStrap.loadingindicator',
  'adaptv.adaptStrap.draggable',
  'adaptv.adaptStrap.infinitedropdown',
  'adaptv.adaptStrap.alerts'
])
  .provider('$adConfig', function () {
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
      },
      paging = this.paging = {
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
        pageSizes: [10, 25, 50]
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
