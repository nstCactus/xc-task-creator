/**
 * @file
 * Track module for the task creator.
 */
define(['app/helper'], function (helper) {

  var Track = function (info) {
    this.points = info.points;
    this.filename = info.filename;
    this.polyline;
    this.color = helper.randomColor(true);

    var color = this.color;
    var coords = [];
    for (var i = 0; i < this.points.length; i++) {
      coords.push(new google.maps.LatLng(this.points[i].x, this.points[i].y));
    }
    this.polyline = new google.maps.Polyline({
      path: coords,
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 1.0,
      strokeWeight: 2
    });

    google.maps.event.addListener(this.polyline, 'click', function (evt) {
      color = helper.randomColor(true);
      this.setOptions({
        strokeColor: color,
      });

      var e = document.createEvent("CustomEvent");
      e.initCustomEvent('rebuildTask', false, false, {});
      document.dispatchEvent(e);
    });

    this.drawPolyline = function (map, google) {
      this.polyline.setMap(map);
    }



  }

  return Track;
});
