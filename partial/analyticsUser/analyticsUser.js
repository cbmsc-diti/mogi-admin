/* global google, moment */
/*
* The video element handled here is not Angular-Way. I was in doubt of creating a directive from the video tag but so far
* I'll keep like this. The same applies to the flowplayer in the live map.
*/
angular.module('mogi-admin').controller('AnalyticsUserCtrl',function($scope, $routeParams, $http, ServerUrl){
  var userId = $routeParams.id,
      currentPositionMarker = new google.maps.Marker({
        position : new google.maps.LatLng(0,0)
      }),
      video = angular.element(document.getElementById('video'));
  var heatmap = null;
  $scope.videos = [];
  $scope.locations = [];
  $scope.currentVideo = null;
  $scope.currentDate = ($routeParams.date) ? moment($routeParams.date).toDate() : new Date();
  $scope.sliderFrom = moment($scope.currentDate).hour(0).minute(0).seconds(0).valueOf();
  $scope.sliderTo = moment($scope.currentDate).hour(23).minute(59).seconds(59).valueOf();

  $scope.mapOptions = {
    center: new google.maps.LatLng(0,0),
    zoom: 11,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  $scope.$watch('currentDate', function(newVal) {
    if (newVal) {
      $scope.skipTime();
    }
  });

  $scope.formatTime = function (value) {
    var hour = value / 60;
    var minutes = value % 60;

    return hour + ':' + minutes;
  };

  $scope.loadData = function() {
    var date = moment($scope.currentDate).format('YYYY-MM-DD');
    $http.get(ServerUrl + '/users/' + userId + '/videos/from/' + date )
      .success(function(data) {
        $scope.videos = data;
        if ( $scope.videos.length > 0 ) {
          $scope.currentVideo = $scope.videos[0];
          $scope.currentDate = $scope.videos[0].from;
          $scope.skipTime();
        }
      });

    $http.get(ServerUrl + '/users/' + userId + '/locations/' + date )
      .success(function(data) {

        if (data === undefined || data.length === 0 ){
            $scope.locations = [];
            if(!!navigator.geolocation) {

                navigator.geolocation.getCurrentPosition(function(position) {

                    var geolocate = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

                    $scope.locationMap.setCenter(geolocate);
                    if (heatmap != null){
                        heatmap.setMap(null);
                    }
                });
            }
            return;
        }
        $scope.locations = data;
        var pos = new google.maps.LatLng($scope.locations[0].lat, $scope.locations[0].lng);
        currentPositionMarker.setPosition(pos);
        currentPositionMarker.setMap($scope.locationMap);

        var path = [];
        var bounds = new google.maps.LatLngBounds(), coordLast = null;
        angular.forEach($scope.locations, function(loc) {
            var coord = new google.maps.LatLng(loc.lat, loc.lng);
//            var marker = new google.maps.Marker({
//                map: $scope.locationMap,
//                position: coord
//            });
            if (coordLast != null){
                var rulerpoly = new google.maps.Polyline({
                    path: [coordLast, coord] ,
                    strokeColor: "#FFFF00",
                    strokeOpacity: 0.7,
                    strokeWeight: 8
                });
                rulerpoly.setMap($scope.locationMap);
            }
            path.push(coord);
            bounds.extend(coord);
            coordLast = coord;
        });
//        if (heatmap == null){
//            heatmap = new google.maps.visualization.HeatmapLayer({
//              data: path
//            });
//        } else {
//            heatmap.setData(path);
//        }
//        heatmap.setMap($scope.locationMap);
        $scope.locationMap.fitBounds(bounds);
        $scope.locationMap.setCenter(pos);
      });
  };

  $scope.showVideo = function(video) {
    $scope.currentVideo = video;
  };

  $scope.skipTime = function() {
    var isoDate = moment($scope.currentDate).toISOString(), location;
    var video = _.find($scope.videos, function (video) {
      return isoDate >= video.from && isoDate <= video.to;
    });

    if ( video ) {
      $scope.currentVideo = video;
    }

    _.some($scope.locations, function(loc) {
      if ( loc.date >= isoDate ) {
        location = loc;
        return true;
      }
      return false;
    });

    if ( location ) {
      currentPositionMarker.setMap($scope.locationMap);
      currentPositionMarker.setPosition(new google.maps.LatLng(location.lat, location.lng));
    } else {
      currentPositionMarker.setMap(null);
    }
  };

  var isPlaying = false;

  video
    .on('play', function() {
      isPlaying = true;
    }).on('pause', function() {
      isPlaying = false;
    }).on('timeupdate', function(ev) {
      console.log(ev);
    });
  if ($routeParams.date) {
    $scope.loadData();
  }
});
