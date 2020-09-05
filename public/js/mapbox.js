/* eslint-disable */

export const displayMap = function (locations) {
  const mapElement = document.getElementById('map');

  mapboxgl.accessToken =
    'pk.eyJ1IjoiYXJ0aHVyMDgxMiIsImEiOiJja2Vremw4MW8xOWs3MnlucDBsMjU3dnF0In0.2mFIrbCnvElmVgjHWEM6tg';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/arthur0812/ckel8lvxb12yd19nsfelafzbe',
    scrollZoom: false,
    // center: startLocation.coordinates,
    // zoom: 4.4,
    // interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  const markers = [];

  locations.forEach((loc, index) => {
    // create marker with class 'marker'
    const el = document.createElement('div');

    if (index === 0) el.classList.add('start-marker');
    else el.classList.add('marker');

    // integrate marker into mapbox map 'map'
    const marker = new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      // add a popup to the marker
      .setPopup(
        new mapboxgl.Popup({
          offset: 30,
          closeOnClick: false,
        })
          .setLngLat(loc.coordinates)
          .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      )
      .addTo(map);

    // marker should be popped up
    marker.togglePopup();

    // extend map bounds to include current location
    bounds.extend(loc.coordinates);

    markers.push(marker);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 175,
      bottom: 175,
      right: 100,
      left: 100,
    },
  });

  let flag = true;
  mapElement.addEventListener('mouseenter', function (event) {
    if (flag) {
      markers.forEach(function (marker) {
        marker.togglePopup();
      });
      flag = false;
    }
  });

  document
    .querySelectorAll('.mapboxgl-marker')
    .forEach(function (marker, index) {
      marker.addEventListener('mouseenter', function (event) {
        if (!markers[index].getPopup().isOpen()) markers[index].togglePopup();
      });
      marker.addEventListener('mouseleave', function (event) {
        if (markers[index].getPopup().isOpen()) markers[index].togglePopup();
      });
    });
};
