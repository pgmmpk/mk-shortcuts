(function(angular) {
	
	var module = angular.module('myApp', ['mkShortcuts']);
	
	module.directive('myKbManager', ['mkShortcutsManager', function(kbd) {

		return function(scope, elm, attr) {
				
			scope.logs = [];
			
			var shortcuts = kbd.shortcuts()
				.on('Ctrl+A', function() {
					scope.logs.push('Select All');
				})
				.on('Ctrl+Z', function() {
					scope.logs.push('Undo');
				})
				.on('Shift+Delete', function() {
					scope.logs.push('Shift+Delete');
				})
				.on('Alt+Up', function() {
					scope.logs.push('Alt+Up');
				})
				.on('Ctrl+Alt+Shift+Delete', function() {
					scope.logs.push('Boom!!!');
				});

			scope.$on('$destroy', shortcuts.close);
		};
		
	}]);

})(angular);