// Add all scripts to the JS folder


//Example 1.3 line 4...set up choropleth map
function setMap() {
        //use Promise.all to parallelize asynchronous data loading
    
        var promises = [
            d3.csv("data/popular_vote_by_state.csv"),
            d3.json("data/lakes.topojson"),
            d3.json("data/states.topojson"),
        ];
        //Promise.all(promises).then(callback);

        Promise.all(promises)
            .then(callback)
            .catch(function(error) {
                console.log("Error loading data:", error);
            });
    
        function callback(data) {
            var pop_Vote = data[0],
                lakes = data[1],
                states = data[2];
            console.log(pop_Vote);
            console.log(lakes);
            console.log(states);

            //translate europe TopoJSON
            var lakes = topojson.feature(lakes, lakes.objects.lakes),
            states = topojson.feature(states, states.objects.states);

            //examine the results
            console.log(lakes);
            console.log(states);
        }
    };

    