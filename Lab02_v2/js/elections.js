// Add all scripts to the JS folder

window.onload = function() {
    setMap();
};

//set up map
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

    //create Albers equal area conic projection centered on United States but including Hawaii, Alaska, and PR
    var projection = d3.geoAlbers()
        .center([0.00, 48.00])

        .rotate([95.55, 0.00, 0])

        .parallels([29.50, 45.5])

        .scale(427.27)

        .translate([width / 2, height / 2]);

    //Set path
    var path = d3.geoPath()
        .projection(projection);
    
    
    //use Promise.all to parallelize asynchronous data loading
    var promises = [];    
        promises.push(d3.csv("data/popular_vote_by_state.csv")); //load attributes from csv    
        promises.push(d3.json("data/lakes.topojson")); //load background spatial data    
        promises.push(d3.json("data/US_States_02.TOPOJSON")); //load choropleth spatial data    
        Promise.all(promises).then(callback);
    

    //Error catching to tell user if data not loaded
    Promise.all(promises)
        .then(callback)
        .catch(function(error) {
            console.log("Error loading data:", error);
        });
    
    //function to call back data and load topojson files and graticules
    function callback(data) {
        var pop_Vote = data[0],
            lakes = data[1],
            states = data[2];

        
        //create graticule generator, set to every 10 degrees for scale
        var graticule = d3.geoGraticule()
            .step([10, 10]); //place graticule lines every 5 degrees of longitude and latitude
        
        /*   
        //create graticule background
        var gratBackground = map.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule
        */
            
        
        //create graticule lines
        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines
        
        


        //translate  TopoJSON
        var lakesFeature = topojson.feature(lakes, lakes.objects.great_lakes_01),
            statesFeature = topojson.feature(states, states.objects.US_States_02).features;


        
        //add states to map
        var lakesPath = map.append("path")
            .datum(lakesFeature)
            .attr("class", "lakes")
            .attr("d", path);

         //add France regions to map
         var statesPath = map.selectAll(".states")
            .data(statesFeature)
            .enter()
            .append("path")
            .attr("class", "states")
            .attr("d", path);
    
    };
};


    