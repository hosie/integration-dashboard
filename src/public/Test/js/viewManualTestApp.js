(function(){
  var testApp = angular.module("ManualTestApp",['ngRoute','iibWidgets']);
  testApp.config(function($routeProvider){
    $routeProvider
    .when('/flowStats',
          {
            templateUrl:'/Test/partials/flowStats.html'
          })
    .when('/sunBurst',
          {
            templateUrl:'/Test/partials/sunBurst.html'
          })
	.otherwise({redirectTo:'/'});
  });
  testApp.controller("MainController",function(){
   
  });


})();
