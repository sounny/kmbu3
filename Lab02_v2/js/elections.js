// Add all scripts to the JS folder

window.onload = function() {
    setMap();
};

//Example 1.3 line 4...set up choropleth map
function setMap() {
        
    //map frame dimensions
    var width = 960,
        height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on United States
    var projection = d3.geo.albers()
        .center([-0.00, 42.69])

        .rotate([101.00, -0.00, 0])

        .parallels([27.00, 44.52])

        .scale(452.52)

        .translate([width / 2, height / 2]);


    var path = d3.geoPath()
        .projection(projection);
    
    
    //use Promise.all to parallelize asynchronous data loading
    var promises = [];    
        promises.push(d3.csv("data/popular_vote_by_state.csv")); //load attributes from csv    
        promises.push(d3.json("data/lakes.topojson")); //load background spatial data    
        promises.push(d3.json("data/states.topojson")); //load choropleth spatial data    
        Promise.all(promises).then(callback);
    
    /*
    var promises = [
        d3.csv("data/popular_vote_by_state.csv"),
        d3.json("data/lakes.topojson"),
        d3.json("data/states.topojson"),
    ];
    Promise.all(promises).then(callback);
    */


    Promise.all(promises)
        .then(callback)
        .catch(function(error) {
            console.log("Error loading data:", error);
        });
    
    function callback(data) {
        var pop_Vote = data[0],
            lakes = data[1],
            states = data[2];

        console.log("pop vote data:",pop_Vote);
        console.log(lakes);
        console.log(states);

        //translate  TopoJSON
        var lakesFeature = topojson.feature(lakes, lakes.objects.great_lakes_01),
            statesFeature = topojson.feature(states, states.objects.US_States_01).features;

        /*
        //translate europe TopoJSON
        var europeCountries = topojson.feature(europe, europe.objects.EuropeCountries),
            franceRegions = topojson.feature(france, france.objects.FranceRegions).features;
        */


        //add states to map
        var lakes = map.append("path")
            .datum(lakes)
            .attr("class", "lakes")
            .attr("d", path);

         //add France regions to map
         var states = map.selectAll(".states")
         .data(states)
         .enter()
         .append("path")
         .attr("class", function(d){
             return "states " + d.properties.adm1_code;
         })
         .attr("d", path);
    

        //examine the results
        console.log(lakes);
        console.log(states);
    };
};


    