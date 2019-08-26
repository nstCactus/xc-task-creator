/**
 * @file.
 * Task optimiser module for the task creator.
 */
define(["app/param"], function (param) {
  // Fast Polyline
  var fastTrack;
  var optimizedMarkers = [];
  var fastWaypoints = new Array();
  var fastDistance = 0;
  var distances = [];


  let optimizeTask = function (google, map, turnpoints) {
    var headings = [];
    fastWaypoints = [];
    fastDistance = 0;
    distances = [];

    checkStartDirection(google,turnpoints);

    // Pushing center of first turnpoint as a fastWaypoint. 
    if (turnpoints.length > 0) {
      fastWaypoints.push(turnpoints[0].latLng);
    }

    // Looping turnpoints.
    for (var i = 0; i < turnpoints.length; i++) {
      var one = fastWaypoints[fastWaypoints.length - 1];  // last one
      var two = null;
      var three = null;

      var heading = null;

      if (turnpoints[i + 1]) {
        two = turnpoints[i + 1];
      }
      else {
        // There is only one turnpoint. Nothing to do.
        var tp = turnpoints[turnpoints.length - 1];
        fastWaypoints.push(tp.latLng);
        //incrementDistance(google, fastWaypoints);

        break;
      }

      if (turnpoints[i + 2]) {
        three = turnpoints[i + 2];
      } else {
        // If there is no turnpoints 3 then act as if 3 was again a turnpoint 2.
        three = two;
      }

      console.log("two.name",two.name);
      console.log("three.name",three.name);


      // Detecting flat lines.
      //if (one.equals(two.latLng) && two.latLng.equals(three.latLng) && one.equals(three.latLng)) {
        // Extreme case. Depend where to go next or any heading can be accepted.
        //fastWaypoints.push(three.latLng);
        //incrementDistance(google, fastWaypoints);
      //}

      if (one.equals(two.latLng) || two.latLng.equals(three.latLng  )) {
        //One and two are the same or two and three are the same. Take heading from three to one.
          heading = google.maps.geometry.spherical.computeHeading(three.latLng, one);
          var fastPoint = google.maps.geometry.spherical.computeOffset(two.latLng, two.radius, heading);
          fastWaypoints.push(fastPoint);
          console.log("fastWaypoints alligbned");
          continue;
        //console.log(heading);
      }
      else if (one.equals(three.latLng)) {
        // One and three are the same take heading from two to one.
        heading = google.maps.geometry.spherical.computeHeading(two.latLng, one);
        var fastPoint = google.maps.geometry.spherical.computeOffset(two.latLng, two.radius, heading);
        fastWaypoints.push(fastPoint);
        console.log("fastWaypoints alligbned");
        continue
        //console.log(heading);
      }
      else if ( two.type == 'start'  ) {
        heading = google.maps.geometry.spherical.computeHeading(three.latLng, one);
        //var fastPoint = google.maps.geometry.spherical.computeOffset(three.latLng, two.radius, heading);
        var fastPoint = calcStartIntersection(google, three,  two , heading )
        if ( fastPoint != null ) {
          fastWaypoints.push(fastPoint);
          console.log("fastWaypoints alligbned");
          continue;
        }

      }


      // if (heading) {
      //   var fastPoint = google.maps.geometry.spherical.computeOffset(two.latLng, two.radius, heading);
      //   fastWaypoints.push(fastPoint);
      //   console.log("fastWaypoints alligbned");
      //   //incrementDistance(google, fastWaypoints);
      //   continue;
      // }

      // Now for most regular triangle situation.
      // Go for some bissectrix hack...
      var aHeading = google.maps.geometry.spherical.computeHeading(two.latLng, one);
      var bHeading = google.maps.geometry.spherical.computeHeading(two.latLng, three.latLng);
      // Getting the angle difference between two headings.
      var angle = Math.min((aHeading - bHeading + 360) % 360, (bHeading - aHeading + 360) % 360);
      // Getting the bissectrix heading.
      var legHeading;
      //var test;
      if (((aHeading - bHeading + 360) % 360) > ((bHeading - aHeading + 360) % 360)) {
        // We're going counter clockwise
        //test = 'counterclock';
        legHeading = aHeading + (angle * 0.5);
        if (legHeading > 180) {
          legHeading = 360 - legHeading;
        }
      } else {
        // Go Clockwise.
        //test = 'clock';
        legHeading = aHeading - (angle * 0.5);
        if (legHeading < -180) {
          legHeading = legHeading + 360;
        }
      }
      //console.log(two.wp.name, aHeading, bHeading,  angle, legHeading, test);
      // Calculating bissectrix length (2 * AB * Cos(two/2)) / (A+B).
      var aDistance = google.maps.geometry.spherical.computeDistanceBetween(one, two.latLng);
      var bDistance = google.maps.geometry.spherical.computeDistanceBetween(two.latLng, three.latLng);
      var leg = (2 * aDistance * bDistance * Math.cos((angle * 0.5) * (Math.PI / 180))) / (aDistance + bDistance);
      var middlePoint = google.maps.geometry.spherical.computeOffset(two.latLng, leg, legHeading);
      // Choosing beetween this length or radius length.
      var minLeg = Math.min(leg, two.radius);
      // Finally getting the fastPoint. Projecting the bissectrix.
      var fastPoint = google.maps.geometry.spherical.computeOffset(two.latLng, minLeg, legHeading);
      // Storing this hardly gained fastPoint.
      fastWaypoints.push(fastPoint);
      //incrementDistance(google, fastWaypoints);



    }

    var lineSymbol = {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
    };




    if (fastTrack) fastTrack.setMap(null);
    fastTrack = new google.maps.Polyline({
      path: fastWaypoints.slice(0,-1),
      geodesic: true,
      strokeColor: param.task.courseColor.fast,
      strokeOpacity: 1.0,
      strokeWeight: 2,
      icons: [{
        icon: lineSymbol,
        offset: '0',
        repeat: '100px'
      }],
      map: map,
    });


    var markerImage = new google.maps.MarkerImage('https://maps.google.com/mapfiles/kml/shapes/placemark_circle.png',
      new google.maps.Size(32, 32),
      new google.maps.Point(0, 0),
      new google.maps.Point(16, 16));

    for ( var i=0; i<100;i++) {
      if (optimizedMarkers[i]) optimizedMarkers[i].setMap(null);
    }

    for (var i=0; i<fastWaypoints.length-1;i++) {
      optimizedMarkers[i] = new google.maps.Marker({
        position: fastWaypoints[i],
        map: map,
        icon: markerImage
      });
    }

  
    recalcDistance(google, fastWaypoints);

    return {
      distance: fastDistance,
      distances: distances,
      fastWaypoints: fastWaypoints,
    }
  }






  function calcStartIntersection(google, three,  two , heading ) {
    var dist = three.radius;
    var fastPoint;
    var n = 0;
    while (n < 10000) {
      n++;
      fastPoint = google.maps.geometry.spherical.computeOffset(three.latLng, dist, heading);
      var distance = google.maps.geometry.spherical.computeDistanceBetween(two.latLng,fastPoint);
      if ( two.mode == "entry" && distance >= two.radius) {
        return fastPoint;
      }
      if ( two.mode == "exit" && distance <= two.radius) {
        return fastPoint;
      } 
      dist +=10;
    }
     
    return null;

  }


  function checkStartDirection(google ,turnpoints) {

    var startIndex = -1;
    for (var i=0; i < turnpoints.length; i++ ) {
      if ( turnpoints[i].type == "start" ) {
        startIndex = i;
        break;
      }
    }
    if ( startIndex == -1 || startIndex == turnpoints.length-1) {
      return;
    }
    var distance = google.maps.geometry.spherical.computeDistanceBetween(turnpoints[startIndex].latLng,turnpoints[startIndex+1].latLng);
    if ( distance > turnpoints[startIndex].radius ) {
      turnpoints[startIndex].mode = 'exit';
    }
    else {
      turnpoints[startIndex].mode = 'entry';

    }

  }















  //
  //  Versione better
  //

  let optimize2 = function (google, map, turnpoints) {
    var headings = [];
    fastWaypoints = [];
    fastDistance = 0;
    distances = [];




    // Pushing center of first turnpoint as a fastWaypoint. 
    if (turnpoints.length > 0) {
      fastWaypoints.push(turnpoints[0].latLng);
    }

    // Looping turnpoints.
    for (var i = 0; i < turnpoints.length; i++) {
      var one = fastWaypoints[fastWaypoints.length - 1];
      //console.log(fastWaypoints.length,one);
      var two = null;
      var three = null;

      var heading = null;

      if (turnpoints[i + 1]) {
        two = turnpoints[i + 1];
      }
      else {
        // There is only one turnpoint. Nothing to do.
        var tp = turnpoints[turnpoints.length - 1];
        fastWaypoints.push(tp.latLng);
        //incrementDistance(google, fastWaypoints);

        // var marker = new google.maps.Marker({
        //   position: tp.latLng,
        //   map: map,
        //   title: 'Hello World!'
        // });
        break;
      }

      if (turnpoints[i + 2]) {
        three = turnpoints[i + 2];
      } else {
        // If there is no turnpoints 3 then act as if 3 was again a turnpoint 2.
        three = two;
      }

      // Detecting flat lines.
      if (one.equals(two.latLng) && two.latLng.equals(three.latLng) && one.equals(three.latLng)) {
        // Extreme case. Depend where to go next or any heading can be accepted.
        //fastWaypoints.push(three.latLng);
        //incrementDistance(google, fastWaypoints);
      }

      if (one.equals(two.latLng) || two.latLng.equals(three.latLng)) {
        //One and two are the same or two and three are the same. Take heading from three to one.
        heading = google.maps.geometry.spherical.computeHeading(three.latLng, one);
        //console.log(heading);
      }

      if (one.equals(three.latLng)) {
        // One and three are the same take heading from two to one.
        heading = google.maps.geometry.spherical.computeHeading(two.latLng, one);
        //console.log(heading);
      }

      if (heading) {
        var fastPoint = google.maps.geometry.spherical.computeOffset(two.latLng, two.radius, heading);
        fastWaypoints.push(fastPoint);
        //incrementDistance(google, fastWaypoints);
        continue;
      }

      // Now for most regular triangle situation.
      // Go for some bissectrix hack...
      var aHeading = google.maps.geometry.spherical.computeHeading(two.latLng, one);
      var bHeading = google.maps.geometry.spherical.computeHeading(two.latLng, three.latLng);
      // Getting the angle difference between two headings.
      var angle = Math.min((aHeading - bHeading + 360) % 360, (bHeading - aHeading + 360) % 360);
      // Getting the bissectrix heading.
      var legHeading;
      //var test;
      if (((aHeading - bHeading + 360) % 360) > ((bHeading - aHeading + 360) % 360)) {
        // We're going counter clockwise
        //test = 'counterclock';
        legHeading = aHeading + (angle * 0.5);
        if (legHeading > 180) {
          legHeading = 360 - legHeading;
        }
      } else {
        // Go Clockwise.
        //test = 'clock';
        legHeading = aHeading - (angle * 0.5);
        if (legHeading < -180) {
          legHeading = legHeading + 360;
        }
      }
      //console.log(two.wp.name, aHeading, bHeading,  angle, legHeading, test);
      // Calculating bissectrix length (2 * AB * Cos(two/2)) / (A+B).
      var aDistance = google.maps.geometry.spherical.computeDistanceBetween(one, two.latLng);
      var bDistance = google.maps.geometry.spherical.computeDistanceBetween(two.latLng, three.latLng);
      var leg = (2 * aDistance * bDistance * Math.cos((angle * 0.5) * (Math.PI / 180))) / (aDistance + bDistance);
      var middlePoint = google.maps.geometry.spherical.computeOffset(two.latLng, leg, legHeading);
      // Choosing beetween this length or radius length.
      var minLeg = Math.min(leg, two.radius);
      // Finally getting the fastPoint. Projecting the bissectrix.
      var fastPoint = google.maps.geometry.spherical.computeOffset(two.latLng, minLeg, legHeading);
      // Storing this hardly gained fastPoint.
      fastWaypoints.push(fastPoint);
      //incrementDistance(google, fastWaypoints);



      // Debugging block. Displaying middle point on map
      /*
      var wp = {
        name : 'custom',
        id : 'M ' ,
        x :	middlePoint.lat(),
        y : middlePoint.lng(),
        z : 0,
        filename : 'middlePoints',
      };
      waypoints.insert(wp);
    */

    }

    var lineSymbol = {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
    };

    //console.log("fastWaypoints ", fastWaypoints);

    if (fastTrack) fastTrack.setMap(null);
    fastTrack = new google.maps.Polyline({
      path: fastWaypoints.slice(0,-1),
      geodesic: true,
      strokeColor: param.task.courseColor.fast,
      strokeOpacity: 1.0,
      strokeWeight: 2,
      icons: [{
        icon: lineSymbol,
        offset: '0',
        repeat: '100px'
      }],
      map: map,
    });

    recalcDistance(google, fastWaypoints);

    return {
      distance: fastDistance,
      distances: distances,
      fastWaypoints: fastWaypoints,
    }
  }










  //
  //   Versione meteo
  // 

  let optimize1 = function (google, map, turnpoints) {
    var headings = Array();
    fastWaypoints = Array();
    fastDistance = 0;
    distances = [];
    for (var i = 0; i < turnpoints.length; i++) {
      // For all turnpoint except the last one.
      if (i < turnpoints.length - 1) {
        // Getting the heading.
        var currentlatLng = turnpoints[i].latLng;
        var nextlatLng = turnpoints[i + 1].latLng;
        var heading = google.maps.geometry.spherical.computeHeading(currentlatLng, nextlatLng);
        //console.log("Heading1 " + heading);
        // Unsure heading is always positive.
        if (heading < 0) heading += 360;
        if (headings.length >= 1) {
          // Switch first heading from 180°.
          var pastHeading = headings[i - 1];

          // We need to catch the right angle !!!
          if (pastHeading > heading) {
            pastHeading -= 180;
          } else {
            pastHeading += 180;
          }

          // Now we can get the average heading. (Bisectrix).
          var middleHeading = (pastHeading + heading) / 2;

          // If both turnpoints are the same. Keep past heading instead of 0.
          if (currentlatLng.equals(nextlatLng)) {
            middleHeading = pastHeading;
          }

          // Offset from the center to the radius to get the intermediary point.
          var fastPoint = google.maps.geometry.spherical.computeOffset(currentlatLng, turnpoints[i].radius, middleHeading);
        }
        else {
          var fastPoint = google.maps.geometry.spherical.computeOffset(currentlatLng, turnpoints[i].radius, heading);
        }
        headings.push(heading);
        fastWaypoints.push(fastPoint);
        incrementDistance(google, fastWaypoints);
      }
    }

    // For the last turnpoint if it's a line the point doesn't change.
    // if it's a cylinder just reverse the last heading from the center and offset to the radius.
    if (headings.length >= 1) {
      var previouslatLng = turnpoints[i - 1].latLng;
      if (turnpoints[i - 1].goalType == "line" && turnpoints[i - 1].type == "goal") {
        var newPoint = previouslatLng;
      }
      else {
        var beforelatLng = turnpoints[i - 2].latLng;
        if (beforelatLng.equals(previouslatLng)) {
          var newPoint = google.maps.geometry.spherical.computeOffset(previouslatLng, turnpoints[i - 1].radius, headings[headings.length - 2] - 180);
        }
        else {
          var newPoint = google.maps.geometry.spherical.computeOffset(previouslatLng, turnpoints[i - 1].radius, headings[headings.length - 1] - 180);
        }
      }

      fastWaypoints.push(newPoint);
      incrementDistance(google, fastWaypoints);
    }

    var lineSymbol = {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
    };

    //console.log("fastWaypoints ", fastWaypoints);

    if (fastTrack) fastTrack.setMap(null);

    fastTrack = new google.maps.Polyline({
      path: fastWaypoints,
      geodesic: true,
      strokeColor: param.task.courseColor.fast,
      strokeOpacity: 1.0,
      strokeWeight: 2,
      icons: [{
        icon: lineSymbol,
        offset: '0',
        repeat: '100px'
      }],
      map: map,
    });



    //console.log(fastDistance, distances, fastWaypoints);
    return {
      distance: fastDistance,
      distances: distances,
      fastWaypoints: fastWaypoints,
    }
  }















  //
  //  Versione originale non meteor
  //

  var optimize = function (google, map, turnpoints) {
    var headings = Array();
    fastWaypoints = Array();
    fastDistance = 0;
    distances = [];

    for (var i = 0; i < turnpoints.length; i++) {
      // For all turnpoint excpet the last one.
      if (i < turnpoints.length - 1) {
        // Getting the heading.
        var heading = google.maps.geometry.spherical.computeHeading(turnpoints[i].latLng, turnpoints[i + 1].latLng);
        //console.log("Heading " + heading);

        // Unsure heading is always positive.
        if (heading < 0) heading += 360;
        if (headings.length >= 1) {
          // Switch first heading from 180°.
          var pastHeading = headings[i - 1];

          // We need to catch the right angle !!!
          if (pastHeading > heading) {
            pastHeading -= 180;
          } else {
            pastHeading += 180;
          }

          // Now we can get the average heading. (Bisectrix).
          var middleHeading = (pastHeading + heading) / 2;

          // If both turnpoints are the same. Keep past heading instead of 0.
          if (turnpoints[i].latLng.equals(turnpoints[i + 1].latLng)) {
            middleHeading = pastHeading;
          }

          // Offset from the center to the radius to get the intermediary point.
          var fastPoint = google.maps.geometry.spherical.computeOffset(turnpoints[i].latLng, turnpoints[i].radius, middleHeading);
        }
        else {
          // For the first point just offset form the center to its radius following the heading of next turnpoint.
          var fastPoint = google.maps.geometry.spherical.computeOffset(turnpoints[i].latLng, turnpoints[i].radius, heading);
        }
        headings.push(heading);
        fastWaypoints.push(fastPoint);
        incrementDistance(google, fastWaypoints);
      }
    }

    // For the last turnpoint if it's a line the point doesn't change.
    // if it's a cylinder just reverse the last heading from the center and offset to the radius.
    if (headings.length >= 1) {
      if (turnpoints[i - 1].goalType == "line" && turnpoints[i - 1].type == "goal") {
        var newPoint = turnpoints[i - 1].latLng;
      }
      else {
        if (turnpoints[i - 2].latLng.equals(turnpoints[i - 1].latLng)) {
          var newPoint = google.maps.geometry.spherical.computeOffset(turnpoints[i - 1].latLng, turnpoints[i - 1].radius, headings[headings.length - 2] - 180);
        }
        else {
          var newPoint = google.maps.geometry.spherical.computeOffset(turnpoints[i - 1].latLng, turnpoints[i - 1].radius, headings[headings.length - 1] - 180);
        }
      }

      fastWaypoints.push(newPoint);
      incrementDistance(google, fastWaypoints);
    }

    var lineSymbol = {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
    };

    //console.log("fastWaypoints ", fastWaypoints);

    if (fastTrack) fastTrack.setMap(null);
    fastTrack = new google.maps.Polyline({
      path: fastWaypoints,
      geodesic: true,
      strokeColor: param.task.courseColor.fast,
      strokeOpacity: 1.0,
      strokeWeight: 2,
      icons: [{
        icon: lineSymbol,
        offset: '0',
        repeat: '100px'
      }],
      map: map,
    });

    //console.log(fastDistance, distances, fastWaypoints);
    return {
      distance: fastDistance,
      distances: distances,
      fastWaypoints: fastWaypoints,
    }
  }



  function recalcDistance(google, waypoints) {
    fastDistance = 0;
    distances = [];
    if (waypoints.length > 1) {
      for (var  i=0; i< waypoints.length-2 ;i++) {
        var distance = google.maps.geometry.spherical.computeDistanceBetween(waypoints[i],waypoints[i+1]);
        fastDistance += distance;
        distances.push(Math.round(distance / 10) / 100);

      }
      //console.log("Distances ", distances);
      //console.log("fastDistance ", fastDistance);
    }

  }

  function incrementDistance(google, waypoints) {
    if (waypoints.length > 1) {
      var distance = google.maps.geometry.spherical.computeDistanceBetween(
        waypoints[fastWaypoints.length - 1],
        waypoints[fastWaypoints.length - 2]
      );
      fastDistance += distance;
      distances.push(Math.round(distance / 10) / 100);
      //console.log("Distances ", distances);
      //console.log("fastDistance ", fastDistance);
    }
  }

  return {
    optimize: optimizeTask,
  }
});

