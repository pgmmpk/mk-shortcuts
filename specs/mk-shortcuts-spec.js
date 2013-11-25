describe('mkShortcuts module', function() {
	'use strict';

	var mkShortcutsFactory, mockElement;

	beforeEach(function() {
		
		module('mkShortcuts');
		
		inject(function($injector) {
			mkShortcutsFactory = $injector.get('mkShortcutsFactory');
		});

		mockElement = {
			addEventListener   : jasmine.createSpy(),
			removeEventListener: jasmine.createSpy()
		};
	});

	it('should attach keydown and keyup listeners', function() {
		
		var kb = mkShortcutsFactory(mockElement);
		
		expect(mockElement.addEventListener).toHaveBeenCalled();
		expect(mockElement.removeEventListener).not.toHaveBeenCalled();

		mockElement.addEventListener.reset();
		mockElement.removeEventListener.reset();

		kb.close();
		
		expect(mockElement.addEventListener).not.toHaveBeenCalled();
		expect(mockElement.removeEventListener).toHaveBeenCalled();
	});

	it('should obey config "type" when attaching listeners', function() {
		
		var kb = mkShortcutsFactory(mockElement, {type: 'keyup'});
		mockElement.addEventListener.reset();
		mockElement.removeEventListener.reset();
		
		var shortcut = kb.shortcuts().on('A', function() {});

		expect(mockElement.addEventListener).toHaveBeenCalled();

		mockElement.addEventListener.reset();
		mockElement.removeEventListener.reset();
		
		shortcut.offAll();
		expect(mockElement.removeEventListener).toHaveBeenCalled();
	});
});