//Wrap everything in a self-executing anonymous function to move to local scope
(function(){

    //pseudo-global variables
    var attrArray = ["pop_vote_Biden", "pop_vote_Trump", "pop_vote_all_others", "total_vote", "over_18_total"]; //list of attributes
    var expressed = attrArray[0]; //initial attribute
    var extracted = expressed.substring(9, 14);


    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473,
        leftPadding = 39,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a scale to size bars proportionally to frame and for axis
    var yScale = d3.scaleLinear()
        .range([463, 0])
        .domain([0, 35000000]);


    window.onload = setMap();

    //set up map
    function setMap() {
            
        //map frame dimensions
        //map frame dimensions
        var width = window.innerWidth * 0.5,
            height = 460;

        //create new svg container for the map
        var map = d3.select("body")
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height);

        //create Albers equal area conic projection centered on United States but including Hawaii, Alaska
        var projection = d3.geoAlbers()
            .center([0.00, 48.00])

            .rotate([122.55, 0.00, 0])

            .parallels([29.50, 45.5])

            .scale(400.00)

            .translate([width / 2, height / 2]);

        //Set path
        var path = d3.geoPath()
            .projection(projection);
        
        
        //use Promise.all to parallelize asynchronous data loading
        var promises = [];    
            promises.push(d3.csv("data/popular_vote_by_state.csv")); //load attributes from csv    
            promises.push(d3.json("data/lakes.topojson")); //load background spatial data    
            promises.push(d3.json("data/US_States_04.topojson")); //load choropleth spatial data    

        

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

            //translate TopoJSON
            var lakesFeature = topojson.feature(lakes, lakes.objects.great_lakes_01),
            statesFeature = topojson.feature(states, states.objects.US_States_04).features;
        
            console.log(statesFeature);

            //sets graticules
            setGraticule(map, path);

            //sets lakes
            var lakesPath = map.append("path")
            .datum(lakesFeature)
            .attr("class", "lakes")
            .attr("d", path);


            //join csv data to topojson enumeration units
            var joined_statesFeatures = joinData(statesFeature, pop_Vote);

            //create the color scale
            var colorScale = makeColorScale(pop_Vote);

            //add enumeration units to the map
            setEnumerationUnits(joined_statesFeatures, map, path, colorScale);

            //add coordinated visualization to the map
            setChart(pop_Vote, colorScale);

            //adds dropdown
            createDropdown(pop_Vote);

        };
    }; //end of setMap()
        


    //function to create coordinated bar chart
    function setChart(pop_Vote, colorScale){
        //create a second svg element to hold the bar chart
        var chart = d3.select("body")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");

        //create a rectangle for chart background fill
        var chartBackground = chart.append("rect")
            .attr("class", "chartBackground")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);

        //set bars for each province
        var bars = chart.selectAll(".bar")
            .data(pop_Vote)
            .enter()
            .append("rect")
            .sort(function(a, b){
                return b[expressed]-a[expressed]
            })
            .attr("class", function(d){
                return "bar " + d.state;
            })
            .attr("width", chartInnerWidth / pop_Vote.length - 1)
            .attr("x", function(d, i){
                return i * (chartInnerWidth / pop_Vote.length) + leftPadding;
            })
            .attr("height", function(d, i){
                return 463 - yScale(parseFloat(d[expressed]));
            })
            .attr("y", function(d, i){
                return yScale(parseFloat(d[expressed])) + topBottomPadding;
            })
            .style("fill", function(d){
                return colorScale(d[expressed]);
            });

        //create a text element for the chart title
        var chartTitle = chart.append("text")
            .attr("x", 75)
            .attr("y", 40)
            .attr("class", "chartTitle")
            .text("Voters for " + extracted + " in each state");

        //create vertical axis generator
        var yAxis = d3.axisLeft()
            .scale(yScale);

        //place axis
        var axis = chart.append("g")
            .attr("class", "axis")
            .attr("transform", translate)
            .call(yAxis);

        //create frame for chart border
        var chartFrame = chart.append("rect")
            .attr("class", "chartFrame")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);

        //set bar positions, heights, and colors
        updateChart(bars, pop_Vote.length, colorScale);
    };


    //creates 10 degree graticules
    function setGraticule(map, path){
        //create graticule generator, set to every 10 degrees for scale
        var graticule = d3.geoGraticule()
            .step([10, 10]); //place graticule lines every 5 degrees of longitude and latitude
               
            
        //create graticule background
        var gratBackground = map.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule


        //create graticule lines
        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines
    }    
    

    // Joins the pop_Vote CSV and the US_States_04 TopoJSON
    function joinData(statesFeature, pop_Vote) {
        // Loop through CSV to assign each set of CSV attribute values to TopoJSON region
        pop_Vote.forEach(function(csvState) {
            var csvKey = csvState.state; // The CSV primary key

            // Loop through TopoJSON regions to find the correct region
            statesFeature.forEach(function(topojsonFeature) {
                var topojsonProps = topojsonFeature.properties; // The current region TopoJSON properties
                var topojsonKey = topojsonProps.STUSPS; // The TopoJSON primary key

                // Where primary keys match, transfer CSV data to TopoJSON properties object
                if (topojsonKey === csvKey) {
                    // Assign all attributes and values
                    attrArray.forEach(function(attr) {
                        var val = parseFloat(csvState[attr]); // Get CSV attribute value
                        topojsonProps[attr] = val; // Assign attribute and value to TopoJSON properties
                    });
                }
            });
        });

        return statesFeature; // Return the updated features
    }

    //sets enumeration units on the map and colors them appropriately
    function setEnumerationUnits(statesFeature,map,path,colorScale){

        //add US States to map
        var statesPath = map.selectAll(".states")
            .data(statesFeature)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "regions " + d.properties.states;
            })
            .attr("d", path)        
            .style("fill", function(d){            
                var value = d.properties[expressed];            
                if(value) {                
                    return colorScale(d.properties[expressed]);            
                } else {                
                    return "#ccc";            
                }    
        });
    }


    //function to create color scale generator
    function makeColorScale(data){
        var colorClasses = [
            "#edf8fb",
            "#b3cde3",
            "#8c96c6",
            "#8856a7",
            "#810f7c"
        ];

        //create color scale generator
        var colorScale = d3.scaleThreshold()
            .range(colorClasses);

        //build array of all values of the expressed attribute
        var domainArray = [];
        for (var i=0; i<data.length; i++){
            var val = parseFloat(data[i][expressed]);
            domainArray.push(val);
        };

        //cluster data using ckmeans clustering algorithm to create natural breaks
        var clusters = ss.ckmeans(domainArray, 5);
        //reset domain array to cluster minimums
        domainArray = clusters.map(function(d){
            return d3.min(d);
        });
        //remove first value from domain array to create class breakpoints
        domainArray.shift();

        //assign array of last 4 cluster minimums as domain
        colorScale.domain(domainArray);

        return colorScale;
    };

    //function to create a dropdown menu for attribute selection
    function createDropdown(pop_Vote){
        //add select element
        var dropdown = d3.select("body")
            .append("select")
            .attr("class", "dropdown")
            .on("change", function(){
                changeAttribute(this.value, pop_Vote)
            });
        

        //add initial option
        var titleOption = dropdown.append("option")
            .attr("class", "titleOption")
            .attr("disabled", "true")
            .text("Select Attribute");

        //add attribute name options
        var attrOptions = dropdown.selectAll("attrOptions")
            .data(attrArray)
            .enter()
            .append("option")
            .attr("value", function(d){ return d })
            .text(function(d){ return d });
        };


    //dropdown change event handler
    function changeAttribute(attribute, pop_Vote) {
        //change the expressed attribute
        expressed = attribute;

        //recreate the color scale
        var colorScale = makeColorScale(pop_Vote);

        //recolor enumeration units
        var states = d3.selectAll(".states")
            .transition()
            .duration(1000)
            .style("fill", function(d){            
                var value = d.properties[expressed];            
                if(value) {                
                    return colorScale(value);           
                } else {                
                    return "#ccc";            
                }   
        });
        //Sort, resize, and recolor bars
        var bars = d3.selectAll(".bar")
            //Sort bars
            .sort(function(a, b){
                return b[expressed] - a[expressed];
            })
            .transition() //add animation
            .delay(function(d, i){
                return i * 20
            })
            .duration(500);

        updateChart(bars, pop_Vote.length, colorScale);
    }; //end of changeAttribute()


    //function to position, size, and color bars in chart
    function updateChart(bars, n, colorScale){
        //position bars
        bars.attr("x", function(d, i){
                return i * (chartInnerWidth / n) + leftPadding;
            })
            //size/resize bars
            .attr("height", function(d, i){
                return 463 - yScale(parseFloat(d[expressed]));
            })
            .attr("y", function(d, i){
                return yScale(parseFloat(d[expressed])) + topBottomPadding;
            })
            //color/recolor bars
            .style("fill", function(d){            
                var value = d[expressed];            
                if(value) {                
                    return colorScale(value);            
                } else {                
                    return "#ccc";            
                }    
        });
        //add text to chart title
        var chartTitle = d3.select(".chartTitle")
            .text("Votes for " + extracted + " in each State");
    };
// ON USER SELECTION:
// Step 1. Change the expressed attribute
// Step 2. Recreate the color scale with new class breaks
// Step 3. Recolor each enumeration unit on the map
// Step 4. Sort each bar on the bar chart
// Step 5. Resize each bar on the bar chart
// Step 6. Recolor each bar on the bar chart









})(); //last line

