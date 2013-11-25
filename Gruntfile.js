module.exports = function(grunt) {

	grunt.initConfig({
		
		pkg : grunt.file.readJSON('package.json'),
		
		uglify : {
			options : {
				banner : '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
			},
			dist : {
				files : {
					'dist/<%= pkg.name %>.min.js' : [ 'src/mk-shortcuts.js' ]
				}
			}
		},
		
		jshint : {
			files : [ 'Gruntfile.js', 'src/**/*.js', 'specs/**/*.js' ],
			options : {
				globals : {
					jQuery : true,
					console : true,
					module : true,
					document : true
				}
			}
		},
		
		jasmine : {
			src : 'src/**/*.js',

			options : {
				specs : 'specs/**/*spec.js',
				vendor : [
						'http://ajax.googleapis.com/ajax/libs/angularjs/1.2.2/angular.min.js',
						'http://ajax.googleapis.com/ajax/libs/angularjs/1.2.2/angular-mocks.js' ],

			// keepRunner: true,
			// outfile: 'runner.html'
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-jasmine');

	grunt.registerTask('test', [ 'jshint', 'jasmine' ]);

	grunt.registerTask('default', [ 'test', 'uglify' ]);

};
