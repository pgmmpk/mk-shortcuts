# mkShortcuts

AngularJS module that provides mkShortcutFactory service. Use it for getting programmatic control over
keyboard shortcuts. This is useful for dynamic shortcuts. If your shortcuts never change, you should instead
use AngularJS built-in [ngKeydown/ngKeyup](http://docs.angularjs.org/api/ng.directive:ngKeyup) directives.

## Usage

First, include JS code by adding `script` tag to your page:

	<script src='//pgmmpk.github.io/mk-shortcuts/dist/mk-shortcuts.min.js'> </script>

Then, declare `mkShortcuts` as your app dependency:

	angular.module('myApp', ['mkShortcuts']);

Now you are ready to use it!
	
## Global Shortcuts Manager

The easiest way to use Shortcuts Manager is to create it as a service, attaching it to the window's document, like this:

	app.factory('kbd', function(mkShortcutsFactory) {
		
		return mkShortcutsFactory();
	});

Now you can use it in your controller to register shortcuts:

	app.controller('MyCtrl', function($scope, kbd) {
		
		var shortcuts = kbd.shortcuts()
			.on('Ctrl+C', copyCurrentSelection)
			.on('Ctrl+P', pasteCurrentSelection)
			.on('Ctrl+Plus', function() {
				$scope.zoom *= 1.2;
			})
			.on('Ctrl+Minus', function() {
				$scope.zoom /= 1.2;
			});
			
		$scope.$on('$destroy', function() {
			shortcuts.offAll(); // cleanup when scope is destroyed
		});
	});

## Scoped Shortcuts Manager

You can also attach Shortcuts Manager to a specific DOM element, or even create several Shortcuts Manager
for different parts of your application. This is best done with directives, because there we can legally
access DOM elements.

Example:

	angular.directive('panelKbd', function(mkShortcutsFactory) {
	
		return {
			restrict: 'A',
			scope: true,
			link: function(scope, elm, attr) {
				
				scope.kbd = mkShortcutsFactory(elm); // attach only to this element
				
				scope.$on('$destroy', function() {
					scope.kbd.close(); // cleanup when we navigate away
				}); 
			}
		};
	});

Now you have `kbd` object in directive's scope. This and any nested scopes can use it to register shortcuts, like this:

	app.controller('MyCtrl', function($scope, kbd) {
		
		var shortcuts = $scope.kbd.shortcuts()
			.on('Ctrl+C', copyCurrentSelection)
			.on('Ctrl+P', pasteCurrentSelection);
			
		$scope.$on('$destroy', function() {
			shortcuts.offAll(); // cleanup when scope is destroyed
		});
	});
	
## API

### Factory API

Function `mkShortcutsFactory` takes two optional parameters:

1. elt - the DOM element where listeners are attached. If undefined or null, window's `document` will be used as event source. 
         This effectively makes it listen on the page-wide events.

2. opts - options that control Shortcuts behavior. Valid options are:

	* `type`          - can be 'keyup' or 'keydown'. This controls when events are emitted. Default is 'keydown'.

	* `propagate`     - true/false. Default is false (prevents recognized event from bubbling up).

	* `inputDisabled` - true/false. Set it to true to suppress shortcut firing when focus is in INPUT or TEXTAREA. Default
	                    is false (that fires events regardless).

Calling factory function creates an instance of Shortcuts Manager.

### Shortcuts Manager API

Shortcuts Manager has the following members:

1. `shortcuts()` - call this function to create a new Shortcuts bag.

2. `currentMods` - an object that contains the current state of keyboard modifiers. Members are:

	* `ctrl`  - true if Ctrl key is currently pressed.
	* `alt`   - true if Alt key is currently pressed.
	* `shift` - true if Shift key is currently pressed.
	* `meta`  - true if Meta key is currently pressed.

3. `close()` - call this to close Shortcuts Manager. This detaches listeners that were attached at the time of creation (to keep
               track of the current modifier states).
             
### Shortcuts API

Shortcuts object has the following methods:

1. `on(keyName, handler, [opts])` - registers handler for the shortcut with name keyName. Options can be adjusted if needed
                                    (see documentation for the opts parameter of mkShortcutsFactory'.

2. `offAll()` - unregisters all shortcuts registered with this object. Note that it is not possible to selectively unregister
                shortcuts. If you need to manage life span of different shortcuts differently, just create a separate Shortcuts
                object for each such set.
	
## Key Name Syntax

Shortcut key combination should be a string that optionally starts with a set of modifiers. Separator is
symbol `+`. Key label must be the last (or only) part of the name. Order of modifiers does not matter.
Case of the key name does not matter.

Example of valid shortcut names:
	
	Ctrl+U
	Alt+Ctrl+Z
	X
	PageDown

Example of invalid shortcut names:
	
	Del    (use Delete)
	U+Ctrl (key must be the last shortcut part)
	XX     (no such key)

Following modifiers are recognized:

* Ctrl
* Alt
* Shift
* Meta

Here is the list of recognized Keys:

* A-Z
* 0-1
* F1-F12
* Esc
* Return, Enter
* Tab
* Backspace
* Insert
* Home
* Delete
* PageUp
* PageDown
* Up
* Down
* Left
* Right
* ScrollLock
* NumLock
* CapsLock
* Pause, Break
* Backtick
* Minus
* Plus
* [
* ]
* ;
* '
* ,
* .
* /
* Pad0-Pad9 (these are numeric keys on the numeric pad)
* PadMinus
* PadPlus
* Pad/
* Pad*
 
## License
MIT
