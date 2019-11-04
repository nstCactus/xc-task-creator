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

    fastWaypoints = [];
    fastDistance = 0;
    distances = [];


    checkStartDirection(google, turnpoints);

    var zone = "33"; // just default if not valid turnpoits yet
    if (turnpoints.length > 0) {
      zone = getUtmZoneFromPosition(turnpoints[0].latLng.lng(), turnpoints[0].latLng.lat());
    }

    var es = turnpoints.length - 1;
    var ss = 1;
    var g = turnpoints.length - 1;
    for (let i = 0; i < turnpoints.length; i++) {
      if (turnpoints[i].type == 'end-of-speed-section') {
        es = i;
      }
      if (turnpoints[i].type == 'start') {
        ss = i;
      }
      if (turnpoints[i].type == 'goal') {
        g = i;
      }
    }

    var points = [];
    for (let i = 0; i < turnpoints.length; i++) {
      var p = degrees2utm(turnpoints[i].latLng.lng(), turnpoints[i].latLng.lat(), zone);
      points.push(createPoint(p[0], p[1], turnpoints[i].radius))
    }

    var goalLine = []
    if (g > 0 && turnpoints[g].type == 'goal' && turnpoints[g].goalType == 'line') {

      var i = g - 1;
      var pastTurnpoint = turnpoints[g - 1];
      while (i > 0 && pastTurnpoint.latLng == turnpoints[g].latLng) {
        i--;
        pastTurnpoint = turnpoints[i];
      }

      var lastLegHeading = google.maps.geometry.spherical.computeHeading(pastTurnpoint.latLng, turnpoints[g].latLng);
      if (lastLegHeading < 0) lastLegHeading += 360;
      // Add 90° to this heading to have a perpendicular.
      var heading = lastLegHeading + 90;
      // Getting a first point 50m further. 
      var firstPoint = google.maps.geometry.spherical.computeOffset(turnpoints[g].latLng, turnpoints[g].radius, heading);
      // Reversing the heading.
      heading += 180;
      // And now completing the line with a point 100m further.
      var secondPoint = google.maps.geometry.spherical.computeOffset(firstPoint, 2 * turnpoints[g].radius, heading);

      var p1 = degrees2utm(firstPoint.lng(), firstPoint.lat(), zone);
      var p2 = degrees2utm(secondPoint.lng(), secondPoint.lat(), zone);

      goalLine.push({ x: p1[0], y: p1[1] });
      goalLine.push({ x: p2[0], y: p2[1] });



    }



    var d = getShortestPath(points, es, goalLine);
    //console.log("Distance : " + d);

    for (let i = 0; i < turnpoints.length; i++) {
      var fl = utm2degress(points[i].fx, points[i].fy, zone);
      fastWaypoints.push(new google.maps.LatLng(fl[1], fl[0]))
    }




    var lineSymbol = {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
    };




    if (fastTrack) fastTrack.setMap(null);
    fastTrack = new google.maps.Polyline({
      path: fastWaypoints,//.slice(0, -1),
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




    var markerImageSS = {
      url: "https://maps.google.com/mapfiles/kml/pal5/icon26.png", // url
      scaledSize: new google.maps.Size(16, 16), // scaled size
      origin: new google.maps.Point(0, 0), // origin
      anchor: new google.maps.Point(8, 8) // anchor
    };

    var markerImage = {
      url: "https://maps.google.com/mapfiles/kml/shapes/placemark_circle.png", // url
      scaledSize: new google.maps.Size(16, 16), // scaled size
      origin: new google.maps.Point(0, 0), // origin
      anchor: new google.maps.Point(8, 8) // anchor
    };

    var markerImageES = {
      url: "https://maps.google.com/mapfiles/kml/pal5/icon60.png", // url
      scaledSize: new google.maps.Size(16, 16), // scaled size
      origin: new google.maps.Point(0, 0), // origin
      anchor: new google.maps.Point(8, 8) // anchor
    };


    for (var i = 0; i < 100; i++) {
      if (optimizedMarkers[i]) optimizedMarkers[i].setMap(null);
    }

    for (var i = 0; i < fastWaypoints.length; i++) {
      optimizedMarkers[i] = new google.maps.Marker({
        scaledSize: new google.maps.Size(8, 8), // scaled size
        position: fastWaypoints[i],
        map: map,
        icon: i == ss ? markerImageSS : i == es ? markerImageES : markerImage,
      });
    }


    recalcDistance(google, fastWaypoints, turnpoints[0] != undefined ? turnpoints[0].radius : 0);

    // if ( fastWaypoints.length == 7 ) {
    //   console.log(JSON.stringify(fastWaypoints, undefined, 2)) 
    // }

    return {
      distance: d - (turnpoints[0] != undefined ? turnpoints[0].radius : 0),
      distances: distances,
      fastWaypoints: fastWaypoints,
      cumulativeDistance: cumulativeDistance,
    }
  }

  function calcStartIntersection(google, three, two, heading) {
    var dist = three.radius;
    var fastPoint;
    var n = 0;
    while (n < 10000) {
      n++;
      fastPoint = google.maps.geometry.spherical.computeOffset(three.latLng, dist, heading);
      var distance = computeDistanceBetween(two.latLng, fastPoint);
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
    var distance = computeDistanceBetween(turnpoints[startIndex].latLng, turnpoints[startIndex + 1].latLng);
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
    cumulativeDistance = [];
    if (waypoints.length > 1) {
      for (var i = 0; i < waypoints.length - 1; i++) {
        var distance;
        //distance = google.maps.geometry.spherical.computeDistanceBetween(waypoints[i], waypoints[i + 1]);
        distance = computeDistanceBetween(waypoints[i], waypoints[i + 1]);
        //distance = distVincenty(waypoints[i].lat(), waypoints[i].lng(), waypoints[i + 1].lat(), waypoints[i + 1].lng());


        if (i == 0) {
          distance -= radius;
        }
        fastDistance += distance;
        if ( param.showCumulativeDistances ) {
          distances.push(Math.round(fastDistance / 10) / 100)

        }
        else {
          distances.push(Math.round(distance / 10) / 100);

        }

      }
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
    return lastDistance;
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
      var a, b, c;
      var ret = getTargetPoints(points, count, index, esIndex);
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
    var ret = getRelativeDistances(c, a, b);
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
    var s1, s2, e;
    var ret = getIntersectionPoints(c, a, b, distAB);
    s1 = ret[0];
    s2 = ret[1];
    e = ret[2];
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
    var s1, s2, e, ret;
    ret = getIntersectionPoints(c, a, b, distAB);
    s1 = ret[0];
    s2 = ret[1];
    e = ret[2];
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

  var degrees2meters = function (lon, lat) {
    var x = lon * 20037508.34 / 180;
    var y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
    y = y * 20037508.34 / 180;
    return [x, y]
  }

  var meters2degress = function (x, y) {
    var lon = x * 180 / 20037508.34;
    var lat = Math.atan(Math.exp(y * Math.PI / 20037508.34)) * 360 / Math.PI - 90;
    return [lon, lat]
  }

  var degrees2utm = function (lon, lat, zone) {
    var utm = "+proj=utm +zone=" + zone;
    var wgs84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
    return proj4(wgs84, utm, [lon, lat]);
  }

  var utm2degress = function (x, y, zone) {
    var utm = "+proj=utm +zone=" + zone;
    var wgs84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
    return proj4(utm, wgs84, [x, y]);
  }

  function getUtmZoneFromPosition(lon, lat) {
    return (Math.floor((lon + 180) / 6) % 60) + 1;
  };




  function toRad(n) {
    return n * Math.PI / 180;
   };

   function computeDistanceBetween(wpt1,wpt2){
     return distVincenty(wpt1.lat(), wpt1.lng(),wpt2.lat(), wpt2.lng())
   };

   function distVincenty(lat1, lon1, lat2, lon2) {
    var a = 6378137,
        b = 6356752.3142,
        f = 1 / 298.257223563, // WGS-84 ellipsoid params
        L = toRad(lon2-lon1),
        U1 = Math.atan((1 - f) * Math.tan(toRad(lat1))),
        U2 = Math.atan((1 - f) * Math.tan(toRad(lat2))),
        sinU1 = Math.sin(U1),
        cosU1 = Math.cos(U1),
        sinU2 = Math.sin(U2),
        cosU2 = Math.cos(U2),
        lambda = L,
        lambdaP,
        iterLimit = 100;
    do {
     var sinLambda = Math.sin(lambda),
         cosLambda = Math.cos(lambda),
         sinSigma = Math.sqrt((cosU2 * sinLambda) * (cosU2 * sinLambda) + (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
     if (0 === sinSigma) {
      return 0; // co-incident points
     };
     var cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda,
         sigma = Math.atan2(sinSigma, cosSigma),
         sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma,
         cosSqAlpha = 1 - sinAlpha * sinAlpha,
         cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha,
         C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
     if (isNaN(cos2SigmaM)) {
      cos2SigmaM = 0; // equatorial line: cosSqAlpha = 0 (§6)
     };
     lambdaP = lambda;
     lambda = L + (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
    } while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);
   
    if (!iterLimit) {
     return NaN; // formula failed to converge
    };
   
    var uSq = cosSqAlpha * (a * a - b * b) / (b * b),
        A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq))),
        B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq))),
        deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM))),
        s = b * A * (sigma - deltaSigma);
    return s; // round to 1mm precision
   };









  return {
    optimize: optimizeTask,
  }
});

