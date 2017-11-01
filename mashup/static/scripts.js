// David Vesseur
// sets markers on the map when in view of user and gives articles
// when requested. also updates markers and deletes them when map is changed

// Google Map
var map;

// markers for map
var markers = [];

// info window
var info = new google.maps.InfoWindow();

// execute when the DOM is fully loaded
$(function() {

    // styles for map
    // https://developers.google.com/maps/documentation/javascript/styling
    var styles = [

        // hide Google's labels
        {
            featureType: "all",
            elementType: "labels",
            stylers: [
                {visibility: "off"}
            ]
        },

        // hide roads
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [
                {visibility: "off"}
            ]
        }

    ];

    // options for map
    // https://developers.google.com/maps/documentation/javascript/reference#MapOptions
    var options = {
        center: {lat: 41.3184, lng: -72.9318}, // Stanford, California
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        maxZoom: 14,
        panControl: true,
        styles: styles,
        zoom: 13,
        zoomControl: true
    };

    // get DOM node in which map will be instantiated
    var canvas = $("#map-canvas").get(0);

    // instantiate map
    map = new google.maps.Map(canvas, options);

    // configure UI once Google Map is idle (i.e., loaded)
    google.maps.event.addListenerOnce(map, "idle", configure);

});

/**
 * Adds marker for place to map.
 */
function addMarker(place)
{
    // find latitude and longitude
    var myLatLng = new google.maps.LatLng(place.latitude, place.longitude);

    // finds and set image to correct values
    var image = {
    url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSqJfnQc4dHDYWrqe4pVqrPNqs7DH4u-jOEwPFSrwgPqkwlq752Aw",
    scaledSize: new google.maps.Size(50, 50),
    labelOrigin: new google.maps.Point(0, 60)
    };

    // finds and set a gif to correct values
    var image2 = {
    url: "https://vignette.wikia.nocookie.net/kancolle/images/6/6b/147321-" +
    "vladimir-putin-wink-gif-tumblr-oGAq.gif/revision/latest?cb=20170425160532",
    scaledSize: new google.maps.Size(50, 50),
    labelOrigin: new google.maps.Point(0, 60)
    };

    // make marker
    var marker = new google.maps.Marker({
        position: myLatLng,
        map: map,
        title: place["place_name"] +", "+ place["admin_name1"],
        label: place.place_name +", "+ place.admin_name1,
        icon : image
    });

    //display articles when
    google.maps.event.addListener(marker, 'click', function() {
        showInfo(marker);

        // change image to gif when clicked
        marker.setIcon(image2);

        // get json articles
        $.getJSON(Flask.url_for("articles"), {geo: place.postal_code})
        .done(function(data, textStatus, jqXHR) {

            // make unordered list and add link and title of articles
            var content = "<ul>";
            for (var i = 0, n = data.length; i < n; i++)
            {
    		    content += "<li><a href =" + data[i].link + ">" + data[i].title
    		    + "</a></li>";
		    }
		    // rickroll the user
		    content += "<li><a href =" + "https://www.youtube.com/watch?v=dQw4w9" +
		    "WgXcQ" + ">" + "VERY IMPORTANT NEWS!! NO CLICKBAIT!!!!" + "</a></li>";

            // end unordered list and display
            content += "</ul>";

            // show marker and articles
            showInfo(marker, content);
        });
    });

    // set marker on map
    marker.setMap(map);

    // add marker to array
    markers.push(marker);
}

/**
 * Configures application.
 */
function configure()
{
    // update UI after map has been dragged
    google.maps.event.addListener(map, "dragend", function() {

        // if info window isn't open
        // http://stackoverflow.com/a/12410385
        if (!info.getMap || !info.getMap())
        {
            update();
        }
    });

    // update UI after zoom level changes
    google.maps.event.addListener(map, "zoom_changed", function() {
        update();
    });

    // configure typeahead
    $("#q").typeahead({
        highlight: false,
        minLength: 1
    },
    {
        display: function(suggestion) { return null; },
        limit: 10,
        source: search,
        templates: {
            suggestion: Handlebars.compile(
                "<div>" +
                "{{place_name}}, {{admin_name1}}, {{postal_code}}" +
                "</div>"
            )
        }
    });

    // re-center map after place is selected from drop-down
    $("#q").on("typeahead:selected", function(eventObject, suggestion, name) {

        // set map's center
        map.setCenter({lat: parseFloat(suggestion.latitude), lng: parseFloat(suggestion.longitude)});

        // update UI
        update();
    });

    // hide info window when text box has focus
    $("#q").focus(function(eventData) {
        info.close();
    });

    // re-enable ctrl- and right-clicking (and thus Inspect Element) on Google Map
    // https://chrome.google.com/webstore/detail/allow-right-click/hompjdfbfmmmgflfjdlnkohcplmboaeo?hl=en
    document.addEventListener("contextmenu", function(event) {
        event.returnValue = true;
        event.stopPropagation && event.stopPropagation();
        event.cancelBubble && event.cancelBubble();
    }, true);

    // update UI
    update();

    // give focus to text box
    $("#q").focus();
}

/**
 * Removes markers from map.
 */
function removeMarkers()
{
    // removes old markers, sets them to null
    for (var i = 0, n = markers.length; i < n; i++)
    {
        markers[i].setMap(null);
    }
}

/**
 * Searches database for typeahead's suggestions.
 */
function search(query, syncResults, asyncResults)
{
    // get places matching query (asynchronously)
    var parameters = {
        q: query
    };
    $.getJSON(Flask.url_for("search"), parameters)
    .done(function(data, textStatus, jqXHR) {

        // call typeahead's callback with search results (i.e., places)
        asyncResults(data);
    })
    .fail(function(jqXHR, textStatus, errorThrown) {

        // log error to browser's console
        console.log(errorThrown.toString());

        // call typeahead's callback with no results
        asyncResults([]);
    });
}

/**
 * Shows info window at marker with content.
 */
function showInfo(marker, content)
{
    // start div
    var div = "<div id='info'>";
    if (typeof(content) == "undefined")
    {
        // http://www.ajaxload.info/
        div += "<img alt='loading' src='/static/ajax-loader.gif'/>";
    }
    else
    {
        div += content;
    }

    // end div
    div += "</div>";

    // set info window's content
    info.setContent(div);

    // open info window (if not already open)
    info.open(map, marker);
}

/**
 * Updates UI's markers.
 */
function update()
{
    // get map's bounds
    var bounds = map.getBounds();
    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();

    // get places within bounds (asynchronously)
    var parameters = {
        ne: ne.lat() + "," + ne.lng(),
        q: $("#q").val(),
        sw: sw.lat() + "," + sw.lng()
    };
    $.getJSON(Flask.url_for("update"), parameters)
    .done(function(data, textStatus, jqXHR) {

       // remove old markers from map
        removeMarkers();

       // add new markers to map
       for (var i = 0; i < data.length; i++)
       {
           addMarker(data[i]);
       }
    })
    .fail(function(jqXHR, textStatus, errorThrown) {

        // log error to browser's console
        console.log(errorThrown.toString());
    });
};
