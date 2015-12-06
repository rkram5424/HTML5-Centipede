module.exports = function(grunt){
  grunt.initConfig({
    watch: {
      files: ["**/*.*"],
      options: {
        livereload: true
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
}
