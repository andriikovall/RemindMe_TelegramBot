var fs = require("fs");
var request = require("request");

var time_zones = []

    for (let lat = -180; lat < 180; lat += 10) {
        for (let lng = -180; lng < 180; lng += 10) {
            
            request({
                uri: "http://api.geonames.org/timezoneJSON",
                method: "POST",
                form: {
                    lat: lat, 
              lng: lng,
              username: 'ZioVio'
            }
        }, function(error, response, body) {
            //   console.log(body);
            // console.log(response)
            if (typeof response !== 'undefined')  {
                if (response.body.status === undefined) {
                    // if (response.body.status.message != 'invalid lat/lng')
                    time_zones.push(JSON.parse(response.body))
                }
            }
            console.log(time_zones)
            //   console.log(JSON.stringify(JSON.parse(response.body), null, ' '))
            //   console.log('ERROR!!! ' + error)

            fs.writeFileSync('time_zones.json', JSON.stringify(time_zones, null, '  '))
        });
    }
}