angular.module('mogi-admin', ['ngRoute','ngAnimate','ui.bootstrap','ui.map','http-auth-interceptor', 'angular-jwplayer' , 'toaster']);

//angular.module('mogi-admin').constant('ServerUrl', 'http://projectmogi.com');
angular.module('mogi-admin').constant('ServerUrl', 'http://localhost:3000');

angular.module('mogi-admin')
.config(['$routeProvider','$httpProvider', function($routeProvider, $httpProvider) {

    $routeProvider.
	  when('/',{templateUrl: 'partial/home/home.html'}).
	  when('/analytics',{templateUrl: 'partial/analytics/analytics.html'}).
	  when('/analytics/:id',{templateUrl: 'partial/analyticsUser/analyticsUser.html'}).
	  /* Add New Routes Above */
      when('/analytics/:id/date/:date',{templateUrl: 'partial/analyticsUser/analyticsUser.html'}).
      when('/user-list', {templateUrl: 'partial/users/user-list.html', controller: 'UserListCtrl'}).
      when('/user-detail/:id', {templateUrl: 'partial/users/user-detail.html', controller: 'UserDetailCtrl'}).
      when('/user-creation', {templateUrl: 'partial/users/user-creation.html', controller: 'UserCreationCtrl'}).
      otherwise({redirectTo:'/'});

    $httpProvider.interceptors.push(['$q', function ($q) {
        return {
            'response': function (response) {
                return response;
            },
            'responseError': function (rejection) {
                if(rejection.status === 401 && rejection.config.url.indexOf('token') >-1) {
                    //dunno why
                    if($q.responseError){
                        return $q.responseError(rejection);
                    }
                }
                return $q.reject(rejection);
            }
        };
    }]);

}]);

angular.module('mogi-admin').run(function($rootScope, loginService, socket) {
    $rootScope.$on("event:auth-loginRequired", function(data) {
        loginService.show();
    });

    if ( !loginService.isAuthenticated() ) {
        loginService.show();
    } else {
        socket.connect(loginService.getToken());
    }

    $rootScope.safeApply = function(fn) {
        var phase = $rootScope.$$phase;
        if (phase === '$apply' || phase === '$digest') {
            if (fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };

});
