/**
 * @file
 * geoCalc module for the task creator.
 */
define(["app/param","geographiclib","proj4"], function (param,GeographicLib,proj4) {

  var geod = GeographicLib.Geodesic.WGS84;


  function toRad(n) {
    return n * Math.PI / 180;
  };


  function getUtmZoneFromPosition(lon, lat) {
    return (Math.floor((lon + 180) / 6) % 60) + 1;
  };

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

  function computeHeading(latLng1, latLng2) {
    return geod.Inverse(latLng1.lat(),latLng1.lng(), latLng2.lat(), latLng2.lng()).azi1 ;
  }


  function computeOffset(latLng1, radius, heading) { 
    let gl =  new GeographicLib.GeodesicLine.GeodesicLine(geod,latLng1.lat(),latLng1.lng(),heading);
    let p = gl.GenPosition(false,radius);
    return new google.maps.LatLng(p.lat2, p.lon2);

  }


  function computeDistanceBetweenLatLng(wpt1, wpt2) {
    return distGeographicLib(wpt1.lat(), wpt1.lng(), wpt2.lat(), wpt2.lng())
    //return distVincenty(wpt1.lat(), wpt1.lng(), wpt2.lat(), wpt2.lng())
    // return distHaversine(wpt1.lat(), wpt1.lng(), wpt2.lat(), wpt2.lng())
  };

  function computeDistanceBetween(lat1, lng1,lat2,lng2) {
    return distGeographicLib(lat1, lng1,lat2,lng2)
    //return distVincenty(wpt1.lat(), wpt1.lng(), wpt2.lat(), wpt2.lng())
    // return distHaversine(wpt1.lat(), wpt1.lng(), wpt2.lat(), wpt2.lng())
  };
  

  function distGeographicLib(lat1, lon1, lat2, lon2) {
    return geod.Inverse(lat1, lon1, lat2, lon2).s12;
  }


  function distHaversine(lat1, lon1, lat2, lon2) {
    var R = 6371000; // km 
    //has a problem with the .toRad() method below.
    var x1 = lat2-lat1;
    var dLat = toRad(x1);  
    var x2 = lon2-lon1;
    var dLon = toRad(x2);  
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
                    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
                    Math.sin(dLon/2) * Math.sin(dLon/2);  
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; 
    return d;

  }

  function distVincenty(lat1, lon1, lat2, lon2) {
    var a = 6378137,
      b = 6356752.3142,
      f = 1 / 298.257223563, // WGS-84 ellipsoid params
      L = toRad(lon2 - lon1),
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
    getUtmZoneFromPosition: getUtmZoneFromPosition,
    degrees2meters:degrees2meters,
    meters2degress:meters2degress,
    degrees2utm:degrees2utm,
    utm2degress:utm2degress,
    computeHeading:computeHeading,
    computeDistanceBetweenLatLng:computeDistanceBetweenLatLng,
    computeDistanceBetween:computeDistanceBetween,
    computeOffset:computeOffset,

  }
 });
