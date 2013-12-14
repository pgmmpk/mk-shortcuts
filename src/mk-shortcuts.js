// loosely based on http://jsfiddle.net/firehist/nzUBg/ and references therein
(function(angular) {
	'use strict';

	var module = angular.module('mkShortcuts', []);

	/**
	 * Default configuration for Shortcuts Factory. Options are:
	 * 
	 *      * type {'keyup'|'keydown'} defines what causes event to be fired. Default is 'keydown'.
	 *      * propagate {boolean}      set to true to make keyboard events bubble up. Default is false.
	 *      * inputDisabled {boolean}  set to true if you do not want to catch events when 
	 *                                      focus is in INPUT or in TEXTAREA
	 */
	module.constant('mkShortcutsConfig', {
		'type'          : 'keydown', // when event is fired
		'propagate'     : false,     // do we want event to bubble up?
		'inputDisabled' : false      // generate events even when focus is in INPUT or TEXTAREA element
	});

	function detachEvent(elt, name, callback) {

		if (elt.removeEventListener) {
			elt.removeEventListener(name, callback, false);
		} else if (elt.detachEvent) {
			elt.detachEvent('on' + name, callback);
		} else {
			throw new Error('do not know how to detach event from dom element' + elt);
		}
	}

	function attachEvent(elt, name, callback) {

		if (elt.addEventListener) {
			elt.addEventListener(name, callback, false);
		} else if (elt.attachEvent) {
			elt.attachEvent('on' + name, callback);
		} else {
			throw new Error('do not know how to attach event to dom element' + elt);
		}
	}

	function parseMods(mods) {

		var out = {
			ctrl  : false,
			shift : false,
			alt   : false,
			meta  : false
		};

		for ( var i in mods) {

			switch (mods[i].toLowerCase()) {

			case 'ctrl':
				out.ctrl = true;
				break;

			case 'alt':
				out.alt = true;
				break;

			case 'shift':
				out.shift = true;
				break;

			case 'meta':
				out.meta = true;
				break;

			default:
				throw new Error('Unrecognized modifier: "' + mods[i] +
						'", expected one of "Ctrl", "Alt", "Shift", "Meta"');
			}
		}

		return out;
	}

	function parseKey(label) {

		var code = codemap[label.toLowerCase()];

		if (!code) {
			throw new Error(
					'Unrecognized key: "' + label +
							'". For the list of valid key names, visit https://github.com/pgmmpk/mk-shortcuts/blob/master/README.md#key-name-syntax');
		}

		return code;
	}

	/**
	 * This service allows one to instantiate a Shortcuts Manager, attaching it to an arbitrary DOM
	 * element.
	 *
	 * For example:
	 *      $scope.kb = mkShortcutsFactory(elm);
	 *
	 *      $scope.$on('$destroy', function() {
	 *          $scope.kb.close();
	 *      });
	 *
	 * Note how we take care to detach shortcuts manager on scope $destroy event.
	 *
	 * Once you have a shortcuts manager object (like $scope.kb above), you can use it to register shortcut listeners:
	 *
	 *      var shortcuts = $scope.kb.shortcuts()
	 *                          .on('PageUp', prevPage)
	 *                          .on('PageDown', nextPaqe)
	 *                          .on('Ctrl+Home', firstPage)
	 *                          .on('Ctrl+End', lastPage)
	 *                          .on('Ctrl+Plus', zoomIn)
	 *                          .on('Ctrl+Minus', zoomOut);
	 *
	 * Shortcuts object also allows you to release all registered shortcuts in one sweep, like this:
	 *
	 *      $scope.$on('$destroy', function() {
	 *          
	 *          shortcuts.offAll();
	 *      });
	 *
	 * Typically, shortcut manager will be created by a service. Controllers and directives can use this service
	 * to register shortcuts. Such "global" shortcuts manager will be attached to $window's document element and receive
	 * keyboard events from the whole page.
	 * 
	 * Alternatively, you can create a shortcuts manager attaching it to a particular DOM element (you can also have several
	 * shortcuts managers, for different parts of your page). In this case creation of shortcuts manager happens in a directive and
	 * manager is exposed as a scope property. All nested scopes can use it to create shortcuts.
	 *
	 * Additionally, Shortcuts manager exposes 'currentMods' member that contains the current state of
	 * keyboard modifiers.
	 */
	module.factory('mkShortcutsFactory', ['$window', '$timeout', 'mkShortcutsConfig',
												function($window, $timeout, mkShortcutsConfig) {

		return function(elm, opts) {

			var target = elm || $window.document;
			if (typeof target === 'string') {
				target = $window.document.getElementById(elm);
				if (!target) {
					throw new Error('Could not locate target node with id "' + elm + '"');
				}
			} else if (target.length) {
				target = target[0]; // unwrap angular jqLite
			}

			var config = angular.extend({}, mkShortcutsConfig, opts);

			var currentMods = parseMods([]);

			function updateCurrentMods(evt) {
				evt = evt || $window.event;

				//console.log('updateCurrentMods:', evt);
				currentMods.ctrl  = evt.ctrlKey;
				currentMods.alt   = evt.altKey;
				currentMods.shift = evt.shiftKey;
				currentMods.meta  = evt.metaKey;
			}

			var Shortcuts = function() {
				this.currentMods = currentMods;
			};

			Shortcuts.prototype.on = function(key, callback, opts) {

				opts = angular.extend({}, config, opts);

				var parts = key.split('+');
				var expectedMods = parseMods(parts.slice(0, parts.length - 1));
				var expectedCode = parseKey(parts[parts.length - 1]);

				var handler = function(evt) {
					evt = evt || $window.event;

					//console.log('evt:', evt);
					//console.log('expectedCode:', expectedCode);

					// Disable event handler when focus is in input or textarea
					if (opts.inputDisabled) {
						var elt = evt.target || evt.srcElement;
						if (elt.nodeType === 3)
							elt = elt.parentNode;
						if (elt.tagName === 'INPUT' || elt.tagName === 'TEXTAREA') return;
					}

					var keyCode = evt.keyCode || evt.which;
					//console.log('keyCode:', keyCode, expectedMods);
					if (keyCode            !== expectedCode || 
						expectedMods.ctrl  !== evt.ctrlKey  || 
						expectedMods.alt   !== evt.shiftKey || 
						expectedMods.shift !== evt.altKey   || 
						expectedMods.meta  !== evt.metaKey) return;

					$timeout(function() {
						callback(evt);
					});

					if (!opts.propagate) { // Stop the event
						// evt.cancelBubble is supported by IE - this will kill the bubbling process.
						evt.cancelBubble = true;
						evt.returnValue = false;

						// evt.stopPropagation works in Firefox.
						if (evt.stopPropagation) {
							evt.stopPropagation();
							evt.preventDefault();
						}

						return false;
					}
				};

				attachEvent(target, opts.type, handler);

				var chain = this._offAll;
				this._offAll = function() {
					detachEvent(target, opts.type, handler);

					if (chain) chain();
				};

				return this;
			};

			Shortcuts.prototype.offAll = function() {
				if (this._offAll) {
					this._offAll();
					delete this._offAll;
				}
			};

			attachEvent(target, 'keyup', updateCurrentMods);
			attachEvent(target, 'keydown', updateCurrentMods);

			return {

				close : function() {
					detachEvent(target, 'keyup', updateCurrentMods);
					detachEvent(target, 'keydown', updateCurrentMods);
				},

				currentMods : currentMods,

				shortcuts : function() {
					return new Shortcuts();
				}
			};
		};
	}]);
	
	module.factory('mkShortcutsManager', ['mkShortcutsFactory', function(mkShortcutsFactory) {
		return mkShortcutsFactory();
	}]);
	
	module.directive('mkShortcutsAs', ['mkShortcutsFactory', 'mkShortcutsConfig', 
										function(mkShortcutsFactory, mkShortcutsConfig) {
		return {
			restrict: 'A',
			scope: true,
			link: function(scope, elm, attr) {
				scope[attr.mkShortcutsAs] = mkShortcutsFactory(elm, {
					type      : attr.type || mkShortcutsConfig.type,
					propagate : attr.propagate || mkShortcutsConfig.propagate,
					inputDisabled : attr.inputDisabled || mkShortcutsConfig.inputDisabled
				});
			}
		};
	}]);

	var codemap = {
		'esc'         : 27,

		'f1'          : 112,
		'f2'          : 113,
		'f3'          : 114,
		'f4'          : 115,
		'f5'          : 116,
		'f6'          : 117,
		'f7'          : 118,
		'f8'          : 119,
		'f9'          : 120,
		'f10'         : 121,
		'f11'         : 122,
		'f12'         : 123,

		'tab'         :   9,
		'return'      :  13,
		'enter'       :  13,
		'backspace'   :   8,

		'scrlolllock' : 145,
		'capslock'    :  20,
		'numlock'     : 144,

		'pause'       :  19,
		'break'       :  19,

		'insert'      :  45,
		'home'        :  36,
		'delete'      :  46,
		'end'         :  35,

		'space'       :  32,
		'pageup'      :  33,
		'pagedown'    :  34,

		'left'        :  37,
		'up'          :  38,
		'right'       :  39,
		'down'        :  40,

		'a'           :  65,
		'b'           :  66,
		'c'           :  67,
		'd'           :  68,
		'e'           :  69,
		'f'           :  70,
		'g'           :  71,
		'h'           :  72,
		'i'           :  73,
		'j'           :  74,
		'k'           :  75,
		'l'           :  76,
		'm'           :  77,
		'n'           :  78,
		'o'           :  79,
		'p'           :  80,
		'q'           :  81,
		'r'           :  82,
		's'           :  83,
		't'           :  84,
		'u'           :  85,
		'v'           :  86,
		'w'           :  87,
		'x'           :  88,
		'y'           :  89,
		'z'           :  90,

		'0'           :  48,
		'1'           :  49,
		'2'           :  50,
		'3'           :  51,
		'4'           :  52,
		'5'           :  53,
		'6'           :  54,
		'7'           :  55,
		'8'           :  56,
		'9'           :  57,

		'pad0'        :  96,
		'pad1'        :  97,
		'pad2'        :  98,
		'pad3'        :  99,
		'pad4'        : 100,
		'pad5'        : 101,
		'pad6'        : 102,
		'pad7'        : 103,
		'pad8'        : 104,
		'pad9'        : 105,
		'padminus'    : 109,
		'padplus'     : 107,
		'pad/'        : 111,
		'pad*'        : 106,

		'backtick'    : 192,
		'minus'       : 189,
		'plus'        : 187,
		'['           : 219,
		']'           : 221,
		';'           : 186,
		'\''          : 222,
		','           : 188,
		'.'           : 190,
		'/'           : 191
	};

})(angular);