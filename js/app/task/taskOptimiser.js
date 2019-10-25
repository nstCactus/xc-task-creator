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

  var INT_MAX = Number.MAX_SAFE_INTEGER;



  let optimizeTask = function (google, map, turnpoints) {

    // var points = [];
    // for (var i = 0; i < turnpoints.length; i++) {
    //   points.push(createPoint(turnpoints[i].x, turnpoints[i].y, turnpoints[i].radius))
    // }
    // var d = getShortestPath(points, 3, []);


    fastWaypoints = [];
    fastDistance = 0;
    distances = [];

    checkStartDirection(google, turnpoints);

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

      //console.log("two.name",two.name);
      //console.log("three.name",three.name);


      // Detecting flat lines.
      //if (one.equals(two.latLng) && two.latLng.equals(three.latLng) && one.equals(three.latLng)) {
      // Extreme case. Depend where to go next or any heading can be accepted.
      //fastWaypoints.push(three.latLng);
      //incrementDistance(google, fastWaypoints);
      //}

      if (two.latLng.equals(three.latLng)) {
        //One and two are the same or two and three are the same. Take heading from three to one.
        heading = google.maps.geometry.spherical.computeHeading(three.latLng, one);
        var fastPoint = google.maps.geometry.spherical.computeOffset(two.latLng, two.radius, heading);
        fastWaypoints.push(fastPoint);
        //console.log("fastWaypoints alligbned");
        continue;
        //console.log(heading);
      }
      else if (one.equals(three.latLng)) {
        // One and three are the same take heading from two to one.
        heading = google.maps.geometry.spherical.computeHeading(two.latLng, one);
        var fastPoint = google.maps.geometry.spherical.computeOffset(two.latLng, two.radius, heading);
        fastWaypoints.push(fastPoint);
        //console.log("fastWaypoints alligbned");
        continue
        //console.log(heading);
      }
      else if (two.type == 'start') {
        heading = google.maps.geometry.spherical.computeHeading(three.latLng, one);
        //var fastPoint = google.maps.geometry.spherical.computeOffset(three.latLng, two.radius, heading);
        var fastPoint = calcStartIntersection(google, three, two, heading)
        if (fastPoint != null) {
          fastWaypoints.push(fastPoint);
          //console.log("fastWaypoints alligbned");
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
      path: fastWaypoints.slice(0, -1),
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

    for (var i = 0; i < 100; i++) {
      if (optimizedMarkers[i]) optimizedMarkers[i].setMap(null);
    }

    for (var i = 0; i < fastWaypoints.length - 1; i++) {
      optimizedMarkers[i] = new google.maps.Marker({
        position: fastWaypoints[i],
        map: map,
        icon: markerImage
      });
    }


    recalcDistance(google, fastWaypoints, turnpoints[0] != undefined ? turnpoints[0].radius : 0);

    // if ( fastWaypoints.length == 7 ) {
    //   console.log(JSON.stringify(fastWaypoints, undefined, 2)) 
    // }

    return {
      distance: fastDistance,
      distances: distances,
      fastWaypoints: fastWaypoints,
    }
  }

  function calcStartIntersection(google, three, two, heading) {
    var dist = three.radius;
    var fastPoint;
    var n = 0;
    while (n < 10000) {
      n++;
      fastPoint = google.maps.geometry.spherical.computeOffset(three.latLng, dist, heading);
      var distance = google.maps.geometry.spherical.computeDistanceBetween(two.latLng, fastPoint);
      if (two.mode == "entry" && distance >= two.radius) {
        return fastPoint;
      }
      if (two.mode == "exit" && distance <= two.radius) {
        return fastPoint;
      }
      dist += 10;
    }

    return null;

  }

  function checkStartDirection(google, turnpoints) {

    var startIndex = -1;
    for (var i = 0; i < turnpoints.length; i++) {
      if (turnpoints[i].type == "start") {
        startIndex = i;
        break;
      }
    }
    if (startIndex == -1 || startIndex == turnpoints.length - 1) {
      return;
    }
    var distance = google.maps.geometry.spherical.computeDistanceBetween(turnpoints[startIndex].latLng, turnpoints[startIndex + 1].latLng);
    if (distance > turnpoints[startIndex].radius) {
      turnpoints[startIndex].mode = 'exit';
    }
    else {
      turnpoints[startIndex].mode = 'entry';

    }

  }


  function recalcDistance(google, waypoints, radius) {
    fastDistance = 0;
    distances = [];
    if (waypoints.length > 1) {
      for (var i = 0; i < waypoints.length - 2; i++) {
        var distance = google.maps.geometry.spherical.computeDistanceBetween(waypoints[i], waypoints[i + 1]);
        if (i == 0) {
          distance -= radius;
        }
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

  function createPoint(x, y, radius = 0) {
    // Using ECMAScript object literals to convey object creation
    return { x: x, y: y, radius: radius, fx: x, fy: y };
  }
  function createPointFromCenter(point) {
    return createPoint(point.x, point.y, point.radius)
  }
  function createPointFromFix(point) {
    return createPoint(point.fx, point.fy, point.radius)
  }
  5


  // Inputs:
  // points - array of point objects
  // esIndex - index of the ESS point, or -1
  // line - goal line endpoints, or empty array
  function getShortestPath(points, esIndex, line) {
    tolerance = 1.0;
    lastDistance = INT_MAX;
    finished = false;
    count = (points.length);
    // opsCount is the number of operations allowed
    opsCount = count * 10;
    while (!finished && opsCount-- > 0) {
      distance = optimizePath(points, count, esIndex, line);
      // See if the difference between the last distance id
      // smaller than the tolerance
      finished = lastDistance - distance < tolerance;
      lastDistance = distance;
    }
  }


  // Inputs:
  // points - array of point objects
  // count - number of points
  // esIndex - index of the ESS point, or -1
  // line - goal line endpoints, or empty array
  function optimizePath(points, count, esIndex, line) {
    distance = 0;
    hasLine = (line.length) == 2;
    for (index = 1; index < count; index++) {
      // Get the target cylinder c and its preceding and succeeding points
      var a,b,c;
      var ret =  getTargetPoints(points, count, index, esIndex);
      c = ret[0];
      a = ret[1];
      b = ret[2];
      if (index == count - 1 && hasLine) {
        processLine(line, c, a);
      } else {
        processCylinder(c, a, b);
      }
      // Calculate the distance from A to the C fix point
      legDistance = Math.hypot(a.x - c.fx, a.y - c.fy);
      distance += legDistance;
    }
    return distance;
  }


  // Inputs:
  // points - array of point objects
  // count - number of points
  // index - index of the target cylinder (from 1 upwards)
  // esIndex - index of the ESS point, or -1
  function getTargetPoints(points, count, index, esIndex) {
    // Set point C to the target cylinder
    c = points[index];
    // Create point A using the fix from the previous point
    a = createPointFromFix(points[index - 1]);
    // Create point B using the fix from the next point
    // (use point C center for the lastPoint and esIndex).
    if (index == count - 1 || index == esIndex) {
      b = createPointFromCenter(c);
    } else {
      b = createPointFromFix(points[index + 1]);
    }
    return [c, a, b];
  }

  // Inputs:
  // c, a, b - target cylinder, previous point, next point
  function processCylinder(c, a, b) {
    var distAC, distBC, distAB, distCtoAB;
    var ret =  getRelativeDistances(c, a, b);
    distAC = ret[0];
    distBC = ret[1];
    distAB = ret[2];
    distCtoAB = ret[3];
    if (distAB == 0.0) {
      // A and B are the same point: project the point on the circle
      projectOnCircle(c, a.x, a.y, distAC);
    } else if (pointOnCircle(c, a, b, distAC, distBC, distAB, distCtoAB)) {
      // A or B are on the circle: the fix has been calculated
      return;
    } else if (distCtoAB < c.radius) {
      // AB segment intersects the circle, but is not tangent to it
      if (distAC < c.radius && distBC < c.radius) {
        // A and B are inside the circle
        setReflection(c, a, b);
      } else if (distAC < c.radius && distBC > c.radius ||
        (distAC > c.radius && distBC < c.radius)) {
        // One point inside, one point outside the circle
        setIntersection1(c, a, b, distAB);
      } else if (distAC > c.radius && distBC > c.radius) {
        // A and B are outside the circle
        setIntersection2(c, a, b, distAB);
      }
    } else {
      // A and B are outside the circle and the AB segment is
      // either tangent to it or or does not intersect it
      setReflection(c, a, b);
    }
  }


  // Inputs:
  // c, a, b - target cylinder, previous point, next point
  function getRelativeDistances(c, a, b) {
    // Calculate distances AC, BC and AB
    distAC = Math.hypot(a.x - c.x, a.y - c.y);
    distBC = Math.hypot(b.x - c.x, b.y - c.y);
    len2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
    distAB = Math.sqrt(len2);
    // Find the shortest distance from C to the AB line segment
    if (len2 == 0.0) {
      // A and B are the same point
      distCtoAB = distAC;
    } else {
      t = ((c.x - a.x) * (b.x - a.x) + (c.y - a.y) * (b.y - a.y)) / len2;
      if (t < 0.0) {
        // Beyond the A end of the AB segment
        distCtoAB = distAC;
      } else if (t > 1.0) {
        // Beyond the B end of the AB segment
        distCtoAB = distBC;
      } else {
        // On the AB segment
        cpx = t * (b.x - a.x) + a.x;
        cpy = t * (b.y - a.y) + a.y;
        distCtoAB = Math.hypot(cpx - c.x, cpy - c.y);
      }
    }
    return [distAC, distBC, distAB, distCtoAB];
  }


  // Inputs:
  // c, a, b - target cylinder, previous point, next point
  // distAB - AB line segment length
  function getIntersectionPoints(c, a, b, distAB) {
    // Find e, which is on the AB line perpendicular to c center
    dx = (b.x - a.x) / distAB;
    dy = (b.y - a.y) / distAB;
    t2 = dx * (c.x - a.x) + dy * (c.y - a.y);
    ex = t2 * dx + a.x;
    ey = t2 * dy + a.y;
    // Calculate the intersection points, s1 and s2
    dt2 = c.radius ** 2 - (ex - c.x) ** 2 - (ey - c.y) ** 2;
    dt = dt2 > 0 ? Math.sqrt(dt2) : 0;
    s1x = (t2 - dt) * dx + a.x;
    s1y = (t2 - dt) * dy + a.y;
    s2x = (t2 + dt) * dx + a.x;
    s2y = (t2 + dt) * dy + a.y;
    return [createPoint(s1x, s1y), createPoint(s2x, s2y), createPoint(ex, ey)];
  }

  // Inputs:
  // c, a, b - target cylinder, previous point, next point
  // Distances between the points
  function pointOnCircle(c, a, b, distAC, distBC, distAB, distCtoAB) {
    if (Math.abs(distAC - c.radius) < 0.0001) {
      // A on the circle (perhaps B as well): use A position
      c.fx = a.x;
      c.fy = a.y;
      return true;
    }
    if (Math.abs(distBC - c.radius) < 0.0001) {
      // B on the circle
      if (distCtoAB < c.radius && distAC > c.radius) {
        // AB segment intersects the circle and A is outside it
        setIntersection2(c, a, b, distAB);
      } else {
        // Use B position
        c.fx = b.x;
        c.fy = b.y;
      }
      return true;
    }
    return false;
  }

  // Inputs:
  // c - the circle
  // x, y - coordinates of the point to project
  // len - line segment length, from c to the point
  function projectOnCircle(c, x, y, len) {
    if (len == 0.0) {
      // The default direction is eastwards (90 degrees)
      c.fx = c.radius + c.x;
      c.fy = c.y;
    } else {
      c.fx = c.radius * (x - c.x) / len + c.x;
      c.fy = c.radius * (y - c.y) / len + c.y;
    }
  }

  // Inputs:
  // c, a, b - target cylinder, previous point, next point
  // distAB - AB line segment length
  function setIntersection1(c, a, b, distAB) {
    // Get the intersection points (s1, s2)
    s1, s2, e = getIntersectionPoints(c, a, b, distAB);
    as1 = Math.hypot(a.x - s1.x, a.y - s1.y);
    bs1 = Math.hypot(b.x - s1.x, b.y - s1.y);
    // Find the intersection lying between points a and b
    if (Math.abs(as1 + bs1 - distAB) < 0.0001) {
      c.fx = s1.x;
      c.fy = s1.y;
    } else {
      c.fx = s2.x;
      c.fy = s2.y;
    }
  }

  // Inputs:
  // c, a, b - target cylinder, previous point, next point
  // distAB - AB line segment length
  function setIntersection2(c, a, b, distAB) {
    // Get the intersection points (s1, s2) and midpoint (e)
    s1, s2, e = getIntersectionPoints(c, a, b, distAB);
    as1 = Math.hypot(a.x - s1.x, a.y - s1.y);
    es1 = Math.hypot(e.x - s1.x, e.y - s1.y);
    ae = Math.hypot(a.x - e.x, a.y - e.y);
    // Find the intersection between points a and e
    if (Math.abs(as1 + es1 - ae) < 0.0001) {
      c.fx = s1.x;
      c.fy = s1.y;
    } else {
      c.fx = s2.x;
      c.fy = s2.y;
    }
  }

  // Inputs:
  // c, a, b - target circle, previous point, next point
  function setReflection(c, a, b) {
    // The lengths of the adjacent triangle sides (af, bf) are
    // proportional to the lengths of the cut AB segments (ak, bk)
    af = Math.hypot(a.x - c.fx, a.y - c.fy);
    bf = Math.hypot(b.x - c.fx, b.y - c.fy);
    t = af / (af + bf);
    // Calculate point k on the AB segment
    kx = t * (b.x - a.x) + a.x;
    ky = t * (b.y - a.y) + a.y;
    kc = Math.hypot(kx - c.x, ky - c.y);
    // Project k on to the radius of c
    projectOnCircle(c, kx, ky, kc);
  }

  // Inputs:
  // line - array of goal line endpoints
  // c, a - target (goal), previous point
  function processLine(line, c, a) {
    g1 = line[0], g2 = line[1];
    len2 = (g1.x - g2.x) ** 2 + (g1.y - g2.y) ** 2;
    if (len2 == 0.0) {
      // Error trapping: g1 and g2 are the same point
      c.fx = g1.x;
      c.fy = g1.y;
    } else {
      t = ((a.x - g1.x) * (g2.x - g1.x) + (a.y - g1.y) * (g2.y - g1.y)) / len2;
      if (t < 0.0) {
        // Beyond the g1 end of the line segment
        c.fx = g1.x;
        c.fy = g1.y;
      } else if (t > 1.0) {
        // Beyond the g2 end of the line segment
        c.fx = g2.x;
        c.fy = g2.y;
      } else {
        // Projection falls on the line segment
        c.fx = t * (g2.x - g1.x) + g1.x;
        c.fy = t * (g2.y - g1.y) + g1.y;
      }
    }
  }


  return {
    optimize: optimizeTask,
  }
});

