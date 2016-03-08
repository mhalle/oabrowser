angular.module('adaptv.adaptStrap.alerts')
  .factory('adAlerts', [function() {
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
